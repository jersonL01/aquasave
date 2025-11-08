'use client';

import { useEffect, useState } from 'react';
import { Leaf, Recycle, Wrench, Sparkles } from 'lucide-react';
import TopNavApp from '@/components/TopNavApp';

type ApiLogro = {
  id: string;
  titulo: string;
  descripcion?: string;
  points: number;
  unlocked: boolean;
};

type ApiRanking = {
  pos: number;
  dispositivo: string;
  litros: number;
};

type ApiData = {
  ok: boolean;
  puntos: number;
  logros: ApiLogro[];
  ranking: ApiRanking[];
};

export default function GamificacionPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [puntos, setPuntos] = useState(0);
  const [logros, setLogros] = useState<ApiLogro[]>([]);
  const [ranking, setRanking] = useState<ApiRanking[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch('/api/gamificacion', { cache: 'no-store' });
        const j: ApiData = await res.json();
        console.log('gamificacion api =>', j);
        if (!res.ok || j.ok === false) {
          throw new Error('No se pudo cargar gamificación');
        }
        setPuntos(j.puntos ?? 0);
        setLogros(j.logros ?? []);
        setRanking(j.ranking ?? []);
      } catch (e: any) {
        setErr(e?.message || 'Error al cargar gamificación');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <TopNavApp />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Gamificación</h1>
        </div>

        {err ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-500">
            {err}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Logros */}
              <section className="flex-1">
                <h2 className="text-xl font-bold mb-4">Logros</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {logros.map((l) => (
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
                          {l.id === 'ecohereo' ? (
                            <Recycle className="size-6" />
                          ) : l.id === 'consumo-eficiente' ? (
                            <Leaf className="size-6" />
                          ) : (
                            <Wrench className="size-6" />
                          )}
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
                        {!l.unlocked && <span className="text-[10px] text-slate-500">(bloqueado)</span>}
                      </div>
                    </article>
                  ))}
                  {logros.length === 0 && !loading && (
                    <p className="text-sm text-slate-500">Aún no tienes logros. Enciende un dispositivo 👇</p>
                  )}
                </div>
              </section>

              {/* Puntos totales + desafío */}
              <aside className="w-full lg:w-72 space-y-4">
                <section className="rounded-2xl border-2 border-red-400 bg-amber-50 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Reduce tu consumo un <span className="text-red-600">10%</span> este mes
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Completa el desafío para ganar +100 pts.
                  </p>
                </section>
                <section className="rounded-2xl border bg-white px-6 py-5 shadow-sm">
                  <p className="text-lg font-extrabold text-slate-900">
                    Puntos: <span className="text-2xl">{puntos}</span> en total
                  </p>
                </section>
              </aside>
            </div>

            {/* Ranking */}
            <section className="mt-8">
              <h2 className="text-xl font-bold mb-4">Ranking del Consumo</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full bg-white text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Posición</th>
                      <th className="px-4 py-3 text-left font-semibold">Dispositivo</th>
                      <th className="px-4 py-3 text-left font-semibold">Litros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r) => (
                      <tr key={r.pos} className="border-t">
                        <td className="px-4 py-3">{r.pos}</td>
                        <td className="px-4 py-3 font-medium">{r.dispositivo}</td>
                        <td className="px-4 py-3">{r.litros}</td>
                      </tr>
                    ))}
                    {ranking.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-5 text-center text-slate-500">
                          Aún no hay consumo para rankear.
                        </td>
                      </tr>
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
