"use client";
import Swal, { SweetAlertIcon } from "sweetalert2";

// ---------- Helpers básicos ----------
export const alertSuccess = (title: string, text?: string) =>
  Swal.fire({ icon: "success", title, text, confirmButtonText: "OK" });

export const alertError = (title: string, text?: string) =>
  Swal.fire({ icon: "error", title, text, confirmButtonText: "OK" });

export const alertInfo = (title: string, text?: string) =>
  Swal.fire({ icon: "info", title, text, confirmButtonText: "OK" });

// ---------- Confirmaciones ----------
export async function alertConfirm(
  title = "¿Deseas cerrar sesión?",
  text = "Se cerrará tu sesión actual.",
  confirmText = "Sí, cerrar sesión",
  cancelText = "Cancelar",
  icon: SweetAlertIcon = "question"
): Promise<boolean> {
  const r = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
  });
  return r.isConfirmed;
}

// ---------- Toasts (arriba a la derecha) ----------
export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1400,
  timerProgressBar: true,
});

export const toastSuccess = (title: string) =>
  toast.fire({ icon: "success", title });

export const toastError = (title: string) =>
  toast.fire({ icon: "error", title });
