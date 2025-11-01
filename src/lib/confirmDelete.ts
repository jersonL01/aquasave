// "use client" NO hace falta en utils puras
import Swal from "sweetalert2";

type Opts = {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
};

export async function confirmDelete(opts: Opts = {}) {
  const {
    title = "¿Eliminar?",
    text = "Esta acción no se puede deshacer.",
    confirmText = "Sí, eliminar",
    cancelText = "Cancelar",
  } = opts;

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

  return res.isConfirmed;
}

export async function alertSuccess(msg = "Eliminado correctamente") {
  await Swal.fire({
    icon: "success",
    title: "Listo",
    text: msg,
    timer: 1500,
    showConfirmButton: false,
  });
}

export async function alertError(msg = "Ocurrió un error") {
  await Swal.fire({
    icon: "error",
    title: "Ups",
    text: msg,
  });
}
