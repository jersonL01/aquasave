// src/app/api/gamificacion/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Evento = {
  tipo: string;
  detalle: any;
};

export async function GET() {
  try {
    // 1) identificar al usuario (next-auth o cookie aq_uid)
    const session = await getServerSession(authOptions);

    // primero intento sacar id de la sesión (login con google)
    let uid: number | null =
      (session?.user as any)?.id ||
      (session?.user as any)?.userId ||
      (session?.user as any)?.usuario_id ||
      null;

    // si no hay sesión de next-auth, pruebo con tu cookie propia
    if (!uid) {
      const ck = (await cookies()).get("aq_uid")?.value;
      if (ck && /^\d+$/.test(ck)) {
        uid = Number(ck);
      }
    }

    // si aun así no sé quién es -> devuelvo vacío pero ok
    if (!uid) {
      return NextResponse.json({
        ok: true,
        puntos: 0,
        logros: [],
        ranking: [],
      });
    }

    // 2) traer puntos acumulados
    const ptsRows = await sql/*sql*/`
      SELECT puntos
      FROM gamificacion_puntos
      WHERE usuario_id = ${uid}
      LIMIT 1
    `;
    const totalPuntos =
      Array.isArray(ptsRows) && ptsRows.length
        ? Number((ptsRows as any)[0].puntos)
        : 0;

    // 3) traer eventos del usuario (para saber qué logró)
    const evRows = await sql/*sql*/`
      SELECT tipo, detalle
      FROM gamificacion_eventos
      WHERE usuario_id = ${uid}
      ORDER BY creado_en DESC
      LIMIT 200
    `;
    const eventos: Evento[] = Array.isArray(evRows)
      ? (evRows as any)
      : (evRows as any)?.rows ?? [];

    // contar cuántas veces registró consumo
    const consumosHechos = eventos.filter(
      (e) => e.tipo === "consumo_registrado"
    ).length;

    // 4) armar los logros dinámicos
    // (podés cambiar las reglas a lo que quieras)
    const logros = [
      {
        id: "ecohereo",
        titulo: "Ecohéroe",
        descripcion: "Reducción sostenida de consumo",
        points: 200,
        unlocked: consumosHechos >= 3, // por ejemplo: 3 registros de consumo
      },
      {
        id: "consumo-eficiente",
        titulo: "Consumo Eficiente",
        descripcion: "Promedio bajo el umbral",
        points: 150,
        // por ahora lo desbloqueamos si al menos tiene 1 registro
        unlocked: consumosHechos >= 1,
      },
      {
        id: "mantenimiento-ejemplar",
        titulo: "Mantenimiento ejemplar",
        descripcion: "Chequeos al día",
        points: 100,
        // no tenemos eventos de mantenimiento todavía
        unlocked: false,
      },
    ];

    // 5) ranking simple desde consumo_agua (tus datos reales)
    const rkRows = await sql/*sql*/`
      SELECT dispositivo_id AS dispositivo,
             SUM(cantidad_litros)::float8 AS litros
      FROM consumo_agua
      WHERE usuario_id = ${uid}
      GROUP BY dispositivo_id
      ORDER BY litros DESC
      LIMIT 10
    `;
    const ranking = (Array.isArray(rkRows) ? rkRows : (rkRows as any)?.rows ?? [])
      .map((r: any, idx: number) => ({
        pos: idx + 1,
        dispositivo: r.dispositivo,
        litros: Number(r.litros || 0),
      }));

    return NextResponse.json({
      ok: true,
      puntos: totalPuntos,
      logros,
      ranking,
    });
  } catch (e: any) {
    console.error("GET /api/gamificacion error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}
