"use client";
import React, { useEffect, useState } from "react";

type Suggestion = { name: string; street?: string; housenumber?: string; city?: string; state?: string; country?: string; lat: number; lon: number; osm_id?: number; osm_type?: string };
interface Props { value?: string | null; placeholder?: string; onSelect: (place: { address: string; latitude: number; longitude: number; place_id: string }) => void; }

export function LocationAutocomplete({ value, placeholder = "Endereço opcional para aparecer no mapa", onSelect }: Props) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setQuery(value || ""); }, [value]);
  useEffect(() => {
    if (query.trim().length < 3 || query === value) { setSuggestions([]); return; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=pt`;
        const response = await fetch(url);
        const data = await response.json() as { features?: Array<{ properties: Suggestion; geometry: { coordinates: [number, number] } }> };
        if (!cancelled) setSuggestions((data.features || []).map((feature) => ({ ...feature.properties, lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] })));
      } catch { if (!cancelled) setSuggestions([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [query, value]);
  const label = (place: Suggestion) => [place.name, place.street, place.housenumber, place.city, place.state, place.country].filter(Boolean).join(", ");
  return <div className="gt-location-autocomplete"><input className="gt-input" value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} aria-label="Endereço opcional" />{loading && <small>Buscando endereço…</small>}{suggestions.length > 0 && <ul className="gt-location-suggestions">{suggestions.map((place, index) => <li key={`${place.osm_type || "p"}-${place.osm_id || index}`}><button type="button" onClick={() => { const address = label(place); setQuery(address); setSuggestions([]); onSelect({ address, latitude: place.lat, longitude: place.lon, place_id: `${place.osm_type || "photon"}:${place.osm_id || address}` }); }}>{label(place)}</button></li>)}</ul>}</div>;
}
