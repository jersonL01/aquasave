// src/components/FormLogin.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import ButtonGoogle from "./ButtonGoogle";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type FormData = z.infer<typeof schema>;

type Props = {
  afterLoginHref?: string;
  allowedRoles?: string[]; // por si más adelante quieres filtrar
  className?: string;
};

export default function FormLogin({
  afterLoginHref = "/principal",
  allowedRoles = ["usuario", "administrador"],
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
  });

  const base =
    "w-full h-12 pl-12 pr-3 rounded-lg bg-white/30 text-white placeholder-white/75 border border-white/35 focus:outline-none focus:ring-2 focus:ring-white/70";

  const onSubmit = async (values: FormData) => {
    // login via next-auth credentials
    const res = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (res?.error) {
      setError("root", { message: res.error });
      return;
    }

    // opcional: puedes pedir /api/me si quieres comprobar rol:
    // const meRes = await fetch("/api/me", { cache: "no-store" });
    // const me = await meRes.json().catch(() => ({}));
    // ...

    router.push(afterLoginHref);
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold
                   shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition disabled:opacity-60"
      >
        {isSubmitting ? "Ingresando…" : "Iniciar Sesión"}
      </button>

      {/* login con Google (sí usa next-auth) */}
      <ButtonGoogle />

      <p className="text-center text-white/90 mt-1">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
