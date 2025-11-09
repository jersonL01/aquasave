// src/app/reportes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, BarChart3, LineChart, Filter } from "lucide-react";
import TopNavApp from "@/components/TopNavApp";
import BtnDescargar from "@/components/BtnDescargar";

type ApiRow = {
  fecha: string;
  dispositivo_id: string;
  dispositivo: string;
  consumo: number;
  costo: number;
};

// números genéricos (litros, etc.)
const fmtNum = (n: number) => new Intl.NumberFormat("es-CL").format(n);

// pesos chilenos SIN decimales
const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-CL");
const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function ReportesPage() {
  const [desde, setDesde] = useState("2025-01-01");
  const [hasta, setHasta] = useState("2025-12-31");
  const [disp, setDisp] = useState<string>("Todos");

  const [data, setData] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams();
        qs.set("from", desde);
        qs.set("to", hasta);
        if (disp && disp !== "Todos") qs.set("deviceId", disp);

        const res = await fetch(`/api/reportes/consumo?${qs.toString()}`, {
          cache: "no-store",
        });
        const j = await res.json();
        console.log("reporte API =>", j);
        if (!res.ok || j?.ok === false) {
          throw new Error(j?.error || "No se pudo obtener el reporte");
        }
        setData(j.items ?? []);
      } catch (e: any) {
        setErr(e?.message || "Error al cargar");
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [desde, hasta, disp]);

  const dispositivos = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) if (r.dispositivo_id) set.add(r.dispositivo_id);
    return ["Todos", ...Array.from(set)];
  }, [data]);

  const kpis = useMemo(() => {
    const totalConsumo = data.reduce((s, r) => s + r.consumo, 0);
    const totalCosto = data.reduce((s, r) => s + r.costo, 0);
    const promedio = data.length ? totalConsumo / data.length : 0;
    return { totalConsumo, totalCosto, promedio };
  }, [data]);

  const porMes = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data) {
      const mk = monthKey(r.fecha);
      m.set(mk, (m.get(mk) ?? 0) + r.consumo);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const serie = useMemo(
    () => data.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [data]
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <TopNavApp />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Reportes</h1>
          <div className="flex gap-3">
            <BtnDescargar from={desde} to={hasta} deviceId={disp} />
          </div>
        </div>

        <section className="rounded-2xl border bg-white p-4 shadow-sm mb-6">
          <div className="mb-3 flex items-center gap-2 text-slate-600 text-sm">
            <Filter className="size-4" /> Filtros
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Desde
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Hasta
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Dispositivo
              </label>
              <select
                value={disp}
                onChange={(e) => setDisp(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                {dispositivos.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {!loading && !err && data.length === 0 ? (
          <div className="rounded-2xl border bg-slate-50 px-5 py-6 text-center text-slate-500">
            Aún no tienes consumos registrados. Agrega un dispositivo y
            enciéndelo para ver reportes acá.
          </div>
        ) : err ? (
          <div className="rounded-2xl border bg-red-50 px-5 py-6 text-center text-red-500">
            {err}
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <Kpi
                icon={<BarChart3 className="size-5" />}
                label="Consumo total"
                value={`${fmtNum(kpis.totalConsumo)} L`}
              />
              <Kpi
                icon={<Calendar className="size-5" />}
                label="Promedio por registro"
                value={`${fmtNum(kpis.promedio)} L`}
              />
              <Kpi
                icon={<LineChart className="size-5" />}
                label="Costo total"
                value={`$${fmtCLP(kpis.totalCosto)}`}
              />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card title="Consumo por mes (barras)">
                <Bars data={porMes} />
              </Card>
              <Card title="Tendencia (línea/área)">
                <LineArea data={serie} />
              </Card>
            </section>

            <section className="mt-8">
              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Fecha</Th>
                      <Th>Dispositivo</Th>
                      <Th>Consumo (L)</Th>
                      <Th>Costo (CLP)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Cargando…
                        </td>
                      </tr>
                    ) : (
                      data.map((r, i) => (
                        <tr key={i} className="border-t">
                          <Td>{fmtDate(r.fecha)}</Td>
                          <Td>{r.dispositivo}</Td>
                          <Td>{fmtNum(r.consumo)}</Td>
                          <Td>${fmtCLP(r.costo)}</Td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* helpers UI igual que antes */
function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center size-9 rounded-full bg-slate-100">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="text-xl font-extrabold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

/* charts igual que antes… */
function Bars({ data }: { data: [string, number][] }) {
  const W = 520,
    H = 240,
    pad = 28;
  const innerW = W - pad * 2,
    innerH = H - pad * 2;
  const max = Math.max(...data.map((d) => d[1]), 1);
  const gap = 8;
  const bw = innerW / Math.max(1, data.length) - gap;

  if (data.length === 0)
    return <div className="text-sm text-slate-500">Sin datos</div>;

  return (
    <svg width={W} height={H} className="block">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#000" opacity={0.2} />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#000" opacity={0.2} />
      {data.map(([k, v], i) => {
        const x = pad + i * (innerW / data.length) + gap / 2;
        const h = (v / max) * innerH;
        const y = H - pad - h;
        return (
          <g key={k}>
            <rect x={x} y={y} width={bw} height={h} rx={4} className="fill-slate-700" />
            <text
              x={x + bw / 2}
              y={H - pad + 14}
              textAnchor="middle"
              fontSize={10}
              className="fill-slate-600"
            >
              {k.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineArea({ data }: { data: { fecha: string; consumo: number }[] }) {
  const W = 520,
    H = 240,
    pad = 28;
  const innerW = W - pad * 2,
    innerH = H - pad * 2;
  if (data.length === 0)
    return <div className="text-sm text-slate-500">Sin datos</div>;
  if (data.length === 1) {
    return (
      <svg width={W} height={H} className="block">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#000" opacity={0.2} />
        <circle cx={W / 2} cy={H / 2} r={6} fill="#1f2937" />
      </svg>
    );
  }
  const min = Math.min(...data.map((d) => d.consumo));
  const max = Math.max(...data.map((d) => d.consumo));
  const xs = (i: number) => pad + (innerW * i) / Math.max(1, data.length - 1);
  const ys = (v: number) =>
    pad + innerH - ((v - min) / Math.max(1, max - min)) * innerH;

  let d = `M ${xs(0)} ${ys(data[0].consumo)}`;
  for (let i = 1; i < data.length; i++) d += ` L ${xs(i)} ${ys(data[i].consumo)}`;
  const area = `${d} L ${xs(data.length - 1)} ${H - pad} L ${xs(0)} ${H - pad} Z`;

  return (
    <svg width={W} height={H} className="block">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#000" opacity={0.2} />
      <path d={area} fill="rgba(96,165,250,0.25)" />
      <path d={d} stroke="#1f2937" strokeWidth={2} fill="none" />
    </svg>
  );
}
