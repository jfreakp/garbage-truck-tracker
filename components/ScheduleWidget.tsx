"use client";

import { useState, useEffect } from "react";

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
    cardBg:    "#dcfce7",
    cardBg2:   "#bbf7d0",
    color:     "#14532d",
    dotBg:     "#16a34a",
    label:     "Tacho Verde",
    desc:      "Orgánicos: restos de cocina, cáscaras, comida",
    icon:      "eco",
    accentBg:  "#16a34a",
    glow:      "rgba(22,163,74,.35)",
    svgColors: {
      body:      "#16a34a",
      bodyShade: "#15803d",
      bodyDark:  "#14532d",
      lid:       "#22c55e",
      lidShade:  "#16a34a",
      dark:      "#14532d",
      highlight: "#4ade80",
      wheel:     "#052e16",
      wheelRim:  "#166534",
      stripe:    "#15803d",
    },
  },
  negra: {
    cardBg:    "#f1f5f9",
    cardBg2:   "#e2e8f0",
    color:     "#1e293b",
    dotBg:     "#334155",
    label:     "Tacho Negro",
    desc:      "Inorgánicos: papel, cartón, plástico, latas, vidrio",
    icon:      "recycling",
    accentBg:  "#334155",
    glow:      "rgba(51,65,85,.40)",
    svgColors: {
      body:      "#334155",
      bodyShade: "#1e293b",
      bodyDark:  "#0f172a",
      lid:       "#475569",
      lidShade:  "#334155",
      dark:      "#0f172a",
      highlight: "#94a3b8",
      wheel:     "#020617",
      wheelRim:  "#1e293b",
      stripe:    "#1e293b",
    },
  },
  ninguno: {
    cardBg:    "#f8fafc",
    cardBg2:   "#f1f5f9",
    color:     "#94a3b8",
    dotBg:     "#cbd5e1",
    label:     "Sin recolección",
    desc:      "Hoy no hay servicio de recolección",
    icon:      "do_not_disturb_on",
    accentBg:  "#cbd5e1",
    glow:      "rgba(148,163,184,.25)",
    svgColors: {
      body:      "#cbd5e1",
      bodyShade: "#94a3b8",
      bodyDark:  "#64748b",
      lid:       "#e2e8f0",
      lidShade:  "#cbd5e1",
      dark:      "#64748b",
      highlight: "#f8fafc",
      wheel:     "#475569",
      wheelRim:  "#64748b",
      stripe:    "#94a3b8",
    },
  },
} satisfies Record<BinType, object>;

// ── Wheelie bin SVG illustration ─────────────────────────────────────────────
function BinIllustration({ bin }: { bin: BinType }) {
  const c = BIN_CONFIG[bin].svgColors;

  return (
    <svg
      viewBox="0 0 88 120"
      width="88"
      height="120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Ground shadow ── */}
      <ellipse cx="44" cy="116" rx="30" ry="5" fill="rgba(0,0,0,.13)" />

      {/* ── Wheels ── */}
      {/* Left wheel */}
      <circle cx="20" cy="99" r="10" fill={c.dark} />
      <circle cx="20" cy="99" r="7"  fill={c.wheel} />
      <circle cx="20" cy="99" r="4"  fill={c.wheelRim} />
      <circle cx="18" cy="97" r="1.5" fill={c.highlight} opacity="0.5" />

      {/* Right wheel */}
      <circle cx="68" cy="99" r="10" fill={c.dark} />
      <circle cx="68" cy="99" r="7"  fill={c.wheel} />
      <circle cx="68" cy="99" r="4"  fill={c.wheelRim} />
      <circle cx="66" cy="97" r="1.5" fill={c.highlight} opacity="0.5" />

      {/* Axle bar */}
      <rect x="20" y="97" width="48" height="4" rx="2" fill={c.dark} opacity="0.6" />

      {/* ── Body ── */}
      <rect x="9" y="33" width="70" height="64" rx="5" fill={c.body} />

      {/* Body – right-side 3-D shading */}
      <rect x="63" y="38" width="16" height="54" rx="0 4 4 0" fill={c.bodyShade} opacity="0.55" />

      {/* Body – bottom strip */}
      <rect x="9" y="88" width="70" height="9" rx="0 0 5 5" fill={c.bodyDark} opacity="0.45" />

      {/* Body – vertical ribbing (subtle) */}
      {[29, 44, 59].map((x) => (
        <rect key={x} x={x} y="38" width="2" height="50" rx="1" fill={c.stripe} opacity="0.22" />
      ))}

      {/* ── Hinge bar ── */}
      <rect x="11" y="27" width="66" height="8" rx="4" fill={c.dark} />
      {/* Hinge highlight */}
      <rect x="14" y="28" width="58" height="3" rx="1.5" fill={c.highlight} opacity="0.18" />

      {/* ── Lid ── */}
      <rect x="2" y="9" width="84" height="21" rx="6" fill={c.lid} />
      {/* Lid – right shading */}
      <rect x="71" y="9" width="15" height="21" rx="0 6 6 0" fill={c.lidShade} opacity="0.55" />
      {/* Lid – top highlight strip */}
      <rect x="6" y="12" width="62" height="6" rx="3" fill={c.highlight} opacity="0.22" />

      {/* ── Handle ── */}
      <rect x="28" y="1" width="32" height="11" rx="5.5" fill={c.dark} />
      {/* Handle inner cutout */}
      <rect x="32" y="3" width="24" height="7" rx="3.5" fill={c.body} opacity="0.35" />
      {/* Handle top shine */}
      <rect x="34" y="3.5" width="14" height="2.5" rx="1.25" fill={c.highlight} opacity="0.3" />
    </svg>
  );
}

// ── API shape ─────────────────────────────────────────────────────────────────
interface ApiSchedule {
  dayOfWeek: number;
  binColor:  "VERDE" | "NEGRA" | "NINGUNO";
  startTime: string;
  endTime:   string;
  active:    boolean;
}

function apiToSchedule(api: ApiSchedule[]): typeof SCHEDULE {
  const COLOR_MAP: Record<string, BinType> = { VERDE: "verde", NEGRA: "negra", NINGUNO: "ninguno" };
  return SCHEDULE.map((def) => {
    const s = api.find((a) => a.dayOfWeek === def.day && a.active);
    if (!s) return def;
    return { ...def, bin: COLOR_MAP[s.binColor] as BinType };
  });
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function ScheduleWidget() {
  const [open,     setOpen]     = useState(true);
  const [apiData,  setApiData]  = useState<typeof SCHEDULE | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("eco_token") : null;
    if (!token) return;
    fetch("/api/schedules", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => { if (json.success) setApiData(apiToSchedule(json.data)); })
      .catch(() => { /* keep hardcoded fallback */ });
  }, []);

  const schedule   = apiData ?? SCHEDULE;
  const todayIndex = new Date().getDay(); // 0–6
  const today      = schedule[todayIndex];
  const cfg        = BIN_CONFIG[today.bin];

  // 7-day row starting from today
  const week = Array.from({ length: 7 }, (_, i) => schedule[(todayIndex + i) % 7]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background:     "rgba(255,255,255,.96)",
        backdropFilter: "blur(16px)",
        boxShadow:      "0 4px 12px rgba(0,0,0,.08)",
      }}
    >
      {/* Accent bar — color follows today's bin */}
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
            fontSize:   18,
            color:      "#707973",
            transition: "transform .2s",
            transform:  open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">

          {/* ── Hero: bin illustration + label ── */}
          <div
            className="flex flex-col items-center gap-2 pt-4 pb-5 rounded-2xl"
            style={{
              background: `linear-gradient(160deg, ${cfg.cardBg} 0%, ${cfg.cardBg2} 100%)`,
            }}
          >
            {/* Bin SVG with colored glow */}
            <div
              style={{ filter: `drop-shadow(0 10px 22px ${cfg.glow})` }}
              className="select-none"
            >
              <BinIllustration bin={today.bin} />
            </div>

            {/* Labels */}
            <div className="text-center px-4">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: cfg.color, opacity: 0.6 }}
              >
                Hoy toca sacar
              </p>
              <p
                className="text-[22px] font-black leading-tight mt-0.5"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </p>
              <p
                className="text-[11px] mt-1 leading-snug"
                style={{ color: cfg.color, opacity: 0.72 }}
              >
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
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "#707973" }}
            >
              Próximos 7 días
            </p>
            <div className="grid grid-cols-7 gap-1">
              {week.map((d, i) => {
                const c  = BIN_CONFIG[d.bin];
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
