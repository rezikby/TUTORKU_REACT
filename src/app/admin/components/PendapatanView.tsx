// frontend/src/app/admin/components/PendapatanView.tsx
import { useEffect, useMemo, useState } from "react";
import { DollarSign, Calendar, TrendingUp, Wallet, ArrowUp, ArrowDown, CreditCard, PiggyBank, BarChart3, Check } from "lucide-react";
import { adminApiFetch } from "../adminApi";

type SuccessfulBooking = {
  id: number;
  code: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  price: number;
  status: 'confirmed' | 'completed';
  student: { id: number; name: string };
  subject: { name: string };
};

type TutorOverview = {
  balance: number;
  admin_fee: number;
  total_income: number;
  rating_avg: number;
  rating_count: number;
  total_students: number;
  total_sessions: number;
  monthly_income: { month: string; income: number }[];
  successful_bookings: SuccessfulBooking[];
};

export default function PendapatanView() {
  const [overview, setOverview] = useState<TutorOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApiFetch("/dashboard/tutor")
      .then((data) => setOverview(data))
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, []);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const currentMonthIncome = overview?.monthly_income?.length
    ? overview.monthly_income[overview.monthly_income.length - 1].income
    : 0;

  const totalIncome = overview?.monthly_income?.reduce((sum, item) => sum + item.income, 0) ?? 0;

  const stats = [
    {
      label: "Pendapatan Bulan Ini",
      value: isLoading ? "..." : currencyFormatter.format(currentMonthIncome),
      icon: <TrendingUp size={18} className="text-white" />,
      bg: "bg-green-500",
    },
    {
      label: "Total Sesi",
      value: isLoading ? "..." : overview?.total_sessions ?? 0,
      icon: <Calendar size={18} className="text-white" />,
      bg: "bg-blue-500",
    },
    {
      label: "Murid Aktif",
      value: isLoading ? "..." : overview?.total_students ?? 0,
      icon: <DollarSign size={18} className="text-white" />,
      bg: "bg-purple-500",
    },
    {
      label: "Saldo -10% Admin",
      value: isLoading ? "..." : currencyFormatter.format(overview?.balance ?? 0),
      icon: <Wallet size={18} className="text-white" />,
      bg: "bg-yellow-500",
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pendapatan</h2>
        <p className="text-sm text-gray-400 mt-0.5">Ringkasan pendapatan tutor</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} p-4 rounded`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Income */}
      <div className="border border-gray-200 p-5 rounded bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Pendapatan Bulanan</h3>
          <span className="text-sm text-gray-500">
            Total: {isLoading ? "..." : currencyFormatter.format(totalIncome)}
          </span>
        </div>
        {isLoading ? (
          <div className="border border-gray-100 p-8 text-center text-sm text-gray-400 rounded">
            Memuat data pendapatan...
          </div>
        ) : overview?.monthly_income && overview.monthly_income.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {overview.monthly_income.map((item) => (
              <div key={item.month} className="border border-gray-100 p-3 rounded bg-gray-50">
                <p className="text-xs text-gray-500">{item.month}</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {currencyFormatter.format(item.income)}
                </p>
                <div className="mt-1 h-1 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded" 
                    style={{ width: `${Math.min((item.income / (totalIncome || 1)) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 p-8 text-center text-sm text-gray-400 rounded">
            Belum ada data pendapatan
          </div>
        )}
      </div>

      {/* Booking Berhasil / Successful Bookings */}
      <div className="border border-gray-200 p-5 rounded bg-white mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Booking Berhasil</h3>
          <span className="text-sm text-gray-500">
            {isLoading ? "..." : `${overview?.successful_bookings?.length ?? 0} booking`}
          </span>
        </div>

        {isLoading ? (
          <div className="border border-gray-100 p-8 text-center text-sm text-gray-400 rounded">
            Memuat booking...
          </div>
        ) : overview?.successful_bookings && overview.successful_bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-semibold text-gray-900">Kode</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-900">Siswa</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-900">Mata Pelajaran</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-900">Tanggal</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-900">Jam</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-900">Harga</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.successful_bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {booking.code}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-900">{booking.student.name}</td>
                    <td className="py-3 px-3 text-gray-600">{booking.subject.name}</td>
                    <td className="py-3 px-3 text-gray-600">{formatDate(booking.date)}</td>
                    <td className="py-3 px-3 text-gray-600">{booking.start_time}</td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900">
                      {currencyFormatter.format(booking.price)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {booking.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                          <CreditCard size={12} />
                          Dibayar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                          <Check size={12} />
                          Selesai
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-gray-200 p-8 text-center text-sm text-gray-400 rounded">
            Belum ada booking yang berhasil
          </div>
        )}
      </div>

      {/* Info Tambahan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="border border-gray-200 p-4 rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-gray-400" />
            <h4 className="text-sm font-medium text-gray-900">Rata-rata per Sesi</h4>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {isLoading ? "..." : overview?.total_sessions ? currencyFormatter.format(currentMonthIncome / overview.total_sessions) : "Rp 0"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Pendapatan rata-rata per sesi</p>
        </div>

        <div className="border border-gray-200 p-4 rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={16} className="text-gray-400" />
            <h4 className="text-sm font-medium text-gray-900">Rincian Saldo</h4>
          </div>
          {isLoading ? (
            <p className="text-xs text-gray-400">Memuat...</p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Pendapatan</span>
                <span className="font-semibold text-gray-900">{currencyFormatter.format(overview?.total_income ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-red-600">Potongan 10% (Admin)</span>
                <span className="font-semibold text-red-600">-{currencyFormatter.format(overview?.admin_fee ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2 bg-blue-50 p-2 rounded">
                <span className="font-medium text-blue-900">Saldo Anda</span>
                <span className="font-bold text-blue-900">{currencyFormatter.format(overview?.balance ?? 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}