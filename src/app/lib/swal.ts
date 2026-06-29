/**
 * FILE: frontend/src/app/lib/swal.ts
 * STATUS: BARU
 */

import Swal from "sweetalert2";

/**
 * Helper SweetAlert2 dengan tema Biru & Putih TUTORKU, dipakai untuk SELURUH
 * popup di aplikasi (sesuai instruksi: "Seluruh popup gunakan SweetAlert2").
 * Tidak banyak shadow / border-radius besar, konsisten dengan gaya platform
 * edukasi modern yang diminta.
 */

const BRAND_COLOR = "#3B7EFF";

const baseConfig = {
  confirmButtonColor: BRAND_COLOR,
  cancelButtonColor: "#94A3B8",
  buttonsStyling: true,
  customClass: {
    popup: "TUTORKU-swal-popup",
    confirmButton: "TUTORKU-swal-confirm",
    cancelButton: "TUTORKU-swal-cancel",
  },
};

export function alertSuccess(title: string, text?: string) {
  return Swal.fire({ ...baseConfig, icon: "success", title, text });
}

export function alertError(title: string, text?: string) {
  return Swal.fire({ ...baseConfig, icon: "error", title, text });
}

export function alertInfo(title: string, text?: string) {
  return Swal.fire({ ...baseConfig, icon: "info", title, text });
}

export function alertWarning(title: string, text?: string) {
  return Swal.fire({ ...baseConfig, icon: "warning", title, text });
}

export function confirmAction(
  title: string,
  text?: string,
  confirmText = "Ya, lanjutkan",
  cancelText = "Batal",
) {
  return Swal.fire({
    ...baseConfig,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  }).then((result) => result.isConfirmed);
}

export function toastSuccess(title: string) {
  return Swal.fire({
    ...baseConfig,
    icon: "success",
    title,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

export function toastError(title: string) {
  return Swal.fire({
    ...baseConfig,
    icon: "error",
    title,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function loadingAlert(title: string) {
  Swal.fire({
    ...baseConfig,
    title,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
}

export function closeAlert() {
  Swal.close();
}

export { Swal };
