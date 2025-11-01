// src/app/reportes/page.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Calendar, Download, BarChart3, LineChart, Filter } from 'lucide-react';
import TopNavApp from '@/components/TopNavApp';

/* -------------------- Tipos y data demo -------------------- */
type Row = {
  fecha: string;        // yyyy-mm-dd
  dispositivo: string;
  consumo: number;      // litros
  costo: number;        // CLP
};

const DISPOSITIVOS = ['Todos', 'Dispositivo 1', 'Dispositivo 2', 'Dispositivo 3'] as const;

const DATA_DEMO: Row[] = [
  // 3 meses de ejemplo
  { fecha: '2025-01-05', dispositivo: 'Dispositivo 1', consumo: 3200, costo: 4800 },
  { fecha: '2025-01-15', dispositivo: 'Dispositivo 2', consumo: 2600, costo: 3900 },
  { fecha: '2025-01-28', dispositivo: 'Dispositivo 1', consumo: 4100, costo: 6150 },
  { fecha: '2025-02-03', dispositivo: 'Dispositivo 3', consumo: 3000, costo: 4500 },
  { fecha: '2025-02-10', dispositivo: 'Dispositivo 2', consumo: 2800, costo: 4200 },
  { fecha: '2025-02-24', dispositivo: 'Dispositivo 1', consumo: 3500, costo: 5250 },
  { fecha: '2025-03-02', dispositivo: 'Dispositivo 2', consumo: 2900, costo: 4350 },
  { fecha: '2025-03-12', dispositivo: 'Dispositivo 3', consumo: 2700, costo: 4050 },
  { fecha: '2025-03-25', dispositivo: 'Dispositivo 1', consumo: 3600, costo: 5400 },
];

/* -------------------- Helpers -------------------- */
const fmtCL = (n: number) => new Intl.NumberFormat('es-CL').format(n);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function toCSV(rows: Row[]) {
  const headers = ['fecha', 'dispositivo', 'consumo', 'costo'];
  const lines = [headers.join(',')].concat(
    rows.map(r => [r.fecha, r.dispositivo, r.consumo, r.costo].join(',')),
  );
  return lines.join('\n');
}

function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------- Page -------------------- */
export default function ReportesPage() {
  // Filtros
  const [desde, setDesde] = useState('2025-01-01');
  const [hasta, setHasta] = useState('2025-12-31');
  const [disp, setDisp] = useState<(typeof DISPOSITIVOS)[number]>('Todos');

  const filtrados = useMemo(() => {
    const d1 = new Date(desde).getTime();
    const d2 = new Date(hasta).getTime();
    return DATA_DEMO.filter(r => {
      const t = new Date(r.fecha).getTime();
      const okFecha = t >= d1 && t <= d2;
      const okDisp = disp === 'Todos' ? true : r.dispositivo === disp;
      return okFecha && okDisp;
    });
  }, [desde, hasta, disp]);

  // KPIs
  const kpis = useMemo(() => {
    const totalConsumo = filtrados.reduce((s, r) => s + r.consumo, 0);
    const totalCosto = filtrados.reduce((s, r) => s + r.costo, 0);
    const promedio = filtrados.length ? totalConsumo / filtrados.length : 0;
    return { totalConsumo, totalCosto, promedio };
  }, [filtrados]);

  // Series por mes (barras) y por fecha (línea)
  const porMes = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtrados) m.set(monthKey(r.fecha), (m.get(monthKey(r.fecha)) ?? 0) + r.consumo);
    const arr = Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return arr;
  }, [filtrados]);

  const serie = useMemo(
    () => filtrados.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [filtrados],
  );

  // CSV
  function onDownload() {
    downloadFile('reporte.csv', toCSV(filtrados));
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
        <TopNavApp />
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Reportes</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-900 shadow hover:bg-amber-300"
            >
              <Download className="size-4" />
              Descargar PDF
            </button>
          </div>
        </div>

        {/* Filtros */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-600 text-sm">
            <Filter className="size-4" />
            Filtros
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Dispositivo
              </label>
              <select
                value={disp}
                onChange={(e) => setDisp(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              >
                {DISPOSITIVOS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Kpi icon={<BarChart3 className="size-5" />} label="Consumo total" value={`${fmtCL(kpis.totalConsumo)} L`} />
          <Kpi icon={<Calendar className="size-5" />} label="Promedio por registro" value={`${fmtCL(kpis.promedio)} L`} />
          <Kpi icon={<LineChart className="size-5" />} label="Costo total" value={`$${fmtCL(kpis.totalCosto)}`} />
        </section>

        {/* Charts */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Consumo por mes (barras)">
            <Bars data={porMes} />
          </Card>
          <Card title="Tendencia (línea/área)">
            <LineArea data={serie} />
          </Card>
        </section>

        {/* Tabla */}
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
                {filtrados.map((r, i) => (
                  <tr key={i} className="border-t">
                    <Td>{fmtDate(r.fecha)}</Td>
                    <Td>{r.dispositivo}</Td>
                    <Td>{fmtCL(r.consumo)}</Td>
                    <Td>${fmtCL(r.costo)}</Td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay datos para el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

/* -------------------- UI bits -------------------- */

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center size-9 rounded-full bg-slate-100">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
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
  return <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

/* -------------------- Charts (SVG puros) -------------------- */

function Bars({ data }: { data: [string, number][] }) {
  const W = 520, H = 240, pad = 28;
  const innerW = W - pad * 2, innerH = H - pad * 2;
  const max = Math.max(...data.map(d => d[1]), 1);
  const gap = 8;
  const bw = innerW / Math.max(1, data.length) - gap;

  return (
    <svg width={W} height={H} className="block">
      {/* ejes */}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#000" opacity={0.2}/>
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#000" opacity={0.2}/>
      {/* barras */}
      {data.map(([k, v], i) => {
        const x = pad + i * (innerW / data.length) + gap / 2;
        const h = (v / max) * innerH;
        const y = H - pad - h;
        return (
          <g key={k}>
            <rect x={x} y={y} width={bw} height={h} rx={4} className="fill-slate-700" />
            <text x={x + bw / 2} y={H - pad + 14} textAnchor="middle" fontSize={10} className="fill-slate-600">
              {k.slice(5)}{/* muestra MM */}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineArea({ data }: { data: Row[] }) {
  const W = 520, H = 240, pad = 28;
  const innerW = W - pad * 2, innerH = H - pad * 2;
  if (data.length === 0) return <div className="text-sm text-slate-500">Sin datos</div>;
  const min = Math.min(...data.map(d => d.consumo));
  const max = Math.max(...data.map(d => d.consumo));
  const xs = (i: number) => pad + (innerW * i) / Math.max(1, data.length - 1);
  const ys = (v: number) => pad + innerH - ((v - min) / Math.max(1, max - min)) * innerH;

  let d = `M ${xs(0)} ${ys(data[0].consumo)}`;
  for (let i = 1; i < data.length; i++) d += ` L ${xs(i)} ${ys(data[i].consumo)}`;

  const area = `${d} L ${xs(data.length - 1)} ${H - pad} L ${xs(0)} ${H - pad} Z`;

  return (
    <svg width={W} height={H} className="block">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#000" opacity={0.2}/>
      <path d={area} fill="url(#g1)" />
      <path d={d} stroke="#1f2937" strokeWidth={2} fill="none" />
    </svg>
  );
}
