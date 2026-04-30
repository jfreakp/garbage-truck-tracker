"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearToken } from "@/lib/api-client";
import ScheduleWidget from "@/components/ScheduleWidget";

const NAV = [
  { href: "/map",       icon: "map",                  label: "Mapa"     },
  { href: "/trucks",    icon: "local_shipping",       label: "Flota"    },
  { href: "/devices",   icon: "smartphone",           label: "Equipos"  },
  { href: "/barrios",   icon: "holiday_village",      label: "Barrios"  },
  { href: "/routes",    icon: "route",                label: "Rutas"    },
  { href: "/schedules", icon: "calendar_month",       label: "Horarios" },
  { href: "/alerts",    icon: "notifications_active", label: "Alertas"  },
  { href: "/dashboard", icon: "dashboard",            label: "Panel"    },
  { href: "/profile",   icon: "person",               label: "Perfil"   },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("eco_token");
    if (!token) { router.replace("/login"); return; }
    const raw = localStorage.getItem("eco_user");
    if (raw) setUser(JSON.parse(raw));
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#f9f9ff" }}>

      {/* ── Top App Bar ── */}
      <header
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-16"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Mobile menu hint / Logo */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ color: "#0f5238", fontSize: 24 }}>eco</span>
            <span className="text-xl font-bold tracking-tight" style={{ color: "#0f5238" }}>EcoTrack</span>
          </div>
          {/* Tagline */}
          <div className="hidden md:flex items-center gap-1.5 ml-4">
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#bfc9c1" }}>location_on</span>
            <span className="text-sm" style={{ color: "#707973" }}>Loja, Ecuador</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search (decorative on desktop) */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
            style={{ borderColor: "#bfc9c1", color: "#707973", background: "#f0f3ff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            <span>Buscar rutas...</span>
          </div>

          {/* User avatar / logout */}
          <div className="relative group">
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all"
              style={{ background: "#2d6a4f", color: "#fff" }}
              aria-label="Cuenta"
            >
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </button>
            {/* Dropdown */}
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl border p-1 hidden group-focus-within:block"
              style={{ background: "#fff", borderColor: "#e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,.1)" }}
            >
              <p className="px-3 py-2 text-xs font-semibold" style={{ color: "#707973" }}>{user?.email}</p>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors hover:bg-red-50"
                style={{ color: "#ba1a1a" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body (sidebar + main) ── */}
      <div className="flex flex-1 overflow-hidden pt-16 pb-16 md:pb-0">

        {/* Sidebar – desktop only */}
        <aside
          className="hidden md:flex flex-col w-64 flex-shrink-0 border-r overflow-y-auto"
          style={{ background: "#fafafa", borderColor: "#e2e8f0" }}
        >
          <div className="p-6 pb-2">
            <h2 className="font-bold text-sm" style={{ color: "#0f5238" }}>Portal Administrativo</h2>
            <p className="text-xs mt-0.5" style={{ color: "#707973" }}>Div. Residuos Municipales</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: active ? "#0f5238" : "#475569",
                    background: active ? "#dcfce7" : "transparent",
                    borderRight: active ? "3px solid #0f5238" : "3px solid transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 22,
                      fontVariationSettings: active
                        ? "'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24"
                        : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
                    }}
                  >
                    {n.icon}
                  </span>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Schedule widget */}
          <div className="px-3 pb-3">
            <ScheduleWidget />
          </div>

          {/* User card bottom */}
          <div className="p-4 border-t" style={{ borderColor: "#e2e8f0" }}>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ background: "#2d6a4f", color: "#fff" }}
              >
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#111c2c" }}>{user?.name ?? "Usuario"}</p>
                <p className="text-[10px] truncate" style={{ color: "#707973" }}>{user?.email ?? ""}</p>
              </div>
              <button onClick={logout} className="ml-auto flex-shrink-0" aria-label="Salir" title="Cerrar sesión">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#707973" }}>logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* ── Bottom Nav – mobile only ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2"
        style={{
          background: "rgba(255,255,255,.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #e2e8f0",
          boxShadow: "0 -4px 12px rgba(0,0,0,.05)",
        }}
      >
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{
                color: active ? "#0f5238" : "#707973",
                background: active ? "#dcfce7" : "transparent",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 24,
                  fontVariationSettings: active
                    ? "'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24"
                    : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
                }}
              >
                {n.icon}
              </span>
              <span className="text-[10px] font-semibold">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
