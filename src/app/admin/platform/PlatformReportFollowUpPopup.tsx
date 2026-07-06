"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { X, Clock, AlertCircle, CheckCircle } from "lucide-react";

type ReportItem = {
  id: number;
  reporter?: { name: string };
  reportable_type: string;
  category: string;
  reason?: string | null;
  status: string;
  created_at: string;
};

type ReportAction = "suspend_permanent" | "suspend_temporary" | "dismiss";

interface PlatformReportFollowUpPopupProps {
  open: boolean;
  report: ReportItem | null;
  onOpenChange: (open: boolean) => void;
  onAction: (
    reportId: number,
    action: ReportAction,
    payload: { note: string; durationHours?: number },
  ) => Promise<void>;
  actionLoading: boolean;
  initialAction?: ReportAction | null;
}

const categoryLabel: Record<string, string> = {
  penipuan: "Penipuan",
  spam: "Spam",
  konten_tidak_sesuai: "Konten Tidak Sesuai",
  pelecehan: "Pelecehan",
  lainnya: "Lainnya",
};

const actionTitle: Record<ReportAction, string> = {
  suspend_permanent: "Suspend Permanen",
  suspend_temporary: "Suspend Sementara",
  dismiss: "Batalkan Laporan",
};

export default function PlatformReportFollowUpPopup({
  open,
  report,
  onOpenChange,
  onAction,
  actionLoading,
  initialAction,
}: PlatformReportFollowUpPopupProps) {
  const [selectedAction, setSelectedAction] = useState<ReportAction | null>(initialAction ?? null);
  const [note, setNote] = useState("");
  const [durationHours, setDurationHours] = useState(24);

  React.useEffect(() => {
    if (open) {
      setSelectedAction(initialAction ?? null);
    } else {
      setSelectedAction(null);
      setNote("");
      setDurationHours(24);
    }
  }, [open, initialAction]);

  const actionLabel = useMemo(() => {
    return selectedAction ? actionTitle[selectedAction] : "Pilih Aksi";
  }, [selectedAction]);

  const handleConfirm = async () => {
    if (!report || !selectedAction) return;
    if (selectedAction === "suspend_temporary" && durationHours <= 0) return;

    await onAction(report.id, selectedAction, {
      note,
      durationHours: selectedAction === "suspend_temporary" ? durationHours : undefined,
    });
    setSelectedAction(null);
    setNote("");
    setDurationHours(24);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100%,560px)] w-full p-0 rounded-3xl overflow-hidden border border-gray-200 bg-white">
        <DialogHeader className="relative border-b border-gray-200 px-5 py-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">Detail Laporan</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Tinjau detail laporan sebelum mengambil tindakan terhadap akun yang dilaporkan.
          </DialogDescription>
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <X size={18} />
              <span className="sr-only">Tutup</span>
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {report ? (
            <>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Kategori</span>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
                    {categoryLabel[report.category] ?? report.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-500" />
                  <span>{new Date(report.created_at).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-gray-500" />
                  <span>Dilaporkan oleh: {report.reporter?.name ?? "Pengguna"}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">Alasan</div>
                  <p className="mt-1 whitespace-pre-wrap">{report.reason ?? "Tidak ada detail"}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5">{report.reportable_type.split("\\").pop()}</span>
                  <span className="text-gray-400">Status laporan: {report.status}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSelectedAction("suspend_permanent")}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    selectedAction === "suspend_permanent"
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                  }`}
                >
                  Suspend Permanen
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction("suspend_temporary")}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    selectedAction === "suspend_temporary"
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  Suspend Sementara
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction("dismiss")}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    selectedAction === "dismiss"
                      ? "border-gray-600 bg-gray-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Abaikan Laporan
                </button>
              </div>

              {selectedAction === "suspend_temporary" && (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Durasi Suspend</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm text-gray-700">
                      Lama suspend (jam)
                      <input
                        type="number"
                        min={1}
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none"
                      />
                    </label>
                  </div>
                  <div className="text-sm text-gray-700">
                    Setelah periode ini selesai, akun akan dikembalikan secara otomatis.
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <label className="text-sm font-medium text-gray-900">Catatan Admin</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={selectedAction === "dismiss" ? "Masukkan alasan mengabaikan laporan" : "Masukkan alasan untuk menonaktifkan akun"}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none"
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">Pilih laporan untuk melihat detail.</div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end sm:items-center">
          <DialogClose asChild>
            <button
              type="button"
              className="w-full sm:w-auto rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tutup
            </button>
          </DialogClose>
          <button
            type="button"
            disabled={!report || !selectedAction || actionLoading}
            onClick={handleConfirm}
            className="w-full sm:w-auto rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLoading ? "Memproses..." : actionLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
