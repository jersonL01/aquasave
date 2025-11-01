// src/app/api/consumo/por-dispositivo/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const norm = (r: any) => (Array.isArray(r) ? r : r?.rows ?? []);

async function getUid() {
  const store: any = await (cookies() as any);
  const raw = store?.get?.('aq_uid')?.value as string | undefined;
  if (!raw) return null;
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

function parseRange(searchParams: URLSearchParams) {
  const toStr = searchParams.get('to') || new Date().toISOString();
  const to = new Date(toStr);
  const fromStr = searchParams.get('from') || new Date(to.getTime() - 24 * 3600 * 1000).toISOString();
  const from = new Date(fromStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
    const now = new Date();
    return { from: new Date(now.getTime() - 24 * 3600 * 1000), to: now };
  }
  return { from, to };
}

export async function GET(req: Request) {
  try {
    const uid = await getUid();
    if (uid == null) return NextResponse.json({ ok: false, error: 'Sin sesión' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const { from, to } = parseRange(searchParams);

    // Totales por dispositivo
    const totals = await sql/*sql*/`
      SELECT d.id AS dispositivo_id,
             d.nombre,
             COALESCE(SUM(c.cantidad_litros), 0)::float8 AS litros_total,
             MIN(c.fecha) AS desde,
             MAX(c.fecha) AS hasta
      FROM public.dispositivos d
      LEFT JOIN public.consumo_agua c
             ON c.dispositivo_id = d.id
            AND c.fecha >= ${from.toISOString()}::timestamptz
            AND c.fecha <  ${to.toISOString()}::timestamptz
      WHERE d.usuario_id = ${uid}
      GROUP BY d.id, d.nombre
      ORDER BY d.nombre
    `;

    // Serie por hora por dispositivo
    const series = await sql/*sql*/`
      SELECT c.dispositivo_id,
             date_trunc('hour', c.fecha) AS hora,
             SUM(c.cantidad_litros)::float8 AS litros
      FROM public.consumo_agua c
      JOIN public.dispositivos d ON d.id = c.dispositivo_id
      WHERE d.usuario_id = ${uid}
        AND c.fecha >= ${from.toISOString()}::timestamptz
        AND c.fecha <  ${to.toISOString()}::timestamptz
      GROUP BY c.dispositivo_id, hora
      ORDER BY c.dispositivo_id, hora
    `;

    const totalsArr = norm(totals);
    const seriesArr = norm(series);

    const serieMap = new Map<string, { ts: string; litros: number }[]>();
    for (const r of seriesArr) {
      const key = String(r.dispositivo_id);
      const arr = serieMap.get(key) || [];
      arr.push({ ts: new Date(r.hora).toISOString(), litros: Number(r.litros) || 0 });
      serieMap.set(key, arr);
    }

    const items = totalsArr.map((t: any) => ({
      dispositivo_id: String(t.dispositivo_id),
      nombre: String(t.nombre),
      litros_total: Number(t.litros_total) || 0,
      desde: t.desde ? new Date(t.desde).toISOString() : undefined,
      hasta: t.hasta ? new Date(t.hasta).toISOString() : undefined,
      serie: serieMap.get(String(t.dispositivo_id)) || [],
    }));

    const estados = await sql/*sql*/`
      SELECT encendido FROM public.dispositivos WHERE usuario_id = ${uid}
    `;
    const activos = norm(estados).filter((e: any) => !!e.encendido).length;

    return NextResponse.json({
      ok: true,
      from: from.toISOString(),
      to: to.toISOString(),
      items,
      resumen: {
        dispositivos: items.length,
        litros_total: items.reduce((acc: number, it: any) => acc + (it.litros_total || 0), 0),
        activos,
      },
    });
  } catch (e: any) {
    console.error('GET /api/consumo/por-dispositivo error:', e);
    return NextResponse.json({ ok: false, error: e?.message ?? 'Error servidor' }, { status: 500 });
  }
}
