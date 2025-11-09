// src/app/comparacion/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TopNavApp from "@/components/TopNavApp";
import { Calendar, Droplets } from "lucide-react";

type ApiRow = {
  fecha: string;
  dispositivo_id: string;
  dispositivo: string;
  consumo: number;
  costo: number;
};

const fmtCL = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(n);

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
  });

const monthShort = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { month: "short" });
};

export default function ComparacionPage() {
  // rango: desde inicio de mes hasta hoy
  const todayIso = new Date().toISOString().slice(0, 10);
  const firstDay = new Date();
  firstDay.setDate(1);
  const [desde, setDesde] = useState(firstDay.toISOString().slice(0, 10));

  const [data, setData] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // cargar
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams();
        qs.set("from", desde);
        qs.set("to", todayIso);

        const res = await fetch(`/api/reportes/consumo?${qs.toString()}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok || j?.ok === false) {
          throw new Error(j?.error || "No se pudo obtener consumo");
        }
        setData(j.items ?? []);
      } catch (e: any) {
        setErr(e?.message || "Error al cargar");
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [desde, todayIso]);

  // agrupar por dispositivo
  const dispositivos = useMemo(() => {
    const map = new Map<
      string,
      {
        nombre: string;
        rows: ApiRow[];
        total: number;
        costo: number;
      }
    >();

    for (const r of data) {
      const key = r.dispositivo_id || "sin-id";
      if (!map.has(key)) {
        map.set(key, {
          nombre: r.dispositivo || r.dispositivo_id || "Dispositivo",
          rows: [],
          total: 0,
          costo: 0,
        });
      }
      const d = map.get(key)!;
      d.rows.push(r);
      d.total += r.consumo;
      d.costo += r.costo;
    }

    // ordena de mayor consumo a menor
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  // para calcular % vs top
  const topTotal = dispositivos.length ? dispositivos[0].total : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <TopNavApp />

      {/* header */}
      <div className="bg-slate-200/70 border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-white">
            <Droplets className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Comparación por periodo
            </h1>
            <p className="text-slate-600 text-sm">
              Consumo de agua desde la fecha seleccionada hasta hoy (
              {fmtDay(todayIso)}).
            </p>
          </div>
        </div>
      </div>

      {/* contenido */}
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* filtro */}
        <section className="rounded-2xl bg-white p-4 shadow-sm border flex items-center gap-4">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="size-4" />
            Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <p className="text-xs text-slate-500">
            Hasta: <span className="font-mono">{fmtDay(todayIso)}</span>
          </p>
        </section>

        {/* estado */}
        {err ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-red-500">
            {err}
          </div>
        ) : loading ? (
          <div className="rounded-xl bg-white p-5 text-center shadow-sm border">
            Cargando…
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="rounded-xl bg-white p-5 text-center shadow-sm border text-slate-500">
            No hay consumos registrados en este periodo.
          </div>
        ) : (
          <div className="space-y-6">
            {dispositivos.map((d) => (
              <DeviceDashboard
                key={d.id}
                dispositivo={d}
                topTotal={topTotal}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------------- DEVICE DASHBOARD ----------------- */

function DeviceDashboard({
  dispositivo,
  topTotal,
}: {
  dispositivo: {
    id: string;
    nombre: string;
    rows: ApiRow[];
    total: number;
    costo: number;
  };
  topTotal: number;
}) {
  // serie diaria (para los 3 charts)
  const daily = useMemo(() => {
    const m = new Map<string, { litros: number; costo: number }>();
    for (const r of dispositivo.rows) {
      const day = r.fecha.slice(0, 10);
      if (!m.has(day)) m.set(day, { litros: 0, costo: 0 });
      const obj = m.get(day)!;
      obj.litros += r.consumo;
      obj.costo += r.costo;
    }
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, { litros, costo }]) => ({ fecha, litros, costo }));
  }, [dispositivo.rows]);

  const percent = topTotal > 0 ? Math.round((dispositivo.total / topTotal) * 100) : 0;

  return (
    <section className="rounded-2xl bg-white border shadow-sm p-5 space-y-4">
      {/* encabezado del dispositivo */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 grid place-items-center text-xs font-semibold">
            {dispositivo.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {dispositivo.nombre}
            </p>
            <p className="text-[11px] text-slate-400">ID: {dispositivo.id}</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
          {dispositivo.rows.length} reg.
        </span>
      </header>

      {/* fila de KPIs + donut */}
      <div className="grid gap-4 md:grid-cols-[1.2fr_1.2fr_auto] items-stretch">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[11px] uppercase text-slate-400">Consumo total</p>
          <p className="text-2xl font-bold text-slate-900">
            {fmtCL(dispositivo.total)} L
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[11px] uppercase text-slate-400">Costo total</p>
          <p className="text-2xl font-bold text-emerald-600">
            ${fmtCL(dispositivo.costo)}
          </p>
        </div>
        <CircularVsTop percent={percent} />
      </div>

      {/* 3 dashboards separados */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GeneralStats data={daily} />
        <MainSchedule
          primary={daily.map((d) => ({
            label: fmtDay(d.fecha),
            value: d.litros,
          }))}
          secondary={daily.map((d) => ({
            label: fmtDay(d.fecha),
            value: d.costo,
          }))}
        />
        <AccountGrowth
          data={daily.map((d) => ({
            label: fmtDay(d.fecha),
            value: d.litros,
          }))}
        />
      </div>
    </section>
  );
}

/* ----------------- COMPONENTES DE GRAFICO ------------------ */

// donut simple con label
function CircularVsTop({ percent }: { percent: number }) {
  const size = 82;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (percent / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#0ea5e9"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900 text-sm"
          fontSize={14}
        >
          {percent}%
        </text>
      </svg>
      <p className="mt-1 text-[10px] text-slate-400 uppercase">vs top</p>
    </div>
  );
}

// 1) línea estilo general stats
function GeneralStats({ data }: { data: { fecha: string; litros: number }[] }) {
  const ordered = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const W = 520;
  const H = 180;
  const pad = 32;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const max = Math.max(...ordered.map((d) => d.litros), 1);

  const x = (i: number) =>
    pad + (innerW * i) / Math.max(1, ordered.length - 1);
  const y = (v: number) => pad + innerH - (v / max) * innerH;

  let path = "";
  ordered.forEach((d, i) => {
    const xx = x(i);
    const yy = y(d.litros);
    path += i === 0 ? `M ${xx} ${yy}` : ` L ${xx} ${yy}`;
  });
  const area =
    path + ` L ${x(ordered.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Tendencia de consumo
      </h3>
      {ordered.length === 0 ? (
        <p className="text-xs text-slate-400">Sin datos</p>
      ) : (
        <svg width={W} height={H} className="block max-w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={pad}
              y1={pad + innerH * g}
              x2={W - pad}
              y2={pad + innerH * g}
              stroke="#eef2f7"
            />
          ))}
          <path d={area} fill="rgba(59,130,246,0.12)" />
          <path d={path} stroke="#3b82f6" strokeWidth={2.5} fill="none" />
          {ordered.map((d, i) => (
            <g key={d.fecha}>
              <circle
                cx={x(i)}
                cy={y(d.litros)}
                r={4.5}
                fill="#fff"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </g>
          ))}
          {ordered.map((d, i) => (
            <text
              key={d.fecha + "-label"}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {monthShort(d.fecha)}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

// 2) barras dobles
function MainSchedule({
  primary,
  secondary,
}: {
  primary: { label: string; value: number }[];
  secondary: { label: string; value: number }[];
}) {
  const W = 520;
  const H = 180;
  const pad = 32;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const max = Math.max(
    ...primary.map((d) => d.value),
    ...secondary.map((d) => d.value),
    1
  );

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Consumo vs costo diario
      </h3>
      <svg width={W} height={H} className="block max-w-full">
        <line
          x1={pad}
          y1={H - pad}
          x2={W - pad}
          y2={H - pad}
          stroke="#e2e8f0"
        />
        {primary.map((d, i) => {
          const slot = innerW / primary.length;
          const x = pad + i * slot + 3;
          const h1 = (d.value / max) * innerH;
          const h2 = ((secondary[i]?.value ?? 0) / max) * innerH;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={H - pad - h1}
                width={slot / 2 - 6}
                height={h1}
                rx={6}
                fill="#2563eb"
              />
              <rect
                x={x + slot / 2}
                y={H - pad - h2}
                width={slot / 2 - 6}
                height={h2}
                rx={6}
                fill="#f97316"
              />
              <text
                x={x + slot / 2}
                y={H - pad + 14}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex gap-4 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Consumo
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#f97316]" /> Costo
        </span>
      </div>
    </div>
  );
}

// 3) barras crecientes
function AccountGrowth({ data }: { data: { label: string; value: number }[] }) {
  const W = 520;
  const H = 140;
  const pad = 30;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = innerW / Math.max(1, data.length) - 8;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Acumulado del periodo
      </h3>
      {data.length === 0 ? (
        <p className="text-xs text-slate-400">Sin datos</p>
      ) : (
        <svg width={W} height={H} className="block max-w-full">
          <line
            x1={pad}
            y1={H - pad}
            x2={W - pad}
            y2={H - pad}
            stroke="#e2e8f0"
          />
          {data.map((d, i) => {
            const h = (d.value / max) * innerH;
            const x = pad + i * (bw + 8);
            const y = H - pad - h;
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={y}
                  width={bw}
                  height={h}
                  rx={8}
                  fill="#0ea5e9"
                />
                <title>{d.value.toFixed(0)} L</title>
              </g>
            );
          })}
          {data.map((d, i) => (
            <text
              key={d.label + "-l"}
              x={pad + i * (bw + 8) + bw / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
            >
              {d.label}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
