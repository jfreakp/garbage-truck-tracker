"use client";

import { useEffect, useRef } from "react";
import type * as L from "leaflet";
type LeafletLib = typeof L;

interface Props {
  points: [number, number][];        // [lat, lng] vertices being drawn
  existingBarrios: { id: number; name: string; polygon?: string }[];
  onMapClick: (lat: number, lng: number) => void;
}

const DEFAULT_LAT = -4.022;
const DEFAULT_LNG = -79.203;

export default function BarrioDrawMap({ points, onMapClick, existingBarrios }: Props) {
  const divRef    = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  // Init map once
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    (async () => {
      const L = await import("leaflet") as LeafletLib;
      const map = L.map(divRef.current!, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: 14,
        zoomControl: false,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    })();

    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render layers when points change
  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = await import("leaflet") as LeafletLib;
      const map = mapRef.current!;

      // Clear previous layers
      layersRef.current.forEach((l) => l.remove());
      layersRef.current = [];

      // Vertex icon
      const vertexIcon = (index: number) => L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:#0f5238;border:2.5px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,.25);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;color:#fff;
          font-family:system-ui,sans-serif;
        ">${index + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Draw vertices as numbered markers
      points.forEach(([lat, lng], i) => {
        const m = L.marker([lat, lng], { icon: vertexIcon(i) }).addTo(map);
        layersRef.current.push(m);
      });

      // Draw lines connecting the vertices
      if (points.length >= 2) {
        const line = L.polyline(points as [number, number][], {
          color: "#0f5238",
          weight: 2.5,
          dashArray: "6 4",
          opacity: 0.9,
        }).addTo(map);
        layersRef.current.push(line);
      }

      // Draw closed polygon preview (filled) when 3+ points
      if (points.length >= 3) {
        const poly = L.polygon(points as [number, number][], {
          color: "#0f5238",
          fillColor: "#0f5238",
          fillOpacity: 0.12,
          weight: 2,
        }).addTo(map);
        layersRef.current.push(poly);
      }

      // Draw closing line (last → first) hint
      if (points.length >= 3) {
        const closing = L.polyline(
          [points[points.length - 1], points[0]] as [number, number][],
          { color: "#0f5238", weight: 1.5, dashArray: "3 6", opacity: 0.5 }
        ).addTo(map);
        layersRef.current.push(closing);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  return (
    <div
      ref={divRef}
      style={{ width: "100%", height: "100%" }}
      aria-label="Mapa para dibujar polígono del barrio"
    />
  );
}
