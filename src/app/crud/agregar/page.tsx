'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Dispositivo = {
  id: string;
  nombre: string;
  tipo: string;
  marca: string;
  cantidad: number;      // <-- antes era 'serie'
  descripcion: string;
};

export default function NuevoDispositivoPage() {
  const router = useRouter();

  const [form, setForm] = useState<Dispositivo>({
    id: '',
    nombre: '',
    tipo: '',
    marca: '',
    cantidad: 1,          // <-- valor por defecto válido
    descripcion: '',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function set<K extends keyof Dispositivo>(k: K, v: Dispositivo[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function validar(d: Dispositivo): string | null {
    if (!d.id.trim()) return 'El ID del dispositivo es obligatorio.';
    if (!d.nombre.trim()) return 'El nombre es obligatorio.';
    if (!d.tipo.trim()) return 'El tipo de dispositivo es obligatorio.';
    if (!d.marca.trim()) return 'La marca es obligatoria.';
    if (!Number.isFinite(d.cantidad) || d.cantidad <= 0) return 'La cantidad debe ser un número mayor a 0.';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const err = validar(form);
    if (err) return setMsg({ kind: 'err', text: err });

    setLoading(true);
    try {
      const res = await fetch('/api/dispositivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),  // envía { id, nombre, tipo, marca, cantidad, descripcion }
        credentials: 'include',
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) {
        throw new Error(j?.error || 'No se pudo guardar el dispositivo');
      }

      setMsg({ kind: 'ok', text: 'Dispositivo guardado.' });
      router.replace('/dispositivos');
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'Error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-start justify-center md:items-center">
      <main className="w-full max-w-2xl px-6 py-10">
        {/* Volver */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Volver atrás
          </button>
        </div>

        <h1 className="text-2xl font-extrabold text-center">Agregar Dispositivo</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="id" className="mb-1 block text-sm font-semibold">
              ID del Dispositivo
            </label>
            <input
              id="id"
              value={form.id}
              onChange={e => set('id', e.target.value)}
              placeholder="Ej: AQA-001"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-semibold">
              Nombre del dispositivo
            </label>
            <input
              id="nombre"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Medidor Principal"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo" className="mb-1 block text-sm font-semibold">
                Tipo de dispositivo
              </label>
              <input
                id="tipo"
                value={form.tipo}
                onChange={e => set('tipo', e.target.value)}
                placeholder="Lavadora / Duchas / etc."
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="marca" className="mb-1 block text-sm font-semibold">
                Marca
              </label>
              <input
                id="marca"
                value={form.marca}
                onChange={e => set('marca', e.target.value)}
                placeholder="AquaSense"
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cantidad" className="mb-1 block text-sm font-semibold">
              Cantidad
            </label>
            <input
              id="cantidad"
              type="number"
              min={1}
              value={Number.isFinite(form.cantidad) ? form.cantidad : 1}
              onChange={e => set('cantidad', Number(e.target.value))}
              placeholder="1, 2, 3…"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="mb-1 block text-sm font-semibold">
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Ej: Medidor ubicado en cocina, conectado a red interna…"
              className="w-full min-h-[96px] rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 resize-y"
            />
          </div>

          {msg && (
            <p className={`text-sm ${msg.kind === 'err' ? 'text-red-600' : 'text-emerald-700'}`}>
              {msg.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-900 shadow hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Guardar dispositivo'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
