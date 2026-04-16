"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

const DASHBOARD_POR_ROL: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  MAESTRO: "/maestro/agenda",
  PADRE: "/padre/home",
  RECEPCIONISTA: "/admin/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({ email: "", password: "" });

  function validar(): boolean {
    const nuevosErrores = { email: "", password: "" };
    let valido = true;

    if (!email) {
      nuevosErrores.email = "El email es requerido";
      valido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevosErrores.email = "Email inválido";
      valido = false;
    }

    if (!password) {
      nuevosErrores.password = "La contraseña es requerida";
      valido = false;
    } else if (password.length < 6) {
      nuevosErrores.password = "Mínimo 6 caracteres";
      valido = false;
    }

    setErrores(nuevosErrores);
    return valido;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    setCargando(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email o contraseña incorrectos");
        return;
      }

      // Obtener el rol del token para redirigir
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const rol: string = session?.user?.rol ?? "";
      const destino = DASHBOARD_POR_ROL[rol] ?? "/";

      toast.success("Bienvenido a Epic Motion");
      router.push(destino);
      router.refresh();
    } catch {
      toast.error("Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-epic-black dark:bg-epic-black bg-white px-4 py-8">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Epic Motion"
            width={160}
            height={56}
            className="dark:block hidden"
            priority
          />
          <Image
            src="/logo-light.png"
            alt="Epic Motion"
            width={160}
            height={56}
            className="dark:hidden block"
            priority
          />
          <p className="mt-3 text-sm text-epic-silver dark:text-epic-silver text-gray-500 tracking-[0.08em] font-inter uppercase">
            High Performance Dance Studio
          </p>
        </div>

        {/* Card contenedor */}
        <div className="dark:bg-epic-gray bg-gray-50 rounded-2xl p-8 shadow-xl dark:shadow-black/40 shadow-gray-200/60 border dark:border-white/5 border-gray-200">
          <h1 className="text-xl font-montserrat font-700 dark:text-white text-gray-900 mb-1 tracking-[0.04em]">
            Iniciar Sesión
          </h1>
          <p className="text-sm dark:text-epic-silver text-gray-500 mb-6 font-inter">
            Accede a tu cuenta de Epic Motion
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-inter font-medium dark:text-epic-silver text-gray-600 tracking-[0.02em]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errores.email) setErrores((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="ejemplo@correo.com"
                className={[
                  "w-full px-4 py-3 rounded-xl font-inter text-sm",
                  "dark:bg-epic-black bg-white",
                  "dark:text-white text-gray-900",
                  "dark:placeholder-gray-600 placeholder-gray-400",
                  "border transition-colors duration-150 outline-none",
                  errores.email
                    ? "border-red-500 focus:border-red-500"
                    : "dark:border-white/10 border-gray-200 focus:border-epic-gold dark:focus:border-epic-gold",
                ].join(" ")}
              />
              {errores.email && (
                <p className="text-xs text-red-500 font-inter">{errores.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-inter font-medium dark:text-epic-silver text-gray-600 tracking-[0.02em]"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={verPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errores.password) setErrores((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  className={[
                    "w-full px-4 py-3 pr-11 rounded-xl font-inter text-sm",
                    "dark:bg-epic-black bg-white",
                    "dark:text-white text-gray-900",
                    "dark:placeholder-gray-600 placeholder-gray-400",
                    "border transition-colors duration-150 outline-none",
                    errores.password
                      ? "border-red-500 focus:border-red-500"
                      : "dark:border-white/10 border-gray-200 focus:border-epic-gold dark:focus:border-epic-gold",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 hover:dark:text-epic-silver hover:text-gray-600 transition-colors"
                  aria-label={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errores.password && (
                <p className="text-xs text-red-500 font-inter">{errores.password}</p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              className={[
                "w-full py-3 rounded-xl font-montserrat font-bold text-sm tracking-[0.08em] uppercase",
                "transition-all duration-200",
                cargando
                  ? "bg-epic-gold/60 text-black/50 cursor-not-allowed"
                  : "bg-epic-gold text-black hover:brightness-110 active:scale-[0.98]",
              ].join(" ")}
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>

        {/* Volver a inicio */}
        <div className="flex justify-center mt-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-inter dark:text-epic-silver text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver a inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
