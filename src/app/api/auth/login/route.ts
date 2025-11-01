// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    // acepta password o pass
    const emailRaw = String(body?.email ?? '').trim();
    const passwordRaw = String(body?.password ?? body?.pass ?? '').trim();

    if (!emailRaw || !passwordRaw) {
      return NextResponse.json({ ok: false, error: 'Faltan credenciales' }, { status: 400 });
    }

    // búsqueda case-insensitive
    const rows = await sql/*sql*/`
      SELECT id, nombre, email, pass, tipo, provider
      FROM usuarios
      WHERE lower(email) = lower(${emailRaw})
      LIMIT 1
    `;
    const user = Array.isArray(rows) ? rows[0] : (rows as any)?.rows?.[0];

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Credenciales inválidas' }, { status: 401 });
    }

    const hash: string = user.pass ?? '';
    const isBcrypt = /^\$2[aby]\$/.test(hash);

    // Si fue creada con Google y no tiene hash útil -> obliga a usar Google
    const googleOnly =
      (user.provider === 'google') && (hash === '' || hash === null || hash === 'oauth-google' || !isBcrypt);

    if (googleOnly) {
      return NextResponse.json(
        { ok: false, error: 'Esta cuenta inicia con Google. Usa "Continuar con Google" o define una contraseña.' },
        { status: 403 }
      );
    }

    // Validación de contraseña
    const ok = isBcrypt ? await bcrypt.compare(passwordRaw, hash) : passwordRaw === hash;
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Credenciales inválidas' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { sub: String(user.id), email: user.email, rol: user.tipo ?? 'usuario' },
      secret,
      { expiresIn: '7d' }
    );

    const res = NextResponse.json({
      ok: true,
      user: { id: String(user.id), nombre: user.nombre, email: user.email, tipo: user.tipo ?? 'usuario' },
    });

    // Cookie para tus rutas que leen aq_uid
    res.cookies.set('aq_uid', String(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Cookie JWT opcional
    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e: any) {
    console.error('[/api/auth/login] error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Error servidor' }, { status: 500 });
  }
}
