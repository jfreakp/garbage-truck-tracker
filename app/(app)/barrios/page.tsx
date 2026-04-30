"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

const BarrioDrawMap = dynamic(() => import("@/components/map/BarrioDrawMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#f0f3ff" }}>
      <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
    </div>
  ),
});

interface Barrio {
  id: number;
  name: string;
  visibleOnMap: boolean;
  createdAt: string;
  _count?: { users: number };
}

// Convert [lat, lng][] → WKT POLYGON((lng lat, ...))
function toWkt(points: [number, number][]): string {
  const coords = [...points, points[0]]
    .map(([lat, lng]) => `${lng} ${lat}`)
    .join(", ");
  return `POLYGON((${coords}))`;
}

type Mode = "list" | "draw" | "confirm";

export default function BarriosPage() {
  const [barrios,  setBarrios]  = useState<Barrio[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [mode,     setMode]     = useState<Mode>("list");
  const [points,   setPoints]   = useState<[number, number][]>([]);
  const [name,     setName]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<number | null>(null);
  const [toggling,  setToggling]  = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Barrio[]>("/api/barrios");
      setBarrios(data);
    } catch { setError("No se pudo cargar los barrios."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleMapClick(lat: number, lng: number) {
    setPoints((prev) => [...prev, [lat, lng]]);
  }

  function removeLastPoint() {
    setPoints((prev) => prev.slice(0, -1));
  }

  function resetDraw() {
    setPoints([]);
    setName("");
    setMode("list");
    setError(null);
  }

  async function handleSave() {
    if (points.length < 3 || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/barrios", { name: name.trim(), polygonWkt: toWkt(points) });
      await load();
      resetDraw();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar el barrio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await api.delete(`/api/barrios/${id}`);
      await load();
    } catch { setError("No se pudo eliminar el barrio."); }
    finally   { setDeleting(null); }
  }

  async function handleToggleVisible(barrio: Barrio) {
    const next = !barrio.visibleOnMap;
    // optimistic update
    setBarrios((prev) => prev.map((b) => b.id === barrio.id ? { ...b, visibleOnMap: next } : b));
    setToggling(barrio.id);
    try {
      await api.patch(`/api/barrios/${barrio.id}`, { visibleOnMap: next });
    } catch {
      // revert on failure
      setBarrios((prev) => prev.map((b) => b.id === barrio.id ? { ...b, visibleOnMap: barrio.visibleOnMap } : b));
      setError("No se pudo actualizar la visibilidad del barrio.");
    } finally {
      setToggling(null);
    }
  }

  // ── DRAW MODE ─────────────────────────────────────────────────────────────
  if (mode === "draw" || mode === "confirm") {
    return (
      <div className="h-full flex flex-col overflow-hidden" style={{ background: "#f9f9ff" }}>

        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 border-b"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
        >
          <button
            onClick={resetDraw}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#475569" }}>arrow_back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm" style={{ color: "#111c2c" }}>Dibujar área del barrio</h2>
            <p className="text-xs" style={{ color: "#707973" }}>
              {points.length === 0
                ? "Hacé clic en el mapa para agregar el primer vértice"
                : points.length < 3
                ? `${points.length} punto${points.length > 1 ? "s" : ""} — necesitás al menos 3`
                : `${points.length} puntos · polígono listo`}
            </p>
          </div>
          {points.length > 0 && (
            <button
              onClick={removeLastPoint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>undo</span>
              Deshacer
            </button>
          )}
          {points.length >= 3 && (
            <button
              onClick={() => setMode("confirm")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
              style={{ background: "#0f5238" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>
              Continuar
            </button>
          )}
        </div>

        {/* Map + confirm panel */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Map */}
          <div className="flex-1 relative">
            <BarrioDrawMap
              points={points}
              existingBarrios={barrios}
              onMapClick={handleMapClick}
            />

            {/* Inline hint */}
            {points.length === 0 && (
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: "rgba(255,255,255,.95)", backdropFilter: "blur(12px)", boxShadow: "0 4px 12px rgba(0,0,0,.1)", border: "1px solid #e2e8f0" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0f5238" }}>touch_app</span>
                <span className="text-sm font-medium" style={{ color: "#111c2c" }}>Hacé clic para marcar los vértices del área</span>
              </div>
            )}

            {/* Vertex count badge */}
            {points.length > 0 && (
              <div
                className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold"
                style={{ background: "rgba(255,255,255,.95)", backdropFilter: "blur(12px)", border: "1px solid #e2e8f0" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: points.length >= 3 ? "#22c55e" : "#d97706" }}
                />
                <span style={{ color: "#111c2c" }}>{points.length} vértice{points.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Confirm side panel */}
          {mode === "confirm" && (
            <div
              className="w-80 flex-shrink-0 flex flex-col border-l overflow-y-auto"
              style={{ background: "#fff", borderColor: "#e2e8f0" }}
            >
              <div className="p-6 flex-1 space-y-5">
                <div>
                  <h3 className="font-bold text-base mb-0.5" style={{ color: "#111c2c" }}>Guardar barrio</h3>
                  <p className="text-xs" style={{ color: "#707973" }}>El polígono tiene {points.length} vértices.</p>
                </div>

                {/* WKT preview */}
                <div className="rounded-lg p-3 overflow-x-auto" style={{ background: "#f0f3ff" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#707973" }}>WKT generado</p>
                  <p className="text-[10px] font-mono break-all leading-relaxed" style={{ color: "#475569" }}>
                    {toWkt(points).slice(0, 120)}…
                  </p>
                </div>

                {/* Name input */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
                    Nombre del barrio
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Centro, La Colina…"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                    style={{ borderColor: "#bfc9c1", color: "#111c2c" }}
                    onFocus={(e) => { e.target.style.borderColor = "#0f5238"; e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#bfc9c1"; e.target.style.boxShadow = "none"; }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  />
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
                  disabled={saving || !name.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-50"
                  style={{ background: "#0f5238", boxShadow: "0 2px 8px rgba(15,82,56,.2)" }}
                >
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>}
                  {saving ? "Guardando…" : "Guardar barrio"}
                </button>
                <button
                  onClick={() => setMode("draw")}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-all"
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
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.02em" }}>
              Barrios
            </h1>
            <p className="text-sm mt-1" style={{ color: "#707973" }}>
              {barrios.length} zona{barrios.length !== 1 ? "s" : ""} registrada{barrios.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setPoints([]); setName(""); setMode("draw"); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: "#0f5238", boxShadow: "0 2px 8px rgba(15,82,56,.25)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>draw</span>
            Dibujar nuevo barrio
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "#fff5f5", border: "1px solid #fecaca" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ba1a1a", fontVariationSettings: "'FILL' 1" }}>error</span>
            <p className="text-sm flex-1" style={{ color: "#7f1d1d" }}>{error}</p>
            <button onClick={() => setError(null)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>close</span>
            </button>
          </div>
        )}

        {/* List */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
            </div>
          ) : barrios.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f0f3ff" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#bfc9c1" }}>holiday_village</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#707973" }}>No hay barrios registrados</p>
                <p className="text-xs mt-1" style={{ color: "#bfc9c1" }}>Dibujá el primer polígono en el mapa</p>
              </div>
              <button
                onClick={() => { setPoints([]); setName(""); setMode("draw"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#0f5238" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>draw</span>
                Dibujar ahora
              </button>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div
                className="grid grid-cols-12 px-6 py-3 border-b text-[10px] font-semibold uppercase tracking-widest"
                style={{ borderColor: "#f0f3ff", color: "#707973", background: "#fafafa" }}
              >
                <div className="col-span-1">#</div>
                <div className="col-span-5">Nombre</div>
                <div className="col-span-3 hidden sm:block">Creado</div>
                <div className="col-span-2">Visible</div>
                <div className="col-span-1 text-right">Acción</div>
              </div>

              <div className="divide-y" style={{ borderColor: "#f0f3ff" }}>
                {barrios.map((barrio) => (
                  <div
                    key={barrio.id}
                    className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[#f9f9ff] transition-colors"
                  >
                    <div className="col-span-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "#f0f3ff", color: "#707973" }}>
                        {barrio.id}
                      </span>
                    </div>

                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#dcfce7" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0f5238", fontVariationSettings: "'FILL' 1" }}>
                          holiday_village
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#111c2c" }}>{barrio.name}</p>
                    </div>

                    <div className="col-span-3 hidden sm:block">
                      <p className="text-xs" style={{ color: "#bfc9c1" }}>
                        {new Date(barrio.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    {/* Visible on map toggle */}
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        role="switch"
                        aria-checked={barrio.visibleOnMap}
                        disabled={toggling === barrio.id}
                        onClick={() => handleToggleVisible(barrio)}
                        className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                        style={{ background: barrio.visibleOnMap ? "#0f5238" : "#d1d5db" }}
                        title={barrio.visibleOnMap ? "Visible en el mapa" : "Oculto en el mapa"}
                      >
                        <span
                          className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200"
                          style={{ transform: barrio.visibleOnMap ? "translateX(16px)" : "translateX(0px)" }}
                        />
                      </button>
                      <span className="text-xs hidden sm:block" style={{ color: barrio.visibleOnMap ? "#0f5238" : "#bfc9c1" }}>
                        {barrio.visibleOnMap ? "Visible" : "Oculto"}
                      </span>
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(barrio.id)}
                        disabled={deleting === barrio.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-50"
                        aria-label="Eliminar"
                        title="Eliminar barrio"
                      >
                        {deleting === barrio.id
                          ? <span className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                          : <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>delete</span>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#475569" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
