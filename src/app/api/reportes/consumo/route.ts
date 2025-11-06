// src/app/api/reportes/consumo/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const COSTO_CLP_POR_LITRO = 1.5;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // si no hay sesión, devolvemos lista vacía
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const uid = Number((session.user as any).id);
    if (!uid) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const deviceId = searchParams.get("deviceId");

    const rows = await sql/*sql*/`
      SELECT
        id,
        usuario_id,
        fecha,
        dispositivo_id,
        cantidad_litros
      FROM public.consumo_agua
      WHERE usuario_id = ${uid}
      ORDER BY fecha ASC
    `;

    const all = Array.isArray(rows) ? rows : (rows as any)?.rows ?? [];

    const filtered = all.filter((r: any) => {
      const ts = new Date(r.fecha).getTime();
      if (from && ts < new Date(from).getTime()) return false;
      if (to && ts > new Date(to).getTime()) return false;
      if (deviceId && deviceId !== "Todos" && String(r.dispositivo_id) !== deviceId) return false;
      return true;
    });

    const data = filtered.map((r: any) => {
      const litros = Number(r.cantidad_litros ?? 0);
      return {
        fecha: r.fecha,
        dispositivo_id: r.dispositivo_id,
        dispositivo: r.dispositivo_id,
        consumo: litros,
        costo: litros * COSTO_CLP_POR_LITRO,
      };
    });

    return NextResponse.json({ ok: true, items: data });
  } catch (e: any) {
    console.error("GET /api/reportes/consumo error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}
