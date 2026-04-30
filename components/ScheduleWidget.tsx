"use client";

import { useState } from "react";

type BinType = "verde" | "negra" | "ninguno";

interface DaySchedule {
  day: number; // 0 = domingo
  name: string;
  short: string;
  bin: BinType;
}

const SCHEDULE: DaySchedule[] = [
  { day: 0, name: "Domingo",    short: "Dom", bin: "ninguno" },
  { day: 1, name: "Lunes",      short: "Lun", bin: "verde"   },
  { day: 2, name: "Martes",     short: "Mar", bin: "negra"   },
  { day: 3, name: "Miércoles",  short: "Mié", bin: "verde"   },
  { day: 4, name: "Jueves",     short: "Jue", bin: "negra"   },
  { day: 5, name: "Viernes",    short: "Vie", bin: "verde"   },
  { day: 6, name: "Sábado",     short: "Sáb", bin: "negra"   },
];

const BIN_CONFIG = {
  verde: {
    cardBg:   "#dcfce7",
    color:    "#14532d",
    dotBg:    "#16a34a",
    label:    "Tacho Verde",
    desc:     "Orgánicos: restos de cocina, cáscaras, comida",
    icon:     "eco",
    accentBg: "#16a34a",
  },
  negra: {
    cardBg:   "#f1f5f9",
    color:    "#1e293b",
    dotBg:    "#334155",
    label:    "Tacho Negro",
    desc:     "Inorgánicos: papel, cartón, plástico, latas, vidrio",
    icon:     "recycling",
    accentBg: "#334155",
  },
  ninguno: {
    cardBg:   "#f9f9ff",
    color:    "#9ca3af",
    dotBg:    "#d1d5db",
    label:    "Sin recolección",
    desc:     "Hoy no hay servicio de recolección",
    icon:     "do_not_disturb_on",
    accentBg: "#d1d5db",
  },
} satisfies Record<BinType, object>;

export default function ScheduleWidget() {
  const [open, setOpen] = useState(true);

  const todayIndex = new Date().getDay(); // 0–6
  const today      = SCHEDULE[todayIndex];
  const cfg        = BIN_CONFIG[today.bin];

  // 7-day row starting from today
  const week = Array.from({ length: 7 }, (_, i) => SCHEDULE[(todayIndex + i) % 7]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background:       "rgba(255,255,255,.96)",
        backdropFilter:   "blur(16px)",
        boxShadow:        "0 4px 12px rgba(0,0,0,.08)",
      }}
    >
      {/* Accent bar — color changes with today's bin */}
      <div style={{ height: 3, background: cfg.accentBg }} />

      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[.02]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "#0f5238", fontVariationSettings: "'FILL' 1" }}
          >
            calendar_today
          </span>
          <span className="text-sm font-bold" style={{ color: "#111c2c" }}>
            Recolección de basura
          </span>
        </div>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 18,
            color: "#707973",
            transition: "transform .2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">

          {/* ── Today's bin ── */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: cfg.cardBg }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.dotBg }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: "#fff", fontVariationSettings: "'FILL' 1" }}
              >
                {cfg.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color, opacity: 0.65 }}>
                Hoy toca
              </p>
              <p className="text-[15px] font-bold leading-tight" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: cfg.color, opacity: 0.75 }}>
                {cfg.desc}
              </p>
            </div>
          </div>

          {/* ── Hours badge ── */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "#f0f3ff" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: "#1960a3", fontVariationSettings: "'FILL' 1" }}
            >
              schedule
            </span>
            <p className="text-xs font-semibold" style={{ color: "#1960a3" }}>
              Horario: 07:00 – 15:00 &nbsp;·&nbsp; Lun – Sáb
            </p>
          </div>

          {/* ── 7-day week row ── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#707973" }}>
              Próximos 7 días
            </p>
            <div className="grid grid-cols-7 gap-1">
              {week.map((d, i) => {
                const c = BIN_CONFIG[d.bin];
                const isToday = i === 0;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg"
                    style={{
                      background: isToday ? c.cardBg : "transparent",
                      outline:    isToday ? `2px solid ${c.dotBg}` : "none",
                    }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase"
                      style={{ color: isToday ? c.color : "#bfc9c1" }}
                    >
                      {d.short}
                    </span>
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ background: c.dotBg, opacity: isToday ? 1 : 0.45 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Legend ── */}
          <div
            className="flex items-center gap-4 pt-1 border-t"
            style={{ borderColor: "#f0f3ff" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#16a34a" }} />
              <span className="text-[11px]" style={{ color: "#707973" }}>Verde · Orgánicos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#334155" }} />
              <span className="text-[11px]" style={{ color: "#707973" }}>Negro · Inorgánicos</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
