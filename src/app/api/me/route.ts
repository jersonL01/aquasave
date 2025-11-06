// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRow = Record<string, any>;
const norm = (r: any) => (Array.isArray(r) ? r : r?.rows ?? []);

/** lee la cookie de tu login “manual” */
async function getCookieValue(name: string) {
  const store: any = await (cookies() as any);
  return store?.get?.(name)?.value as string | undefined;
}

/** obtiene un id de usuario desde sesión NextAuth o desde tu cookie */
async function resolveUserId(): Promise<number | null> {
  // 1) intentar NextAuth
  const session = await getServerSession(authOptions);
  const sessionId =
    (session?.user as any)?.id ??
    (session?.user as any)?.userId ??
    null;

  if (sessionId && !Number.isNaN(Number(sessionId))) {
    return Number(sessionId);
  }

  // 2) si no hay sesión, intentar cookie de tu login
  const raw = await getCookieValue("aq_uid");
  if (raw && raw.trim() !== "" && raw !== "undefined" && raw !== "null") {
    if (/^\d+$/.test(raw)) return Number(raw);
    // si no es numérico, igual lo podrías usar como string-id,
    // pero tu tabla usa serial, así que devolvemos null
  }

  return null;
}

/* =========================================================
   GET /api/me
   ========================================================= */
export async function GET() {
  try {
    const uid = await resolveUserId();

    // si no encontramos usuario por ningún método, devolvemos 200 con user:null
    // (para que el navbar no muestre 401 todo el rato)
    if (!uid) {
      return NextResponse.json({ ok: true, user: null });
    }

    let row: AnyRow | undefined;

    // 1) tabla principal: usuarios
    try {
      const r1 = await sql/*sql*/`
        SELECT
          id,
          email,
          nombre,
          NULL::text AS apellido,
          telefono::text AS telefono,
          tipo
        FROM public.usuarios
        WHERE id = ${uid}
        LIMIT 1
      `;
      row = norm(r1)[0];
    } catch {
      // ignore
    }

    // 2) fallback a "users" solo si no encontró en "usuarios"
    if (!row) {
      const r2 = await sql/*sql*/`
        SELECT
          id,
          email,
          nombre,
          apellido,
          telefono::text AS telefono,
          NULL::text AS tipo
        FROM public.users
        WHERE id = ${uid}
        LIMIT 1
      `;
      row = norm(r2)[0];
    }

    if (!row) {
      // el id existe en sesión/cookie pero no está en DB
      return NextResponse.json({ ok: true, user: null });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: row.id,
        email: row.email ?? null,
        nombre: row.nombre ?? null,
        apellido: row.apellido ?? null,
        telefono: row.telefono ?? null,
        tipo: row.tipo ?? "usuario",
      },
    });
  } catch (e) {
    console.error("[/api/me GET] error:", e);
    return NextResponse.json({ ok: false, msg: "Error servidor" }, { status: 500 });
  }
}

/* =========================================================
   PATCH /api/me
   ========================================================= */
export async function PATCH(req: Request) {
  try {
    const uid = await resolveUserId();
    if (!uid) {
      return NextResponse.json({ ok: false, msg: "Sin sesión" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nombre = String(body?.nombre ?? "").trim();
    const apellido =
      body?.apellido != null ? String(body.apellido).trim() : null;
    const telStr =
      body?.telefono != null ? String(body.telefono).trim() : null;

    if (!nombre) {
      return NextResponse.json({ ok: false, msg: "El nombre es obligatorio" }, { status: 400 });
    }

    // en tu tabla usuarios el teléfono es integer
    const telefono = telStr && /^\d+$/.test(telStr) ? Number(telStr) : null;

    let touched = false;

    // 1) si tienes tabla "users", la actualizamos también (texto)
    try {
      await sql/*sql*/`
        UPDATE public.users
           SET nombre   = ${nombre},
               apellido = ${apellido},
               telefono = ${telStr}
         WHERE id = ${uid}
      `;
      touched = true;
    } catch {
      // puede no existir
    }

    // 2) actualizamos tabla "usuarios" (la que sí existe)
    try {
      await sql/*sql*/`
        UPDATE public.usuarios
           SET nombre   = ${nombre},
               telefono = ${telefono}
         WHERE id = ${uid}
      `;
      touched = true;
    } catch {
      // si falla aquí ya no hay dónde guardar
    }

    if (!touched) {
      return NextResponse.json({ ok: false, msg: "No se pudo actualizar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/me PATCH] error:", e);
    return NextResponse.json({ ok: false, msg: "Error servidor" }, { status: 500 });
  }
}
