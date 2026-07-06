import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  User,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
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

interface PlatformDashboardProps {
  onSelectMenu?: (menu: string) => void;
}

export default function PlatformDashboard({ onSelectMenu }: PlatformDashboardProps) {
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
    {
      label: "Total Pengguna",
      value: overview?.total_users ?? 0,
      icon: Users,
      menuId: "users",
    },
    {
      label: "Siswa",
      value: overview?.total_siswa ?? 0,
      icon: User,
      menuId: "siswa",
    },
    {
      label: "Tutor Menunggu Verifikasi",
      value: overview?.tutor_pending ?? 0,
      icon: UserCheck,
      menuId: "verifikasi-tutor",
    },
    {
      label: "Tutor Terverifikasi",
      value: overview?.tutor_verified ?? 0,
      icon: CheckCircle,
      menuId: "tutor-list",
    },
    {
      label: "Laporan Terbuka",
      value: overview?.open_reports ?? 0,
      icon: AlertTriangle,
      menuId: "laporan-tutor",
    },
  ];

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const clickable = Boolean(stat.menuId && onSelectMenu);
          return (
            <div
              key={stat.label}
              className={`p-3 border border-[#2563EB] bg-[#2563EB] ${clickable ? "cursor-pointer hover:opacity-95" : ""}`}
              onClick={() => stat.menuId && onSelectMenu?.(stat.menuId)}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-white/70" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/70">{stat.label}</div>
                  <div className="text-lg font-bold text-white">
                    {loading ? "..." : stat.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="p-4 border border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#2563EB]" />
              Total Pendapatan Platform
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2563EB] border border-[#2563EB]">
            <span className="text-sm text-white/70">Total:</span>
            <span className="text-base font-bold text-white">
              {loading ? "..." : formatCurrency(overview?.total_revenue ?? 0)}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={overview?.monthly_revenue ?? []}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "2px",
                color: "#111827",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              formatter={(value: number) => [
                formatCurrency(value),
                "Pendapatan",
              ]}
              labelStyle={{ color: "#6B7280", fontSize: "11px" }}
            />
            <Bar
              dataKey="revenue"
              fill="#2563EB"
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
