// src/app/api/simular/24h/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const f3 = (n: number) => Math.round(n * 1000) / 1000;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      deviceId?: string;
      start?: string;
      end?: string;
      stepSec?: number;
      ruido?: number;
      nightFactor?: number;
    };

    const {
      deviceId,
      start,
      end,
      stepSec = 60,
      ruido = 0.1,
      nightFactor = 0.6,
    } = body;

    if (!deviceId) {
      return NextResponse.json(
        { ok: false, error: "Falta deviceId" },
        { status: 400 }
      );
    }

    // sesión (solo para intentar mapear al mismo user)
    const session = await getServerSession(authOptions);
    const sessionId =
      (session?.user as any)?.id ||
      (session?.user as any)?.userId ||
      (session?.user as any)?.usuario_id ||
      null;

    // obtener dispositivo
    const devRows = await sql/*sql*/`
      SELECT id, usuario_id, COALESCE(cantidad, 1)::float8 AS lpm
      FROM public.dispositivos
      WHERE id = ${deviceId}
      LIMIT 1
    `;
    const dev = Array.isArray(devRows) ? devRows[0] : (devRows as any)?.rows?.[0];
    if (!dev) {
      return NextResponse.json(
        { ok: false, error: "Dispositivo no encontrado" },
        { status: 404 }
      );
    }

    // prioridad:
    // 1) si la sesión trae un id numérico -> usar ese
    // 2) si no, usar el usuario_id del dispositivo
    const usuarioId = sessionId && !Number.isNaN(Number(sessionId))
      ? Number(sessionId)
      : Number(dev.usuario_id);

    const endTs = end ? new Date(end) : new Date();
    const startTs = start
      ? new Date(start)
      : new Date(endTs.getTime() - 24 * 3600 * 1000);

    const fechaDiaISO = endTs.toISOString().slice(0, 10);

    // simulate
    let t = startTs.getTime();
    let litrosDelDia = 0;
    while (t < endTs.getTime()) {
      const ts = new Date(t);
      const h = ts.getHours();
      const nf = h >= 0 && h < 6 ? nightFactor : 1;
      const noise = 1 + (Math.random() * 2 * ruido - ruido);
      const litrosPaso = dev.lpm * nf * noise * (stepSec / 60);
      if (litrosPaso > 0) litrosDelDia += litrosPaso;
      t += stepSec * 1000;
    }
    litrosDelDia = f3(litrosDelDia);

    // upsert
    const existing = await sql/*sql*/`
      SELECT id, cantidad_litros
      FROM public.consumo_agua
      WHERE usuario_id = ${usuarioId}
        AND dispositivo_id = ${deviceId}
        AND fecha::date = ${fechaDiaISO}::date
      LIMIT 1
    `;

    const existArr = Array.isArray(existing)
      ? existing
      : (existing as any)?.rows ?? [];

    if (existArr.length) {
      const current = Number(existArr[0].cantidad_litros || 0);
      const newTotal = f3(current + litrosDelDia);
      await sql/*sql*/`
        UPDATE public.consumo_agua
        SET cantidad_litros = ${newTotal},
            fecha = ${fechaDiaISO}::timestamptz
        WHERE id = ${existArr[0].id}
      `;
    } else {
      await sql/*sql*/`
        INSERT INTO public.consumo_agua (usuario_id, dispositivo_id, fecha, cantidad_litros)
        VALUES (${usuarioId}, ${deviceId}, ${fechaDiaISO}::timestamptz, ${litrosDelDia})
      `;
    }

    return NextResponse.json({
      ok: true,
      simulated: litrosDelDia,
      deviceId,
    });
  } catch (e: any) {
    console.error("POST /api/simular/24h error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}
