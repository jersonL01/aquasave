import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { nombre, email, pass, telefono, tipo = 'usuario' } = await req.json();

    if (!nombre?.trim() || !email?.trim() || !pass?.trim()) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    // ¿ya existe ese email?
    const exists = await sql/*sql*/`SELECT 1 FROM usuarios WHERE email = ${email} LIMIT 1`;
    if (exists.length) {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 });
    }

    // hash de la contraseña
    const hash = await bcrypt.hash(pass, 10);

    // inserción
    const [user] = await sql/*sql*/`
      INSERT INTO usuarios (nombre, email, telefono, pass, tipo)
      VALUES (${nombre.trim()}, ${email.trim()}, ${telefono ?? null}, ${hash}, ${tipo})
      RETURNING id, nombre, email, tipo, creado_en
    `;

    return NextResponse.json({ user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error de servidor' }, { status: 500 });
  }
}
