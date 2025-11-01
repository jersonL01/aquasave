// src/components/FormLogin.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { alertError, alertSuccess } from "@/lib/alerts";
import { setUser } from "@/lib/user";
import { Mail, Lock } from "lucide-react";
import ButtonGoogle from "./ButtonGoogle";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

type Props = {
  afterLoginHref?: string;      // default: /principal
  meEndpoint?: string;          // default: /api/me
  allowedRoles?: string[];      // <-- NUEVO (default ["usuario"])
  className?: string;
};

export default function FormLogin({
  afterLoginHref = "/principal",
  meEndpoint = "/api/me",
  allowedRoles = ["usuario"],   // <-- por defecto solo 'usuario'
  className = "",
}: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember: false },
  });

  const base =
    "w-full h-12 pl-12 pr-3 rounded-lg bg-white/30 text-white placeholder-white/75 border border-white/35 focus:outline-none focus:ring-2 focus:ring-white/70";

  const onSubmit = async (payload: FormData) => {
    try {
      // 1) Login (server setea cookie)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.msg || "Error al iniciar sesión");
      }

      // 2) Perfil con cookie
      const meRes = await fetch(meEndpoint, { credentials: "include", cache: "no-store" });
      const me: any = await meRes.json().catch(() => ({}));
      if (!meRes.ok || me?.ok === false || !me?.user) {
        throw new Error("No se pudo leer el perfil de usuario");
      }

      // Guarda user mínimo (si tu app lo usa)
      setUser({
        email: me.user.email,
        nombre: me.user.nombre,
        apellido: me.user.apellido,
      });

      // ---- Validación de rol permitido ----
      const tipo = String(
        me?.user?.tipo ?? me?.tipo ?? me?.user?.rol ?? me?.rol ?? ""
      ).toLowerCase();

      const okRole = allowedRoles.map(r => r.toLowerCase()).includes(tipo);
      if (!okRole) {
        throw new Error("No tienes permisos para acceder");
      }
      // -------------------------------------

      alertSuccess("Bienvenido", `${me.user?.nombre ?? ""} ${me.user?.apellido ?? ""}`.trim());
      router.push(afterLoginHref);
    } catch (e: any) {
      const msg = e?.message || "Credenciales inválidas";
      alertError("Inicio fallido", msg);
      setError("root", { message: msg });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={"grid gap-4 " + className}>
      {/* Email */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-2 bg-black/30">
          <Mail className="size-5 text-white/90" />
        </div>
        <input type="email" placeholder="Correo Electrónico" className={base} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-2 bg-black/30">
          <Lock className="size-5 text-white/90" />
        </div>
        <input type="password" placeholder="Contraseña" className={base} {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
      </div>

      {/* Error general */}
      {"root" in errors && (errors as any).root?.message && (
        <p className="text-red-400 text-sm font-semibold text-center">
          {(errors as any).root.message}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between text-sm text-white/90">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-white/90" {...register("remember")} />
          Recordarme
        </label>
        <Link href="/auth/password" className="underline hover:text-blue-200">
          Recuperar Contraseña
        </Link>
      </div>

      {/* Botón principal */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold
                   shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition disabled:opacity-60"
      >
        {isSubmitting ? "Ingresando…" : "Iniciar Sesión"}
      </button>
      <ButtonGoogle />
      {/* Registro */}
      <p className="text-center text-white/90 mt-1">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
