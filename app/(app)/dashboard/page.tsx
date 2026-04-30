"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

interface Truck {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  lastUpdate: string;
  currentBarrio: { id: number; name: string } | null;
}

interface Barrio {
  id: number;
  name: string;
  createdAt: string;
  _count?: { users: number };
}

function StatCard({
  icon, iconBg, iconColor, label, value, sub,
}: {
  icon: string; iconBg: string; iconColor: string;
  label: string; value: string; sub?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-4 p-5 rounded-xl border"
      style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: iconColor }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#707973", letterSpacing: "0.07em" }}>{label}</p>
        <p className="text-2xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.01em" }}>{value}</p>
        {sub && <div className="mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [trucks,  setTrucks]  = useState<Truck[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [t, b] = await Promise.all([
        api.get<Truck[]>("/api/trucks"),
        api.get<Barrio[]>("/api/barrios"),
      ]);
      setTrucks(t);
      setBarrios(b);
    } catch {/* silent */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active    = trucks.filter((t) => t.lat != null).length;
  const inactive  = trucks.length - active;

  function timeSince(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)  return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "#f9f9ff" }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.02em" }}>
              Panel de Control
            </h1>
            <p className="text-sm mt-1" style={{ color: "#707973" }}>
              Resumen de flota · Div. Residuos Municipales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
              style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#475569", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              Actualizar
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "#2d6a4f", boxShadow: "0 2px 8px rgba(15,82,56,.25)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Iniciar Seguimiento
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Stats grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                icon="local_shipping"
                iconBg="#dcfce7"
                iconColor="#0f5238"
                label="Camiones Activos"
                value={String(active)}
                sub={
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs" style={{ color: "#707973" }}>{inactive} sin señal</span>
                  </div>
                }
              />
              <StatCard
                icon="holiday_village"
                iconBg="#e0f2fe"
                iconColor="#1960a3"
                label="Barrios Registrados"
                value={String(barrios.length)}
              />
              <StatCard
                icon="radar"
                iconBg="#fef3c7"
                iconColor="#d97706"
                label="GPS en Vivo"
                value={active > 0 ? "Activo" : "Sin señal"}
                sub={
                  active > 0 ? (
                    <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Actualizando en tiempo real</span>
                  ) : (
                    <span className="text-xs" style={{ color: "#ba1a1a" }}>Sin camiones en ruta</span>
                  )
                }
              />
            </div>

            {/* ── Main grid: truck table + barrios ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

              {/* Truck table */}
              <div
                className="lg:col-span-8 rounded-xl border overflow-hidden"
                style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f0f3ff" }}>
                  <h2 className="font-semibold text-base" style={{ color: "#111c2c" }}>Flota de Camiones</h2>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: "#dcfce7", color: "#0f5238" }}
                  >
                    {trucks.length} unidades
                  </span>
                </div>

                {trucks.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#bfc9c1" }}>local_shipping</span>
                    <p className="text-sm font-semibold" style={{ color: "#707973" }}>No hay camiones registrados</p>
                    <p className="text-xs" style={{ color: "#bfc9c1" }}>Agrega un camión desde la API</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "#f0f3ff" }}>
                    {trucks.map((truck) => (
                      <div key={truck.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9ff] transition-colors">
                        {/* Status dot + icon */}
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: truck.lat != null ? "#0f5238" : "#e7eeff" }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: 20,
                                color: truck.lat != null ? "#fff" : "#707973",
                                fontVariationSettings: "'FILL' 1",
                              }}
                            >
                              local_shipping
                            </span>
                          </div>
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                            style={{ background: truck.lat != null ? "#22c55e" : "#bfc9c1" }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#111c2c" }}>{truck.name}</p>
                          <p className="text-xs truncate" style={{ color: "#707973" }}>
                            {truck.lat != null
                              ? `${truck.lat.toFixed(4)}, ${truck.lng!.toFixed(4)}`
                              : "Sin coordenadas"}
                          </p>
                        </div>

                        <div className="hidden sm:block text-right flex-shrink-0">
                          {truck.currentBarrio ? (
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: "#dcfce7", color: "#0f5238" }}
                            >
                              {truck.currentBarrio.name}
                            </span>
                          ) : (
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: "#f1f5f9", color: "#707973" }}
                            >
                              {truck.lat != null ? "En tránsito" : "Sin señal"}
                            </span>
                          )}
                          <p className="text-[10px] mt-1 text-right" style={{ color: "#bfc9c1" }}>
                            hace {timeSince(truck.lastUpdate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Barrios list */}
              <div
                className="lg:col-span-4 rounded-xl border overflow-hidden"
                style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#f0f3ff" }}>
                  <h2 className="font-semibold text-base" style={{ color: "#111c2c" }}>Barrios</h2>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: "#e0f2fe", color: "#1960a3" }}
                  >
                    {barrios.length}
                  </span>
                </div>

                {barrios.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12">
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#bfc9c1" }}>holiday_village</span>
                    <p className="text-sm" style={{ color: "#707973" }}>Sin barrios registrados</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "#f0f3ff" }}>
                    {barrios.map((barrio) => {
                      const truckHere = trucks.find((t) => t.currentBarrio?.id === barrio.id);
                      return (
                        <div key={barrio.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f9f9ff] transition-colors">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: truckHere ? "#dcfce7" : "#f0f3ff" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: truckHere ? "#0f5238" : "#707973" }}>
                              {truckHere ? "location_on" : "holiday_village"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "#111c2c" }}>{barrio.name}</p>
                            {truckHere && (
                              <p className="text-[11px] font-semibold" style={{ color: "#0f5238" }}>
                                🚛 {truckHere.name} aquí
                              </p>
                            )}
                          </div>
                          {truckHere && (
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,.2)" }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Quick tip card ── */}
            <div
              className="rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4"
              style={{
                background: "linear-gradient(135deg, #0f5238 0%, #2d6a4f 100%)",
                color: "#fff",
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,.15)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#a8e7c5" }}>eco</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base" style={{ color: "#fff" }}>Impacto Ecológico</h3>
                <p className="text-sm mt-0.5" style={{ color: "#a8e7c5" }}>
                  Con notificaciones push activas, tu comunidad reduce el tiempo de inactividad del camión en un <strong style={{ color: "#fff" }}>14%</strong>, disminuyendo las emisiones locales.
                </p>
              </div>
              <button
                className="flex-shrink-0 px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                style={{ background: "#fff", color: "#0f5238" }}
              >
                Ver estadísticas
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
