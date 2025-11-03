'use client';

import TopNavApp from '@/components/TopNavApp';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConfirmDeleteButton from '@/components/ConfirmDeleteButton';
import BtnEncendido from '@/components/BtnEncendido';

type Dispositivo = {
  id: string;
  nombre: string;
  tipo: string;
  marca: string;
  cantidad: number;
  descripcion: string | null;
  creado_en?: string;
  encendido?: boolean; // <- viene de la API
};

function sortDispositivos(list: Dispositivo[]) {
  return [...list].sort(
    (a, b) =>
      String(a.id).localeCompare(String(b.id), 'es', { numeric: true, sensitivity: 'base' }) ||
      String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' }) ||
      (a.descripcion ?? '').localeCompare(b.descripcion ?? '', 'es', { sensitivity: 'base' })
  );
}

export default function DispositivosVinculadosPage() {
  const router = useRouter();

  const [items, setItems] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [statusById, setStatusById] = useState<Record<string, boolean>>({});
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es-ES') : '—');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/dispositivos', { credentials: 'include', cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) throw new Error(j?.error || 'No se pudo cargar');
      const arr: Dispositivo[] = Array.isArray(j.items) ? j.items : [];
      setItems(sortDispositivos(arr));
      setStatusById(() => {
        const m: Record<string, boolean> = {};
        for (const d of arr) m[d.id] = !!d.encendido;
        return m;
      });
    } catch (e: any) {
      setErr(e?.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleEdit(id: string) {
    router.push(`/crud/${encodeURIComponent(id)}/editar`);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopNavApp />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Mis Dispositivos</h1>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              title="Actualizar"
            >
              Actualizar
            </button>
            <Link
              href="/crud/agregar"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-900 shadow hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <Plus className="h-4 w-4" /> Agregar
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-600 text-sm">Cargando…</p>
        ) : err ? (
          <p className="text-red-600 text-sm">{err}</p>
        ) : items.length === 0 ? (
          <p className="text-slate-600 text-sm">Aún no has agregado dispositivos.</p>
        ) : (
          <section className="mt-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden md:grid grid-cols-[2fr_1.2fr_1.2fr_.7fr_1fr_1fr_1.2fr] gap-x-4 items-center px-5 py-3 border-b bg-slate-50 text-[12px] font-semibold text-slate-800">
                <span>Nombre del dispositivo</span>
                <span>Tipo</span>
                <span>Marca</span>
                <span className="text-center">Cantidad</span>
                <span>Estado</span>
                <span>Creado</span>
                <span className="text-center">Acciones</span>
              </div>

              <ul className="divide-y divide-slate-200">
                {items.map(d => {
                  const on = !!statusById[d.id];
                  const busy = !!busyById[d.id];

                  return (
                    <li key={d.id} className="px-5 py-4">
                      {/* Desktop */}
                      <div className="hidden md:grid grid-cols-[2fr_1.2fr_1.2fr_.7fr_1fr_1fr_1.2fr] gap-x-4 items-center">
                        <div>
                          <div className="font-medium text-slate-900">{d.nombre}</div>
                          <div className="text-[11px] text-slate-500">ID: {d.id}</div>
                          {d.descripcion && (
                            <div className="mt-1 text-xs text-slate-600 line-clamp-2">{d.descripcion}</div>
                          )}
                        </div>

                        <div className="text-slate-700">{d.tipo}</div>
                        <div className="text-slate-700">{d.marca}</div>
                        <div className="text-center">{d.cantidad}</div>

                        <div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              on ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span className={`size-2 rounded-full ${on ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                            {on ? 'Encendido' : 'Apagado'}
                          </span>
                        </div>

                        <div className="text-slate-700">{fmtDate(d.creado_en)}</div>

                        <div className="flex justify-center gap-2">
                          <BtnEncendido
                            deviceId={d.id}
                            deviceName={d.nombre}
                            on={on}
                            disabled={busy}
                            onChanged={(nextOn) => {
                              setStatusById(m => ({ ...m, [d.id]: nextOn }));
                              setBusyById(m => ({ ...m, [d.id]: false }));
                            }}
                            simulateOnEnable={true}
                            simulateEndpoint="/api/simular/24h"
                          />

                          <button
                            onClick={() => router.push(`/crud/${encodeURIComponent(d.id)}/editar`)}
                            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" /> Editar
                          </button>

                          <ConfirmDeleteButton
                            onConfirm={async () => {
                              setBusyById(m => ({ ...m, [d.id]: true }));
                              try {
                                const res = await fetch(`/api/dispositivos/${encodeURIComponent(d.id)}`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                });
                                const j = await res.json().catch(() => ({}));
                                if (!res.ok || j?.ok === false) {
                                  throw new Error(j?.error || 'No se pudo eliminar');
                                }
                                setItems(prev => prev.filter(x => x.id !== d.id));
                                setStatusById(m => {
                                  const { [d.id]: _omit, ...rest } = m;
                                  return rest;
                                });
                              } finally {
                                setBusyById(m => ({ ...m, [d.id]: false }));
                              }
                            }}
                          >
                            Eliminar
                          </ConfirmDeleteButton>
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden grid gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{d.nombre}</div>
                          <div className="text-[11px] text-slate-500">ID: {d.id}</div>
                          {d.descripcion && <div className="mt-1 text-xs text-slate-600">{d.descripcion}</div>}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-slate-500">Tipo</div>
                            <div className="font-medium">{d.tipo}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Marca</div>
                            <div className="font-medium">{d.marca}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Cantidad</div>
                            <div className="font-medium">{d.cantidad}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Creado</div>
                            <div className="font-medium">{fmtDate(d.creado_en)}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              statusById[d.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`size-2 rounded-full ${
                                statusById[d.id] ? 'bg-emerald-600' : 'bg-slate-500'
                              }`}
                            />
                            {statusById[d.id] ? 'Encendido' : 'Apagado'}
                          </span>

                          <div className="flex gap-2">
                            <BtnEncendido
                              deviceId={d.id}
                              deviceName={d.nombre}
                              on={!!statusById[d.id]}
                              disabled={!!busyById[d.id]}
                              onChanged={(nextOn) => {
                                setStatusById(m => ({ ...m, [d.id]: nextOn }));
                                setBusyById(m => ({ ...m, [d.id]: false }));
                              }}
                              simulateOnEnable={true}
                              simulateEndpoint="/api/simular/24h"
                              className="rounded-md border px-3 py-1.5 text-xs font-semibold text-slate-700"
                            />

                            <button
                              onClick={() => handleEdit(d.id)}
                              className="rounded-md border px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              Editar
                            </button>

                            <ConfirmDeleteButton
                              onConfirm={async () => {
                                const res = await fetch(`/api/dispositivos/${encodeURIComponent(d.id)}`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                });
                                const j = await res.json().catch(() => ({}));
                                if (!res.ok || j?.ok === false) {
                                  throw new Error(j?.error || 'No se pudo eliminar');
                                }
                                setItems(prev => prev.filter(x => x.id !== d.id));
                                setStatusById(m => {
                                  const { [d.id]: _omit, ...rest } = m;
                                  return rest;
                                });
                              }}
                            >
                              Eliminar
                            </ConfirmDeleteButton>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
