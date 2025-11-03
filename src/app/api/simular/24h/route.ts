// src/app/api/simular/24h/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const f3 = (n: number) => Math.round(n * 1000) / 1000;

type Body = {
  deviceId?: string;
  start?: string;
  end?: string;
  stepSec?: number;
  ruido?: number;
  nightFactor?: number;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const {
      deviceId,
      start,
      end,
      stepSec = 60,
      ruido = 0.1,
      nightFactor = 0.6,
    } = (await req.json().catch(() => ({}))) as Body;

    const endTs = end ? new Date(end) : new Date();
    const startTs = start ? new Date(start) : new Date(endTs.getTime() - 24 * 3600 * 1000);

    if (!(startTs < endTs)) {
      return NextResponse.json({ ok: false, error: "Rango inválido" }, { status: 400 });
    }
    if (stepSec <= 0 || stepSec > 3600) {
      return NextResponse.json({ ok: false, error: "stepSec debe estar entre 1 y 3600" }, { status: 400 });
    }

    const fechaDiaISO = endTs.toISOString().slice(0, 10); // yyyy-mm-dd

    // pedimos lo mínimo que sabemos que existe
    const devices =
      deviceId
        ? await sql/*sql*/`
            SELECT id, usuario_id
            FROM public.dispositivos
            WHERE id = ${deviceId}
          `
        : await sql/*sql*/`
            SELECT id, usuario_id
            FROM public.dispositivos
          `;

    const arr = Array.isArray(devices) ? devices : (devices as any)?.rows ?? [];
    if (!arr.length) {
      return NextResponse.json({ ok: true, devices: 0, upserts: 0, items: [] });
    }

    let upserts = 0;
    const items: Array<{ dispositivo_id: string; litros: number }> = [];

    for (const d of arr as any[]) {
      const uid = d.usuario_id ? Number(d.usuario_id) : null;
      const did = String(d.id);
      if (!uid) continue;

      // caudal fijo 1 l/min
      const lpm = 1;

      // simular 24h
      let t = startTs.getTime();
      let litrosDelDia = 0;

      while (t < endTs.getTime()) {
        const ts = new Date(t);
        const h = ts.getHours();
        const nf = h >= 0 && h < 6 ? nightFactor : 1;
        const noise = 1 + (Math.random() * 2 * ruido - ruido);
        const litrosPaso = lpm * nf * noise * (stepSec / 60);
        if (litrosPaso > 0) litrosDelDia += litrosPaso;
        t += stepSec * 1000;
      }

      litrosDelDia = f3(litrosDelDia);

      // buscar si ya hay registro hoy
      const existing: any[] = await sql/*sql*/`
        SELECT id
        FROM public.consumo_agua
        WHERE usuario_id = ${uid}
          AND dispositivo_id = ${did}
          AND fecha::date = ${fechaDiaISO}::date
        LIMIT 1
      `;

      if (existing.length) {
        // ✅ sumar sobre la columna, no sobre 2 parámetros
        await sql/*sql*/`
          UPDATE public.consumo_agua
          SET cantidad_litros = cantidad_litros + ${litrosDelDia}::numeric,
              fecha = ${fechaDiaISO}::timestamptz
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql/*sql*/`
          INSERT INTO public.consumo_agua (usuario_id, dispositivo_id, fecha, cantidad_litros, usuario, dispositivo)
          VALUES (${uid}, ${did}, ${fechaDiaISO}::timestamptz, ${litrosDelDia}::numeric, 'usuario', 'dispositivo')
        `;
      }

      upserts += 1;
      items.push({ dispositivo_id: did, litros: litrosDelDia });
    }

    return NextResponse.json({
      ok: true,
      devices: arr.length,
      upserts,
      range: { start: startTs.toISOString(), end: endTs.toISOString() },
      items,
    });
  } catch (e: any) {
    console.error("POST /api/simular/24h error:", e?.message, e);
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
