"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import ScheduleWidget from "@/components/ScheduleWidget";

// Ruta de prueba: inicio -4.012342, -79.204543 → fin -4.032308, -79.202414
// 25 puntos interpolados, un ping cada 2 s
const ROUTE: [number, number][] = [
  [-4.012342, -79.204543],
  [-4.013174, -79.204454],
  [-4.014006, -79.204365],
  [-4.014838, -79.204277],
  [-4.015670, -79.204188],
  [-4.016502, -79.204099],
  [-4.017334, -79.204010],
  [-4.018166, -79.203922],
  [-4.018998, -79.203833],
  [-4.019830, -79.203744],
  [-4.020662, -79.203655],
  [-4.021494, -79.203566],
  [-4.022326, -79.203478],
  [-4.023158, -79.203389],
  [-4.023990, -79.203300],
  [-4.024822, -79.203211],
  [-4.025654, -79.203122],
  [-4.026486, -79.203034],
  [-4.027318, -79.202945],
  [-4.028150, -79.202856],
  [-4.028982, -79.202767],
  [-4.029814, -79.202678],
  [-4.030646, -79.202590],
  [-4.031478, -79.202501],
  [-4.032308, -79.202414],
];
const SIM_INTERVAL_MS = 2000;

const TruckMap = dynamic(() => import("@/components/map/TruckMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#f0f3ff" }}>
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
        <p className="text-sm" style={{ color: "#707973" }}>Cargando mapa…</p>
      </div>
    </div>
  ),
});

interface Truck {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  lastUpdate: string;
  currentBarrio: { id: number; name: string } | null;
}

interface User {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  barrioId: number | null;
  barrio: { id: number; name: string } | null;
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


export default function MapPage() {
  const [trucks,     setTrucks]     = useState<Truck[]>([]);
  const [user,       setUser]       = useState<User | null>(null);
  const [status,     setStatus]     = useState<"live" | "offline">("live");
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [barrioGeos, setBarrioGeos] = useState<BarrioGeo[]>([]);
  const [history,    setHistory]    = useState<HistoryPoint[]>([]);
  const [routeGeos,  setRouteGeos]  = useState<RouteGeo[]>([]);
  const [simRunning, setSimRunning]   = useState(false);
  const [simStep,    setSimStep]      = useState(0);
  const [simTruckId, setSimTruckId]  = useState<number | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrucks = useCallback(async () => {
    try {
      const data = await api.get<Truck[]>("/api/trucks");
      setTrucks(data);
      setStatus("live");
    } catch {
      setStatus("offline");
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const raw = localStorage.getItem("eco_user");
      if (!raw) return;
      const u = JSON.parse(raw) as { id: number };
      const data = await api.get<User>(`/api/users/${u.id}`);
      setUser(data);
    } catch {/* silent */}
  }, []);

  const fetchBarrioGeos = useCallback(async () => {
    try {
      const data = await api.get<BarrioGeo[]>("/api/barrios/geodata");
      setBarrioGeos(data);
    } catch {/* silent */}
  }, []);

  const fetchRouteGeos = useCallback(async () => {
    try {
      const data = await api.get<RouteGeo[]>("/api/routes/geodata");
      setRouteGeos(data);
    } catch {/* silent */}
  }, []);

  // SSE — real-time truck updates
  useEffect(() => {
    const token = localStorage.getItem("eco_token");
    if (!token) return;

    // Fetch initial data immediately so UI isn't empty while SSE connects
    fetchTrucks();
    fetchUser();
    fetchBarrioGeos();
    fetchRouteGeos();

    const es = new EventSource(`/api/trucks/stream?token=${encodeURIComponent(token)}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as Truck[];
        setTrucks(data);
        setStatus("live");
      } catch {/* ignore malformed */}
    };

    es.onerror = () => setStatus("offline");

    return () => es.close();
  }, [fetchTrucks, fetchUser, fetchBarrioGeos, fetchRouteGeos]);

  // Fetch history when selected truck changes
  useEffect(() => {
    const truckId = selectedTruck?.id ?? trucks.find((t) => t.lat != null)?.id;
    if (!truckId) { setHistory([]); return; }
    api.get<HistoryPoint[]>(`/api/trucks/${truckId}/history`)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [selectedTruck, trucks]);

  // ── Simulation ──────────────────────────────────────────────────────────
  function startSim() {
    const truckId = simTruckId ?? trucks[0]?.id;
    if (!truckId || simRef.current) return;
    setSimRunning(true);
    let step = 0;
    setSimStep(0);

    async function tick() {
      const [lat, lng] = ROUTE[step];
      try {
        await api.post("/api/trucks/location", { truckId, lat, lng });
        await fetchTrucks();
      } catch {/* silent */}
      step = (step + 1) % ROUTE.length;
      setSimStep(step);
    }

    tick();
    simRef.current = setInterval(tick, SIM_INTERVAL_MS);
  }

  function stopSim() {
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
    setSimRunning(false);
  }

  useEffect(() => () => { if (simRef.current) clearInterval(simRef.current); }, []);
  // ────────────────────────────────────────────────────────────────────────

  const activeTruck = trucks.find((t) => t.lat != null);
  const displayTruck = selectedTruck ?? activeTruck ?? null;

  // Estimate time (mock: distance in km / avg 15 km/h)
  function estimateMinutes(truck: Truck, user: User | null): string {
    if (!truck.lat || !truck.lng || !user?.lat || !user?.lng) return "–";
    const dlat = truck.lat - user.lat;
    const dlng = truck.lng - user.lng;
    const km = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
    const mins = Math.round((km / 15) * 60);
    return mins < 1 ? "< 1 min" : `${mins} min`;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">

      {/* ── Full-screen map ── */}
      <div className="absolute inset-0 z-0">
        <TruckMap
          trucks={trucks}
          userLat={user?.lat}
          userLng={user?.lng}
          barrioGeos={barrioGeos}
          history={history}
          routeGeos={routeGeos}
        />
      </div>

      {/* Left gradient overlay on desktop */}
      <div className="absolute inset-y-0 left-0 w-[45%] z-10 pointer-events-none hidden md:block map-gradient-left" />

      {/* ── Overlay panel (top-left) ── */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 w-[calc(100%-2rem)] md:w-96 flex flex-col gap-3 pointer-events-auto">

        {/* Status card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,.96)", backdropFilter: "blur(16px)", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
        >
          {/* Top accent bar */}
          <div style={{ height: 3, background: "#0f5238" }} />

          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#707973", letterSpacing: "0.08em" }}>
                  Estado Actual
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: status === "live" ? "#22c55e" : "#ba1a1a", boxShadow: status === "live" ? "0 0 0 3px rgba(34,197,94,.2)" : "none" }}
                  />
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: "#111c2c" }}>
                    {displayTruck?.currentBarrio
                      ? `En ${displayTruck.currentBarrio.name}`
                      : activeTruck ? "En tránsito" : "Sin camiones activos"}
                  </h2>
                </div>
              </div>
              {displayTruck && user && (
                <div
                  className="px-3 py-1 rounded-full text-sm font-bold flex-shrink-0"
                  style={{ background: "#dcfce7", color: "#0f5238" }}
                >
                  ~{estimateMinutes(displayTruck, user)}
                </div>
              )}
            </div>

            {/* Route info */}
            {displayTruck && (
              <div className="flex items-center gap-4 py-3 border-y" style={{ borderColor: "#f0f3ff" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#707973" }}>Camión</p>
                  <p className="text-sm font-bold truncate" style={{ color: "#111c2c" }}>{displayTruck.name}</p>
                </div>
                <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#707973" }}>Barrio</p>
                  <p className="text-sm font-bold truncate" style={{ color: "#111c2c" }}>
                    {displayTruck.currentBarrio?.name ?? "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Progress */}
            {trucks.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#707973" }}>Camiones activos</p>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "#e7eeff" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round((trucks.filter(t => t.lat != null).length / Math.max(trucks.length, 1)) * 100)}%`,
                      background: "#0f5238",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: "#707973" }}>
                  <span>{trucks.filter(t => t.lat != null).length} en ruta</span>
                  <span>{trucks.length} total</span>
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              className="w-full py-3 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[.98]"
              style={{ background: "#0f5238", boxShadow: "0 2px 8px rgba(15,82,56,.2)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications_active</span>
              Activar notificaciones
            </button>
          </div>
        </div>

        {/* Schedule widget */}
        <ScheduleWidget />

        {/* Alert card */}
        {status === "offline" && (
          <div
            className="p-4 rounded-xl flex items-center gap-3 animate-fade-up"
            style={{
              background: "rgba(255,255,255,.95)",
              backdropFilter: "blur(16px)",
              borderLeft: "4px solid #d97706",
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            }}
          >
            <div className="p-2 rounded-lg flex-shrink-0" style={{ background: "#fef3c7" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#d97706", fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#111c2c" }}>Sin conexión al servidor</p>
              <p className="text-xs mt-0.5" style={{ color: "#707973" }}>Reconectando…</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Truck list (bottom sheet style on mobile) ── */}
      {trucks.length > 0 && (
        <div
          className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-64 z-20 flex flex-col gap-2"
        >
          {trucks.slice(0, 3).map((truck) => (
            <button
              key={truck.id}
              onClick={() => setSelectedTruck(truck.id === selectedTruck?.id ? null : truck)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[.98]"
              style={{
                background: selectedTruck?.id === truck.id ? "#dcfce7" : "rgba(255,255,255,.95)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${selectedTruck?.id === truck.id ? "#0f5238" : "#e2e8f0"}`,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: truck.lat != null ? "#0f5238" : "#e2e8f0" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: truck.lat != null ? "#fff" : "#707973", fontVariationSettings: "'FILL' 1" }}
                >
                  local_shipping
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#111c2c" }}>{truck.name}</p>
                <p className="text-xs truncate" style={{ color: "#707973" }}>
                  {truck.currentBarrio?.name ?? (truck.lat != null ? "En tránsito" : "Sin señal")}
                </p>
              </div>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: truck.lat != null ? "#22c55e" : "#bfc9c1" }}
              />
            </button>
          ))}
        </div>
      )}

      {/* ── FABs ── */}
      <div className="absolute bottom-28 right-4 md:bottom-8 md:right-6 z-20 flex flex-col gap-2">
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
          aria-label="Mi ubicación"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#475569" }}>my_location</span>
        </button>
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
          aria-label="Capas"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#475569" }}>layers</span>
        </button>
      </div>

      {/* ── Simulation control ── */}
      <div
        className="absolute bottom-28 left-4 md:bottom-8 md:left-6 z-20 rounded-2xl overflow-hidden flex flex-col gap-0"
        style={{
          background: "rgba(255,255,255,.97)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 4px 16px rgba(0,0,0,.10)",
          border: "1px solid #e2e8f0",
          minWidth: 220,
        }}
      >
        {/* Header strip */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{ borderColor: "#f0f3ff", background: "#fafafa" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: "#0f5238", fontVariationSettings: "'FILL' 1" }}
          >
            science
          </span>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#475569", letterSpacing: "0.08em" }}>
            Simulador
          </span>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Truck selector */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#707973" }}>
              Camión
            </label>
            <select
              disabled={simRunning}
              value={simTruckId ?? ""}
              onChange={(e) => setSimTruckId(Number(e.target.value) || null)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all disabled:opacity-50"
              style={{ borderColor: "#bfc9c1", color: "#111c2c", background: "#fff" }}
            >
              <option value="">— elegir camión —</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (id {t.id})
                </option>
              ))}
            </select>
          </div>

          {/* Progress bar */}
          {simRunning && (
            <div className="space-y-1">
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "#e7eeff" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(((simStep + 1) / ROUTE.length) * 100)}%`, background: "#0f5238" }}
                />
              </div>
              <p className="text-[10px] text-right" style={{ color: "#707973" }}>
                Punto {simStep + 1} / {ROUTE.length}
              </p>
            </div>
          )}

          {/* Play / Stop button */}
          <button
            onClick={simRunning ? stopSim : startSim}
            disabled={!simRunning && trucks.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: simRunning ? "#ba1a1a" : "#0f5238",
              boxShadow: simRunning ? "0 2px 8px rgba(186,26,26,.25)" : "0 2px 8px rgba(15,82,56,.25)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              {simRunning ? "stop_circle" : "play_circle"}
            </span>
            {simRunning ? "Detener" : "Iniciar simulación"}
          </button>
        </div>
      </div>

      {/* GPS live badge */}
      <div className="absolute top-4 right-4 z-20">
        <div
          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
          style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", border: "1px solid #e2e8f0" }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: status === "live" ? "#22c55e" : "#ba1a1a", boxShadow: status === "live" ? "0 0 0 3px rgba(34,197,94,.2)" : "none" }}
          />
          <span style={{ color: "#111c2c" }}>GPS {status === "live" ? "en vivo" : "sin señal"}</span>
        </div>
      </div>
    </div>
  );
}
