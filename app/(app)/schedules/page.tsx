"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

type BinColor = "VERDE" | "NEGRA" | "NINGUNO";

interface WasteSchedule {
  id:        number;
  dayOfWeek: number;
  binColor:  BinColor;
  startTime: string;
  endTime:   string;
  active:    boolean;
  notes:     string | null;
  updatedAt: string;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ALL_DAYS  = [0, 1, 2, 3, 4, 5, 6];

const BIN_LABELS: Record<BinColor, string> = {
  VERDE:   "Tacho Verde",
  NEGRA:   "Tacho Negro",
  NINGUNO: "Sin recolección",
};

const BIN_BADGE: Record<BinColor, { bg: string; color: string; dot: string }> = {
  VERDE:   { bg: "#dcfce7", color: "#14532d", dot: "#16a34a" },
  NEGRA:   { bg: "#f1f5f9", color: "#1e293b", dot: "#334155" },
  NINGUNO: { bg: "#f8fafc", color: "#9ca3af", dot: "#cbd5e1" },
};

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <h2 className="font-bold text-base" style={{ color: "#111c2c" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#707973" }}>close</span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Schedule form ─────────────────────────────────────────────────────────────
function ScheduleForm({
  initial,
  dayOfWeek,
  loading,
  onSubmit,
  onCancel,
}: {
  initial?: WasteSchedule;
  dayOfWeek: number;
  loading: boolean;
  onSubmit: (data: { binColor: BinColor; startTime: string; endTime: string; active: boolean; notes: string }) => void;
  onCancel: () => void;
}) {
  const [binColor,  setBinColor]  = useState<BinColor>(initial?.binColor  ?? "NINGUNO");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "07:00");
  const [endTime,   setEndTime]   = useState(initial?.endTime   ?? "15:00");
  const [active,    setActive]    = useState(initial?.active    ?? true);
  const [notes,     setNotes]     = useState(initial?.notes     ?? "");

  const label = (t: string) => (
    <label className="block text-xs font-semibold mb-1" style={{ color: "#475569" }}>{t}</label>
  );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ binColor, startTime, endTime, active, notes }); }}
      className="space-y-4"
    >
      <div className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "#f0f3ff", color: "#1960a3" }}>
        {DAY_NAMES[dayOfWeek]}
      </div>

      {/* Bin color */}
      <div>
        {label("Tipo de tacho")}
        <div className="grid grid-cols-3 gap-2">
          {(["VERDE", "NEGRA", "NINGUNO"] as BinColor[]).map((c) => {
            const b = BIN_BADGE[c];
            const sel = binColor === c;
            return (
              <button
                key={c} type="button"
                onClick={() => setBinColor(c)}
                className="py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border-2 transition-all"
                style={{
                  background:   sel ? b.bg    : "#fafafa",
                  borderColor:  sel ? b.dot   : "#e2e8f0",
                  color:        sel ? b.color : "#9ca3af",
                }}
              >
                <span className="w-4 h-4 rounded-full" style={{ background: b.dot }} />
                {BIN_LABELS[c].replace("Tacho ", "").replace("Sin recolección", "Ninguno")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          {label("Hora inicio")}
          <input
            type="time" value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "#bfc9c1", color: "#111c2c" }}
          />
        </div>
        <div>
          {label("Hora fin")}
          <input
            type="time" value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "#bfc9c1", color: "#111c2c" }}
          />
        </div>
      </div>

      {/* Active */}
      <div className="flex items-center justify-between py-2 border rounded-xl px-4" style={{ borderColor: "#e2e8f0" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#111c2c" }}>Servicio activo</p>
          <p className="text-xs" style={{ color: "#707973" }}>Mostrar este día en el widget</p>
        </div>
        <button
          type="button" onClick={() => setActive((v) => !v)}
          className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
          style={{ background: active ? "#0f5238" : "#e2e8f0" }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ left: active ? "calc(100% - 22px)" : "2px" }}
          />
        </button>
      </div>

      {/* Notes */}
      <div>
        {label("Notas (opcional)")}
        <input
          type="text" value={notes} maxLength={200}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Solo sector norte"
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: "#bfc9c1", color: "#111c2c" }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
          style={{ borderColor: "#e2e8f0", color: "#475569" }}
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "#0f5238" }}
        >
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Modal =
  | { type: "edit";   schedule: WasteSchedule }
  | { type: "create"; dayOfWeek: number }
  | { type: "delete"; schedule: WasteSchedule }
  | null;

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<WasteSchedule[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [modal,     setModal]     = useState<Modal>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<WasteSchedule[]>("/api/schedules");
      setSchedules(res);
    } catch {
      setError("No se pudo cargar los horarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(dayOfWeek: number, data: { binColor: BinColor; startTime: string; endTime: string; active: boolean; notes: string }) {
    try {
      setSaving(true);
      await api.post("/api/schedules", { dayOfWeek, ...data, notes: data.notes || null });
      setModal(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear horario");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: number, data: { binColor: BinColor; startTime: string; endTime: string; active: boolean; notes: string }) {
    try {
      setSaving(true);
      await api.patch(`/api/schedules/${id}`, { ...data, notes: data.notes || null });
      setModal(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al actualizar horario");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      setSaving(true);
      await api.delete(`/api/schedules/${id}`);
      setModal(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar horario");
    } finally {
      setSaving(false);
    }
  }

  // Build a map dayOfWeek → schedule for fast lookup
  const byDay = new Map(schedules.map((s) => [s.dayOfWeek, s]));

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111c2c" }}>Horarios de Recolección</h1>
          <p className="text-sm mt-0.5" style={{ color: "#707973" }}>
            Configura qué tacho corresponde a cada día de la semana
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: "#16a34a" }} />
            <span className="text-xs" style={{ color: "#707973" }}>Verde · Orgánicos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: "#334155" }} />
            <span className="text-xs" style={{ color: "#707973" }}>Negro · Inorgánicos</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#dc2626", fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#dc2626" }}>close</span>
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <span className="w-8 h-8 border-2 border-[#0f5238]/20 border-t-[#0f5238] rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "#707973" }}>Cargando horarios…</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#e2e8f0" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#707973" }}>Día</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#707973" }}>Tacho</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#707973" }}>Horario</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#707973" }}>Estado</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#707973" }}>Notas</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {ALL_DAYS.map((day, i) => {
                const s   = byDay.get(day);
                const b   = s ? BIN_BADGE[s.binColor] : null;
                const odd = i % 2 === 1;
                return (
                  <tr
                    key={day}
                    style={{ background: odd ? "#fafafa" : "#fff", borderBottom: i < 6 ? "1px solid #f1f5f9" : "none" }}
                  >
                    {/* Day */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "#f0f3ff", color: "#1960a3" }}
                        >
                          {day === 0 ? "Do" : DAY_NAMES[day].slice(0, 2)}
                        </span>
                        <span className="font-semibold" style={{ color: "#111c2c" }}>{DAY_NAMES[day]}</span>
                      </div>
                    </td>

                    {/* Bin */}
                    <td className="px-5 py-4">
                      {s && b ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: b.bg, color: b.color }}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.dot }} />
                          {BIN_LABELS[s.binColor]}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "#bfc9c1" }}>—</span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-4 hidden sm:table-cell" style={{ color: "#475569" }}>
                      {s ? `${s.startTime} – ${s.endTime}` : <span style={{ color: "#bfc9c1" }}>—</span>}
                    </td>

                    {/* Active */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      {s ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: s.active ? "#dcfce7" : "#f1f5f9", color: s.active ? "#0f5238" : "#9ca3af" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.active ? "#16a34a" : "#cbd5e1" }} />
                          {s.active ? "Activo" : "Inactivo"}
                        </span>
                      ) : (
                        <span style={{ color: "#bfc9c1" }} className="text-xs">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-4 hidden md:table-cell max-w-[160px]">
                      <span className="truncate block text-xs" style={{ color: "#707973" }}>
                        {s?.notes ?? ""}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        {s ? (
                          <>
                            <button
                              onClick={() => setModal({ type: "edit", schedule: s })}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#1960a3" }}>edit</span>
                            </button>
                            <button
                              onClick={() => setModal({ type: "delete", schedule: s })}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ba1a1a" }}>delete</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setModal({ type: "create", dayOfWeek: day })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-green-50"
                            style={{ color: "#0f5238", border: "1px dashed #16a34a" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                            Agregar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal?.type === "create" && (
        <Modal title={`Agregar horario — ${DAY_NAMES[modal.dayOfWeek]}`} onClose={() => setModal(null)}>
          <ScheduleForm
            dayOfWeek={modal.dayOfWeek}
            loading={saving}
            onSubmit={(data) => handleCreate(modal.dayOfWeek, data)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title={`Editar — ${DAY_NAMES[modal.schedule.dayOfWeek]}`} onClose={() => setModal(null)}>
          <ScheduleForm
            initial={modal.schedule}
            dayOfWeek={modal.schedule.dayOfWeek}
            loading={saving}
            onSubmit={(data) => handleEdit(modal.schedule.id, data)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <Modal title="Eliminar horario" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "#475569" }}>
              ¿Eliminar el horario del <strong>{DAY_NAMES[modal.schedule.dayOfWeek]}</strong>?
              El widget mostrará ese día sin configurar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(modal.schedule.id)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#ba1a1a" }}
              >
                {saving ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
