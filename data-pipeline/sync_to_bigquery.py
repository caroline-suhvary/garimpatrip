#!/usr/bin/env python3
"""
==============================================================================
GARIMPATRIP - LAKEHOUSE ETL & SYNC PARA BIGQUERY (DuckDB -> Parquet -> BigQuery)
==============================================================================
Extrai métricas, eventos, pipeline runs e histórico de preços do Supabase,
transforma com DuckDB, gera arquivos colunares Parquet e carrega no Google BigQuery.
"""

import datetime as dt
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

import duckdb
from google.cloud import bigquery
from google.oauth2 import service_account
import requests

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "")
GCP_SA_KEY = os.getenv("GCP_SA_KEY", "")
DATASET_ID = "garimpatrip_analytics"

PARQUET_DIR = Path("/tmp/parquet")
PARQUET_DIR.mkdir(parents=True, exist_ok=True)


def sb_get(table: str, select: str = "*", params: Dict[str, str] = None) -> List[Dict[str, Any]]:
    p = {"select": select}
    if params:
        p.update(params)
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    res = requests.get(url, headers=headers, params=p, timeout=30)
    if res.status_code >= 400:
        print(f"[AVISO]: Consulta a {table}: {res.status_code} - {res.text}")
        return []
    return res.json()


def get_bigquery_client() -> bigquery.Client:
    if not GCP_SA_KEY:
        raise ValueError("GCP_SA_KEY não configurado nos Secrets do GitHub!")
    sa_info = json.loads(GCP_SA_KEY)
    creds = service_account.Credentials.from_service_account_info(sa_info)
    project = GCP_PROJECT_ID or sa_info.get("project_id")
    return bigquery.Client(credentials=creds, project=project)


def sync_finops_metrics(con: duckdb.DuckDBPyConnection, bq_client: bigquery.Client):
    print("[ETL]: Calculando snapshot de FinOps & Cotas...")
    profiles = sb_get("profiles", "id")
    trips = sb_get("trips", "id")
    alerts = sb_get("route_alerts", "id", {"is_active": "eq.true"})
    routes = sb_get("monitored_routes", "id", {"is_active": "eq.true"})
    prices = sb_get("price_history", "id")

    first_day_month = dt.date.today().replace(day=1).isoformat()
    runs = sb_get("pipeline_runs", "duration_seconds", {"created_at": f"gte.{first_day_month}"})
    total_seconds = sum(r.get("duration_seconds") or 0 for r in runs)
    minutes_used = round(total_seconds / 60.0, 2)

    profiles_count = len(profiles)
    profiles_limit = 1000
    trips_count = len(trips)
    alerts_count = len(alerts)
    routes_count = len(routes)
    prices_count = len(prices)
    minutes_limit = 2000

    row = {
        "snapshot_at": dt.datetime.utcnow().isoformat(),
        "profiles_count": profiles_count,
        "profiles_limit": profiles_limit,
        "profiles_usage_pct": round((profiles_count / profiles_limit) * 100.0, 2),
        "trips_count": trips_count,
        "active_alerts_count": alerts_count,
        "active_routes_count": routes_count,
        "prices_recorded_count": prices_count,
        "github_actions_minutes_used": minutes_used,
        "github_actions_minutes_limit": minutes_limit,
        "github_actions_usage_pct": round((minutes_used / minutes_limit) * 100.0, 2),
    }

    con.execute("DROP TABLE IF EXISTS finops_metrics")
    con.execute("""
        CREATE TABLE finops_metrics (
            snapshot_at TIMESTAMP,
            profiles_count BIGINT,
            profiles_limit BIGINT,
            profiles_usage_pct DOUBLE,
            trips_count BIGINT,
            active_alerts_count BIGINT,
            active_routes_count BIGINT,
            prices_recorded_count BIGINT,
            github_actions_minutes_used DOUBLE,
            github_actions_minutes_limit BIGINT,
            github_actions_usage_pct DOUBLE
        )
    """)
    con.execute("""
        INSERT INTO finops_metrics VALUES (
            $snapshot_at, $profiles_count, $profiles_limit, $profiles_usage_pct,
            $trips_count, $active_alerts_count, $active_routes_count,
            $prices_recorded_count, $github_actions_minutes_used,
            $github_actions_minutes_limit, $github_actions_usage_pct
        )
    """, row)

    parquet_file = PARQUET_DIR / "finops_metrics.parquet"
    con.execute(f"COPY finops_metrics TO '{parquet_file}' (FORMAT PARQUET)")

    table_ref = f"{bq_client.project}.{DATASET_ID}.finops_metrics"
    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.PARQUET,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    with open(parquet_file, "rb") as f:
        job = bq_client.load_table_from_file(f, table_ref, job_config=job_config)
    job.result()
    print(f"[BIGQUERY]: Tabela {table_ref} atualizada com sucesso.")


def sync_events(con: duckdb.DuckDBPyConnection, bq_client: bigquery.Client):
    print("[ETL]: Extraindo eventos e cliques de site_events...")
    events = sb_get("site_events", "*")
    con.execute("DROP TABLE IF EXISTS site_events")
    con.execute("""
        CREATE TABLE site_events (
            id VARCHAR,
            event_type VARCHAR,
            target_name VARCHAR,
            category VARCHAR,
            destination VARCHAR,
            url VARCHAR,
            user_region VARCHAR,
            user_city VARCHAR,
            user_country VARCHAR,
            created_at TIMESTAMP
        )
    """)
    if events:
        for ev in events:
            con.execute("""
                INSERT INTO site_events VALUES (
                    $id, $event_type, $target_name, $category, $destination,
                    $url, $user_region, $user_city, $user_country, $created_at
                )
            """, {
                "id": str(ev.get("id") or ""),
                "event_type": ev.get("event_type"),
                "target_name": ev.get("target_name"),
                "category": ev.get("category"),
                "destination": ev.get("destination"),
                "url": ev.get("url"),
                "user_region": ev.get("user_region"),
                "user_city": ev.get("user_city"),
                "user_country": ev.get("user_country"),
                "created_at": ev.get("created_at"),
            })

    parquet_file = PARQUET_DIR / "site_events.parquet"
    con.execute(f"COPY site_events TO '{parquet_file}' (FORMAT PARQUET)")

    table_ref = f"{bq_client.project}.{DATASET_ID}.site_events"
    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.PARQUET,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    with open(parquet_file, "rb") as f:
        job = bq_client.load_table_from_file(f, table_ref, job_config=job_config)
    job.result()
    print(f"[BIGQUERY]: Tabela {table_ref} sincronizada ({len(events)} eventos).")


def sync_pipeline_runs(con: duckdb.DuckDBPyConnection, bq_client: bigquery.Client):
    print("[ETL]: Sincronizando execuções de pipeline_runs...")
    runs = sb_get("pipeline_runs", "*")
    con.execute("DROP TABLE IF EXISTS pipeline_runs")
    con.execute("""
        CREATE TABLE pipeline_runs (
            id VARCHAR,
            pipeline_name VARCHAR,
            status VARCHAR,
            duration_seconds DOUBLE,
            records_inserted BIGINT,
            error_message VARCHAR,
            created_at TIMESTAMP
        )
    """)
    if runs:
        for r in runs:
            con.execute("""
                INSERT INTO pipeline_runs VALUES (
                    $id, $pipeline_name, $status, $duration_seconds,
                    $records_inserted, $error_message, $created_at
                )
            """, {
                "id": str(r.get("id") or ""),
                "pipeline_name": r.get("pipeline_name"),
                "status": r.get("status"),
                "duration_seconds": float(r.get("duration_seconds") or 0.0),
                "records_inserted": int(r.get("records_inserted") or 0),
                "error_message": r.get("error_message"),
                "created_at": r.get("created_at"),
            })

    parquet_file = PARQUET_DIR / "pipeline_runs.parquet"
    con.execute(f"COPY pipeline_runs TO '{parquet_file}' (FORMAT PARQUET)")

    table_ref = f"{bq_client.project}.{DATASET_ID}.pipeline_runs"
    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.PARQUET,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    with open(parquet_file, "rb") as f:
        job = bq_client.load_table_from_file(f, table_ref, job_config=job_config)
    job.result()
    print(f"[BIGQUERY]: Tabela {table_ref} sincronizada ({len(runs)} execuções).")


def sync_radar_prices(con: duckdb.DuckDBPyConnection, bq_client: bigquery.Client):
    print("[ETL]: Sincronizando preços do Radar...")
    routes = {r["id"]: r for r in sb_get("monitored_routes", "id,route_name,origin_iata,destination_iata")}
    prices = sb_get("price_history", "id,route_id,flight_date,price,airline,stops,recorded_at")

    con.execute("DROP TABLE IF EXISTS radar_prices")
    con.execute("""
        CREATE TABLE radar_prices (
            id VARCHAR,
            route_name VARCHAR,
            origin_iata VARCHAR,
            destination_iata VARCHAR,
            flight_date DATE,
            price DOUBLE,
            airline VARCHAR,
            stops BIGINT,
            recorded_at TIMESTAMP
        )
    """)
    if prices:
        for p in prices:
            route = routes.get(p.get("route_id"), {})
            con.execute("""
                INSERT INTO radar_prices VALUES (
                    $id, $route_name, $origin_iata, $destination_iata,
                    $flight_date, $price, $airline, $stops, $recorded_at
                )
            """, {
                "id": str(p.get("id") or ""),
                "route_name": route.get("route_name") or "Desconhecida",
                "origin_iata": route.get("origin_iata") or "",
                "destination_iata": route.get("destination_iata") or "",
                "flight_date": p.get("flight_date"),
                "price": float(p.get("price") or 0.0),
                "airline": p.get("airline"),
                "stops": int(p.get("stops") or 0),
                "recorded_at": p.get("recorded_at"),
            })

    parquet_file = PARQUET_DIR / "radar_prices.parquet"
    con.execute(f"COPY radar_prices TO '{parquet_file}' (FORMAT PARQUET)")

    table_ref = f"{bq_client.project}.{DATASET_ID}.radar_prices"
    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.PARQUET,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    with open(parquet_file, "rb") as f:
        job = bq_client.load_table_from_file(f, table_ref, job_config=job_config)
    job.result()
    print(f"[BIGQUERY]: Tabela {table_ref} sincronizada ({len(prices)} preços).")


def main():
    print(f"[{dt.datetime.now()}] Iniciando Lakehouse Sync (DuckDB -> Parquet -> BigQuery)...")
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERRO]: Credenciais do Supabase ausentes.")
        sys.exit(1)

    bq_client = get_bigquery_client()
    con = duckdb.connect(database=":memory:")

    sync_finops_metrics(con, bq_client)
    sync_events(con, bq_client)
    sync_pipeline_runs(con, bq_client)
    sync_radar_prices(con, bq_client)

    con.close()
    print(f"[{dt.datetime.now()}] Lakehouse Sync concluído com sucesso!")


if __name__ == "__main__":
    main()
