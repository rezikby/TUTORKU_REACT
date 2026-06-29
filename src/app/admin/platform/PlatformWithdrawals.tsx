/**
 * FILE: frontend/src/app/admin/platform/PlatformWithdrawals.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import { alertError } from "../../lib/swal";
import { Skeleton } from "../../components/ui";

type WithdrawalItem = {
  id: number;
  tutorProfile?: { user?: { name: string } };
  amount: number;
  bank_name: string;
  bank_account_number: string;
  status: string;
  created_at: string;
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  processing: "bg-blue-500/15 text-blue-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

export default function PlatformWithdrawals() {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch(`/admin/withdrawals?status=${status}`);
      setItems(data.data ?? data);
    } catch (e) {
      console.error("Gagal memuat pencairan dana", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const updateStatus = async (id: number, newStatus: string) => {
    setActingId(id);
    try {
      await adminApiFetch(`/admin/withdrawals/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      load();
    } catch (e: any) {
      alertError(e.message || "Gagal memperbarui status pencairan.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pending", "processing", "completed", "rejected"].map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={`px-4 py-2 rounded-sm text-xs font-medium capitalize ${status === f ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-slate-400"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Tidak ada pengajuan pada kategori ini.</p>
      ) : (
        <div className="space-y-2">
          {items.map((w) => (
            <div key={w.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-white font-medium text-sm">{w.tutorProfile?.user?.name ?? "Tutor"}</div>
                <div className="text-xs text-slate-400">Rp {w.amount.toLocaleString("id-ID")} · {w.bank_name} {w.bank_account_number}</div>
                <div className="text-[10px] text-slate-500">{new Date(w.created_at).toLocaleDateString("id-ID")}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[w.status]}`}>{w.status}</span>
                {w.status === "pending" && (
                  <>
                    <button onClick={() => updateStatus(w.id, "processing")} disabled={actingId === w.id} className="px-3 py-1 rounded-sm bg-blue-600 text-white text-xs font-semibold disabled:opacity-60">Proses</button>
                    <button onClick={() => updateStatus(w.id, "rejected")} disabled={actingId === w.id} className="px-3 py-1 rounded-sm bg-red-600 text-white text-xs font-semibold disabled:opacity-60">Tolak</button>
                  </>
                )}
                {w.status === "processing" && (
                  <button onClick={() => updateStatus(w.id, "completed")} disabled={actingId === w.id} className="px-3 py-1 rounded-sm bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60">Selesaikan</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
