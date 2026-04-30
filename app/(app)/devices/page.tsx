"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

interface Device {
  id:        number;
  name:      string;
  token:     string;
  active:    boolean;
  createdAt: string;
  truck:     { id: number; name: string };
}

interface Truck { id: number; name: string; }

type Modal = null | "create" | { type: "edit"; device: Device } | { type: "token"; device: Device };

export default function DevicesPage() {
  const [devices,    setDevices]    = useState<Device[]>([]);
  const [trucks,     setTrucks]     = useState<Truck[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState<Modal>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [toggling,   setToggling]   = useState<number | null>(null);
  const [copiedId,   setCopiedId]   = useState<number | null>(null);

  // Form state
  const [formName,    setFormName]    = useState("");
  const [formTruckId, setFormTruckId] = useState<number | "">("");
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([
        api.get<Device[]>("/api/devices"),
        api.get<Truck[]>("/api/trucks"),
      ]);
      setDevices(d);
      setTrucks(t);
    } catch { setError("No se pudo cargar los equipos."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Trucks that still don't have a device assigned (for the create form)
  function availableTrucks(excludeDeviceId?: number) {
    const assigned = new Set(
      devices
        .filter((d) => d.id !== excludeDeviceId)
        .map((d) => d.truck.id)
    );
    return trucks.filter((t) => !assigned.has(t.id));
  }

  function openCreate() {
    setFormName(""); setFormTruckId(""); setFormError(null);
    setModal("create");
  }

  function openEdit(device: Device) {
    setFormName(device.name); setFormTruckId(device.truck.id); setFormError(null);
    setModal({ type: "edit", device });
  }

  async function handleCreate() {
    if (!formName.trim() || formTruckId === "") return;
    setSaving(true); setFormError(null);
    try {
      await api.post("/api/devices", { name: formName.trim(), truckId: Number(formTruckId) });
      await load();
      setModal(null);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Error al crear el equipo.");
    } finally { setSaving(false); }
  }

  async function handleEdit() {
    if (modal === null || typeof modal !== "object" || modal.type !== "edit") return;
    if (!formName.trim() || formTruckId === "") return;
    setSaving(true); setFormError(null);
    try {
      await api.patch(`/api/devices/${modal.device.id}`, {
        name:    formName.trim(),
        truckId: Number(formTruckId),
      });
      await load();
      setModal(null);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Error al actualizar el equipo.");
    } finally { setSaving(false); }
  }

  async function handleToggleActive(device: Device) {
    setToggling(device.id);
    try {
      await api.patch(`/api/devices/${device.id}`, { active: !device.active });
      await load();
    } catch { setError("No se pudo cambiar el estado del equipo."); }
    finally   { setToggling(null); }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await api.delete(`/api/devices/${id}`);
      await load();
    } catch { setError("No se pudo eliminar el equipo."); }
    finally   { setDeleting(null); }
  }

  async function handleRegenToken(device: Device) {
    setSaving(true);
    try {
      const updated = await api.post<Device>(`/api/devices/${device.id}/token`, {});
      await load();
      setModal({ type: "token", device: updated });
    } catch { setError("No se pudo regenerar el token."); }
    finally   { setSaving(false); }
  }

  function copyToken(device: Device) {
    navigator.clipboard.writeText(device.token).then(() => {
      setCopiedId(device.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  // ── MODAL ─────────────────────────────────────────────────────────────────
  const isCreate = modal === "create";
  const isEdit   = modal !== null && typeof modal === "object" && modal.type === "edit";
  const isToken  = modal !== null && typeof modal === "object" && modal.type === "token";

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#f9f9ff" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111c2c", letterSpacing: "-0.02em" }}>
              Equipos
            </h1>
            <p className="text-sm mt-1" style={{ color: "#707973" }}>
              {devices.length} equipo{devices.length !== 1 ? "s" : ""} registrados · solo estos pueden enviar ubicación
            </p>
          </div>
          <button
            onClick={openCreate}
            disabled={availableTrucks().length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#0f5238", boxShadow: "0 2px 8px rgba(15,82,56,.25)" }}
            title={availableTrucks().length === 0 ? "Todos los camiones tienen equipo" : undefined}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Registrar equipo
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ba1a1a", fontVariationSettings: "'FILL' 1" }}>error</span>
            <p className="text-sm flex-1" style={{ color: "#7f1d1d" }}>{error}</p>
            <button onClick={() => setError(null)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>close</span>
            </button>
          </div>
        )}

        {/* Info card */}
        <div
          className="mb-6 p-4 rounded-xl flex items-start gap-3"
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <span className="material-symbols-outlined mt-0.5" style={{ fontSize: 20, color: "#2563eb", fontVariationSettings: "'FILL' 1" }}>info</span>
          <div className="text-sm" style={{ color: "#1e40af" }}>
            <p className="font-semibold mb-0.5">¿Cómo funciona?</p>
            <p style={{ color: "#3b82f6" }}>
              Cada equipo recibe un <strong>token único</strong>. El celular lo incluye en el header{" "}
              <code className="px-1 py-0.5 rounded text-xs" style={{ background: "#dbeafe", color: "#1d4ed8" }}>X-Device-Token</code>{" "}
              al enviar coordenadas GPS. Si el token no existe o el equipo está inactivo, el servidor rechaza la petición.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <div
            className="grid grid-cols-12 px-6 py-3 border-b text-[10px] font-semibold uppercase tracking-widest"
            style={{ borderColor: "#f0f3ff", color: "#707973", background: "#fafafa" }}
          >
            <div className="col-span-1">#</div>
            <div className="col-span-3">Nombre</div>
            <div className="col-span-3">Camión</div>
            <div className="col-span-3">Token</div>
            <div className="col-span-1 text-center">Estado</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f0f3ff" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#bfc9c1" }}>smartphone</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#707973" }}>No hay equipos registrados</p>
                <p className="text-xs mt-1" style={{ color: "#bfc9c1" }}>Registrá el primer celular para habilitar el rastreo GPS</p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#0f5238" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                Registrar ahora
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f0f3ff" }}>
              {devices.map((device) => (
                <div key={device.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[#f9f9ff] transition-colors">

                  {/* ID */}
                  <div className="col-span-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "#f0f3ff", color: "#707973" }}>
                      {device.id}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: device.active ? "#dcfce7" : "#f1f5f9" }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: device.active ? "#0f5238" : "#94a3b8", fontVariationSettings: "'FILL' 1" }}
                      >
                        smartphone
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#111c2c" }}>{device.name}</p>
                      <p className="text-[11px]" style={{ color: "#bfc9c1" }}>
                        {new Date(device.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Truck */}
                  <div className="col-span-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "#f0fdf4", color: "#0f5238", border: "1px solid #bbf7d0" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                      {device.truck.name}
                    </span>
                  </div>

                  {/* Token */}
                  <div className="col-span-3 flex items-center gap-1.5 min-w-0">
                    <code
                      className="text-[11px] font-mono px-2 py-1 rounded-lg truncate flex-1"
                      style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", maxWidth: 120 }}
                      title={device.token}
                    >
                      {device.token.slice(0, 12)}…
                    </code>
                    <button
                      onClick={() => copyToken(device)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-blue-50 transition-colors"
                      title="Copiar token completo"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 15, color: copiedId === device.id ? "#22c55e" : "#94a3b8" }}
                      >
                        {copiedId === device.id ? "check_circle" : "content_copy"}
                      </span>
                    </button>
                  </div>

                  {/* Status toggle */}
                  <div className="col-span-1 flex justify-center">
                    {toggling === device.id ? (
                      <span className="w-4 h-4 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
                    ) : (
                      <button
                        onClick={() => handleToggleActive(device)}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
                        style={{ background: device.active ? "#0f5238" : "#e2e8f0" }}
                        title={device.active ? "Desactivar" : "Activar"}
                        aria-label={device.active ? "Desactivar equipo" : "Activar equipo"}
                      >
                        <span
                          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: device.active ? "translateX(18px)" : "translateX(2px)" }}
                        />
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end gap-1">
                    <button
                      onClick={() => openEdit(device)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#3b82f6" }}>edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(device.id)}
                      disabled={deleting === device.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deleting === device.id
                        ? <span className="w-3 h-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                        : <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#ba1a1a" }}>delete</span>}
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────────────── */}
      {(isCreate || isEdit || isToken) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "#f0f3ff" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f0f3ff" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#0f5238", fontVariationSettings: "'FILL' 1" }}>
                    {isToken ? "key" : "smartphone"}
                  </span>
                </div>
                <h3 className="text-base font-bold" style={{ color: "#111c2c" }}>
                  {isCreate ? "Registrar equipo" : isEdit ? "Editar equipo" : "Token del equipo"}
                </h3>
              </div>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#475569" }}>close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ── Token view ── */}
              {isToken && (
                <>
                  <p className="text-sm" style={{ color: "#475569" }}>
                    Token regenerado. Copialo ahora — no se mostrará nuevamente en texto plano.
                  </p>
                  <div
                    className="p-4 rounded-xl font-mono text-sm break-all"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#111c2c" }}
                  >
                    {modal.device.token}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToken(modal.device)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                      style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {copiedId === modal.device.id ? "check_circle" : "content_copy"}
                      </span>
                      {copiedId === modal.device.id ? "Copiado" : "Copiar token"}
                    </button>
                    <button
                      onClick={() => setModal(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "#0f5238", color: "#fff" }}
                    >
                      Listo
                    </button>
                  </div>
                </>
              )}

              {/* ── Create / Edit form ── */}
              {(isCreate || isEdit) && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
                      Nombre del equipo <span style={{ color: "#ba1a1a" }}>*</span>
                    </label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Samsung A53 – Camión Norte"
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                      style={{ borderColor: "#bfc9c1", color: "#111c2c" }}
                      onFocus={(e) => { e.target.style.borderColor = "#0f5238"; e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "#bfc9c1"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
                      Camión asignado <span style={{ color: "#ba1a1a" }}>*</span>
                    </label>
                    <select
                      value={formTruckId}
                      onChange={(e) => setFormTruckId(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                      style={{ borderColor: "#bfc9c1", color: formTruckId === "" ? "#9ca3af" : "#111c2c", background: "#fff" }}
                    >
                      <option value="">— Seleccioná un camión —</option>
                      {/* Show all trucks when editing (to allow keeping current) */}
                      {(isEdit
                        ? [modal.device.truck, ...availableTrucks(modal.device.id)]
                        : availableTrucks()
                      ).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {isEdit && (
                    <div className="pt-1">
                      <button
                        onClick={() => handleRegenToken(modal.device)}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-amber-50 disabled:opacity-50"
                        style={{ borderColor: "#fcd34d", color: "#92400e" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>autorenew</span>
                        Regenerar token del equipo
                      </button>
                    </div>
                  )}

                  {formError && (
                    <p className="text-xs p-3 rounded-lg" style={{ background: "#fff5f5", color: "#ba1a1a", border: "1px solid #fecaca" }}>
                      {formError}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setModal(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                      style={{ borderColor: "#e2e8f0", color: "#475569" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={isCreate ? handleCreate : handleEdit}
                      disabled={saving || !formName.trim() || formTruckId === ""}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-50"
                      style={{ background: "#0f5238" }}
                    >
                      {saving
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{isCreate ? "add_circle" : "save"}</span>}
                      {saving ? "Guardando…" : isCreate ? "Registrar" : "Guardar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
