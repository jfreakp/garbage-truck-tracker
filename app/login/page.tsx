"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: { id: number; name: string; email: string } }>(
        "/api/auth/login",
        { email, password }
      );
      setToken(res.token);
      localStorage.setItem("eco_user", JSON.stringify(res.user));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        backgroundImage:
          "linear-gradient(rgba(249,249,255,.93),rgba(249,249,255,.93)), url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&q=60)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Login card */}
      <div
        className="w-full max-w-[440px] bg-white border border-[#bfc9c1]/30 rounded-xl overflow-hidden animate-fade-up"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,.07)" }}
      >
        <div className="p-8">
          {/* Branding */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 flex items-center justify-center rounded-xl mb-4"
              style={{ backgroundColor: "#2d6a4f", boxShadow: "0 2px 8px rgba(15,82,56,.25)" }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 30 }}>
                recycling
              </span>
            </div>
            <h1
              className="text-[28px] font-bold tracking-tight"
              style={{ color: "#0f5238", letterSpacing: "-0.02em" }}
            >
              EcoTrack
            </h1>
            <p className="text-sm mt-1" style={{ color: "#404943" }}>
              Portal de Control de Gestión de Residuos
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
              style={{ background: "#ffdad6", color: "#93000a" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#404943", letterSpacing: "0.05em" }}
              >
                Correo electrónico
              </label>
              <div className="relative group">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ fontSize: 20, color: "#707973" }}
                >
                  person
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ecotrack.gov"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm transition-all outline-none"
                  style={{
                    borderColor: "#bfc9c1",
                    backgroundColor: "#fff",
                    color: "#111c2c",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0f5238";
                    e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#bfc9c1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#404943", letterSpacing: "0.05em" }}
              >
                Contraseña
              </label>
              <div className="relative group">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 20, color: "#707973" }}
                >
                  lock
                </span>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border rounded-lg text-sm transition-all outline-none"
                  style={{ borderColor: "#bfc9c1", backgroundColor: "#fff", color: "#111c2c" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0f5238";
                    e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#bfc9c1";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#707973" }}
                  aria-label={showPw ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#0f5238]"
                />
                <span className="text-sm" style={{ color: "#404943" }}>Recordarme</span>
              </label>
              <Link href="#" className="text-xs font-semibold" style={{ color: "#0f5238" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#2d6a4f",
                boxShadow: "0 2px 8px rgba(15,82,56,.2)",
              }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="mt-7 pt-6 border-t text-center"
            style={{ borderColor: "#bfc9c1" }}
          >
            <p className="text-sm" style={{ color: "#404943" }}>
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="font-semibold" style={{ color: "#0f5238" }}>
                Regístrate aquí
              </Link>
            </p>
            <p className="text-xs mt-3" style={{ color: "#707973" }}>
              Estado del sistema:{" "}
              <span className="font-bold inline-flex items-center gap-1" style={{ color: "#166534" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" style={{ animation: "pulseRing 2s ease-out infinite" }} />
                Operativo
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative floating cards */}
      <div className="fixed top-20 right-[12%] hidden lg:block opacity-20 pointer-events-none">
        <div className="p-4 bg-white border border-[#bfc9c1] rounded-xl shadow-sm rotate-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[#0f5238]" style={{ fontSize: 22 }}>local_shipping</span>
          </div>
          <div>
            <div className="h-2 w-16 bg-[#0f5238]/20 rounded-full mb-1.5" />
            <div className="h-2 w-10 bg-[#0f5238]/10 rounded-full" />
          </div>
        </div>
      </div>
      <div className="fixed bottom-20 left-[8%] hidden lg:block opacity-20 pointer-events-none">
        <div className="p-4 bg-white border border-[#bfc9c1] rounded-xl shadow-sm -rotate-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-700" style={{ fontSize: 22 }}>report</span>
          </div>
          <div>
            <div className="h-2 w-20 bg-orange-700/20 rounded-full mb-1.5" />
            <div className="h-2 w-14 bg-orange-700/10 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
