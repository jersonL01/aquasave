// src/app/api/reportes/pdf/route.ts
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const deviceId = searchParams.get("deviceId");

    // 1. traemos todo (filtros los hacemos en JS)
    const rows = await sql/*sql*/`
      SELECT fecha, dispositivo_id, cantidad_litros
      FROM public.consumo_agua
      ORDER BY fecha ASC
    `;
    const all = Array.isArray(rows) ? rows : (rows as any)?.rows ?? [];

    // 2. filtros
    const filtered = all.filter((r: any) => {
      const ts = new Date(r.fecha).getTime();
      if (from && ts < new Date(from).getTime()) return false;
      if (to && ts > new Date(to).getTime()) return false;
      if (deviceId && deviceId !== "Todos") {
        if (String(r.dispositivo_id) !== deviceId) return false;
      }
      return true;
    });

    const totalLitros = filtered.reduce(
      (acc: number, r: any) => acc + Number(r.cantidad_litros ?? 0),
      0
    );

    // ------------------------------------------------------------------
    // PDF a mano (bien simple, pero con mejor formato)
    // ------------------------------------------------------------------
    // coordenadas base
    const title = "AquaSave - Reporte de Consumo";
    const periodo = `Período: ${from ?? "-"} a ${to ?? "-"}`;
    const disp = `Dispositivo: ${deviceId ?? "Todos"}`;
    const total = `Consumo total: ${totalLitros.toLocaleString("es-CL")} L`;

    // armamos el cuerpo de líneas de texto
    const lines: string[] = [];

    // título grande centrado
    lines.push("BT");
    lines.push("/F1 20 Tf");
    // x=70, y=770 aprox
    lines.push("70 770 Td");
    lines.push(`(${escapePdfText(title)}) Tj`);
    lines.push("ET");

    // una barrita azul arriba (rectángulo)
    // hacemos una línea de color celeste (#4fa3ff aprox)
    // PDF usa 0-1, así que 0.31 0.64 1
    const headerBar = `
0.31 0.64 1 rg
50 750 500 2 re
f
`.trim();
    // info de cabecera
    lines.push("BT");
    lines.push("/F1 11 Tf");
    lines.push("50 730 Td");
    lines.push(`(${escapePdfText(periodo)}) Tj`);
    lines.push("0 -14 Td");
    lines.push(`(${escapePdfText(disp)}) Tj`);
    lines.push("0 -14 Td");
    lines.push(`(${escapePdfText(total)}) Tj`);
    lines.push("ET");

    // tabla / detalle
    lines.push("BT");
    lines.push("/F1 11 Tf");
    lines.push("50 680 Td");
    lines.push("(Detalle (máx. 30 filas):) Tj");
    lines.push("ET");

    // filas
    let y = 660;
    const maxRows = 30;
    for (let i = 0; i < Math.min(filtered.length, maxRows); i++) {
      const r: any = filtered[i];
      const f = new Date(r.fecha).toLocaleDateString("es-CL");
      const line = `${f}  •  ${r.dispositivo_id}  •  ${Number(
        r.cantidad_litros ?? 0
      ).toLocaleString("es-CL")} L`;

      lines.push("BT");
      lines.push("/F1 10 Tf");
      lines.push(`50 ${y} Td`);
      lines.push(`(${escapePdfText(line)}) Tj`);
      lines.push("ET");

      y -= 14;
    }

    if (filtered.length > maxRows) {
      lines.push("BT");
      lines.push("/F1 10 Tf");
      lines.push(`50 ${y - 10} Td`);
      lines.push(
        `(${escapePdfText(
          `… ${filtered.length - maxRows} filas más no mostradas`
        )}) Tj`
      );
      lines.push("ET");
    }

    // contenido final del PDF
    const pdfBody = [
      "%PDF-1.4",
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
      // contents
      `4 0 obj << /Length ${calcContentLength(
        headerBar + "\n" + lines.join("\n")
      )} >> stream
${headerBar}
${lines.join("\n")}
endstream
endobj`,
      // font (Helvetica estándar)
      "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      "xref",
      "0 6",
      "0000000000 65535 f ",
      "0000000010 00000 n ",
      "0000000060 00000 n ",
      "0000000116 00000 n ",
      "0000000295 00000 n ",
      "0000000520 00000 n ",
      "trailer << /Size 6 /Root 1 0 R >>",
      "startxref",
      "600",
      "%%EOF",
    ].join("\n");

    const pdfBytes = new TextEncoder().encode(pdfBody);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reporte-consumo.pdf"',
      },
    });
  } catch (e: any) {
    console.error("ERROR /api/reportes/pdf:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// escapa parentesis y backslashes para que PDF no se enoje
function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// el length tiene que ser el número de bytes del contenido que metimos en el stream
function calcContentLength(content: string) {
  return new TextEncoder().encode(content).length;
}
