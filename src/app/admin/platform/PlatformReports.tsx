/**
 * FILE: frontend/src/app/admin/platform/PlatformReports.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import { alertError } from "../../lib/swal";
import { Skeleton } from "../../components/ui";

type ReportItem = {
  id: number;
  reporter?: { name: string };
  reportable_type: string;
  category: string;
  reason?: string | null;
  status: string;
  created_at: string;
};

const categoryLabel: Record<string, string> = {
  penipuan: "Penipuan",
  spam: "Spam",
  konten_tidak_sesuai: "Konten Tidak Sesuai",
  pelecehan: "Pelecehan",
  lainnya: "Lainnya",
};

const statusColor: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-400",
  reviewed: "bg-blue-500/15 text-blue-400",
  action_taken: "bg-emerald-500/15 text-emerald-400",
  dismissed: "bg-slate-500/15 text-slate-400",
};

export default function PlatformReports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [note, setNote] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch(`/admin/reports?status=${status}`);
      setReports(data.data ?? data);
    } catch (e) {
      console.error("Gagal memuat laporan", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const resolve = async (id: number, newStatus: string) => {
    setActingId(id);
    try {
      await adminApiFetch(`/admin/reports/${id}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus, note: note[id] ?? undefined }),
      });
      load();
    } catch (e: any) {
      alertError(e.message || "Gagal memperbarui laporan.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["open", "reviewed", "action_taken", "dismissed"].map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={`px-4 py-2 rounded-sm text-xs font-medium ${status === f ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-slate-400"}`}>
            {f === "open" ? "Menunggu" : f === "reviewed" ? "Ditinjau" : f === "action_taken" ? "Ditindak" : "Diabaikan"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Tidak ada laporan pada kategori ini.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-white font-medium text-sm">
                    {categoryLabel[r.category] ?? r.category} · <span className="text-slate-400">{r.reportable_type.split("\\").pop()}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Dilaporkan oleh: {r.reporter?.name ?? "Pengguna"}</div>
                  {r.reason && <p className="text-xs text-slate-300 mt-1">"{r.reason}"</p>}
                  <div className="text-[10px] text-slate-500 mt-1">{new Date(r.created_at).toLocaleString("id-ID")}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>{r.status}</span>
              </div>

              {r.status === "open" && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  <input
                    value={note[r.id] ?? ""}
                    onChange={(e) => setNote((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Catatan tindak lanjut (opsional)"
                    className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-sm outline-none"
                  />
                  <button onClick={() => resolve(r.id, "action_taken")} disabled={actingId === r.id} className="px-3 py-2 rounded-sm bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60">
                    Tindak Lanjuti
                  </button>
                  <button onClick={() => resolve(r.id, "dismissed")} disabled={actingId === r.id} className="px-3 py-2 rounded-sm bg-slate-600 text-white text-xs font-semibold disabled:opacity-60">
                    Abaikan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
