"use client";

import { useEffect, useRef } from "react";
import type * as L from "leaflet";
type LeafletLib = typeof L;
type Map = L.Map;
type Marker = L.Marker;
type Circle = L.Circle;
type Layer = L.Layer;

interface TruckData {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  currentBarrio: { id: number; name: string } | null;
}

interface BarrioGeo {
  id: number;
  name: string;
  geojson: GeoJSON.Geometry | null;
}

interface HistoryPoint {
  lat: number;
  lng: number;
  recordedAt: string;
}

interface RouteGeo {
  id: number;
  name: string;
  truckId: number | null;
  truckName: string | null;
  geojson: GeoJSON.Geometry | null;
}

interface Props {
  trucks: TruckData[];
  userLat?: number | null;
  userLng?: number | null;
  barrioGeos?: BarrioGeo[];
  history?: HistoryPoint[];   // breadcrumb trail for the selected truck
  routeGeos?: RouteGeo[];
}

// Centro de la ruta de prueba (Loja, Ecuador)
const DEFAULT_LAT = -4.022;
const DEFAULT_LNG = -79.203;

export default function TruckMap({ trucks, userLat, userLng, barrioGeos = [], history = [], routeGeos = [] }: Props) {
  const mapRef          = useRef<Map | null>(null);
  const divRef          = useRef<HTMLDivElement>(null);
  const markersRef      = useRef<Marker[]>([]);
  const userMarkerRef   = useRef<Marker | null>(null);
  const nearCircleRef   = useRef<Circle | null>(null);
  const barrioLayersRef = useRef<Layer[]>([]);
  const historyLayerRef = useRef<Layer | null>(null);
  const routeLayersRef  = useRef<Layer[]>([]);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    (async () => {
      const L = await import("leaflet") as LeafletLib;

      const map = L.map(divRef.current!, {
        center: [userLat ?? DEFAULT_LAT, userLng ?? DEFAULT_LNG],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      renderLayers(L, map);
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = await import("leaflet") as LeafletLib;
      renderLayers(L, mapRef.current!);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trucks, userLat, userLng, barrioGeos, history, routeGeos]);

  function renderLayers(L: LeafletLib, map: Map) {
    // ── Clear previous ──────────────────────────────────────────────────────
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    userMarkerRef.current?.remove();
    nearCircleRef.current?.remove();
    barrioLayersRef.current.forEach((l) => l.remove());
    barrioLayersRef.current = [];
    historyLayerRef.current?.remove();
    routeLayersRef.current.forEach((l) => l.remove());
    routeLayersRef.current = [];

    // ── Barrio polygons ─────────────────────────────────────────────────────
    barrioGeos.forEach((barrio) => {
      if (!barrio.geojson) return;

      // Filled polygon
      const layer = L.geoJSON(barrio.geojson as GeoJSON.GeoJsonObject, {
        style: {
          color: "#1960a3",
          fillColor: "#1960a3",
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "5 4",
        },
      })
        .bindTooltip(barrio.name, {
          permanent: false,
          direction: "center",
          className: "barrio-label",
        })
        .addTo(map);

      barrioLayersRef.current.push(layer);

      // Label — place at centroid via getBounds
      try {
        const bounds = layer.getBounds();
        const center = bounds.getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: "",
            html: `<div style="
              background:rgba(25,96,163,.85);color:#fff;
              font-size:11px;font-weight:700;
              padding:3px 8px;border-radius:6px;
              white-space:nowrap;
              font-family:'Public Sans',system-ui,sans-serif;
              box-shadow:0 2px 6px rgba(0,0,0,.2);
            ">${barrio.name}</div>`,
            iconAnchor: [0, 0],
          }),
          interactive: false,
          zIndexOffset: -100,
        }).addTo(map);
        barrioLayersRef.current.push(label);
      } catch {/* empty polygon */}
    });

    // ── History trail ────────────────────────────────────────────────────────
    if (history.length >= 2) {
      const coords: [number, number][] = [...history]
        .reverse()
        .map((p) => [p.lat, p.lng]);

      historyLayerRef.current = L.polyline(coords, {
        color: "#d97706",
        weight: 3,
        opacity: 0.7,
        dashArray: "8 4",
      }).addTo(map);
    }

    // ── Planned routes ───────────────────────────────────────────────────────
    // One stable color per truckId so each truck's route is visually distinct
    const ROUTE_PALETTE = ["#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
    const truckColorMap = new Map<number, string>();

    routeGeos.forEach((route) => {
      if (!route.geojson) return;

      // Assign a color per truck deterministically
      if (!truckColorMap.has(route.truckId!)) {
        const idx = truckColorMap.size % ROUTE_PALETTE.length;
        truckColorMap.set(route.truckId!, ROUTE_PALETTE[idx]);
      }
      const routeColor = route.truckId != null
        ? truckColorMap.get(route.truckId)!
        : "#94a3b8";

      const layer = L.geoJSON(route.geojson as GeoJSON.GeoJsonObject, {
        style: {
          color: routeColor,
          weight: 4,
          opacity: 0.85,
          dashArray: "10 5",
        },
      })
        .bindTooltip(
          `<div style="font-family:'Public Sans',system-ui;min-width:120px">
            <p style="font-weight:700;font-size:13px;color:#111c2c;margin:0 0 2px">${route.name}</p>
            ${route.truckName
              ? `<span style="display:inline-flex;align-items:center;gap:4px;background:${routeColor}22;color:${routeColor};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid ${routeColor}44">
                   <span class="material-symbols-outlined" style="font-size:11px;font-variation-settings:'FILL' 1">local_shipping</span>
                   ${route.truckName}
                 </span>`
              : ""}
          </div>`,
          { sticky: true, className: "route-tooltip" }
        )
        .addTo(map);

      routeLayersRef.current.push(layer);

      // Dot markers at start and end of route
      try {
        const geoLayer = layer as L.GeoJSON;
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          // Start cap (filled circle at first coord)
          const coords = (route.geojson as GeoJSON.LineString).coordinates;
          if (coords?.length >= 2) {
            const [startLng, startLat] = coords[0];
            const [endLng, endLat] = coords[coords.length - 1];

            [
              { lat: startLat, lng: startLng, label: "A" },
              { lat: endLat,   lng: endLng,   label: "B" },
            ].forEach(({ lat, lng, label }) => {
              const cap = L.circleMarker([lat, lng], {
                radius: 6,
                color: "#fff",
                weight: 2,
                fillColor: routeColor,
                fillOpacity: 1,
              }).addTo(map);
              routeLayersRef.current.push(cap);
            });
          }
        }
      } catch {/* ignore */}
    });

    // ── Truck markers ────────────────────────────────────────────────────────
    const truckIcon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div class="pin-pulse" style="position:absolute;inset:0;border-radius:50%;"></div>
          <div style="
            position:relative;z-index:2;
            width:44px;height:44px;border-radius:50%;
            background:#0f5238;border:2.5px solid #fff;
            box-shadow:0 3px 10px rgba(0,0,0,.25);
            display:flex;align-items:center;justify-content:center;
          ">
            <span class="material-symbols-outlined" style="
              font-size:22px;color:#fff;
              font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24;
            ">local_shipping</span>
          </div>
        </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const homeIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:#1960a3;border:2.5px solid #fff;
          box-shadow:0 3px 8px rgba(0,0,0,.2);
          display:flex;align-items:center;justify-content:center;
        ">
          <span class="material-symbols-outlined" style="
            font-size:18px;color:#fff;
            font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24;
          ">home</span>
        </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    trucks.forEach((truck) => {
      if (truck.lat == null || truck.lng == null) return;
      const marker = L.marker([truck.lat, truck.lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'Public Sans',system-ui,sans-serif;min-width:140px">
            <p style="font-weight:700;font-size:14px;color:#111c2c;margin:0 0 4px">${truck.name}</p>
            ${truck.currentBarrio
              ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#0f5238;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;">
                   <span class="material-symbols-outlined" style="font-size:12px;font-variation-settings:'FILL' 1">location_on</span>
                   ${truck.currentBarrio.name}
                 </span>`
              : `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;display:inline-block;">
                   En tránsito
                 </span>`}
            <p style="font-size:11px;color:#707973;margin:6px 0 0">
              ${truck.lat.toFixed(5)}, ${truck.lng.toFixed(5)}
            </p>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // ── User home + proximity ring ───────────────────────────────────────────
    const uLat = userLat ?? DEFAULT_LAT;
    const uLng = userLng ?? DEFAULT_LNG;

    userMarkerRef.current = L.marker([uLat, uLng], { icon: homeIcon })
      .addTo(map)
      .bindPopup(`<p style="font-weight:700;font-size:13px;color:#1960a3;font-family:'Public Sans',system-ui">Mi casa</p>`);

    nearCircleRef.current = L.circle([uLat, uLng], {
      radius: 500,
      color: "#1960a3",
      fillColor: "#1960a3",
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);
  }

  return (
    <div
      ref={divRef}
      style={{ width: "100%", height: "100%" }}
      aria-label="Mapa de seguimiento de camiones"
    />
  );
}
