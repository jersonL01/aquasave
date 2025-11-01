// src/app/api/simular/24h/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// redondeo a 3 decimales
const f3 = (n: number) => Math.round(n * 1000) / 1000;

type Body = {
  deviceId?: string;   // si no viene, simula TODOS los encendidos
  start?: string;      // ISO (default: now-24h)
  end?: string;        // ISO (default: now)
  stepSec?: number;    // tamaño del intervalo en segundos (default: 60)
  ruido?: number;      // 0.10 => ±10% (default: 0.10)
  nightFactor?: number;// multiplicador 00–06 (default: 0.6)
};

export async function POST(req: Request) {
  try {
    const {
      deviceId,
      start,
      end,
      stepSec = 60,
      ruido = 0.10,
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

    // Dispositivos objetivo
    const devices = deviceId
      ? await sql/*sql*/`
          SELECT id, usuario_id, litros::float8 AS lpm
          FROM public.dispositivos
          WHERE id = ${deviceId}
        `
      : await sql/*sql*/`
          SELECT id, usuario_id, litros::float8 AS lpm
          FROM public.dispositivos
          WHERE encendido = true
        `;

    if (!devices.length) {
      return NextResponse.json({ ok: true, devices: 0, inserted: 0 });
    }

    // Insertaremos en lotes usando UNNEST (arrays)
    const batchSize = 1500; // filas por INSERT; ajusta si hace falta
    let totalInserted = 0;

    for (const d of devices) {
      const uid = Number(d.usuario_id);
      const did = String(d.id);
      const lpm = Number(d.lpm || 0);
      if (!uid || !did || !lpm) continue;

      let t = startTs.getTime();

      // buffers del lote
      let uids: number[] = [];
      let dids: string[] = [];
      let fechas: string[] = [];
      let litros: number[] = [];

      const flush = async () => {
        if (!uids.length) return;
        await sql/*sql*/`
          INSERT INTO public.consumo_agua (usuario_id, dispositivo_id, fecha, cantidad_litros)
          SELECT * FROM UNNEST(
            ${uids}::bigint[],
            ${dids}::text[],
            ${fechas}::timestamptz[],
            ${litros}::numeric[]
          )
        `;
        totalInserted += uids.length;
        // limpia buffers
        uids = []; dids = []; fechas = []; litros = [];
      };

      while (t < endTs.getTime()) {
        const ts = new Date(t);
        const h = ts.getHours();
        const nf = h >= 0 && h < 6 ? nightFactor : 1.0;       // factor nocturno
        const noise = 1 + (Math.random() * 2 * ruido - ruido);// 1±ruido
        const l = f3(lpm * nf * noise * (stepSec / 60));       // L/min -> L en intervalo

        if (l > 0) {
          uids.push(uid);
          dids.push(did);
          fechas.push(ts.toISOString());
          litros.push(l);

          if (uids.length >= batchSize) {
            await flush();
          }
        }
        t += stepSec * 1000;
      }
      await flush();
    }

    return NextResponse.json({
      ok: true,
      devices: devices.length,
      inserted: totalInserted,
      range: { start: startTs.toISOString(), end: endTs.toISOString() },
      stepSec,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
