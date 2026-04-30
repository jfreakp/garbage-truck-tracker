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

// ── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#e2e8f0" }}
        >
          <h2 className="font-bold text-base" style={{ color: "#111c2c" }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#707973" }}>close</span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

function TruckForm({
  initial,
  loading,
  onSubmit,
  onCancel,
}: {
  initial?: string;
  loading: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial ?? "");

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
          Nombre del camión
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Camión 02"
          required
          autoFocus
          className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
          style={{ borderColor: "#bfc9c1", color: "#111c2c" }}
          onFocus={(e) => { e.target.style.borderColor = "#0f5238"; e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "#bfc9c1"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all"
          style={{ borderColor: "#e2e8f0", color: "#475569" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-50"
          style={{ background: "#0f5238" }}
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

function DeleteConfirm({
  truck,
  loading,
  onConfirm,
  onCancel,
}: {
  truck: Truck;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-3 p-4 rounded-xl"
        style={{ background: "#fff5f5", border: "1px solid #fecaca" }}
      >
        <span
          className="material-symbols-outlined flex-shrink-0"
          style={{ fontSize: 24, color: "#ba1a1a", fontVariationSettings: "'FILL' 1" }}
        >
          warning
        </span>
        <p className="text-sm" style={{ color: "#7f1d1d" }}>
          ¿Eliminar <strong>{truck.name}</strong>? Esta acción no se puede deshacer y se borrarán todos sus registros de ubicación.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold border"
          style={{ borderColor: "#e2e8f0", color: "#475569" }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: "#ba1a1a" }}
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>}
          {loading ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Modal = { type: "create" } | { type: "edit"; truck: Truck } | { type: "delete"; truck: Truck };

export default function TrucksPage() {
  const [trucks,  setTrucks]  = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<Modal | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Truck[]>("/api/trucks");
      setTrucks(data);
    } catch { setError("No se pudo cargar la flota."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function timeSince(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)    return `${s}s`;
    if (s < 3600)  return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  }

  async function handleCreate(name: string) {
    setSaving(true);
    try {
      await api.post("/api/trucks", { name });
      await load();
      setModal(null);
    } catch { setError("Error al crear camión."); }
    finally   { setSaving(false); }
  }

  async function handleEdit(truck: Truck, name: string) {
    setSaving(true);
    try {
      await api.patch(`/api/trucks/${truck.id}`, { name });
      await load();
      setModal(null);
    } catch { setError("Error al actualizar camión."); }
    finally   { setSaving(false); }
  }

  async function handleDelete(truck: Truck) {
    setSaving(true);
    try {
      await api.delete(`/api/trucks/${truck.id}`);
      await load();
      setModal(null);
    } catch { setError("Error al eliminar camión."); }
    finally   { setSaving(false); }
  }

  const active   = trucks.filter((t) => t.lat != null).length;
  const inactive = trucks.length - active;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#f9f9ff" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.02em" }}>
              Gestión de Flota
            </h1>
            <p className="text-sm mt-1" style={{ color: "#707973" }}>
              {trucks.length} camiones · {active} activos · {inactive} sin señal
            </p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: "#0f5238", boxShadow: "0 2px 8px rgba(15,82,56,.25)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Nuevo camión
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "#fff5f5", border: "1px solid #fecaca" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ba1a1a", fontVariationSettings: "'FILL' 1" }}>error</span>
            <p className="text-sm" style={{ color: "#7f1d1d" }}>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>close</span>
            </button>
          </div>
        )}

        {/* Table card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 px-6 py-3 border-b text-[10px] font-semibold uppercase tracking-widest"
            style={{ borderColor: "#f0f3ff", color: "#707973", background: "#fafafa", letterSpacing: "0.07em" }}
          >
            <div className="col-span-1">#</div>
            <div className="col-span-4">Nombre</div>
            <div className="col-span-3 hidden sm:block">Barrio actual</div>
            <div className="col-span-2 hidden sm:block">Coordenadas</div>
            <div className="col-span-1 hidden sm:block">Upd.</div>
            <div className="col-span-2 sm:col-span-1 text-right">Acciones</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
            </div>
          ) : trucks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#f0f3ff" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#bfc9c1" }}>local_shipping</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#707973" }}>No hay camiones registrados</p>
              <button
                onClick={() => setModal({ type: "create" })}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#0f5238" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                Agregar el primero
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f0f3ff" }}>
              {trucks.map((truck) => (
                <div
                  key={truck.id}
                  className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[#f9f9ff] transition-colors"
                >
                  {/* ID */}
                  <div className="col-span-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{ background: "#f0f3ff", color: "#707973" }}
                    >
                      {truck.id}
                    </span>
                  </div>

                  {/* Name + status */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: truck.lat != null ? "#0f5238" : "#e7eeff" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 18,
                            color: truck.lat != null ? "#fff" : "#707973",
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          local_shipping
                        </span>
                      </div>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                        style={{ background: truck.lat != null ? "#22c55e" : "#bfc9c1" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#111c2c" }}>{truck.name}</p>
                      <p className="text-[11px]" style={{ color: truck.lat != null ? "#22c55e" : "#bfc9c1" }}>
                        {truck.lat != null ? "En ruta" : "Sin señal"}
                      </p>
                    </div>
                  </div>

                  {/* Barrio */}
                  <div className="col-span-3 hidden sm:block">
                    {truck.currentBarrio ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: "#dcfce7", color: "#0f5238" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        {truck.currentBarrio.name}
                      </span>
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: "#f1f5f9", color: "#707973" }}
                      >
                        {truck.lat != null ? "En tránsito" : "—"}
                      </span>
                    )}
                  </div>

                  {/* Coords */}
                  <div className="col-span-2 hidden sm:block">
                    {truck.lat != null ? (
                      <p className="text-xs font-mono" style={{ color: "#475569" }}>
                        {truck.lat.toFixed(4)},<br />{truck.lng!.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: "#bfc9c1" }}>—</p>
                    )}
                  </div>

                  {/* Last update */}
                  <div className="col-span-1 hidden sm:block">
                    <p className="text-xs" style={{ color: "#bfc9c1" }}>
                      {timeSince(truck.lastUpdate)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-7 sm:col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => setModal({ type: "edit", truck })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f0f3ff]"
                      aria-label="Editar"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#475569" }}>edit</span>
                    </button>
                    <button
                      onClick={() => setModal({ type: "delete", truck })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                      aria-label="Eliminar"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh row */}
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

      {/* ── Modals ── */}
      {modal?.type === "create" && (
        <Modal title="Nuevo camión" onClose={() => setModal(null)}>
          <TruckForm
            loading={saving}
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Editar camión" onClose={() => setModal(null)}>
          <TruckForm
            initial={modal.truck.name}
            loading={saving}
            onSubmit={(name) => handleEdit(modal.truck, name)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <Modal title="Eliminar camión" onClose={() => setModal(null)}>
          <DeleteConfirm
            truck={modal.truck}
            loading={saving}
            onConfirm={() => handleDelete(modal.truck)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
