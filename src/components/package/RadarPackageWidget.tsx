"use client";
// Widget do Radar em Meu Pacote (Área 1: Transporte Principal).
// Permite ativar o monitoramento no Radar direto pelo roteiro da viagem sem digitar IATA.
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CheckCircle, ExternalLink } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveIata } from "@/lib/iata";
import { formatBRL } from "@/lib/format";
import type { Trip, PackageItem } from "@/types";

interface Props {
  supabase: SupabaseClient;
  trip: Trip;
  items: PackageItem[];
  onError: (msg: string) => void;
}

export function RadarPackageWidget({ supabase, trip, items, onError }: Props) {
  const [originIata, setOriginIata] = useState<string | null>(null);
  const [destIata, setDestIata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [monitored, setMonitored] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [recentMinPrice, setRecentMinPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function findIatas() {
      setLoading(true);
      const [orig, dest] = await Promise.all([
        resolveIata(trip.origin_city),
        resolveIata(trip.destination_city),
      ]);
      if (!active) return;
      setOriginIata(orig);
      setDestIata(dest);

      if (orig && dest) {
        // Verifica se a rota já está nos alertas do usuário
        const { data: routeData } = await supabase
          .from("monitored_routes")
          .select("id, user_route_alerts(id, is_active, target_price)")
          .eq("origin_iata", orig)
          .eq("destination_iata", dest)
          .maybeSingle();

        if (routeData) {
          const userAlert = (routeData.user_route_alerts as any)?.[0];
          if (userAlert && userAlert.is_active) {
            setMonitored(true);
            setAlertId(userAlert.id);
          }

          // Busca o menor preço recente gravado nos últimos 30 dias
          const { data: priceData } = await supabase
            .from("price_history")
            .select("price")
            .eq("route_id", routeData.id)
            .order("price", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (priceData) {
            setRecentMinPrice(Number(priceData.price));
          }
        }
      }
      setLoading(false);
    }
    findIatas();
    return () => {
      active = false;
    };
  }, [supabase, trip.origin_city, trip.destination_city]);

  if (loading || !originIata || !destIata) return null;

  const handleToggleMonitor = async () => {
    setSaving(true);
    try {
      if (!monitored) {
        const flightItem = items.find(
          (i) => i.category_id === 1 && Number(i.estimated_cost) > 0,
        );
        const targetPrice = flightItem
          ? Number(flightItem.estimated_cost)
          : 3500;
        const preferredMonth = trip.start_date
          ? `${trip.start_date.slice(0, 7)}-01`
          : null;

        const { data, error } = await supabase.rpc("create_route_alert", {
          p_origin: originIata,
          p_destination: destIata,
          p_target_price: targetPrice,
          p_preferred_month: preferredMonth,
        });

        if (error) throw error;
        setMonitored(true);
        setAlertId(data);
      } else if (alertId) {
        const { error } = await supabase
          .from("user_route_alerts")
          .delete()
          .eq("id", alertId);

        if (error) throw error;
        setMonitored(false);
        setAlertId(null);
      }
    } catch (err: any) {
      onError(err.message || "Erro ao atualizar alerta no Radar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        margin: "1rem 0",
        padding: "1.1rem 1.25rem",
        borderRadius: "12px",
        border: "1px solid var(--cat-flight-border, #FCD34D)",
        backgroundColor: "var(--cat-flight-bg, #FEF3C7)",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BellRing size={18} color="var(--brand-amber, #D97706)" />
          <strong
            style={{
              fontSize: "0.95rem",
              color: "var(--brand-dark, #1F2937)",
            }}>
            Radar de Preços: {originIata} ➔ {destIata}
          </strong>
        </div>
        <Link
          href="/radar"
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--brand-amber, #D97706)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            textDecoration: "none",
          }}>
          <span>Abrir Radar</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "0.85rem",
          color: "#4B5563",
          lineHeight: 1.4,
        }}>
        Acompanhe oscilações diárias de preços para o trecho{" "}
        <strong>
          {trip.origin_city} ➔ {trip.destination_city}
        </strong>{" "}
        e receba aviso quando o valor cair.
      </p>

      {recentMinPrice !== null && (
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#047857" }}>
          💡 Menor tarifa recente registrada no Radar:{" "}
          <strong>{formatBRL(recentMinPrice)}</strong>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginTop: "0.25rem",
          flexWrap: "wrap",
        }}>
        <button
          type="button"
          onClick={handleToggleMonitor}
          disabled={saving}
          className={`gt-btn gt-btn-sm ${monitored ? "gt-btn-light" : "gt-btn-dark"}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}>
          {monitored ? (
            <CheckCircle size={14} color="#059669" />
          ) : (
            <Bell size={14} />
          )}
          <span>
            {monitored
              ? "Monitorando no Radar (clique para pausar)"
              : "Ativar monitoramento no Radar"}
          </span>
        </button>
        {monitored && (
          <span
            style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 700 }}>
            ✓ Rota ativa no seu painel do Radar
          </span>
        )}
      </div>
    </div>
  );
}
