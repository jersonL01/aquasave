// src/app/dispositivo_consumo/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import TopNavApp from '@/components/TopNavApp';

type SeriePunto = { ts: string; litros: number };
type Item = {
  dispositivo_id: string;
  nombre: string;
  litros_total: number;
  serie: SeriePunto[];
};
type ApiResp = {
  ok: boolean;
  from: string;
  to: string;
  items: Item[];
  resumen: { dispositivos: number; litros_total: number; activos: number };
};

function fmt(n: number) {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(n);
}
function Sparkline({ data, width = 120, height = 28 }: { data: SeriePunto[]; width?: number; height?: number }) {
  const d = useMemo(() => {
    if (!data?.length) return '';
    const ys = data.map(p => p.litros);
    const min = Math.min(...ys, 0);
    const max = Math.max(...ys, 1);
    const dx = width / Math.max(1, data.length - 1);
    const sy = (y: number) => (max === min ? height / 2 : height - ((y - min) / (max - min)) * height);
    return data.map((p, i) => `${i ? 'L' : 'M'} ${i * dx} ${sy(p.litros)}`).join(' ');
  }, [data, width, height]);
  return <svg width={width} height={height}><path d={d} fill="none" strokeWidth="2" stroke="currentColor" /></svg>;
}

export default function DispositivoConsumoPage() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResp | null>(null);

  function rangeIso(r: typeof range) {
    const to = new Date();
    const from = new Date(to);
    if (r === '24h') from.setHours(to.getHours() - 24);
    else if (r === '7d') from.setDate(to.getDate() - 7);
    else from.setDate(to.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  async function load() {
    setLoading(true); setErr(null);
    try {
      const { from, to } = rangeIso(range);
      const res = await fetch(`/api/consumo/por-dispositivo?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { credentials: 'include', cache: 'no-store' });
      const j: ApiResp = await res.json();
      if (!res.ok || !j?.ok) throw new Error((j as any)?.error || 'No se pudo cargar');
      setData(j);
    } catch (e: any) {
      setErr(e?.message || 'Error al cargar');
      setData(null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [range]);

  const total = data?.resumen?.litros_total ?? 0;
  const activos = data?.resumen?.activos ?? 0;
  const dispositivos = data?.resumen?.dispositivos ?? 0;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopNavApp />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Consumo por dispositivo</h1>
          <div className="flex items-center gap-2">
            <select value={range} onChange={e => setRange(e.target.value as any)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="24h">Últimas 24 h</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
            </select>
            <button onClick={load} className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Actualizar</button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border p-4 bg-white shadow-sm">
            <div className="text-sm text-slate-500">Litros totales</div>
            <div className="mt-1 text-2xl font-extrabold">{fmt(total)} L</div>
          </div>
          <div className="rounded-2xl border p-4 bg-white shadow-sm">
            <div className="text-sm text-slate-500">Dispositivos</div>
            <div className="mt-1 text-2xl font-extrabold">{dispositivos}</div>
          </div>
          <div className="rounded-2xl border p-4 bg-white shadow-sm">
            <div className="text-sm text-slate-500">Activos</div>
            <div className="mt-1 text-2xl font-extrabold">{activos}</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_160px] gap-x-4 items-center px-5 py-3 border-b bg-slate-50 text-[12px] font-semibold text-slate-800">
            <span>Dispositivo</span>
            <span className="text-right">Litros</span>
            <span className="text-right">Promedio L/h</span>
            <span>Serie</span>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-600">Cargando…</div>
          ) : err ? (
            <div className="p-5 text-sm text-red-600">{err}</div>
          ) : !data?.items?.length ? (
            <div className="p-5 text-sm text-slate-600">Sin datos.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {data.items.map((it) => {
                const horas = Math.max(1, it.serie.length);
                const prom = it.litros_total / horas;
                return (
                  <li key={it.dispositivo_id} className="px-5 py-4">
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_160px] gap-x-4 items-center">
                      <div>
                        <div className="font-medium text-slate-900">{it.nombre}</div>
                        <div className="text-[11px] text-slate-500">ID: {it.dispositivo_id}</div>
                      </div>
                      <div className="text-right font-semibold">{fmt(it.litros_total)} L</div>
                      <div className="text-right">{fmt(prom)} L/h</div>
                      <div className="text-slate-700"><Sparkline data={it.serie} /></div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden grid gap-3">
                      <div className="font-semibold text-slate-900">{it.nombre}</div>
                      <div className="text-[11px] text-slate-500">ID: {it.dispositivo_id}</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><div className="text-slate-500">Litros</div><div className="font-medium">{fmt(it.litros_total)} L</div></div>
                        <div><div className="text-slate-500">Promedio L/h</div><div className="font-medium">{fmt(prom)}</div></div>
                      </div>
                      <div className="border rounded-lg p-2"><Sparkline data={it.serie} width={260} height={32} /></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
