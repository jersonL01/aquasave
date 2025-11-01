// src/app/campanas/page.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Megaphone, Target, Calendar, Activity, Plus } from 'lucide-react';
import TopNavApp from '@/components/TopNavApp';

type Campania = {
  id: string;
  nombre: string;
  estado: 'Borrador' | 'Activa' | 'Pausada' | 'Finalizada';
  inicio: string; // yyyy-mm-dd
  fin: string;    // yyyy-mm-dd
  objetivo: string; // texto corto
  progreso: number; // 0-100
};

const DEMO: Campania[] = [
  {
    id: 'C-001',
    nombre: 'Reduce 10% Consumo – Hogares',
    estado: 'Activa',
    inicio: '2025-10-01',
    fin: '2025-10-31',
    objetivo: 'Disminuir 10% el consumo mensual',
    progreso: 62,
  },
  {
    id: 'C-002',
    nombre: 'Mantención preventiva Q4',
    estado: 'Pausada',
    inicio: '2025-09-01',
    fin: '2025-12-15',
    objetivo: 'Recordatorios de mantenimiento',
    progreso: 38,
  },
  {
    id: 'C-003',
    nombre: 'Concientización “Cierra la llave”',
    estado: 'Finalizada',
    inicio: '2025-07-01',
    fin: '2025-08-15',
    objetivo: 'Campaña educativa',
    progreso: 100,
  },
  {
    id: 'C-004',
    nombre: 'Detección de fugas piloto',
    estado: 'Borrador',
    inicio: '2025-11-05',
    fin: '2025-12-05',
    objetivo: 'Prueba de alertas tempranas',
    progreso: 0,
  },
];

export default function CampanasPage() {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'Todos' | Campania['estado']>('Todos');

  const campañas = useMemo(() => {
    return DEMO.filter((c) => {
      const matchText =
        c.nombre.toLowerCase().includes(q.toLowerCase()) ||
        c.objetivo.toLowerCase().includes(q.toLowerCase());
      const matchEstado = estado === 'Todos' ? true : c.estado === estado;
      return matchText && matchEstado;
    });
  }, [q, estado]);

  const kpis = useMemo(() => {
    const total = DEMO.length;
    const activas = DEMO.filter((c) => c.estado === 'Activa').length;
    const finalizadas = DEMO.filter((c) => c.estado === 'Finalizada').length;
    const avgProgreso =
      Math.round(
        (DEMO.reduce((s, c) => s + c.progreso, 0) / Math.max(1, total)) * 10,
      ) / 10;
    return { total, activas, finalizadas, avgProgreso };
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
        <TopNavApp />
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Campañas</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/campanas/nueva"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-900 shadow hover:bg-amber-300"
            >
              <Plus className="size-4" />
              Nueva campaña
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Buscar
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, objetivo…"
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              >
                <option>Todos</option>
                <option>Activa</option>
                <option>Pausada</option>
                <option>Finalizada</option>
                <option>Borrador</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Kpi icon={<Megaphone className="size-5" />} label="Total campañas" value={String(kpis.total)} />
          <Kpi icon={<Activity className="size-5" />} label="Activas" value={String(kpis.activas)} />
          <Kpi icon={<Target className="size-5" />} label="Finalizadas" value={String(kpis.finalizadas)} />
          <Kpi icon={<Calendar className="size-5" />} label="Progreso promedio" value={`${kpis.avgProgreso}%`} />
        </section>

        {/* Grid de tarjetas */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campañas.map((c) => (
            <CardCampania key={c.id} c={c} />
          ))}
          {campañas.length === 0 && (
            <div className="col-span-full rounded-2xl border bg-slate-50 p-6 text-center text-sm text-slate-600">
              No hay campañas que coincidan con el filtro.
            </div>
          )}
        </section>

        {/* Tabla compacta */}
        <section className="mt-8">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Campaña</Th>
                  <Th>Estado</Th>
                  <Th>Inicio</Th>
                  <Th>Fin</Th>
                  <Th>Progreso</Th>
                </tr>
              </thead>
              <tbody>
                {campañas.map((c) => (
                  <tr key={c.id} className="border-t">
                    <Td>
                      <div className="font-semibold">{c.nombre}</div>
                      <div className="text-xs text-slate-500">{c.objetivo}</div>
                    </Td>
                    <Td>
                      <BadgeEstado estado={c.estado} />
                    </Td>
                    <Td>{fmt(c.inicio)}</Td>
                    <Td>{fmt(c.fin)}</Td>
                    <Td>
                      <Progress value={c.progreso} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ------------ UI bits ------------- */

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

function CardCampania({ c }: { c: Campania }) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{c.nombre}</h3>
          <p className="text-xs text-slate-600 mt-0.5">{c.objetivo}</p>
        </div>
        <BadgeEstado estado={c.estado} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Inicio</p>
          <p className="font-medium">{fmt(c.inicio)}</p>
        </div>
        <div>
          <p className="text-slate-500">Fin</p>
          <p className="font-medium">{fmt(c.fin)}</p>
        </div>
      </div>
      <div className="mt-4">
        <Progress value={c.progreso} />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span>ID: {c.id}</span>
      </div>
    </article>
  );
}

function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-emerald-500 transition-[width]"
        style={{ width: `${v}%` }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        role="progressbar"
      />
      <div className="mt-1 text-xs text-slate-600">{v}%</div>
    </div>
  );
}

function BadgeEstado({ estado }: { estado: Campania['estado'] }) {
  const map: Record<Campania['estado'], string> = {
    Activa: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pausada: 'bg-amber-100 text-amber-700 border-amber-200',
    Finalizada: 'bg-slate-200 text-slate-800 border-slate-300',
    Borrador: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${map[estado]}`}>
      {estado}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
