/**
 * FILE: frontend/src/app/admin/platform/PlatformPayments.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";

type PaymentItem = {
  id: number;
  invoice_number: string;
  gateway: string;
  method?: string | null;
  amount: number;
  status: string;
  paid_at?: string | null;
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
  expired: "bg-slate-500/15 text-slate-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function PlatformPayments() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = status ? `?status=${status}` : "";
        const data = await adminApiFetch(`/admin/payments${params}`);
        setPayments(data.data ?? data);
      } catch (e) {
        console.error("Gagal memuat pembayaran", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status]);

  return (
    <div className="space-y-4">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm">
        <option value="">Semua Status</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="failed">Failed</option>
        <option value="expired">Expired</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat pembayaran...</p>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-white/10">
                <th className="p-3">Invoice</th>
                <th className="p-3">Gateway</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Jumlah</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0">
                  <td className="p-3 text-white">{p.invoice_number}</td>
                  <td className="p-3 text-slate-400 capitalize">{p.gateway}</td>
                  <td className="p-3 text-slate-400 capitalize">{p.method ?? "-"}</td>
                  <td className="p-3 text-white">Rp {p.amount.toLocaleString("id-ID")}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[p.status]}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
