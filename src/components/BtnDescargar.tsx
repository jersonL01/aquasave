"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";

type Props = {
  from: string;
  to: string;
  deviceId: string; // "Todos" o id
  className?: string;
};

export default function BtnDescargarPDF({ from, to, deviceId, className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      setLoading(true);

      const qs = new URLSearchParams();
      qs.set("from", from);
      qs.set("to", to);
      if (deviceId && deviceId !== "Todos") qs.set("deviceId", deviceId);

      const res = await fetch(`/api/reportes/pdf?${qs.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error("No se pudo generar el PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte-consumo.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No se pudo descargar el PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60 ${className}`}
    >
      <FileDown className="size-4" />
      {loading ? "Generando..." : "Descargar PDF"}
    </button>
  );
}
