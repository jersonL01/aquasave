// src/app/consumo/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TopNavApp from "@/components/TopNavApp";
import { Droplets, Calendar } from "lucide-react";

type ApiRow = {
  fecha: string;          // ISO
  dispositivo_id: string;
  dispositivo: string;
  consumo: number;        // litros
  costo: number;          // clp
};

const fmtNumber = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
  });

export default function ConsumoAguaPage() {
  // por defecto: mes actual
  const todayISO = new Date().toISOString().slice(0, 10);
  const firstDay = new Date();
  firstDay.setDate(1);

  const [desde, setDesde] = useState(firstDay.toISOString().slice(0, 10));
  const [hasta, setHasta] = useState(todayISO);

  const [data, setData] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // cargar datos cada vez que cambie el rango
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams();
        qs.set("from", desde);
        qs.set("to", hasta);

        const res = await fetch(`/api/reportes/consumo?${qs.toString()}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok || j?.ok === false) {
          throw new Error(j?.error || "No se pudo obtener el consumo");
        }
        setData(j.items ?? []);
      } catch (e: any) {
        setErr(e?.message || "Error al cargar");
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [desde, hasta]);

  // totales
  const { totalLitros, totalCosto } = useMemo(() => {
    const litros = data.reduce((s, r) => s + (r.consumo || 0), 0);
    const costo = data.reduce((s, r) => s + (r.costo || 0), 0);
    return { totalLitros: litros, totalCosto: costo };
  }, [data]);

  // agrupar por día para el gráfico
  const porDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of data) {
      const day = r.fecha.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + r.consumo);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, litros]) => ({ fecha, litros }));
  }, [data]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <TopNavApp />

      {/* header lindo */}
      <div className="bg-[linear-gradient(120deg,#168ca7,#1f4d72)] text-white py-6 shadow-sm mb-6">
        <div className="mx-auto max-w-7xl px-6 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/15 grid place-items-center">
            <Droplets className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Consumo de agua</h1>
            <p className="text-sm text-white/80">
              Suma de todos tus dispositivos en el período seleccionado.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 space-y-6 pb-10">
        {/* filtros */}
        <section className="rounded-2xl bg-white border shadow-sm flex flex-wrap gap-4 items-center px-5 py-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Calendar className="size-4" />
            Período
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
        </section>

        {/* estados */}
        {err ? (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-6 text-center text-red-500">
            {err}
          </div>
        ) : (
          <>
            {/* KPIs */}
            <section className="grid gap-4 md:grid-cols-3">
              <Kpi
                label="Consumo total"
                value={`${fmtNumber(totalLitros)} L`}
                icon={<Droplets className="size-5 text-sky-500" />}
              />
              <Kpi
                label="Costo total"
                value={`$${fmtNumber(totalCosto)}`}
                icon={<span className="text-xl leading-none">$</span>}
              />
              <Kpi
                label="Registros"
                value={fmtNumber(data.length)}
                icon={<Calendar className="size-5 text-slate-500" />}
              />
            </section>

            {/* gráfico y tabla */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white border shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  Consumo diario (todos los dispositivos)
                </h2>
                {loading ? (
                  <p className="text-sm text-slate-400">Cargando…</p>
                ) : porDia.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin datos en el período.</p>
                ) : (
                  <BarsDaily data={porDia} />
                )}
              </div>

              <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
                <h2 className="text-sm font-semibold text-slate-700 px-5 py-4 border-b">
                  Detalle por registro
                </h2>
                <div className="max-h-[320px] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                          Dispositivo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                          Consumo (L)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                          Costo (CLP)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{fmtDate(r.fecha)}</td>
                          <td className="px-4 py-2">{r.dispositivo}</td>
                          <td className="px-4 py-2">{fmtNumber(r.consumo)}</td>
                          <td className="px-4 py-2">${fmtNumber(r.costo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* ---------- COMPONENTES AUX --------- */

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border shadow-sm px-5 py-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-slate-100 grid place-items-center">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function BarsDaily({ data }: { data: { fecha: string; litros: number }[] }) {
  const W = 520;
  const H = 230;
  const pad = 28;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const max = Math.max(...data.map((d) => d.litros), 1);
  const gap = 6;
  const bw = innerW / Math.max(data.length, 1) - gap;

  return (
    <svg width={W} height={H} className="block">
      {/* ejes */}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#cbd5f5" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#cbd5f5" />
      {data.map((d, i) => {
        const x = pad + i * (innerW / data.length) + gap / 2;
        const h = (d.litros / max) * innerH;
        const y = H - pad - h;
        return (
          <g key={d.fecha}>
            <title>
              {fmtDate(d.fecha)} · {fmtNumber(d.litros)} L
            </title>
            <rect
              x={x}
              y={y}
              width={bw}
              height={h}
              rx={6}
              fill="#0ea5e9"
              opacity={0.9}
            />
            <text
              x={x + bw / 2}
              y={H - pad + 14}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {fmtDate(d.fecha)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
