"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";

interface AlertPrefs {
  alertProximity: boolean;
  alertDelayed:   boolean;
  alertReminder:  boolean;
  alertEntry:     boolean;
}

const TOGGLES = [
  {
    key:      "alertProximity" as keyof AlertPrefs,
    icon:     "local_shipping",
    iconBg:   "#b1f0ce",
    iconColor:"#0f5238",
    title:    "Camión a 2 cuadras",
    desc:     "Alerta en tiempo real cuando el camión recolector está cerca.",
  },
  {
    key:      "alertDelayed" as keyof AlertPrefs,
    icon:     "warning",
    iconBg:   "#ffdcc3",
    iconColor:"#6f3a00",
    title:    "Ruta retrasada",
    desc:     "Actualizaciones instantáneas si tráfico o mantenimiento afectan tu zona.",
  },
  {
    key:      "alertReminder" as keyof AlertPrefs,
    icon:     "calendar_today",
    iconBg:   "#d3e4ff",
    iconColor:"#1960a3",
    title:    "Recordatorio de recolección",
    desc:     "Notificación la noche anterior para preparar los recipientes.",
  },
  {
    key:      "alertEntry" as keyof AlertPrefs,
    icon:     "notifications_active",
    iconBg:   "#b1f0ce",
    iconColor:"#0f5238",
    title:    "Camión entró al barrio",
    desc:     "Push inmediata cuando el camión entra al polígono de tu barrio.",
  },
] as const;

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{ background: on ? "#2d6a4f" : "#bfc9c1" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
        style={{ transform: on ? "translateX(24px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function AlertsPage() {
  const [prefs,   setPrefs]   = useState<AlertPrefs | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [userId,  setUserId]  = useState<number | null>(null);

  const load = useCallback(async () => {
    const raw = localStorage.getItem("eco_user");
    if (!raw) return;
    const u = JSON.parse(raw) as { id: number };
    setUserId(u.id);
    try {
      const data = await api.get<AlertPrefs & { id: number }>(`/api/users/${u.id}`);
      setPrefs({
        alertProximity: data.alertProximity,
        alertDelayed:   data.alertDelayed,
        alertReminder:  data.alertReminder,
        alertEntry:     data.alertEntry,
      });
    } catch {/* silent */}
  }, []);

  useEffect(() => { load(); }, [load]);

  async function flip(key: keyof AlertPrefs, value: boolean) {
    if (!prefs || !userId) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await api.patch(`/api/users/${userId}`, { [key]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch { setPrefs(prefs); /* revert */ }
    finally  { setSaving(false); }
  }

  const activeCount = prefs
    ? Object.values(prefs).filter(Boolean).length
    : 0;

  if (!prefs) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#f9f9ff" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.02em" }}>
              Preferencias de Notificación
            </h1>
            <p className="text-sm mt-1 max-w-2xl" style={{ color: "#707973" }}>
              Administrá cómo y cuándo recibís alertas push. Los cambios se guardan automáticamente.
            </p>
          </div>
          {/* Save indicator */}
          <div
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: saved ? "#dcfce7" : saving ? "#f0f3ff" : "transparent",
              color: saved ? "#0f5238" : saving ? "#1960a3" : "transparent",
            }}
          >
            {saved && <><span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check_circle</span>Guardado</>}
            {saving && !saved && <><span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />Guardando…</>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">

          {/* Toggle cards */}
          <div className="md:col-span-8 space-y-3">
            {TOGGLES.map((t) => (
              <div
                key={t.key}
                className="flex items-center gap-4 p-5 rounded-xl border transition-all hover:border-[#95d4b3]"
                style={{
                  background: "#fff",
                  borderColor: prefs[t.key] ? "#95d4b3" : "#e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,.04)",
                }}
              >
                <div className="p-3 rounded-xl flex-shrink-0" style={{ background: t.iconBg }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, color: t.iconColor, fontVariationSettings: "'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24" }}
                  >
                    {t.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: "#111c2c" }}>{t.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#707973" }}>{t.desc}</p>
                </div>
                <ToggleSwitch on={prefs[t.key]} onChange={(v) => flip(t.key, v)} />
              </div>
            ))}
          </div>

          {/* Eco card */}
          <div className="md:col-span-4">
            <div
              className="h-full rounded-xl p-6 flex flex-col justify-between relative overflow-hidden"
              style={{ background: "#0f5238", color: "#fff", minHeight: 240 }}
            >
              <div className="absolute inset-0 opacity-5 pointer-events-none select-none"
                style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
              />
              <div className="relative z-10">
                <span className="text-[10px] font-semibold uppercase tracking-widest block mb-3" style={{ color: "#a8e7c5", letterSpacing: "0.1em" }}>
                  Impacto Ecológico · Loja
                </span>
                <h2 className="text-xl font-bold" style={{ color: "#fff", letterSpacing: "-0.01em" }}>
                  El tiempo óptimo importa
                </h2>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: "#a8e7c5" }}>
                  Al rastrear rutas en tiempo real, la comunidad lojana reduce el tiempo de inactividad en un{" "}
                  <strong style={{ color: "#fff" }}>14%</strong>, disminuyendo las emisiones locales.
                </p>
              </div>
              <div className="relative z-10 mt-6 text-xs font-semibold" style={{ color: "#a8e7c5" }}>
                Municipio de Loja · Gestión de Residuos
              </div>
            </div>
          </div>
        </div>

        {/* Notification methods */}
        <section
          className="p-6 rounded-xl border flex flex-col md:flex-row items-start md:items-center gap-6"
          style={{ background: "#e7eeff", borderColor: "#bfc9c1" }}
        >
          <div className="flex-1">
            <h3 className="font-semibold text-base" style={{ color: "#111c2c" }}>Métodos de Notificación</h3>
            <p className="text-sm mt-1" style={{ color: "#707973" }}>
              Actualmente enviamos alertas vía <strong style={{ color: "#111c2c" }}>notificación push</strong>. Las opciones de SMS y correo estarán disponibles pronto.
            </p>
          </div>
          <div className="flex gap-5">
            {[
              { icon: "notifications", label: "Push",  active: true  },
              { icon: "sms",           label: "SMS",   active: false },
              { icon: "mail",          label: "Email", active: false },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-1.5" style={{ opacity: m.active ? 1 : 0.35 }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: m.active ? "#2d6a4f" : "#bfc9c1" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#fff", fontVariationSettings: m.active ? "'FILL' 1" : "'FILL' 0" }}>
                    {m.icon}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: "#111c2c" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Summary strip */}
        <div
          className="mt-4 px-5 py-3.5 rounded-xl flex items-center gap-3"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#0f5238", fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <p className="text-sm" style={{ color: "#475569" }}>
            <strong style={{ color: "#111c2c" }}>{activeCount} de {TOGGLES.length}</strong> tipos de alerta activados para tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}
