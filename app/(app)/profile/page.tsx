"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

interface User {
  id: number; name: string; email: string;
  lat: number | null; lng: number | null;
  fcmToken: string | null; barrioId: number | null;
  barrio: { id: number; name: string } | null;
}

interface Barrio { id: number; name: string; }

export default function ProfilePage() {
  const [user,     setUser]     = useState<User | null>(null);
  const [barrios,  setBarrios]  = useState<Barrio[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [fcmToken, setFcmToken] = useState("");
  const [barrioId, setBarrioId] = useState<number | "">("");

  useEffect(() => {
    const raw = localStorage.getItem("eco_user");
    if (!raw) return;
    const u = JSON.parse(raw) as { id: number };

    Promise.all([
      api.get<User>(`/api/users/${u.id}`),
      api.get<Barrio[]>("/api/barrios"),
    ]).then(([d, bs]) => {
      setUser(d);
      setFcmToken(d.fcmToken ?? "");
      setBarrioId(d.barrioId ?? "");
      setBarrios(bs);
    }).catch(() => {});
  }, []);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await api.patch(`/api/users/${user.id}`, {
        fcmToken: fcmToken || null,
        barrioId: barrioId !== "" ? Number(barrioId) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {/* silent */}
    finally { setSaving(false); }
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#f9f9ff" }}>
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.02em" }}>Mi Perfil</h1>
          <p className="text-sm mt-1" style={{ color: "#707973" }}>Gestiona tu información y preferencias de notificación.</p>
        </div>

        {/* Avatar card */}
        <div
          className="flex items-center gap-5 p-6 rounded-xl border mb-6"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: "#2d6a4f", color: "#fff" }}
          >
            {user.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: "#111c2c" }}>{user.name}</p>
            <p className="text-sm" style={{ color: "#707973" }}>{user.email}</p>
            {user.barrio && (
              <span
                className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "#dcfce7", color: "#0f5238" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>location_on</span>
                {user.barrio.name}
              </span>
            )}
          </div>
        </div>

        {/* Barrio selector */}
        <div
          className="p-5 rounded-xl border mb-6"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
        >
          <h2 className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: "#111c2c" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0f5238" }}>holiday_village</span>
            Mi barrio
          </h2>
          <p className="text-xs mb-4" style={{ color: "#707973" }}>
            El camión te notificará cuando esté cerca de esta zona.
          </p>
          <select
            value={barrioId}
            onChange={(e) => setBarrioId(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
            style={{ borderColor: "#bfc9c1", color: barrioId === "" ? "#9ca3af" : "#111c2c", background: "#fff" }}
            onFocus={(e) => { e.target.style.borderColor = "#0f5238"; e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#bfc9c1"; e.target.style.boxShadow = "none"; }}
          >
            <option value="">— Sin barrio asignado —</option>
            {barrios.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {barrios.length === 0 && (
            <p className="text-xs mt-2" style={{ color: "#d97706" }}>
              No hay barrios registrados aún. Creá uno en la sección Barrios.
            </p>
          )}
        </div>

        {/* Location info */}
        <div
          className="p-5 rounded-xl border mb-6"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
        >
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#111c2c" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0f5238" }}>location_on</span>
            Ubicación guardada
          </h2>
          {user.lat && user.lng ? (
            <div className="grid grid-cols-2 gap-4">
              {[{ label: "Latitud", value: user.lat.toFixed(6) }, { label: "Longitud", value: user.lng.toFixed(6) }].map((f) => (
                <div key={f.label} className="p-3 rounded-lg" style={{ background: "#f0f3ff" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#707973" }}>{f.label}</p>
                  <p className="text-sm font-semibold mt-0.5 font-mono" style={{ color: "#111c2c" }}>{f.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#707973" }}>No has guardado tu ubicación aún.</p>
          )}
        </div>

        {/* FCM token */}
        <div
          className="p-5 rounded-xl border mb-6"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}
        >
          <h2 className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: "#111c2c" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#1960a3" }}>notifications</span>
            Token de notificaciones (FCM)
          </h2>
          <p className="text-xs mb-4" style={{ color: "#707973" }}>
            Pegá aquí el token de dispositivo generado por Firebase en tu app móvil.
          </p>
          <textarea
            value={fcmToken}
            onChange={(e) => setFcmToken(e.target.value)}
            placeholder="Pega tu FCM token aquí…"
            rows={3}
            className="w-full px-4 py-3 rounded-lg border text-sm font-mono outline-none transition-all resize-none"
            style={{ borderColor: "#bfc9c1", color: "#111c2c", background: "#fff" }}
            onFocus={(e) => { e.target.style.borderColor = "#0f5238"; e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#bfc9c1"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "#2d6a4f", boxShadow: "0 2px 8px rgba(15,82,56,.2)" }}
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : saved
            ? <><span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>Guardado</>
            : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>Guardar cambios</>
          }
        </button>

      </div>
    </div>
  );
}
