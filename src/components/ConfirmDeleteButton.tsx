"use client";

import Swal from "sweetalert2";
import { MouseEvent, useState } from "react";

type Props = {
  onConfirm: () => Promise<void> | void;
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  className?: string;
  children?: React.ReactNode; // contenido del botón
};

export default function ConfirmDeleteButton({
  onConfirm,
  title = "¿Eliminar?",
  text = "Esta acción no se puede deshacer.",
  confirmText = "Sí, eliminar",
  cancelText = "Cancelar",
  className = "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50",
  children = "Eliminar",
}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (busy) return;

    const res = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#e02424",
    });

    if (!res.isConfirmed) return;

    try {
      setBusy(true);
      await onConfirm();
      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Eliminado correctamente",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Ups",
        text: err?.message || "No se pudo eliminar",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={handleClick} className={className} disabled={busy}>
      {children}
    </button>
  );
}
