"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

const RouteDrawMap = dynamic(() => import("@/components/map/RouteDrawMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#f0f3ff" }}>
      <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
    </div>
  ),
});

interface Route {
  id:        number;
  name:      string;
  createdAt: string;
  truck:     { id: number; name: string } | null;
}

interface Truck { id: number; name: string; }

type Mode = "list" | "draw" | "confirm";

function haversine([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalKm(points: [number, number][]) {
  let d = 0;
  for (let i = 0; i < points.length - 1; i++) d += haversine(points[i], points[i + 1]);
  return d;
}

export default function RoutesPage() {
  const [routes,      setRoutes]      = useState<Route[]>([]);
  const [trucks,      setTrucks]      = useState<Truck[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [mode,        setMode]        = useState<Mode>("list");
  const [points,      setPoints]      = useState<[number, number][]>([]);
  const [name,        setName]        = useState("");
  const [truckId,     setTruckId]     = useState<number | "">("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState<number | null>(null);
  // Inline reassignment state: routeId → new truckId being patched
  const [reassigning, setReassigning] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, t] = await Promise.all([
        api.get<Route[]>("/api/routes"),
        api.get<Truck[]>("/api/trucks"),
      ]);
      setRoutes(r);
      setTrucks(t);
    } catch { setError("No se pudo cargar las rutas."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function reset() {
    setPoints([]); setName(""); setTruckId(""); setMode("list"); setError(null);
  }

  async function handleSave() {
    if (points.length < 2 || !name.trim() || truckId === "") return;
    setSaving(true); setError(null);
    try {
      await api.post("/api/routes", {
        name:    name.trim(),
        truckId: Number(truckId),
        points,
      });
      await load();
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar la ruta.");
    } finally { setSaving(false); }
  }

  async function handleReassign(routeId: number, newTruckId: number | null) {
    setReassigning(routeId);
    try {
      await api.patch(`/api/routes/${routeId}`, { truckId: newTruckId });
      await load();
    } catch { setError("No se pudo reasignar el camión."); }
    finally   { setReassigning(null); }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await api.delete(`/api/routes/${id}`);
      await load();
    } catch { setError("No se pudo eliminar la ruta."); }
    finally   { setDeleting(null); }
  }

  const km = totalKm(points);
  const canSave = points.length >= 2 && name.trim() !== "" && truckId !== "";

  // ── DRAW / CONFIRM MODE ───────────────────────────────────────────────────
  if (mode === "draw" || mode === "confirm") {
    return (
      <div className="h-full flex flex-col overflow-hidden" style={{ background: "#f9f9ff" }}>

        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 border-b"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
        >
          <button onClick={reset} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100" aria-label="Volver">
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#475569" }}>arrow_back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm" style={{ color: "#111c2c" }}>Dibujar ruta de recolección</h2>
            <p className="text-xs" style={{ color: "#707973" }}>
              {points.length === 0
                ? "Hacé clic en el mapa para marcar el primer punto"
                : points.length === 1
                ? "Agregá al menos un punto más para formar la ruta"
                : `${points.length} puntos · ${km.toFixed(2)} km estimados`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {points.length > 0 && (
              <button
                onClick={() => setPoints((p) => p.slice(0, -1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>undo</span>
                Deshacer
              </button>
            )}
            {points.length > 0 && (
              <button
                onClick={() => setPoints([])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:border-red-300"
                style={{ borderColor: "#e2e8f0", color: "#ba1a1a" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete_sweep</span>
                Limpiar
              </button>
            )}
            {points.length >= 2 && (
              <button
                onClick={() => setMode("confirm")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white active:scale-95"
                style={{ background: "#0f5238" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>
                Continuar
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">

          {/* Map */}
          <div className="flex-1 relative">
            <RouteDrawMap
              points={points}
              onMapClick={(lat, lng) => setPoints((p) => [...p, [lat, lng]])}
            />

            {points.length === 0 && (
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: "rgba(255,255,255,.95)", backdropFilter: "blur(12px)", boxShadow: "0 4px 12px rgba(0,0,0,.1)", border: "1px solid #e2e8f0" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#d97706" }}>touch_app</span>
                <span className="text-sm font-medium" style={{ color: "#111c2c" }}>Hacé clic para agregar puntos de la ruta</span>
              </div>
            )}

            {points.length > 0 && (
              <div
                className="absolute top-4 left-4 z-20 px-3 py-2 rounded-xl flex flex-col gap-1.5"
                style={{ background: "rgba(255,255,255,.95)", backdropFilter: "blur(12px)", border: "1px solid #e2e8f0" }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#111c2c" }}>
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} /> Inicio
                </div>
                {points.length >= 2 && (
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#111c2c" }}>
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "#ba1a1a" }} /> Fin actual
                  </div>
                )}
                <div className="text-xs font-mono pt-1 border-t" style={{ color: "#707973", borderColor: "#e2e8f0" }}>
                  {points.length} pts · {km.toFixed(2)} km
                </div>
              </div>
            )}
          </div>

          {/* Confirm panel */}
          {mode === "confirm" && (
            <div
              className="w-80 flex-shrink-0 flex flex-col border-l overflow-y-auto"
              style={{ background: "#fff", borderColor: "#e2e8f0" }}
            >
              <div className="p-6 flex-1 space-y-5">
                <div>
                  <h3 className="font-bold text-base mb-0.5" style={{ color: "#111c2c" }}>Guardar ruta</h3>
                  <p className="text-xs" style={{ color: "#707973" }}>
                    {points.length} puntos · {km.toFixed(2)} km estimados
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Waypoints", value: String(points.length) },
                    { label: "Distancia", value: `${km.toFixed(1)} km` },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: "#f0f3ff" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#707973" }}>{s.label}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: "#111c2c" }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
                    Nombre de la ruta <span style={{ color: "#ba1a1a" }}>*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Ruta Norte – Carigán"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                    style={{ borderColor: "#bfc9c1", color: "#111c2c" }}
                    onFocus={(e) => { e.target.style.borderColor = "#0f5238"; e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#bfc9c1"; e.target.style.boxShadow = "none"; }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  />
                </div>

                {/* Truck — required */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
                    Camión asignado <span style={{ color: "#ba1a1a" }}>*</span>
                  </label>
                  <select
                    value={truckId}
                    onChange={(e) => setTruckId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                    style={{
                      borderColor: truckId === "" ? "#fca5a5" : "#bfc9c1",
                      color: truckId === "" ? "#9ca3af" : "#111c2c",
                      background: "#fff",
                    }}
                  >
                    <option value="">— Seleccioná un camión —</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {truckId === "" && (
                    <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: "#ba1a1a" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                      Cada ruta debe tener un camión asignado
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-xs p-3 rounded-lg" style={{ background: "#fff5f5", color: "#ba1a1a", border: "1px solid #fecaca" }}>
                    {error}
                  </p>
                )}
              </div>

              <div className="p-6 pt-0 flex flex-col gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !canSave}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#0f5238", boxShadow: "0 2px 8px rgba(15,82,56,.2)" }}
                >
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>}
                  {saving ? "Guardando…" : "Guardar ruta"}
                </button>
                <button
                  onClick={() => setMode("draw")}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: "#e2e8f0", color: "#475569" }}
                >
                  Seguir editando
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LIST MODE ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto" style={{ background: "#f9f9ff" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.02em" }}>
              Rutas de Recolección
            </h1>
            <p className="text-sm mt-1" style={{ color: "#707973" }}>
              {routes.length} ruta{routes.length !== 1 ? "s" : ""} · cada una enlazada a un camión
            </p>
          </div>
          <button
            onClick={() => { setPoints([]); setName(""); setTruckId(""); setMode("draw"); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: "#0f5238", boxShadow: "0 2px 8px rgba(15,82,56,.25)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>route</span>
            Dibujar nueva ruta
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ba1a1a", fontVariationSettings: "'FILL' 1" }}>error</span>
            <p className="text-sm flex-1" style={{ color: "#7f1d1d" }}>{error}</p>
            <button onClick={() => setError(null)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>close</span>
            </button>
          </div>
        )}

        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          {/* Header row */}
          <div
            className="grid grid-cols-12 px-6 py-3 border-b text-[10px] font-semibold uppercase tracking-widest"
            style={{ borderColor: "#f0f3ff", color: "#707973", background: "#fafafa" }}
          >
            <div className="col-span-1">#</div>
            <div className="col-span-4">Nombre</div>
            <div className="col-span-5">Camión asignado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
            </div>
          ) : routes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f0f3ff" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#bfc9c1" }}>route</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#707973" }}>No hay rutas definidas</p>
                <p className="text-xs mt-1" style={{ color: "#bfc9c1" }}>Dibujá la primera ruta de recolección</p>
              </div>
              <button
                onClick={() => setMode("draw")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#0f5238" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>route</span>
                Dibujar ahora
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f0f3ff" }}>
              {routes.map((route) => (
                <div key={route.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[#f9f9ff] transition-colors">

                  {/* ID */}
                  <div className="col-span-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "#f0f3ff", color: "#707973" }}>
                      {route.id}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fef3c7" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#d97706", fontVariationSettings: "'FILL' 1" }}>route</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#111c2c" }}>{route.name}</p>
                      <p className="text-[11px]" style={{ color: "#bfc9c1" }}>
                        {new Date(route.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Truck — inline reassign dropdown */}
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      {reassigning === route.id ? (
                        <span className="w-4 h-4 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
                      ) : (
                        <select
                          value={route.truck?.id ?? ""}
                          onChange={(e) => handleReassign(route.id, e.target.value === "" ? null : Number(e.target.value))}
                          className="px-3 py-1.5 rounded-lg border text-sm outline-none transition-all cursor-pointer"
                          style={{
                            borderColor: route.truck ? "#bbf7d0" : "#fca5a5",
                            background:  route.truck ? "#dcfce7" : "#fff5f5",
                            color:       route.truck ? "#0f5238" : "#ba1a1a",
                            fontWeight:  600,
                          }}
                          title="Cambiar camión asignado"
                        >
                          <option value="" style={{ background: "#fff", color: "#9ca3af" }}>— Sin asignar —</option>
                          {trucks.map((t) => (
                            <option key={t.id} value={t.id} style={{ background: "#fff", color: "#111c2c" }}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {!route.truck && reassigning !== route.id && (
                        <span
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "#fff5f5", color: "#ba1a1a" }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span>
                          Sin camión
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => handleDelete(route.id)}
                      disabled={deleting === route.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                      title="Eliminar ruta"
                    >
                      {deleting === route.id
                        ? <span className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                        : <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>delete</span>}
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
