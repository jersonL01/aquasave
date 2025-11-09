// src/app/lugares/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TopNavApp from "@/components/TopNavApp";
import { MapPin, Calendar, Droplets } from "lucide-react";

type Dispositivo = {
  id: string;
  nombre: string;
  descripcion: string | null;
};

type ConsumoRow = {
  fecha: string;
  dispositivo_id: string;
  dispositivo: string;
  consumo: number;
  costo: number;
};

const fmtLitros = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);

export default function LugaresPage() {
  // rango por defecto: último mes
  const todayISO = new Date().toISOString().slice(0, 10);
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const [desde, setDesde] = useState(d.toISOString().slice(0, 10));
  const [hasta, setHasta] = useState(todayISO);

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [consumos, setConsumos] = useState<ConsumoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // cargar dispositivos + consumos
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) dispositivos (para saber la ubicación)
        const resDisp = await fetch("/api/dispositivos", { cache: "no-store" });
        const jd = await resDisp.json();
        const disp: Dispositivo[] = jd?.items ?? jd?.dispositivos ?? [];
        setDispositivos(disp);

        // 2) consumos dentro del rango
        const qs = new URLSearchParams();
        qs.set("from", desde);
        qs.set("to", hasta);
        const resCons = await fetch(`/api/reportes/consumo?${qs.toString()}`, {
          cache: "no-store",
        });
        const jc = await resCons.json();
        if (!resCons.ok || jc?.ok === false) {
          throw new Error(jc?.error || "No se pudo cargar el consumo");
        }
        setConsumos(jc.items ?? []);
      } catch (e: any) {
        setErr(e?.message || "Error al cargar datos");
        setDispositivos([]);
        setConsumos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [desde, hasta]);

  // juntar consumos con su ubicación (descripcion)
  const lugares = useMemo(() => {
    if (!consumos.length) return [];
    const map = new Map<string, { litros: number; registros: number }>();

    for (const c of consumos) {
      const disp = dispositivos.find((d) => String(d.id) === String(c.dispositivo_id));
      const ubicacion = disp?.descripcion?.trim() || "Sin ubicación";

      const litros = Number(c.consumo ?? 0);
      if (!map.has(ubicacion)) {
        map.set(ubicacion, { litros: 0, registros: 0 });
      }
      const obj = map.get(ubicacion)!;
      obj.litros += litros;
      obj.registros += 1;
    }

    return Array.from(map.entries())
      .map(([ubicacion, v]) => ({
        ubicacion,
        litros: v.litros,
        registros: v.registros,
      }))
      .sort((a, b) => b.litros - a.litros);
  }, [consumos, dispositivos]);

  const totalLitros = useMemo(
    () => lugares.reduce((s, l) => s + l.litros, 0),
    [lugares]
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <TopNavApp />

      {/* encabezado */}
      <div className="bg-[linear-gradient(120deg,#2f91b4,#1f4d72)] text-white py-6 mb-6 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/15 grid place-items-center">
            <MapPin className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Lugares con mayor consumo
            </h1>
            <p className="text-sm text-white/80">
              Basado en la descripción de tus dispositivos.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 space-y-6 pb-10">
        {/* filtros */}
        <section className="rounded-2xl bg-white border shadow-sm flex flex-wrap gap-4 items-center px-5 py-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Calendar className="size-4" />
            Rango de fechas
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-10">Desde</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-10">Hasta</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
            <Droplets className="size-4" />
            Total:{" "}
            <span className="font-semibold text-slate-700">
              {fmtLitros(totalLitros)} L
            </span>
          </div>
        </section>

        {/* estados */}
        {err ? (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-6 text-center text-red-500">
            {err}
          </div>
        ) : loading ? (
          <div className="rounded-xl bg-white border px-5 py-6 text-center text-slate-500 shadow-sm">
            Cargando…
          </div>
        ) : lugares.length === 0 ? (
          <div className="rounded-xl bg-white border px-5 py-6 text-center text-slate-500 shadow-sm">
            No hay consumos en ese rango.
          </div>
        ) : (
          <>
            {/* top 3 cards */}
            <section className="grid gap-4 md:grid-cols-3">
              {lugares.slice(0, 3).map((lugar, idx) => (
                <div
                  key={lugar.ubicacion}
                  className="rounded-2xl bg-white border shadow-sm p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 grid place-items-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">
                          Ubicación
                        </p>
                        <h2 className="text-sm font-semibold leading-tight">
                          {lugar.ubicacion}
                        </h2>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                      {lugar.registros} reg.
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] text-slate-400 uppercase">Consumo</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {fmtLitros(lugar.litros)}{" "}
                      <span className="text-sm font-semibold text-slate-400">L</span>
                    </p>
                  </div>
                  {totalLitros > 0 && (
                    <p className="text-xs text-slate-400">
                      {Math.round((lugar.litros / totalLitros) * 100)}% del total
                    </p>
                  )}
                </div>
              ))}
            </section>

            {/* gráfico */}
            <section className="rounded-2xl bg-white border shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <MapPin className="size-4 text-sky-500" />
                Consumo por ubicación
              </h2>
              <BarrasLugares data={lugares} />
            </section>

            {/* tabla */}
            <section className="rounded-2xl bg-white border shadow-sm overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Ubicación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Litros
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Registros
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lugares.map((lugar) => (
                    <tr key={lugar.ubicacion} className="border-t">
                      <td className="px-4 py-3">{lugar.ubicacion}</td>
                      <td className="px-4 py-3">{fmtLitros(lugar.litros)} L</td>
                      <td className="px-4 py-3">{lugar.registros}</td>
                      <td className="px-4 py-3">
                        {totalLitros > 0
                          ? Math.round((lugar.litros / totalLitros) * 100) + "%"
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* ===== gráfico simple en SVG ===== */
function BarrasLugares({ data }: { data: { ubicacion: string; litros: number }[] }) {
  const W = 920;
  const barH = 30;
  const gap = 14;
  const leftPad = 180;
  const max = Math.max(...data.map((d) => d.litros), 1);
  const height = data.length * (barH + gap) + 20;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={height}>
        {data.map((d, idx) => {
          const y = idx * (barH + gap) + 10;
          const pct = d.litros / max;
          const w = (W - leftPad - 40) * pct;
          return (
            <g key={d.ubicacion}>
              {/* esto es lo que TS quería */}
              <title>
                {d.ubicacion} · {fmtLitros(d.litros)} L
              </title>
              <text x={10} y={y + barH / 2 + 4} fontSize={12} fill="#0f172a">
                {d.ubicacion}
              </text>
              <rect
                x={leftPad}
                y={y}
                width={W - leftPad - 40}
                height={barH}
                rx={10}
                fill="#e2e8f0"
              />
              <rect
                x={leftPad}
                y={y}
                width={w}
                height={barH}
                rx={10}
                fill="#0ea5e9"
              />
              <text x={leftPad + w + 8} y={y + barH / 2 + 4} fontSize={11} fill="#0f172a">
                {fmtLitros(d.litros)} L
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
