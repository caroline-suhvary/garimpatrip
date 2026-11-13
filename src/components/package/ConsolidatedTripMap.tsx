"use client";
import React, { useEffect, useRef } from "react";
import type { PackageItem, ScheduleItem } from "@/types";

declare global { interface Window { L?: any; } }
interface Props { items: PackageItem[]; schedule: ScheduleItem[]; }
const COLORS: Record<number, string> = { 1: "#e85d4a", 2: "#3478c5", 3: "#ed8b26", 4: "#8056b3", 5: "#718096", 6: "#2c9a69", 7: "#be8a18", 10: "#53616f" };

export function ConsolidatedTripMap({ items, schedule }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const points = [
    ...items.filter((item) => item.latitude != null && item.longitude != null).map((item) => ({ title: item.title, lat: Number(item.latitude), lon: Number(item.longitude), category: item.category_id, address: item.address || "" })),
    ...schedule.filter((item) => item.latitude != null && item.longitude != null).map((item) => ({ title: item.title, lat: Number(item.latitude), lon: Number(item.longitude), category: 8, address: item.location_name || "" })),
  ];
  useEffect(() => {
    const host = elementRef.current;
    if (!host || points.length === 0) return;
    let map: any;
    let cancelled = false;
    const cssId = "gt-leaflet-css";
    if (!document.getElementById(cssId)) { const link = document.createElement("link"); link.id = cssId; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link); }
    const init = () => {
      if (cancelled || !host || !window.L) return;
      map = window.L.map(host).setView([points[0].lat, points[0].lon], 12);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      const markers: any[] = [];
      points.forEach((point) => { const marker = window.L.circleMarker([point.lat, point.lon], { radius: 8, color: "#fff", weight: 2, fillColor: COLORS[point.category] || "#e85d4a", fillOpacity: 0.95 }).addTo(map); marker.bindPopup(`<strong>${String(point.title).replace(/[<>&]/g, "")}</strong>${point.address ? `<br>${String(point.address).replace(/[<>&]/g, "")}` : ""}`); markers.push(marker); });
      if (markers.length > 1) map.fitBounds(window.L.featureGroup(markers).getBounds().pad(0.15));
    };
    if (window.L) init();
    else {
      const existing = document.getElementById("gt-leaflet-js") as HTMLScriptElement | null;
      const script = existing || document.createElement("script");
      script.id = "gt-leaflet-js"; script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = init;
      if (!existing) document.body.appendChild(script);
    }
    return () => { cancelled = true; if (map) map.remove(); };
  }, [points.map((point) => `${point.lat},${point.lon},${point.title}`).join("|")]);
  if (points.length === 0) return <section className="gt-trip-map"><h3>Mapa da viagem</h3><p>Adicione endereços aos itens para ver os pontos salvos neste mapa. O endereço é opcional.</p></section>;
  return <section className="gt-trip-map"><h3>Mapa consolidado da viagem</h3><p>Os pontos aparecem quando um endereço é selecionado. Cores representam as áreas do pacote.</p><div className="gt-trip-map-legend">{[[2,"Hospedagens"],[3,"Passeios"],[6,"Alimentação"],[4,"Deslocamento"],[8,"Cronograma"]].map(([id,label]) => <span key={String(id)}><i style={{ background: COLORS[Number(id)] || "#e85d4a" }} />{label}</span>)}</div><div ref={elementRef} className="gt-trip-map-canvas" role="application" aria-label="Mapa com os locais salvos na viagem" /></section>;
}
