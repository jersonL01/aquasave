// src/app/dispositivos/[id]/editar/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type Dispositivo = {
  id: string;
  nombre: string;
  tipo: string;
  marca: string;
  cantidad: number;
  descripcion: string | null;
};

export default function EditarDispositivoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>(); // /dispositivos/[id]/editar
  const [item, setItem] = useState<Dispositivo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/dispositivos/${encodeURIComponent(id)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) throw new Error(j?.error || 'No se pudo cargar');
      setItem(j.item);
    } catch (e: any) {
      setErr(e?.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    try {
      const res = await fetch(`/api/dispositivos/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: item.nombre,
          tipo: item.tipo,
          marca: item.marca,
          cantidad: item.cantidad,
          descripcion: item.descripcion ?? '',
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) throw new Error(j?.error || 'No se pudo guardar');
      router.push('/dispositivos');
      router.refresh();
    } catch (e: any) {
      alert(e?.message || 'Error al guardar');
    }
  }

  if (loading) return <div className="min-h-screen bg-white text-slate-900 p-6">Cargando…</div>;
  if (err) return <div className="min-h-screen bg-white text-slate-900 p-6 text-red-600">{err}</div>;
  if (!item) return <div className="min-h-screen bg-white text-slate-900 p-6">No encontrado.</div>;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto w-full max-w-2xl px-6 py-8">
        <button
          onClick={() => router.back()}
          className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          ← Volver
        </button>

        <h1 className="mt-4 text-2xl font-extrabold">Editar dispositivo</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {/* ID: solo lectura */}
          <div>
            <label className="block text-sm font-semibold mb-1">ID</label>
            <input
              value={item.id}
              disabled
              className="w-full rounded-xl border px-4 py-2 bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Nombre</label>
            <input
              value={item.nombre}
              onChange={(e) => setItem({ ...item, nombre: e.target.value })}
              className="w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Tipo</label>
              <input
                value={item.tipo}
                onChange={(e) => setItem({ ...item, tipo: e.target.value })}
                className="w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Marca</label>
              <input
                value={item.marca}
                onChange={(e) => setItem({ ...item, marca: e.target.value })}
                className="w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              value={item.cantidad ?? 1}
              onChange={(e) => setItem({ ...item, cantidad: Number(e.target.value) || 1 })}
              className="w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Descripción</label>
            <textarea
              value={item.descripcion ?? ''}
              onChange={(e) => setItem({ ...item, descripcion: e.target.value })}
              className="w-full min-h-[96px] rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3"
            >
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
