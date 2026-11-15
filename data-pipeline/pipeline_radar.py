#!/usr/bin/env python3
"""
==============================================================================
GARIMPATRIP - PIPELINE DE INGESTÃO E MANUTENÇÃO (GitHub Actions)
Executado diariamente às 06:00 UTC (03:00 Horário de Brasília)

O que este robô faz, nesta ordem:
  1. Captura cotações de câmbio (USD, EUR, ARS) e grava em exchange_rates.
  2. Garante que as 15 rotas base estratégicas existam em monitored_routes.
  3. Preenche dim_calendar (2 anos para trás e ~13 meses para frente).
  4. Para cada rota ATIVA (base + alertas dos usuários), consulta preços
     na Travelpayouts uma única vez (sem duplicar chamadas).
  5. Desativa alertas de usuários inativos há mais de 60 dias.
  6. Exclui contas sem acesso há mais de 60 dias (libera espaço no plano Free).
  7. Apaga preços com mais de 2 anos (retenção móvel).

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
INACTIVITY_DAYS = 60        # regra de 60 dias

# 15 ROTAS BASE ESTRATÉGICAS (10 GRU, 3 GIG, 2 VCP)
BASE_ROUTES = [
    # 10 rotas saindo de São Paulo (GRU)
    {"origin": "GRU", "destination": "CNF", "name": "São Paulo -> Belo Horizonte"},
    {"origin": "GRU", "destination": "GIG", "name": "São Paulo -> Rio de Janeiro"},
    {"origin": "GRU", "destination": "BSB", "name": "São Paulo -> Brasília"},
    {"origin": "GRU", "destination": "MCZ", "name": "São Paulo -> Maceió"},
    {"origin": "GRU", "destination": "REC", "name": "São Paulo -> Recife"},
    {"origin": "GRU", "destination": "SSA", "name": "São Paulo -> Salvador"},
    {"origin": "GRU", "destination": "FOR", "name": "São Paulo -> Fortaleza"},
    {"origin": "GRU", "destination": "MCO", "name": "São Paulo -> Orlando"},
    {"origin": "GRU", "destination": "LIS", "name": "São Paulo -> Lisboa"},
    {"origin": "GRU", "destination": "AMS", "name": "São Paulo -> Amsterdam"},

    # 3 rotas saindo do Rio de Janeiro (GIG)
    {"origin": "GIG", "destination": "SSA", "name": "Rio de Janeiro -> Salvador"},
    {"origin": "GIG", "destination": "REC", "name": "Rio de Janeiro -> Recife"},
    {"origin": "GIG", "destination": "LIS", "name": "Rio de Janeiro -> Lisboa"},

    # 2 rotas saindo de Campinas (VCP)
    {"origin": "VCP", "destination": "REC", "name": "Campinas -> Recife"},
    {"origin": "VCP", "destination": "MCO", "name": "Campinas -> Orlando"},
]


# ------------------------------------------------------------------ SUPABASE
def sb_headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
    }
    # Chaves legadas (JWT) começam com 'ey' e usam Bearer.
    # Novas chaves secretas ('sb_secret_') vão apenas no 'apikey'.
    if SUPABASE_KEY.startswith("ey"):
        headers["Authorization"] = f"Bearer {SUPABASE_KEY}"

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
    """Obtém cotações do dia de USD, EUR e ARS para BRL com fallback."""
    try:
        url = "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,ARS-BRL"
        data = requests.get(url, timeout=10).json()
        usd = float(data.get("USDBRL", {}).get("bid", 0))
        eur = float(data.get("EURBRL", {}).get("bid", 0))
        ars = float(data.get("ARSBRL", {}).get("bid", 0))
        if usd > 0:
            return {"USD_BRL": usd, "EUR_BRL": eur, "ARS_BRL": ars}
    except Exception:
        pass

    try:
        res = requests.get("https://open.er-api.com/v6/latest/USD", timeout=10).json()
        rates = res.get("rates", {})
        usd_brl = float(rates.get("BRL", 0))
        eur_usd = float(rates.get("EUR", 1))
        ars_usd = float(rates.get("ARS", 1))
        return {
            "USD_BRL": round(usd_brl, 4),
            "EUR_BRL": round(usd_brl / eur_usd, 4) if eur_usd else 0.0,
            "ARS_BRL": round(usd_brl / ars_usd, 4) if ars_usd else 0.0,
        }
    except Exception as e:
        print(f"[ERRO CÂMBIO]: {e}")
        return {}



def save_currency_rates(rates: Dict[str, float]) -> None:
    if not rates:
        return
    now_iso = dt.datetime.now(dt.timezone.utc).isoformat()
    rows = [
        {"currency_pair": pair, "rate": rate, "recorded_at": now_iso}
        for pair, rate in rates.items()
        if rate > 0
    ]
    if rows:
        sb_insert("exchange_rates", rows)


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
    return d.month in (1, 7) or (d.month == 12 and d.day >= 15)


def fetch_holidays(years: List[int]) -> Dict[str, Dict[str, str]]:
    holidays: Dict[str, Dict[str, str]] = {}
    for year in years:
        try:
            res = requests.get(f"https://brasilapi.com.br/api/feriados/v1/{year}", timeout=15)
            res.raise_for_status()
            for h in res.json():
                holidays[h["date"]] = {"name": h.get("name", "Feriado"), "type": h.get("type", "national")}
        except Exception as e:
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
            except Exception as e:
                print(f"    [ERRO {o}->{d} {month}]: {e}")
            time.sleep(0.4)
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
    try:
        save_currency_rates(rates)
        print("[CÂMBIO]: Cotações salvas em exchange_rates.")
    except Exception as e:
        print(f"[CÂMBIO AVISO]: Não foi possível salvar cotações: {e}")

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

    try:
        deactivated = sb_rpc("deactivate_inactive_alerts", {"p_days": INACTIVITY_DAYS})
        print(f"[INATIVIDADE]: {deactivated} alertas desativados.")
    except Exception as e:
        print(f"[INATIVIDADE AVISO]: {e}")

    try:
        purged_users = sb_rpc("purge_inactive_accounts", {"p_days": INACTIVITY_DAYS})
        print(f"[EXPURGO CONTAS]: {purged_users} contas inativas há mais de {INACTIVITY_DAYS} dias excluídas.")
    except Exception as e:
        print(f"[EXPURGO CONTAS AVISO]: {e}")

    try:
        purged_prices = sb_rpc("purge_old_prices", {})
        print(f"[RETENÇÃO]: {purged_prices} preços com mais de 2 anos removidos.")
    except Exception as e:
        print(f"[RETENÇÃO AVISO]: {e}")

    print(f"[{dt.datetime.now()}] Pipeline finalizado com sucesso!")
    return 0


if __name__ == "__main__":
    sys.exit(run_pipeline())
