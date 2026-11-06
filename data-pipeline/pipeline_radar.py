#!/usr/bin/env python3
"""
==============================================================================
GARIMPATRIP - PIPELINE DE INGESTÃO E ANÁLISE DE DADOS (GitHub Actions)
Executado diariamente às 06:00 UTC (03:00 Horário de Brasília)

O que este robô faz, nesta ordem:
  1. Garante que as 15 rotas base existam em monitored_routes.
  2. Preenche dim_calendar (2 anos para trás e ~13 meses para frente) com
     estação do ano, férias escolares e feriados nacionais (BrasilAPI).
  3. Para cada rota ATIVA (base + rotas com alertas), consulta a Travelpayouts
     uma única vez (deduplicação) e grava os preços em price_history.
  4. Desativa alertas de usuários inativos há mais de 90 dias.
  5. Apaga preços com mais de 2 anos (retenção móvel).

Usa a API REST do Supabase com a chave service_role (somente nos Secrets do GitHub).
==============================================================================
"""

import datetime as dt
import os
import sys
import time
from typing import Any, Dict, List, Optional

import requests

TRAVELPAYOUTS_TOKEN = os.getenv("TRAVELPAYOUTS_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

MONTHS_AHEAD = 3            # meses de partida consultados por rota
CALENDAR_PAST_DAYS = 730    # 2 anos para trás
CALENDAR_FUTURE_DAYS = 400  # ~13 meses para frente
INACTIVITY_DAYS = 90

# 15 ROTAS BASE ESTRATÉGICAS (Deduplicação de consumo de API)
BASE_ROUTES = [
    {"origin": "GRU", "destination": "SSA", "name": "São Paulo -> Salvador"},
    {"origin": "GRU", "destination": "REC", "name": "São Paulo -> Recife"},
    {"origin": "GRU", "destination": "FOR", "name": "São Paulo -> Fortaleza"},
    {"origin": "GRU", "destination": "GIG", "name": "São Paulo -> Rio de Janeiro"},
    {"origin": "GRU", "destination": "FLN", "name": "São Paulo -> Florianópolis"},
    {"origin": "GRU", "destination": "IGU", "name": "São Paulo -> Foz do Iguaçu"},
    {"origin": "GRU", "destination": "EZE", "name": "São Paulo -> Buenos Aires"},
    {"origin": "GRU", "destination": "SCL", "name": "São Paulo -> Santiago"},
    {"origin": "GRU", "destination": "LIS", "name": "São Paulo -> Lisboa"},
    {"origin": "GIG", "destination": "SSA", "name": "Rio de Janeiro -> Salvador"},
    {"origin": "GIG", "destination": "REC", "name": "Rio de Janeiro -> Recife"},
    {"origin": "GIG", "destination": "FOR", "name": "Rio de Janeiro -> Fortaleza"},
    {"origin": "BSB", "destination": "SSA", "name": "Brasília -> Salvador"},
    {"origin": "CNF", "destination": "REC", "name": "Belo Horizonte -> Recife"},
    {"origin": "POA", "destination": "GIG", "name": "Porto Alegre -> Rio de Janeiro"},
]


# ------------------------------------------------------------------ SUPABASE
def sb_headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def sb_get(table: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=sb_headers(), params=params, timeout=30)
    res.raise_for_status()
    return res.json()


def sb_upsert(table: str, rows: List[Dict[str, Any]], on_conflict: str) -> None:
    for i in range(0, len(rows), 500):
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=sb_headers({"Prefer": "resolution=merge-duplicates,return=minimal"}),
            params={"on_conflict": on_conflict},
            json=rows[i:i + 500],
            timeout=60,
        )
        res.raise_for_status()


def sb_insert(table: str, rows: List[Dict[str, Any]]) -> None:
    for i in range(0, len(rows), 500):
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=sb_headers({"Prefer": "return=minimal"}),
            json=rows[i:i + 500],
            timeout=60,
        )
        res.raise_for_status()


def sb_patch(table: str, match: Dict[str, str], values: Dict[str, Any]) -> None:
    res = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=sb_headers({"Prefer": "return=minimal"}),
        params=match,
        json=values,
        timeout=30,
    )
    res.raise_for_status()


def sb_rpc(fn: str, payload: Dict[str, Any]) -> Any:
    res = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/{fn}", headers=sb_headers(), json=payload, timeout=60)
    res.raise_for_status()
    return res.json() if res.text else None


# ------------------------------------------------------------------ CÂMBIO
def fetch_currency_rates() -> Dict[str, float]:
    """Obtém cotações do dia de USD, EUR e ARS para BRL (AwesomeAPI - 100% aberta)"""
    url = "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,ARS-BRL"
    try:
        data = requests.get(url, timeout=10).json()
        return {
            "USD_BRL": float(data.get("USDBRL", {}).get("bid", 0)),
            "EUR_BRL": float(data.get("EURBRL", {}).get("bid", 0)),
            "ARS_BRL": float(data.get("ARSBRL", {}).get("bid", 0)),
        }
    except Exception as e:  # noqa: BLE001
        print(f"[ERRO CÂMBIO]: {e}")
        return {}


# ------------------------------------------------------------------ CALENDÁRIO
def season_br(d: dt.date) -> str:
    md = (d.month, d.day)
    if md >= (12, 21) or md < (3, 20):
        return "Verão"
    if md < (6, 21):
        return "Outono"
    if md < (9, 22):
        return "Inverno"
    return "Primavera"


def is_school_vacation(d: dt.date) -> bool:
    # Aproximação nacional: janeiro, julho e a partir de 15 de dezembro.
    return d.month in (1, 7) or (d.month == 12 and d.day >= 15)


def fetch_holidays(years: List[int]) -> Dict[str, Dict[str, str]]:
    holidays: Dict[str, Dict[str, str]] = {}
    for year in years:
        try:
            res = requests.get(f"https://brasilapi.com.br/api/feriados/v1/{year}", timeout=15)
            res.raise_for_status()
            for h in res.json():
                holidays[h["date"]] = {"name": h.get("name", "Feriado"), "type": h.get("type", "national")}
        except Exception as e:  # noqa: BLE001
            print(f"[AVISO FERIADOS {year}]: {e}")
    return holidays


def build_calendar(today: dt.date) -> int:
    start = today - dt.timedelta(days=CALENDAR_PAST_DAYS)
    end = today + dt.timedelta(days=CALENDAR_FUTURE_DAYS)
    holidays = fetch_holidays(list(range(start.year, end.year + 1)))
    holiday_dates = {dt.date.fromisoformat(k) for k in holidays}

    rows = []
    d = start
    while d <= end:
        iso = d.isoformat()
        h = holidays.get(iso)
        vacation = is_school_vacation(d)
        # Feriado ou dia vizinho de feriado (emenda) e férias = Alta Temporada
        near_holiday = any(abs((d - hd).days) <= 1 for hd in holiday_dates)
        if vacation or near_holiday:
            period = "Alta Temporada"
        elif d.month in (3, 4, 5, 8, 9, 10, 11):
            period = "Baixa Temporada"
        else:
            period = "Média Temporada"
        rows.append({
            "date_day": iso,
            "day_of_week": d.isoweekday(),
            "month": d.month,
            "season_br": season_br(d),
            "is_school_vacation": vacation,
            "holiday_type": h["type"] if h else None,
            "holiday_name": h["name"] if h else None,
            "period_classification": period,
        })
        d += dt.timedelta(days=1)
    sb_upsert("dim_calendar", rows, "date_day")
    return len(rows)


# ------------------------------------------------------------------ ROTAS
def ensure_base_routes() -> None:
    rows = [{
        "origin_iata": r["origin"],
        "destination_iata": r["destination"],
        "route_name": r["name"],
        "is_base_route": True,
        "is_active": True,
    } for r in BASE_ROUTES]
    sb_upsert("monitored_routes", rows, "origin_iata,destination_iata")


def active_routes() -> List[Dict[str, Any]]:
    return sb_get("monitored_routes", {"select": "id,origin_iata,destination_iata,route_name", "is_active": "eq.true"})


# ------------------------------------------------------------------ PREÇOS
def month_list(today: dt.date, n: int) -> List[str]:
    months = []
    y, m = today.year, today.month
    for _ in range(n):
        months.append(f"{y:04d}-{m:02d}")
        m += 1
        if m > 12:
            y, m = y + 1, 1
    return months


def fetch_prices(origin: str, destination: str, month: str) -> List[Dict[str, Any]]:
    res = requests.get(
        "https://api.travelpayouts.com/aviasales/v3/prices_for_dates",
        headers={"X-Access-Token": TRAVELPAYOUTS_TOKEN},
        params={
            "origin": origin,
            "destination": destination,
            "departure_at": month,
            "one_way": "true",
            "currency": "brl",
            "sorting": "price",
            "limit": 30,
        },
        timeout=20,
    )
    res.raise_for_status()
    return res.json().get("data", []) or []


def collect_prices(routes: List[Dict[str, Any]], today: dt.date) -> int:
    last_calendar_day = today + dt.timedelta(days=CALENDAR_FUTURE_DAYS)
    recorded_at = dt.datetime.now(dt.timezone.utc).isoformat()
    total = 0
    for route in routes:
        o, d = route["origin_iata"], route["destination_iata"]
        print(f" -> Consultando {route['route_name']} ({o} -> {d})...")
        rows: List[Dict[str, Any]] = []
        for month in month_list(today, MONTHS_AHEAD):
            try:
                for f in fetch_prices(o, d, month):
                    flight_date = dt.date.fromisoformat(f["departure_at"][:10])
                    if flight_date < today or flight_date > last_calendar_day:
                        continue
                    rows.append({
                        "route_id": route["id"],
                        "flight_date": flight_date.isoformat(),
                        "price": float(f["price"]),
                        "airline": f.get("airline"),
                        "stops": int(f.get("transfers", 0)),
                        "recorded_at": recorded_at,
                    })
            except Exception as e:  # noqa: BLE001
                print(f"    [ERRO {o}->{d} {month}]: {e}")
            time.sleep(0.4)  # respeita o limite de requisições da API
        if rows:
            sb_insert("price_history", rows)
        sb_patch("monitored_routes", {"id": f"eq.{route['id']}"}, {"last_checked_at": recorded_at})
        print(f"    {len(rows)} preços gravados.")
        total += len(rows)
    return total


# ------------------------------------------------------------------ MAIN
def run_pipeline() -> int:
    print(f"[{dt.datetime.now()}] Iniciando Pipeline do GarimpaTrip...")
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERRO]: Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nos Secrets do GitHub.")
        return 1

    today = dt.date.today()

    rates = fetch_currency_rates()
    print(f"[CÂMBIO]: Cotações capturadas: {rates}")

    ensure_base_routes()
    print(f"[ROTAS]: {len(BASE_ROUTES)} rotas base garantidas.")

    days = build_calendar(today)
    print(f"[CALENDÁRIO]: {days} dias atualizados em dim_calendar.")

    if TRAVELPAYOUTS_TOKEN:
        routes = active_routes()
        print(f"[PREÇOS]: Processando {len(routes)} rotas ativas (uma consulta por rota, sem duplicar).")
        total = collect_prices(routes, today)
        print(f"[PREÇOS]: {total} registros gravados em price_history.")
    else:
        print("[AVISO]: TRAVELPAYOUTS_API_KEY não configurada; coleta de preços pulada.")

    deactivated = sb_rpc("deactivate_inactive_alerts", {"p_days": INACTIVITY_DAYS})
    print(f"[INATIVIDADE]: {deactivated} alertas desativados.")

    purged = sb_rpc("purge_old_prices", {})
    print(f"[RETENÇÃO]: {purged} preços com mais de 2 anos removidos.")

    print(f"[{dt.datetime.now()}] Pipeline finalizado com sucesso!")
    return 0


if __name__ == "__main__":
    sys.exit(run_pipeline())
