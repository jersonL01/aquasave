import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (r: any) => (Array.isArray(r) ? r : r?.rows ?? []);

/* -------------------- Auth helper (JWT -> aq_uid -> NextAuth) -------------------- */
async function getAuthUser() {
  const jar: any = await (cookies() as any);
  const jwtSecret = process.env.JWT_SECRET;

  // 1) token (JWT propio)
  try {
    const tok: string | undefined = jar?.get?.("token")?.value;
    if (tok && jwtSecret) {
      const payload = jwt.verify(tok, jwtSecret) as any; // { sub?, id?, email? }
      const id =
        payload?.id != null ? Number(payload.id)
        : payload?.sub != null ? Number(payload.sub)
        : null;
      if (Number.isFinite(id)) return { id, email: payload?.email ?? null };
    }
  } catch { /* ignore */ }

  // 2) aq_uid (login manual)
  const rawUid = jar?.get?.("aq_uid")?.value as string | undefined;
  if (rawUid && /^\d+$/.test(rawUid)) {
    return { id: Number(rawUid), email: null };
  }

  // 3) NextAuth (Google)
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (email) {
    const r = await sql/*sql*/`
      SELECT id FROM public.usuarios WHERE lower(email) = lower(${email}) LIMIT 1
    `;
    const row = norm(r)[0];
    if (row?.id) return { id: Number(row.id), email };
  }

  return null;
}

/* ------------------------------------ GET ------------------------------------ */
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });
    }

    const r = await sql/*sql*/`
      SELECT
        id,
        nombre,
        tipo,
        marca,
        cantidad,
        descripcion,
        creado_en,
        actualizado_en,
        encendido           -- 👈 IMPORTANTE
      FROM public.dispositivos
      WHERE usuario_id = ${auth.id}
      ORDER BY creado_en DESC
      LIMIT 200
    `;
    return NextResponse.json({ ok: true, items: norm(r) });
  } catch (e: any) {
    console.error("[/api/dispositivos GET]", e);
    return NextResponse.json({ ok: false, error: "Error servidor" }, { status: 500 });
  }
}

/* ------------------------------------ POST ----------------------------------- */
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const id          = String(body?.id ?? "").trim();
    const nombre      = String(body?.nombre ?? "").trim();
    const tipo        = String(body?.tipo ?? "").trim();
    const marca       = String(body?.marca ?? "").trim();
    const descripcion = body?.descripcion != null ? String(body.descripcion).trim() : "";

    const cantidadNum = Number.parseInt(String(body?.cantidad ?? ""), 10);
    const cantidad    = Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : NaN;

    if (!id || !nombre || !tipo || !marca || !Number.isFinite(cantidad)) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios o cantidad inválida" }, { status: 400 });
    }

    const exists = await sql/*sql*/`SELECT 1 FROM public.dispositivos WHERE id = ${id} LIMIT 1`;
    if (norm(exists).length) {
      return NextResponse.json({ ok: false, error: `El dispositivo ${id} ya existe` }, { status: 409 });
    }

    const r = await sql/*sql*/`
      INSERT INTO public.dispositivos (id, nombre, tipo, marca, cantidad, descripcion, usuario_id)
      VALUES (${id}, ${nombre}, ${tipo}, ${marca}, ${cantidad}, ${descripcion || null}, ${auth.id})
      RETURNING id, nombre, tipo, marca, cantidad, descripcion, creado_en, encendido
    `;
    const [item] = norm(r);
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    console.error("[/api/dispositivos POST]", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Error servidor" }, { status: 500 });
  }
}
