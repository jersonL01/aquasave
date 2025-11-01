// src/app/gamificacion/page.tsx
'use client';

import Link from 'next/link';
import { Leaf, Recycle, Wrench, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import TopNavApp from '@/components/TopNavApp';

type Logro = {
  id: string;
  titulo: string;
  descripcion?: string;
  icon: React.ReactNode;
  unlocked: boolean;
  points: number;
};

const LOGROS: Logro[] = [
  {
    id: 'ecohereo',
    titulo: 'Ecohéroe',
    descripcion: 'Reducción sostenida de consumo',
    icon: <Recycle className="size-6" />,
    unlocked: true,
    points: 200,
  },
  {
    id: 'consumo-eficiente',
    titulo: 'Consumo Eficiente',
    descripcion: 'Promedio bajo el umbral',
    icon: <Leaf className="size-6" />,
    unlocked: true,
    points: 150,
  },
  {
    id: 'mantenimiento-ejemplar',
    titulo: 'Mantenimiento ejemplar',
    descripcion: 'Chequeos al día',
    icon: <Wrench className="size-6" />,
    unlocked: true,
    points: 100,
  },
];

const RANKING = [
  { pos: 1, nombre: 'Dispositivo 1' },
  { pos: 2, nombre: 'Dispositivo 2' },
  { pos: 3, nombre: 'Dispositivo 3' },
];

export default function GamificacionPage() {
  const totalPuntos = useMemo(
    () => LOGROS.filter(l => l.unlocked).reduce((s, l) => s + l.points, 0),
    [],
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
        <TopNavApp />
      <div className="mx-auto max-w-7xl px-6 py-8">
          
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Gamificación</h1>

        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna izquierda: Logros + Ranking */}
          <div className="lg:col-span-2 space-y-8">
            {/* Logros */}
            <section>
              <h2 className="text-xl font-bold">Logros</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {LOGROS.map((l) => (
                  <article
                    key={l.id}
                    className={`rounded-2xl border p-4 shadow-sm transition ${
                      l.unlocked
                        ? 'bg-green-200/70 border-green-300'
                        : 'bg-slate-100 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center size-10 rounded-xl bg-white/70 text-green-700">
                        {l.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{l.titulo}</h3>
                        {l.descripcion && (
                          <p className="text-xs text-slate-600">{l.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                      <Sparkles className="size-4 text-amber-500" />
                      <span>{l.points} pts</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Ranking */}
            <section>
              <h2 className="text-xl font-bold">Ranking del Consumo</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full bg-white text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Posición</th>
                      <th className="px-4 py-3 text-left font-semibold">Dispositivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RANKING.map((r) => (
                      <tr key={r.pos} className="border-t">
                        <td className="px-4 py-3">{r.pos}</td>
                        <td className="px-4 py-3 font-medium">{r.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Columna derecha: Desafío del mes */}
          <aside className="space-y-6">
            <section className="rounded-2xl border-2 border-red-400 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">
                Reduce tu consumo un <span className="text-red-600">10%</span> este mes
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Completa el desafío para ganar +100 pts.
              </p>
            </section>

            {/* Puntos totales (sticky en desktop) */}
            <section className="lg:sticky lg:top-6">
              <div className="rounded-2xl border bg-white px-6 py-5 shadow-sm">
                <p className="text-lg font-extrabold text-slate-900">
                  Puntos: <span className="text-2xl">{totalPuntos}</span> en total
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
