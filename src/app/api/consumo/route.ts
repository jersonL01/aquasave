import { NextResponse } from "next/server"
let current = 18; 

export async function GET() {
  const now = Date.now();

  // Tendencia suave + ruido
  const drift = Math.sin(now / 60_000) * 3;        
  const step  = (Math.random() - 0.5) * 1.8;        
  current = Math.max(0, current + step);            

  const value = Math.max(0, Math.round((current + drift) * 10) / 10);

  // Simula cortes de noche (00–06 baja más)
  const h = new Date(now).getHours();
  const nightFactor = h >= 0 && h < 6 ? 0.6 : 1;
  const finalValue = Math.round(value * nightFactor * 10) / 10;

  return NextResponse.json({
    ok: true,
    ts: now,
    value: finalValue,        
    unit: "L/min",
  });
}
