"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api-client";

const inputStyle = {
  borderColor: "#bfc9c1",
  backgroundColor: "#fff",
  color: "#111c2c",
};

function Field({
  id, label, type = "text", value, onChange, placeholder, icon,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; icon: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest" style={{ color: "#404943", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: 20, color: "#707973" }}>{icon}</span>
        <input
          id={id} type={type} value={value} placeholder={placeholder} required
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "#0f5238"; e.target.style.boxShadow = "0 0 0 3px rgba(15,82,56,.12)"; }}
          onBlur={(e) => { e.target.style.borderColor = "#bfc9c1"; e.target.style.boxShadow = "none"; }}
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: { id: number; name: string; email: string } }>(
        "/api/auth/register",
        { name: form.name, email: form.email, password: form.password }
      );
      setToken(res.token);
      localStorage.setItem("eco_user", JSON.stringify(res.user));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        backgroundImage: "linear-gradient(rgba(249,249,255,.93),rgba(249,249,255,.93)), url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&q=60)",
        backgroundSize: "cover", backgroundPosition: "center",
      }}
    >
      <div
        className="w-full max-w-[440px] bg-white border border-[#bfc9c1]/30 rounded-xl overflow-hidden animate-fade-up"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,.07)" }}
      >
        <div className="p-8">
          {/* Branding */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 flex items-center justify-center rounded-xl mb-4" style={{ backgroundColor: "#2d6a4f" }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: 30 }}>eco</span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight" style={{ color: "#0f5238", letterSpacing: "-0.02em" }}>
              Crear cuenta
            </h1>
            <p className="text-sm mt-1" style={{ color: "#404943" }}>EcoTrack · Portal Ciudadano</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg text-sm" style={{ background: "#ffdad6", color: "#93000a" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="name" label="Nombre completo" value={form.name} onChange={set("name")} placeholder="Juan Pérez" icon="badge" />
            <Field id="email" label="Correo electrónico" type="email" value={form.email} onChange={set("email")} placeholder="juan@email.com" icon="mail" />
            <Field id="password" label="Contraseña" type="password" value={form.password} onChange={set("password")} placeholder="Mínimo 8 caracteres" icon="lock" />

            <p className="text-xs pt-1" style={{ color: "#707973" }}>
              Al registrarte aceptas los términos de servicio del portal municipal EcoTrack.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-50"
              style={{ backgroundColor: "#2d6a4f", boxShadow: "0 2px 8px rgba(15,82,56,.2)" }}
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>Registrarme</>
              }
            </button>
          </form>

          <div className="mt-7 pt-6 border-t text-center" style={{ borderColor: "#bfc9c1" }}>
            <p className="text-sm" style={{ color: "#404943" }}>
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-semibold" style={{ color: "#0f5238" }}>
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
