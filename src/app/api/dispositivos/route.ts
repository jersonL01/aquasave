import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (r: any) => (Array.isArray(r) ? r : r?.rows ?? []);

async function getCookie(name: string) {
  const store: any = await (cookies() as any);
  return store?.get?.(name)?.value as string | undefined;
}

// LISTAR mis dispositivos
export async function GET() {
  try {
    const raw = await getCookie("aq_uid");
    if (!raw) return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });
    const uid = /^\d+$/.test(raw) ? Number(raw) : raw;

    const r = await sql/*sql*/`
      SELECT id, nombre, tipo, marca, cantidad, descripcion, creado_en, actualizado_en
      FROM dispositivos
      WHERE usuario_id = ${uid}
      ORDER BY creado_en DESC
      LIMIT 200
    `;
    return NextResponse.json({ ok: true, items: norm(r) });
  } catch (e: any) {
    console.error("[/api/dispositivos GET]", e);
    return NextResponse.json({ ok: false, error: "Error servidor" }, { status: 500 });
  }
}

// CREAR dispositivo
export async function POST(req: Request) {
  try {
    const raw = await getCookie("aq_uid");
    if (!raw) return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });
    const uid = /^\d+$/.test(raw) ? Number(raw) : raw;

    const body = await req.json().catch(() => ({}));

    const id          = String(body?.id ?? "").trim();
    const nombre      = String(body?.nombre ?? "").trim();
    const tipo        = String(body?.tipo ?? "").trim();
    const marca       = String(body?.marca ?? "").trim();
    const descripcion = body?.descripcion != null ? String(body.descripcion).trim() : "";

    // cantidad debe ser entero positivo
    const cantidadRaw = body?.cantidad;
    const cantidadNum = Number.parseInt(String(cantidadRaw ?? ""), 10);
    const cantidad    = Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : NaN;

    if (!id || !nombre || !tipo || !marca || !Number.isFinite(cantidad)) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios o cantidad inválida" }, { status: 400 });
    }

    const exists = await sql/*sql*/`SELECT 1 FROM dispositivos WHERE id = ${id} LIMIT 1`;
    if (norm(exists).length) {
      return NextResponse.json({ ok: false, error: `El dispositivo ${id} ya existe` }, { status: 409 });
    }

    const r = await sql/*sql*/`
      INSERT INTO dispositivos (id, nombre, tipo, marca, cantidad, descripcion, usuario_id)
      VALUES (${id}, ${nombre}, ${tipo}, ${marca}, ${cantidad}, ${descripcion || null}, ${uid})
      RETURNING id, nombre, tipo, marca, cantidad, descripcion, creado_en
    `;
    const [item] = norm(r);
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    console.error("[/api/dispositivos POST]", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Error servidor" }, { status: 500 });
  }
}
