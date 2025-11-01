"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { alertError, alertSuccess } from "@/lib/alerts";
import Link from "next/link";
import { User, Phone, Mail, Lock } from "lucide-react";

const schema = z
  .object({
    nombre: z.string().min(3, "Ingresa tu nombre completo"),
    // Si quieres que teléfono sea opcional en el registro, deja .optional()
    telefono: z
      .string()
      .min(8, "Teléfono inválido")
      .max(15, "Teléfono inválido")
      .regex(/^[0-9()+\-\s]+$/, "Solo números y +()-")
      .optional(),
    email: z.string().email("Correo inválido"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[a-z]/, "Debe incluir minúscula")
      .regex(/[A-Z]/, "Debe incluir mayúscula")
      .regex(/[0-9]/, "Debe incluir número"),
    confirm: z.string(),
    terminos: z.boolean(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  })
  .refine((d) => d.terminos === true, {
    message: "Debes aceptar los términos",
    path: ["terminos"],
  });

type FormData = z.infer<typeof schema>;

export default function FormRegistro() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { terminos: false },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 👇 La API espera `pass`, y `telefono` puede ser null; `tipo` por defecto "usuario"
        body: JSON.stringify({
          nombre: data.nombre.trim(),
          email: data.email.trim(),
          pass: data.password,                    // <-- mapear password -> pass
          telefono: data.telefono?.trim() || null,
          tipo: "usuario",
        }),
      });

      const j = await res.json().catch(() => ({} as any));

      if (res.status !== 201 || !j?.user) {
        // La API manda { error: "..."} en 400/409/500
        const msg = j?.error || "No se pudo crear la cuenta";
        throw new Error(msg);
      }

      alertSuccess("Cuenta creada", "Ahora inicia sesión");
      reset();
      setTimeout(() => router.push("/login"), 600);
    } catch (err: any) {
      alertError("Registro fallido", err?.message || "Intenta de nuevo");
    }
  };

  const baseInput =
    "w-full rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/70 px-4 py-3 pl-11 backdrop-blur outline-none focus:ring-2 focus:ring-sky-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {/* Nombre */}
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/80" />
        <input {...register("nombre")} placeholder="Nombre Completo" className={baseInput} />
        {errors.nombre && <p className="mt-1 text-xs text-red-300">{errors.nombre.message}</p>}
      </div>

      {/* Teléfono (opcional) */}
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/80" />
        <input {...register("telefono")} placeholder="Teléfono (opcional)" className={baseInput} />
        {errors.telefono && <p className="mt-1 text-xs text-red-300">{errors.telefono.message}</p>}
      </div>

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/80" />
        <input type="email" {...register("email")} placeholder="Correo Electrónico" className={baseInput} />
        {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
      </div>

      {/* Contraseña */}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/80" />
        <input type="password" {...register("password")} placeholder="Contraseña" className={baseInput} />
        {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
      </div>

      {/* Confirmar contraseña */}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/80" />
        <input type="password" {...register("confirm")} placeholder="Confirmar Contraseña" className={baseInput} />
        {errors.confirm && <p className="mt-1 text-xs text-red-300">{errors.confirm.message}</p>}
      </div>

      {/* Términos */}
      <label className="flex items-center gap-2 text-white/90 text-sm">
        <input type="checkbox" {...register("terminos")} className="size-4 accent-sky-500" />
        <span>
          Acepto los <a className="underline" href="/terminos">Términos y Condiciones</a>
        </span>
      </label>
      {errors.terminos && <p className="mt-[-6px] text-xs text-red-300">{errors.terminos.message}</p>}

      {/* CTA */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold px-6 py-3 transition"
      >
        {isSubmitting ? "Creando..." : "Crear Cuenta"}
      </button>

      <p className="text-center text-white">
        ¿Ya tienes cuenta?{" "}
        <Link className="underline" href="/login">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
