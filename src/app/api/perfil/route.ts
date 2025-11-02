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

type AuthCtx =
  | { ok: true; via: 'cookie-token' | 'cookie-id' | 'nextauth'; id: number | null; email: string | null }
  | { ok: false };

async function getAuthContext(): Promise<AuthCtx> {
  const jar: any = await (cookies() as any);
  const jwtSecret = process.env.JWT_SECRET;

  // 1) JWT propio (token) — PRIORIDAD
  try {
    const tok: string | undefined = jar?.get?.('token')?.value;
    if (tok && jwtSecret) {
      const payload = jwt.verify(tok, jwtSecret) as any; // { sub?, id?, email? }
      const rawId = payload?.id ?? payload?.sub ?? null;
      const id = rawId != null ? Number(rawId) : null;
      return { ok: true, via: 'cookie-token', id: Number.isFinite(id) ? id : null, email: payload?.email ?? null };
    }
  } catch { /* ignore */ }

  // 2) Cookie id “aq_uid” (login manual)
  const rawUid = jar?.get?.('aq_uid')?.value;
  if (rawUid && /^\d+$/.test(String(rawUid))) {
    return { ok: true, via: 'cookie-id', id: Number(rawUid), email: null };
  }

  // 3) NextAuth (Google)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const id = (session.user as any)?.id ?? null;
    const email = session.user.email ?? null;
    return { ok: true, via: 'nextauth', id: id != null ? Number(id) : null, email };
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
    return rows?.[0] ?? null;
  }
  if (where.email) {
    const rows = await sql/* sql */`
      SELECT id, nombre AS nombres, telefono, email, tipo
      FROM usuarios
      WHERE lower(email) = lower(${where.email})
      LIMIT 1
    `;
    return rows?.[0] ?? null;
  }
  return null;
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.ok) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const user = await findUser({ id: auth.id, email: auth.email });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      nombres: user.nombres ?? '',
      telefono: user.telefono ?? null,
      email: user.email ?? '',
      tipo: user.tipo ?? 'usuario',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth.ok) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const nombres = String(body?.nombres ?? '').trim();
    const telRaw = String(body?.telefono ?? '').trim();
    const telefono = telRaw === '' ? null : Number.isNaN(Number(telRaw)) ? null : Number.parseInt(telRaw, 10);

    let updated: any | null = null;

    if (auth.id != null) {
      const rows = await sql/* sql */`
        UPDATE usuarios
        SET nombre = ${nombres}, telefono = ${telefono}
        WHERE id = ${auth.id}
        RETURNING id, nombre AS nombres, telefono, email, tipo
      `;
      updated = rows?.[0] ?? null;
    } else if (auth.email) {
      const rows = await sql/* sql */`
        UPDATE usuarios
        SET nombre = ${nombres}, telefono = ${telefono}
        WHERE lower(email) = lower(${auth.email})
        RETURNING id, nombre AS nombres, telefono, email, tipo
      `;
      updated = rows?.[0] ?? null;
    } else {
      return NextResponse.json({ error: 'No se pudo identificar al usuario' }, { status: 400 });
    }

    if (!updated) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({
      id: updated.id,
      nombres: updated.nombres ?? '',
      telefono: updated.telefono ?? null,
      email: updated.email ?? '',
      tipo: updated.tipo ?? 'usuario',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
