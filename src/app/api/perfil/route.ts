// src/app/api/perfil/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

/* ------------------------ helpers ------------------------ */
type AuthCtx =
  | { ok: true; via: 'nextauth' | 'cookie'; id: number | null; email: string | null }
  | { ok: false };

async function getAuthContext(): Promise<AuthCtx> {
  // 1) NextAuth (Google)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      ok: true,
      via: 'nextauth',
      id: (session.user as any)?.id ?? null,
      email: session.user.email ?? null,
    };
  }

  // 2) JWT propio en cookie "token"
  const JWT_SECRET = process.env.JWT_SECRET;
  try {
    // 👇 cookies() debe ser await en Next 14 (Dynamic APIs)
    const jar: any = await (cookies() as any);
    const raw: string | undefined = jar?.get?.('token')?.value;

    if (raw && JWT_SECRET) {
      const payload = jwt.verify(raw, JWT_SECRET) as any; // { id, email, tipo? }
      return {
        ok: true,
        via: 'cookie',
        id: payload?.id ?? null,
        email: payload?.email ?? null,
      };
    }
  } catch {
    // ignora y caerá a no autenticado
  }

  return { ok: false };
}

async function findUser(where: { id?: number | null; email?: string | null }) {
  if (where.id != null) {
    const rows = await sql/* sql */`
      SELECT id, nombre AS nombres, telefono, email, tipo
      FROM usuarios
      WHERE id = ${where.id}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
  if (where.email) {
    const rows = await sql/* sql */`
      SELECT id, nombre AS nombres, telefono, email, tipo
      FROM usuarios
      WHERE email = ${where.email}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
  return null;
}

/* ------------------------ GET /api/perfil ------------------------ */
export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.ok) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await findUser({ id: auth.id, email: auth.email });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      nombres: user.nombres ?? '',
      telefono: user.telefono ?? '',
      email: user.email ?? '',
      tipo: user.tipo ?? 'usuario',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

/* ------------------------ PUT /api/perfil ------------------------ */
export async function PUT(req: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth.ok) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nombres = String(body?.nombres ?? '').trim();

    // normaliza teléfono: si viene vacío => NULL, si viene texto con números => parseInt
    const telRaw = String(body?.telefono ?? '').trim();
    const telefono =
      telRaw === '' ? null : Number.isNaN(Number(telRaw)) ? null : Number.parseInt(telRaw, 10);

    // sólo permitimos actualizar nombre/telefono
    let updated: any | null = null;

    if (auth.id != null) {
      const rows = await sql/* sql */`
        UPDATE usuarios
        SET nombre = ${nombres}, telefono = ${telefono}
        WHERE id = ${auth.id}
        RETURNING id, nombre AS nombres, telefono, email, tipo
      `;
      updated = rows[0] ?? null;
    } else if (auth.email) {
      const rows = await sql/* sql */`
        UPDATE usuarios
        SET nombre = ${nombres}, telefono = ${telefono}
        WHERE email = ${auth.email}
        RETURNING id, nombre AS nombres, telefono, email, tipo
      `;
      updated = rows[0] ?? null;
    } else {
      return NextResponse.json({ error: 'No se pudo identificar al usuario' }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      nombres: updated.nombres ?? '',
      telefono: updated.telefono ?? '',
      email: updated.email ?? '',
      tipo: updated.tipo ?? 'usuario',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
