// src/app/perfil/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { alertError, alertSuccess } from "@/lib/alerts";
import { User, Mail, Phone, Edit3, Save, Shield, X, IdCard } from "lucide-react";

type PerfilApi = {
  id: number;
  nombres: string;            // <- viene así desde /api/perfil
  telefono: number | null;
  email: string;
  tipo?: string | null;
};

type PerfilUser = {
  id: number;
  email: string;
  nombre: string;
  telefono: number | null;
  tipo?: string | null;
  provider?: string | null;   // opcional (puede venir undefined si no lo expones)
  creado_en?: string | null;  // opcional
};

function getErrMsg(e: unknown, fallback = "Inténtalo nuevamente") {
  return e instanceof Error ? e.message : fallback;
}

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);

  const [u, setU] = useState<PerfilUser | null>(null);
  const originalRef = useRef<PerfilUser | null>(null);

  // Sanitizador numérico para teléfono (solo dígitos, máx 15)
  const sanitizePhoneInput = (s: string) => s.replace(/[^\d]/g, "").slice(0, 15);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Esta ruta soporta NextAuth (Google) y JWT propio según tu backend
        const r = await fetch("/api/perfil", { cache: "no-store", credentials: "same-origin" });
        if (!r.ok) throw new Error(r.status === 401 ? "No autenticado" : "No pudimos cargar tu perfil");

        const data = (await r.json()) as PerfilApi;
        const mapped: PerfilUser = {
          id: data.id,
          email: data.email,
          nombre: data.nombres ?? "",
          telefono: data.telefono ?? null,
          tipo: data.tipo ?? "usuario",
          // provider/creado_en: sólo si los agregas a la respuesta del backend
          provider: undefined,
          creado_en: undefined,
        };

        if (!alive) return;
        setU(mapped);
        originalRef.current = mapped;
      } catch (e) {
        if (alive) alertError("Ups", getErrMsg(e, "No pudimos cargar tu perfil"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const initial = useMemo(() => (u?.nombre?.[0] ?? "U").toUpperCase(), [u?.nombre]);

  const onCancel = () => {
    if (!originalRef.current) return;
    setU(originalRef.current);
    setEdit(false);
  };

  const onSave = async () => {
    if (!u) return;

    const nombre = (u.nombre ?? "").trim();
    const telefonoStr = u.telefono != null ? String(u.telefono) : "";
    const telefonoDigits = sanitizePhoneInput(telefonoStr);
    const telefonoNum = telefonoDigits ? Number(telefonoDigits) : null;

    if (!nombre) {
      alertError("Datos incompletos", "El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      // Tu backend /api/perfil (PUT) actualiza nombre/telefono (campos: nombres, telefono)
      const r = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nombres: nombre, telefono: telefonoNum }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudo guardar");
      }

      const updated: PerfilUser = { ...u, nombre, telefono: telefonoNum };
      originalRef.current = updated;
      setU(updated);
      setEdit(false);
      alertSuccess("Perfil actualizado");
    } catch (e) {
      alertError("Error al guardar", getErrMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl bg-white/10 backdrop-blur p-8 border border-white/15">
        <p className="text-white/80">Cargando perfil…</p>
      </section>
    );
  }

  if (!u) {
    return (
      <section className="rounded-2xl bg-white/10 backdrop-blur p-8 border border-white/15">
        <p className="text-red-200">No pudimos obtener tu perfil.</p>
      </section>
    );
  }

  const creadoFmt = u.creado_en ? new Date(u.creado_en).toLocaleString("es-ES") : null;

  return (
    <section className="rounded-3xl bg-white/10 backdrop-blur-lg border border-white/15 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="grid place-items-center size-14 rounded-full bg-sky-500/80 text-white text-lg font-bold shadow">
            {initial}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Mi Perfil</h1>
            <p className="text-white/70 text-sm flex items-center gap-2">
              <Shield className="size-4" />
              Datos de tu cuenta
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {!edit ? (
            <button
              onClick={() => setEdit(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 px-4 py-2 text-sm border border-white/20 transition"
            >
              <Edit3 className="size-4" />
              Editar Perfil
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-sm border border-white/20 transition disabled:opacity-60"
              >
                <X className="size-4" />
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium shadow disabled:opacity-60"
              >
                {saving ? (
                  <span className="inline-block size-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Guardar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 sm:px-8 py-8">
        {/* Avatar */}
        <div className="flex md:block items-center justify-center">
          <div className="relative w-48 aspect-square rounded-2xl overflow-hidden border border-white/15 shadow-inner bg-white/5">
            <Image
              src="/perfil.png"
              alt="Avatar AquaSave"
              fill
              sizes="192px"
              className="object-contain p-6"
              priority
            />
          </div>
        </div>

        {/* Formulario */}
        <div className="md:col-span-2 grid gap-6">
          {/* Nombre */}
          <div>
            <label className="text-sm text-white/80 block mb-2">Nombre</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/70" />
              <input
                value={u.nombre ?? ""}
                onChange={(e) => edit && setU({ ...u, nombre: e.target.value })}
                disabled={!edit || saving}
                className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 px-10 py-3 outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-70"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-sm text-white/80 block mb-2">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/70" />
              <input
                inputMode="numeric"
                value={u.telefono != null ? String(u.telefono) : ""}
                onChange={(e) => {
                  if (!edit) return;
                  const digits = sanitizePhoneInput(e.target.value);
                  setU({ ...u, telefono: digits ? Number(digits) : null });
                }}
                disabled={!edit || saving}
                className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 px-10 py-3 outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-70"
              />
            </div>
          </div>

          {/* Email (solo lectura) */}
          <div>
            <label className="text-sm text-white/80 block mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/70" />
              <input
                value={u.email}
                disabled
                className="w-full rounded-xl border border-white/20 bg-white/10 text-white px-10 py-3 outline-none disabled:opacity-70"
              />
            </div>
            <p className="text-xs text-white/60 mt-1">El correo no se puede editar.</p>
          </div>

          {/* Info opcional */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {u.tipo && (
              <div className="text-white/80 text-sm">
                <span className="block text-white/60">Rol</span>
                <div className="mt-1 inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2">
                  <IdCard className="size-4" />
                  {u.tipo}
                </div>
              </div>
            )}
            {u.provider && (
              <div className="text-white/80 text-sm">
                <span className="block text-white/60">Proveedor</span>
                <div className="mt-1 rounded-md border border-white/20 px-3 py-2">
                  {u.provider}
                </div>
              </div>
            )}
            {u.creado_en && (
              <div className="text-white/80 text-sm">
                <span className="block text-white/60">Creado</span>
                <div className="mt-1 rounded-md border border-white/20 px-3 py-2">
                  {new Date(u.creado_en).toLocaleString("es-ES")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
