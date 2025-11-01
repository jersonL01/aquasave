// src/app/historial/page.tsx
'use client';

import TopNavApp from '@/components/TopNavApp';
import Link from 'next/link';

type Row = {
  id: string;
  fecha: string;          // yyyy-mm-dd
  consumo: number;        // litros o m³ (usa el que prefieras)
  costo: number;          // CLP
};

const DEMO: Row[] = [
  { id: 'R-0001', fecha: '2025-10-01', consumo: 3200, costo: 4800 },
  { id: 'R-0002', fecha: '2025-10-02', consumo: 2800, costo: 4200 },
  { id: 'R-0003', fecha: '2025-10-03', consumo: 4100, costo: 6150 },
  { id: 'R-0004', fecha: '2025-10-04', consumo: 3050, costo: 4575 },
];

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DATA_12M = [72, 65, 68, 70, 63, 60, 58, 61, 66, 69, 71, 67]; // demo

export default function HistorialPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
        <TopNavApp />
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Top: Info + Chart */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* AquaSave informa / Cargos */}
          <div className="rounded-2xl border-4 border-indigo-200 bg-indigo-50 p-4">
            <div className="rounded-xl bg-white/70 px-4 py-2 text-center text-sm font-bold text-slate-700">
              AquaSave Informa
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold">Cargos:</p>
              <div className="mt-2 h-40 rounded-xl border-4 border-indigo-200 bg-white" />
            </div>
          </div>

          {/* Mini chart últimos 12 meses */}
          <div>
            <p className="text-xs font-semibold mb-2">Consumo últimos 12 meses</p>
            <div className="rounded-xl border bg-white p-3">
              <MiniChart />
            </div>
          </div>
        </section>

        {/* Tabla grande */}
        <section className="mt-8">
          <div className="rounded-2xl border-[12px] border-indigo-600/90 p-3">
            <div className="overflow-x-auto rounded-xl bg-indigo-50">
              <table className="min-w-full text-sm">
                <thead className="bg-indigo-100/80">
                  <tr>
                    <Th>ID Registro</Th>
                    <Th>Fecha</Th>
                    <Th>Consumo (litros/m³)</Th>
                    <Th>Costo estimado</Th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO.map((r, i) => (
                    <tr key={r.id} className={i % 2 ? 'bg-white/60' : 'bg-white/30'}>
                      <Td>{r.id}</Td>
                      <Td>{fmt(r.fecha)}</Td>
                      <Td>{num(r.consumo)}</Td>
                      <Td>${num(r.costo)}</Td>
                    </tr>
                  ))}
                  {/* filas vacías para dar sensación de “planilla” como en el mockup */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`empty-${i}`} className={i % 2 ? 'bg-white/60' : 'bg-white/30'}>
                      <Td>&nbsp;</Td>
                      <Td>&nbsp;</Td>
                      <Td>&nbsp;</Td>
                      <Td>&nbsp;</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------- UI bits ---------- */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-semibold text-slate-700">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-slate-800">{children}</td>;
}

/* Mini chart: barras simples con SVG (frontend puro) */
function MiniChart() {
  // dimensiones
  const W = 420;
  const H = 200;
  const padding = 28;
  const innerW = W - padding * 2;
  const innerH = H - padding * 2;
  const max = Math.max(...DATA_12M, 1);

  const barW = innerW / DATA_12M.length - 6;

  return (
    <svg width={W} height={H} className="block">
      {/* eje Y y X */}
      <line x1={padding} y1={padding} x2={padding} y2={H - padding} stroke="#222" strokeWidth={1.2} />
      <line x1={padding} y1={H - padding} x2={W - padding} y2={H - padding} stroke="#222" strokeWidth={1.2} />

      {/* líneas horizontales suaves */}
      {Array.from({ length: 4 }).map((_, i) => {
        const y = padding + (innerH * (i + 1)) / 5;
        return <line key={i} x1={padding} x2={W - padding} y1={y} y2={y} stroke="#000" opacity={0.08} />;
      })}

      {/* barras */}
      {DATA_12M.map((v, i) => {
        const x = padding + i * (innerW / DATA_12M.length) + 3;
        const h = (v / max) * innerH;
        const y = H - padding - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={3}
            fill="#555"
          />
        );
      })}

      {/* labels de meses (3 o 4 para no saturar, como el mockup) */}
      {DATA_12M.map((_, i) => {
        const label = (i % 3 === 0) ? MESES[i] : '';
        const x = padding + i * (innerW / DATA_12M.length) + barW / 2 + 3;
        return (
          <text
            key={`m-${i}`}
            x={x}
            y={H - padding + 16}
            textAnchor="middle"
            className="fill-slate-700"
            fontSize={10}
          >
            {label}
          </text>
        );
      })}

      {/* 0 en eje Y */}
      <text x={padding - 8} y={H - padding + 12} textAnchor="end" fontSize={10} className="fill-slate-700">
        0
      </text>
    </svg>
  );
}

/* ---------- helpers ---------- */
function fmt(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}
function num(n: number) {
  return new Intl.NumberFormat('es-CL').format(n);
}
