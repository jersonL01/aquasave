// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRow = Record<string, any>;
const norm = (r: any) => (Array.isArray(r) ? r : r?.rows ?? []);

async function getCookieValue(name: string) {
  const store: any = await (cookies() as any);
  return store?.get?.(name)?.value as string | undefined;
}

export async function GET() {
  try {
    const raw = await getCookieValue("aq_uid");
    if (!raw || raw === "undefined" || raw === "null" || raw.trim() === "") {
      return NextResponse.json({ ok: false, msg: "Sin sesión" }, { status: 401 });
    }
    const uid = /^\d+$/.test(raw) ? Number(raw) : raw;

    let row: AnyRow | undefined;

    // Preferimos 'usuarios' (tu login/registro)
    try {
      const r1 = await sql/*sql*/`
        SELECT id, email, nombre,
               NULL::text AS apellido,
               telefono::text AS telefono,   -- <<<<<< aquí estaba el bug
               tipo
        FROM usuarios
        WHERE id = ${uid}
        LIMIT 1
      `;
      row = norm(r1)[0];
    } catch {}

    // Fallback: 'users' si existiera
    if (!row) {
      const r2 = await sql/*sql*/`
        SELECT id, email, nombre, apellido,
               telefono::text AS telefono,
               NULL::text AS tipo
        FROM users
        WHERE id = ${uid}
        LIMIT 1
      `;
      row = norm(r2)[0];
    }

    if (!row) {
      return NextResponse.json({ ok: false, msg: "Usuario no encontrado" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: row.id,
        email: row.email ?? null,
        nombre: row.nombre ?? null,
        apellido: row.apellido ?? null,
        telefono: row.telefono ?? null, // string para el input
        tipo: row.tipo ?? null,
      },
    });
  } catch (e) {
    console.error("[/api/me GET] error:", e);
    return NextResponse.json({ ok: false, msg: "Error servidor" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const raw = await getCookieValue("aq_uid");
    if (!raw || raw === "undefined" || raw === "null" || raw.trim() === "") {
      return NextResponse.json({ ok: false, msg: "Sin sesión" }, { status: 401 });
    }
    const uid = /^\d+$/.test(raw) ? Number(raw) : raw;

    const body = await req.json().catch(() => ({}));
    const nombre = String(body?.nombre ?? "").trim();
    const apellido = body?.apellido != null ? String(body.apellido).trim() : null;
    const telStr = body?.telefono != null ? String(body.telefono).trim() : null;

    if (!nombre) {
      return NextResponse.json({ ok: false, msg: "El nombre es obligatorio" }, { status: 400 });
    }

    // Normaliza teléfono: INTEGER o NULL para 'usuarios'
    const telefono =
      telStr && /^\d+$/.test(telStr) ? Number(telStr) : null;

    // 1) Intenta 'users' si existe
    let touched = false;
    try {
      await sql/*sql*/`
        UPDATE users
           SET nombre = ${nombre},
               apellido = ${apellido},
               telefono = ${telStr}         -- en 'users' puede ser TEXT
         WHERE id = ${uid}
      `;
      touched = true;
    } catch {}

    // 2) Actualiza también 'usuarios' (o si no existe 'users', al menos aquí)
    try {
      await sql/*sql*/`
        UPDATE usuarios
           SET nombre   = ${nombre},
               telefono = ${telefono}       -- INTEGER o NULL
         WHERE id = ${uid}
      `;
      touched = true;
    } catch {}

    if (!touched) {
      return NextResponse.json({ ok: false, msg: "No se pudo actualizar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/me PATCH] error:", e);
    return NextResponse.json({ ok: false, msg: "Error servidor" }, { status: 500 });
  }
}
