// app/consumo/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Droplets, RefreshCcw, AlertTriangle, CalendarDays } from "lucide-react";
import TopNavApp from "@/components/TopNavApp";

/* ---------- helpers ---------- */
type Point = { t: number; v: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// construye el path del área (simple y robusto)
function buildAreaPath(points: Point[], w: number, h: number, minV: number, maxV: number) {
  if (!points.length) return "";
  const padding = 8;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const x = (i: number) => padding + (innerW * i) / Math.max(1, points.length - 1);
  const y = (v: number) =>
    padding + innerH - ((v - minV) / Math.max(1, maxV - minV)) * innerH;

  let d = `M ${x(0)} ${y(points[0].v)}`;
  for (let i = 1; i < points.length; i++) d += ` L ${x(i)} ${y(points[i].v)}`;
  // cerrar área
  d += ` L ${x(points.length - 1)} ${padding + innerH} L ${x(0)} ${padding + innerH} Z`;
  return d;
}

/* ---------- simulación ---------- */
const TICK_MS = 3000;
const MAX_POINTS = 60; // ~3 minutos

export default function ConsumoPage() {
  const [auto, setAuto] = useState(true);
  const [now, setNow] = useState<Point[]>([]);
  const seed = useRef<number>(20); // L/min aprox

  // stats derivados
  const current = now.at(-1)?.v ?? 0;
  const avg = useMemo(() => (now.length ? now.reduce((s, p) => s + p.v, 0) / now.length : 0), [now]);
  const minV = useMemo(() => (now.length ? Math.min(...now.map((p) => p.v)) : 0), [now]);
  const maxV = useMemo(() => (now.length ? Math.max(...now.map((p) => p.v)) : 0), [now]);

  // simulador
  const tick = () => {
    const drift = (Math.random() - 0.5) * 1.4; // ruido
    seed.current = clamp(seed.current + drift, 10, 35);
    setNow((prev) => {
      const next = [...prev, { t: Date.now(), v: Number(seed.current.toFixed(1)) }];
      if (next.length > MAX_POINTS) next.shift();
      return next;
    });
  };

  useEffect(() => {
    // primer punto
    if (now.length === 0) tick();
    if (!auto) return;
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  // tamaños del gráfico
  const W = 1000;
  const H = 320;
  const areaD = buildAreaPath(now, W, H, Math.floor(minV) - 1, Math.ceil(maxV) + 1);

  /* ---------- UI ---------- */
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#071521] text-white">
      <TopNavApp />   
      
      <section className="relative overflow-hidden">
        <div className="absolute -inset-x-20 -top-40 h-[260px] bg-gradient-to-b from-sky-700/30 to-transparent blur-2xl" />
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-2 relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Consumo de agua
            </h1>
            <p className="mt-2 text-white/70">
              Datos simulados, actualizados cada <strong>3s</strong>.
            </p>
          </div>

        </div>
      </section>

      {/* métricas */}
      <section className="mx-auto max-w-7xl px-4 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Droplets className="size-5" />}
          label="Consumo actual"
          value={`${current.toFixed(1)} L/min`}
        />
        <StatCard label="Promedio" value={`${avg.toFixed(1)} L/min`} />
        <StatCard label="Rango" value={`${minV.toFixed(1)} – ${maxV.toFixed(1)} L/min`} />
      </section>

      {/* panel principal */}
      <section className="mx-auto max-w-7xl px-4 mt-6">
        <div className="rounded-3xl bg-white/7 backdrop-blur border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">Tiempo real</h2>

            <div className="flex items-center gap-3">
              <button
                onClick={tick}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 px-4 py-2 text-sm transition"
              >
                <RefreshCcw className="size-4" />
                Actualizar
              </button>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={auto}
                  onChange={(e) => setAuto(e.target.checked)}
                  className="size-4 accent-sky-500"
                />
                Auto
              </label>

              <span className="text-xs text-white/70 rounded-full bg-white/10 px-2 py-1">
                {current.toFixed(1)} L/min
              </span>
            </div>
          </div>

          {/* gráfico */}
          <div className="px-3 md:px-6 pt-6 pb-8">
            <div className="w-full overflow-x-auto">
              <svg width={W} height={H} className="rounded-xl ring-1 ring-inset ring-white/10 bg-gradient-to-b from-sky-900/20 to-transparent">
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* eje base */}
                <line x1="12" y1={H - 12} x2={W - 12} y2={H - 12} stroke="white" strokeOpacity="0.15" />

                {/* área */}
                {now.length > 1 && (
                  <path d={areaD} fill="url(#fill)" stroke="white" strokeOpacity="0.9" strokeWidth={1.5} />
                )}
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* tarjetas secundarias */}
      <section className="mx-auto max-w-7xl px-4 mt-8 grid gap-4 md:grid-cols-3">
        <MiniCard
          title="Hoy"
          value={`${(avg * 60 * 0.4).toFixed(0)} L`}
          subtitle="Estimación (40% del día)"
          icon={<CalendarDays className="size-4" />}
        />
        <MiniCard title="Semana" value={`${(avg * 60 * 24 * 7 * 0.25).toFixed(0)} L`} subtitle="Proyección" />
        <MiniCard title="Mes" value={`${(avg * 60 * 24 * 30 * 0.25).toFixed(0)} L`} subtitle="Proyección" />
      </section>

      {/* alerta de pico */}
      {current > avg + 5 && (
        <section className="mx-auto max-w-7xl px-4 mt-6">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-100 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="size-5 shrink-0" />
            <p className="text-sm">
              <strong>Pico de consumo</strong>: estás {Math.max(0, current - avg).toFixed(1)} L/min por
              sobre el promedio de la sesión.
            </p>
          </div>
        </section>
      )}

      <div className="h-14" />
    </main>
  );
}

/* ---------- UI bits ---------- */

function StatCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/8 backdrop-blur border border-white/10 shadow-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center size-9 rounded-full bg-white/15 ring-1 ring-inset ring-white/10">
          {icon ?? <Droplets className="size-5" />}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
          <p className="text-xl font-bold leading-tight mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/6 backdrop-blur border border-white/10 shadow-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/80">{title}</p>
        <div className="grid place-items-center size-8 rounded-full bg-white/10">
          {icon ?? <Droplets className="size-4" />}
        </div>
      </div>
      <p className="text-2xl font-extrabold mt-2">{value}</p>
      {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
    </div>
  );
}
