import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (r: any) => (Array.isArray(r) ? r : r?.rows ?? []);

/* --------- Auth helper (idéntico al de la lista) --------- */
async function getAuthUser() {
  const jar: any = await (cookies() as any);
  const jwtSecret = process.env.JWT_SECRET;

  try {
    const tok: string | undefined = jar?.get?.("token")?.value;
    if (tok && jwtSecret) {
      const payload = jwt.verify(tok, jwtSecret) as any;
      const id =
        payload?.id != null ? Number(payload.id)
        : payload?.sub != null ? Number(payload.sub)
        : null;
      if (Number.isFinite(id)) return { id, email: payload?.email ?? null };
    }
  } catch {}

  const rawUid = jar?.get?.("aq_uid")?.value as string | undefined;
  if (rawUid && /^\d+$/.test(rawUid)) {
    return { id: Number(rawUid), email: null };
  }

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

/* ----------------------------- GET /:id ----------------------------- */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth?.id) return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });

    const rid = decodeURIComponent(params.id);
    const r = await sql/*sql*/`
      SELECT id, nombre, tipo, marca, cantidad, descripcion,
             creado_en, actualizado_en,
             encendido, litros::float8 AS litros, last_tick_at
      FROM public.dispositivos
      WHERE id = ${rid} AND usuario_id = ${auth.id}
      LIMIT 1
    `;
    const [item] = norm(r);
    if (!item) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("GET /dispositivos/:id error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Error servidor" }, { status: 500 });
  }
}

/* ---------------------------- PATCH /:id ---------------------------- */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth?.id) return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });

    const rid = decodeURIComponent(params.id);
    const body = await req.json().catch(() => ({}));

    const pEncendido = Object.prototype.hasOwnProperty.call(body, "encendido");
    const pNombre    = Object.prototype.hasOwnProperty.call(body, "nombre");
    const pTipo      = Object.prototype.hasOwnProperty.call(body, "tipo");
    const pMarca     = Object.prototype.hasOwnProperty.call(body, "marca");
    const pCantidad  = Object.prototype.hasOwnProperty.call(body, "cantidad");
    const pDesc      = Object.prototype.hasOwnProperty.call(body, "descripcion");
    const pLitros    = Object.prototype.hasOwnProperty.call(body, "litros");

    if (!pEncendido && !pNombre && !pTipo && !pMarca && !pCantidad && !pDesc && !pLitros) {
      return NextResponse.json({ ok: false, error: "Sin cambios" }, { status: 400 });
    }

    if (pEncendido && !pNombre && !pTipo && !pMarca && !pCantidad && !pDesc && !pLitros && typeof body.encendido === "boolean") {
      const r = await sql/*sql*/`
        UPDATE public.dispositivos
        SET encendido = ${body.encendido},
            last_tick_at = CASE WHEN ${body.encendido} THEN now() ELSE last_tick_at END,
            actualizado_en = now()
        WHERE id = ${rid} AND usuario_id = ${auth.id}
        RETURNING id, encendido, litros::float8 AS litros, last_tick_at
      `;
      const [item] = norm(r);
      if (!item) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
      return NextResponse.json({ ok: true, item });
    }

    const enc = !!body.encendido;

    const nombre = String(body?.nombre ?? "").trim();
    if (pNombre && !nombre) return NextResponse.json({ ok: false, error: "nombre inválido" }, { status: 400 });

    const tipo = String(body?.tipo ?? "").trim();
    if (pTipo && !tipo) return NextResponse.json({ ok: false, error: "tipo inválido" }, { status: 400 });

    const marca = String(body?.marca ?? "").trim();
    if (pMarca && !marca) return NextResponse.json({ ok: false, error: "marca inválida" }, { status: 400 });

    const cant = Number.parseInt(String(body?.cantidad ?? ""), 10);
    if (pCantidad && (!Number.isFinite(cant) || cant <= 0)) {
      return NextResponse.json({ ok: false, error: "cantidad inválida" }, { status: 400 });
    }

    const desc =
      body?.descripcion !== undefined
        ? body.descripcion === null
          ? null
          : String(body.descripcion).trim()
        : null;

    const litrosNum = Number(body?.litros);
    if (pLitros && (!Number.isFinite(litrosNum) || litrosNum < 0)) {
      return NextResponse.json({ ok: false, error: "litros inválido" }, { status: 400 });
    }

    const r = await sql/*sql*/`
      UPDATE public.dispositivos
      SET
        nombre       = CASE WHEN ${pNombre}    THEN ${nombre}             ELSE nombre       END,
        tipo         = CASE WHEN ${pTipo}      THEN ${tipo}               ELSE tipo         END,
        marca        = CASE WHEN ${pMarca}     THEN ${marca}              ELSE marca        END,
        cantidad     = CASE WHEN ${pCantidad}  THEN ${cant}               ELSE cantidad     END,
        descripcion  = CASE WHEN ${pDesc}      THEN ${desc}               ELSE descripcion  END,
        litros       = CASE WHEN ${pLitros}    THEN ${litrosNum}::numeric ELSE litros       END,
        encendido    = CASE WHEN ${pEncendido} THEN ${enc}                ELSE encendido    END,
        last_tick_at = CASE WHEN ${pEncendido} AND ${enc} THEN now() ELSE last_tick_at END,
        actualizado_en = now()
      WHERE id = ${rid} AND usuario_id = ${auth.id}
      RETURNING id, nombre, tipo, marca, cantidad, descripcion,
                actualizado_en, encendido, litros::float8 AS litros, last_tick_at
    `;
    const [item] = norm(r);
    if (!item) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("PATCH /dispositivos/:id error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Error servidor" }, { status: 500 });
  }
}

/* --------------------------- DELETE /:id --------------------------- */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth?.id) return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });

    const rid = decodeURIComponent(params.id);
    const r = await sql/*sql*/`
      DELETE FROM public.dispositivos
      WHERE id = ${rid} AND usuario_id = ${auth.id}
      RETURNING id
    `;
    const [row] = norm(r);
    if (!row) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /dispositivos/:id error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Error servidor" }, { status: 500 });
  }
}
