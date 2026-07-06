/**
 * FILE: frontend/src/app/admin/platform/PlatformReports.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import { alertError } from "../../lib/swal";
import { Skeleton } from "../../components/ui";
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
} from "lucide-react";
import PlatformReportFollowUpPopup from "./PlatformReportFollowUpPopup";

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

const statusLabel: Record<string, string> = {
  open: "Menunggu",
  reviewed: "Ditinjau",
  action_taken: "Ditindak",
  dismissed: "Diabaikan",
};

const statusColor: Record<string, string> = {
  open: "border-yellow-200 bg-yellow-100 text-yellow-700",
  reviewed: "border-blue-200 bg-blue-100 text-blue-700",
  action_taken: "border-emerald-200 bg-emerald-100 text-emerald-700",
  dismissed: "border-gray-200 bg-gray-100 text-gray-700",
};

type ReportAction = "suspend_permanent" | "suspend_temporary" | "dismiss";

export default function PlatformReports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [initialAction, setInitialAction] = useState<ReportAction | null>(null);

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

  const resolve = async (
    id: number,
    newStatus: string,
    note?: string,
    action?: ReportAction,
    durationHours?: number,
  ) => {
    setActingId(id);
    try {
      await adminApiFetch(`/admin/reports/${id}/resolve`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          action,
          duration_hours: durationHours,
          note,
        }),
      });
      load();
    } catch (e: any) {
      alertError(e.message || "Gagal memperbarui laporan.");
      throw e;
    } finally {
      setActingId(null);
    }
  };

  const openFollowUp = (report: ReportItem, action?: ReportAction) => {
    setSelectedReport(report);
    setInitialAction(action ?? null);
    setFollowUpOpen(true);
  };

  const handleReportAction = async (
    reportId: number,
    action: ReportAction,
    payload: { note: string; durationHours?: number },
  ) => {
    setActionLoading(true);
    try {
      const status = action === "dismiss" ? "dismissed" : "action_taken";
      const note = payload.note;

      await resolve(
        reportId,
        status,
        note,
        action,
        payload.durationHours,
      );
      setFollowUpOpen(false);
      setSelectedReport(null);
    } catch (e) {
      // error already handled in resolve
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (statusKey: string) => {
    switch(statusKey) {
      case "open": return <Clock size={12} className="text-yellow-600" />;
      case "reviewed": return <AlertCircle size={12} className="text-blue-600" />;
      case "action_taken": return <CheckCircle size={12} className="text-emerald-600" />;
      case "dismissed": return <XCircle size={12} className="text-gray-600" />;
      default: return null;
    }
  };

  const getStatusLabel = (statusKey: string) => {
    return statusLabel[statusKey] || statusKey;
  };

  const getStatusColor = (statusKey: string) => {
    return statusColor[statusKey] || "border-gray-200 bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {["open", "reviewed", "action_taken", "dismissed"].map((f) => (
          <button 
            key={f} 
            onClick={() => setStatus(f)} 
            className={`px-4 py-2 border text-xs font-medium ${
              status === f 
                ? "border-blue-600 bg-blue-600 text-white" 
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Tidak ada laporan pada kategori ini.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="p-4 border border-gray-200 bg-white">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {categoryLabel[r.category] ?? r.category}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">
                      {r.reportable_type.split("\\").pop()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <User size={12} />
                    Dilaporkan oleh: {r.reporter?.name ?? "Pengguna"}
                  </div>
                  {r.reason && (
                    <p className="text-xs text-gray-600 mt-1 border-l-2 border-gray-200 pl-2">
                      "{r.reason}"
                    </p>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(r.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 border ${getStatusColor(r.status)}`}>
                    {getStatusIcon(r.status)}
                    {getStatusLabel(r.status)}
                  </span>
                </div>
              </div>

              {r.status === "open" && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => openFollowUp(r)}
                    className="px-3 py-2 border border-emerald-600 bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckCircle size={14} />
                    Tindak Lanjut
                  </button>
                  <button
                    onClick={() => openFollowUp(r, "dismiss")}
                    className="px-3 py-2 border border-gray-600 bg-gray-600 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <XCircle size={14} />
                    Abaikan
                  </button>
                </div>
              )}
            </div>
          ))}
          <PlatformReportFollowUpPopup
            open={followUpOpen}
            report={selectedReport}
            onOpenChange={(open) => {
              setFollowUpOpen(open);
              if (!open) {
                setSelectedReport(null);
                setInitialAction(null);
              }
            }}
            onAction={handleReportAction}
            actionLoading={actionLoading}
            initialAction={initialAction}
          />
        </div>
      )}
    </div>
  );
}