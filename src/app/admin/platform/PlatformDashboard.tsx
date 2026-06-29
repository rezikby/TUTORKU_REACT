/**
 * FILE: frontend/src/app/admin/platform/PlatformDashboard.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { adminApiFetch } from "../adminApi";

type Overview = {
  total_users: number;
  total_siswa: number;
  total_tutor: number;
  tutor_verified: number;
  tutor_pending: number;
  total_bookings: number;
  total_bookings_completed: number;
  total_revenue: number;
  monthly_revenue: { month: string; revenue: number }[];
  open_reports: number;
  new_contact_messages: number;
};

export default function PlatformDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApiFetch("/admin/dashboard");
        setOverview(data);
      } catch (e) {
        console.error("Gagal memuat dashboard admin", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: "Total Pengguna", value: overview?.total_users ?? 0 },
    { label: "Siswa", value: overview?.total_siswa ?? 0 },
    { label: "Tutor", value: overview?.total_tutor ?? 0 },
    { label: "Tutor Terverifikasi", value: overview?.tutor_verified ?? 0 },
    { label: "Tutor Menunggu Review", value: overview?.tutor_pending ?? 0 },
    { label: "Total Booking", value: overview?.total_bookings ?? 0 },
    { label: "Booking Selesai", value: overview?.total_bookings_completed ?? 0 },
    { label: "Laporan Terbuka", value: overview?.open_reports ?? 0 },
    { label: "Pesan Kontak Baru", value: overview?.new_contact_messages ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="text-2xl font-bold text-white mt-1">{loading ? "..." : s.value}</div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Total Pendapatan Platform</h2>
          <span className="text-sm text-slate-400">Rp {(overview?.total_revenue ?? 0).toLocaleString("id-ID")}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={overview?.monthly_revenue ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
              formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Pendapatan"]}
            />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
