"use client";

import { useEffect, useRef } from "react";
import type * as L from "leaflet";
type LeafletLib = typeof L;

interface Props {
  points: [number, number][];
  onMapClick: (lat: number, lng: number) => void;
}

const DEFAULT_LAT = -4.022;
const DEFAULT_LNG = -79.203;

// Distinct colors for the route line
const ROUTE_COLOR = "#d97706";

export default function RouteDrawMap({ points, onMapClick }: Props) {
  const divRef    = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

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
      map.on("click", (e: L.LeafletMouseEvent) => onMapClick(e.latlng.lat, e.latlng.lng));
      mapRef.current = map;
    })();
    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = await import("leaflet") as LeafletLib;
      const map = mapRef.current!;

      layersRef.current.forEach((l) => l.remove());
      layersRef.current = [];

      if (points.length === 0) return;

      // Numbered waypoint markers
      points.forEach(([lat, lng], i) => {
        const isFirst = i === 0;
        const isLast  = i === points.length - 1 && points.length > 1;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:${isFirst || isLast ? 32 : 24}px;
            height:${isFirst || isLast ? 32 : 24}px;
            border-radius:50%;
            background:${isFirst ? "#22c55e" : isLast ? "#ba1a1a" : ROUTE_COLOR};
            border:2.5px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,.25);
            display:flex;align-items:center;justify-content:center;
            font-size:${isFirst || isLast ? 12 : 10}px;
            font-weight:700;color:#fff;
            font-family:system-ui,sans-serif;
          ">${isFirst ? "A" : isLast ? "B" : i + 1}</div>`,
          iconSize:   [isFirst || isLast ? 32 : 24, isFirst || isLast ? 32 : 24],
          iconAnchor: [isFirst || isLast ? 16 : 12,  isFirst || isLast ? 16 : 12],
        });

        const m = L.marker([lat, lng], { icon }).addTo(map);
        layersRef.current.push(m);
      });

      // Route line
      if (points.length >= 2) {
        const line = L.polyline(points as [number, number][], {
          color:   ROUTE_COLOR,
          weight:  4,
          opacity: 0.85,
        }).addTo(map);

        // Arrowhead decoration at midpoints using divIcon markers
        for (let i = 0; i < points.length - 1; i++) {
          const [lat1, lng1] = points[i];
          const [lat2, lng2] = points[i + 1];
          const midLat = (lat1 + lat2) / 2;
          const midLng = (lng1 + lng2) / 2;
          const angle  = Math.atan2(lat2 - lat1, lng2 - lng1) * (180 / Math.PI);

          const arrow = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: "",
              html: `<div style="
                transform:rotate(${angle}deg);
                font-size:16px;color:${ROUTE_COLOR};
                filter:drop-shadow(0 1px 2px rgba(0,0,0,.3));
              ">➤</div>`,
              iconSize:   [16, 16],
              iconAnchor: [8, 8],
            }),
            interactive: false,
          }).addTo(map);
          layersRef.current.push(arrow);
        }

        layersRef.current.push(line);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  return (
    <div
      ref={divRef}
      style={{ width: "100%", height: "100%" }}
      aria-label="Mapa para dibujar ruta de recolección"
    />
  );
}
