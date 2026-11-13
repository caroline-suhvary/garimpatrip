"use client";
import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, ExternalLink, Layers } from "lucide-react";
import type { PackageItem, ScheduleItem, Trip } from "@/types";

declare global {
  interface Window {
    L?: any;
  }
}

interface Props {
  trip?: Trip | null;
  items?: PackageItem[];
  schedule?: ScheduleItem[];
}

const CATEGORY_COLORS: Record<number, { bg: string; label: string }> = {
  1: { bg: "#e85d4a", label: "Transporte Principal" },
  2: { bg: "#3478c5", label: "Hospedagem" },
  3: { bg: "#ed8b26", label: "Passeios & Atrações" },
  4: { bg: "#8056b3", label: "Deslocamento Local" },
  5: { bg: "#718096", label: "Documentação" },
  6: { bg: "#2c9a69", label: "Alimentação" },
  7: { bg: "#be8a18", label: "Câmbio" },
  8: { bg: "#e11d48", label: "Cronograma Diário" },
  10: { bg: "#53616f", label: "Checklist" },
  11: { bg: "#86198f", label: "Dicas de Roteiro" },
};

export function ConsolidatedTripMap({
  trip,
  items = [],
  schedule = [],
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapStatus, setMapStatus] = useState<string>(
    "Carregando mapa interativo…",
  );

  const destCity = trip?.destination_city || "Destino";

  const points = [
    ...(items || [])
      .filter(
        (it) =>
          it.latitude != null &&
          it.longitude != null &&
          !isNaN(Number(it.latitude)) &&
          !isNaN(Number(it.longitude)),
      )
      .map((it) => ({
        title: it.title || "Item do Pacote",
        lat: Number(it.latitude),
        lon: Number(it.longitude),
        categoryId: it.category_id || 3,
        address: it.address || "",
        externalUrl: it.external_url || null,
      })),
    ...(schedule || [])
      .filter(
        (sc) =>
          sc.latitude != null &&
          sc.longitude != null &&
          !isNaN(Number(sc.latitude)) &&
          !isNaN(Number(sc.longitude)),
      )
      .map((sc) => ({
        title: sc.title || "Atividade do Cronograma",
        lat: Number(sc.latitude),
        lon: Number(sc.longitude),
        categoryId: 8,
        address: sc.location_name || "",
        externalUrl: null,
      })),
  ];

  useEffect(() => {
    const host = elementRef.current;
    if (!host || !trip) return;

    let isSubscribed = true;

    // Garante CSS do Leaflet
    const cssId = "gt-leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const renderMap = async () => {
      if (!isSubscribed || !host || !window.L) return;

      try {
        // Limpeza prévia segura para evitar erro "Map container is already initialized"
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        if ((host as any)._leaflet_id) {
          delete (host as any)._leaflet_id;
        }

        const map = window.L.map(host, {
          zoomControl: true,
          scrollWheelZoom: false,
        });
        mapInstanceRef.current = map;

        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          },
        ).addTo(map);

        if (points.length > 0) {
          const bounds = window.L.latLngBounds([]);

          points.forEach((pt) => {
            const cat = CATEGORY_COLORS[pt.categoryId] || {
              bg: "#e85d4a",
              label: "Item",
            };
            const markerIcon = window.L.divIcon({
              className: "gt-custom-marker",
              html: `<div style="background-color: ${cat.bg}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700;">${pt.categoryId}</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              popupAnchor: [0, -14],
            });

            const marker = window.L.marker([pt.lat, pt.lon], {
              icon: markerIcon,
            }).addTo(map);
            bounds.extend([pt.lat, pt.lon]);

            const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pt.title} ${pt.address || destCity}`)}`;
            const popupHtml = `
              <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 190px;">
                <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${cat.bg};">${cat.label}</span>
                <strong style="display: block; font-size: 14px; margin: 2px 0 4px; color: #1e293b;">${pt.title}</strong>
                ${pt.address ? `<div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">📍 ${pt.address}</div>` : ""}
                <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; color: #0284c7; text-decoration: none; font-weight: 600; font-size: 12px; margin-top: 4px;">
                  Abrir no Google Maps ↗
                </a>
              </div>
            `;
            marker.bindPopup(popupHtml);
          });

          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
          setMapStatus(
            `${points.length} local(is) marcado(s) no roteiro de ${destCity}.`,
          );
        } else {
          setMapStatus(`Localizando ${destCity} no mapa…`);
          try {
            const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destCity)}&count=1&language=pt&format=json`;
            const res = await fetch(geocodeUrl);
            const data = await res.json();
            const hit = data?.results?.[0];
            const lat = hit?.latitude ?? -14.235;
            const lon = hit?.longitude ?? -51.925;
            const zoom = hit ? 13 : 4;

            if (isSubscribed && mapInstanceRef.current) {
              map.setView([lat, lon], zoom);
              const destMarker = window.L.marker([lat, lon]).addTo(map);
              destMarker
                .bindPopup(`<strong>Destino da Viagem</strong><br>${destCity}`)
                .openPopup();
              setMapStatus(
                `Mapa centralizado em ${destCity}. Adicione passeios ou hospedagens com endereço para visualizá-los aqui.`,
              );
            }
          } catch {
            if (isSubscribed && mapInstanceRef.current) {
              map.setView([-14.235, -51.925], 4);
              setMapStatus(`Mapa da viagem: ${destCity}.`);
            }
          }
        }
      } catch (err) {
        setMapStatus("Não foi possível carregar a visualização do mapa.");
      }
    };

    if (!window.L) {
      const scriptId = "gt-leaflet-js";
      let script = document.getElementById(
        scriptId,
      ) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => {
          if (isSubscribed) renderMap();
        };
        document.body.appendChild(script);
      } else {
        script.addEventListener("load", () => {
          if (isSubscribed) renderMap();
        });
      }
    } else {
      renderMap();
    }

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (host && (host as any)._leaflet_id) {
        delete (host as any)._leaflet_id;
      }
    };
  }, [trip?.id, destCity, points.length]);

  if (!trip) return null;

  return (
    <section
      className="gt-trip-map"
      style={{
        marginTop: "2.5rem",
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#ffffff",
        borderRadius: "1rem",
        border: "1px solid #cbd5e1",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}>
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#d97706",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
            <Layers size={15} /> Mapa Consolidado da Viagem
          </span>
          <h3
            style={{
              margin: "0.35rem 0 0.2rem",
              fontSize: "1.35rem",
              color: "#0f172a",
              fontWeight: 700,
            }}>
            Seus Achados e Roteiro em {destCity}
          </h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
            {mapStatus}
          </p>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destCity)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="gt-btn gt-btn-light gt-btn-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}>
          <ExternalLink size={14} /> Abrir {destCity} no Google Maps
        </a>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          margin: "0.75rem 0 1.25rem",
          padding: "0.75rem 1rem",
          background: "#f8fafc",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
        }}>
        {[
          [1, "Transporte"],
          [2, "Hospedagens"],
          [3, "Passeios"],
          [4, "Deslocamento"],
          [6, "Alimentação"],
          [8, "Cronograma"],
          [11, "Dicas"],
        ].map(([id, label]) => {
          const c = CATEGORY_COLORS[Number(id)];
          return (
            <span
              key={String(id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                color: "#334155",
                fontWeight: 600,
              }}>
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  backgroundColor: c.bg,
                }}
              />
              {label}
            </span>
          );
        })}
      </div>

      <div
        ref={elementRef}
        style={{
          width: "100%",
          height: "440px",
          borderRadius: "0.75rem",
          background: "#e2e8f0",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
          position: "relative",
          zIndex: 1,
        }}
        role="application"
        aria-label={`Mapa consolidado de ${destCity}`}
      />
    </section>
  );
}
