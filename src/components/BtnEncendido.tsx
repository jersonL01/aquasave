'use client';

import { useCallback, useState } from 'react';

type Props = {
  deviceId: string;
  deviceName?: string;
  on: boolean;
  disabled?: boolean;
  className?: string;
  onChanged?: (nextOn: boolean) => void;
  simulateOnEnable?: boolean;
  simulateEndpoint?: string; // default abajo => /api/24h
};

export default function BtnEncendido({
  deviceId,
  deviceName = 'dispositivo',
  on,
  disabled,
  className = '',
  onChanged,
  simulateOnEnable = true,
  simulateEndpoint = '/api/24h', // 👈 ahora por defecto apuntamos a la ruta que sí existe
}: Props) {
  const [busy, setBusy] = useState(false);

  const askConfirmOn = useCallback(async () => {
    try {
      const Swal = (await import('sweetalert2')).default;
      const res = await Swal.fire({
        title: 'Encender dispositivo',
        text: `¿Encender “${deviceName}”? Se registrará consumo y se simularán las últimas 24h.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, encender',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981',
      });
      return res.isConfirmed;
    } catch {
      return window.confirm(
        `¿Quieres encender el dispositivo "${deviceName}"?\n\nSe registrará consumo y se simularán las últimas 24 horas.`
      );
    }
  }, [deviceName]);

  const notify = useCallback(async (title: string, text?: string, icon: 'success' | 'error' | 'info' = 'success') => {
    try {
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({ title, text, icon, confirmButtonColor: '#0ea5e9' });
    } catch {}
  }, []);

  const handleClick = useCallback(async () => {
    const next = !on;

    if (next) {
      const ok = await askConfirmOn();
      if (!ok) return;
    }

    setBusy(true);
    try {
      // 1) Persistir encendido/apagado
      const r1 = await fetch(`/api/dispositivos/${encodeURIComponent(deviceId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ encendido: next }),
      });
      const j1 = await r1.json().catch(() => ({}));
      if (!r1.ok || j1?.ok === false) throw new Error(j1?.error || 'No se pudo cambiar el estado');

      // 2) Simular si quedó encendido
      if (next && simulateOnEnable) {
        const r2 = await fetch(simulateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ deviceId }),
        });
        const j2 = await r2.json().catch(() => ({}));
        if (!r2.ok || j2?.ok === false) {
          throw new Error(`Fallo la simulación en ${simulateEndpoint}`);
        }
      }

      onChanged?.(next);
      if (next) {
        notify('Encendido', `“${deviceName}” encendido y consumo 24h simulado.`);
      } else {
        notify('Apagado', `“${deviceName}” apagado.`, 'info');
      }
    } catch (e: any) {
      await notify('Error', e?.message || 'No se pudo completar la acción', 'error');
    } finally {
      setBusy(false);
    }
  }, [on, deviceId, askConfirmOn, simulateOnEnable, simulateEndpoint, notify, onChanged, deviceName]);

  const label = busy ? 'Procesando…' : on ? 'Apagar' : 'Encender';
  const base = 'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition';
  const look = on ? 'text-emerald-700 hover:bg-emerald-50 border-emerald-300' : 'text-slate-700 hover:bg-slate-100';
  const disabledCls = busy || disabled ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <button
      onClick={handleClick}
      disabled={busy || disabled}
      className={`${base} ${look} ${disabledCls} ${className}`}
      title={on ? 'Apagar' : 'Encender'}
    >
      {label}
    </button>
  );
}
