"use client";

import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../components/ui/dialog";
import { toastSuccess, toastError } from "../lib/swal";

const reportCategories = [
  { value: "penipuan", label: "Penipuan" },
  { value: "spam", label: "Spam" },
  { value: "konten_tidak_sesuai", label: "Konten Tidak Sesuai" },
  { value: "pelecehan", label: "Pelecehan" },
  { value: "lainnya", label: "Lainnya" },
];

interface ReportTutorPopupProps {
  tutorName: string;
  tutorId: string | number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

export default function ReportTutorPopup({ 
  tutorName, 
  tutorId, 
  open, 
  onOpenChange, 
  apiFetch 
}: ReportTutorPopupProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [reportCategory, setReportCategory] = useState<string>("penipuan");
  const [reportReason, setReportReason] = useState<string>("");
  const [evidence1, setEvidence1] = useState<File | null>(null);
  const [evidence2, setEvidence2] = useState<File | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const hasEvidence = evidence1 !== null && evidence2 !== null;
  const canSubmitReport = hasEvidence && (reportCategory !== "lainnya" ? true : reportReason.trim().length > 0);

  const handleReportSubmit = async () => {
    if (!hasEvidence) {
      toastError(t("detailTutor.reportEvidenceRequired"));
      return;
    }
    if (!canSubmitReport) {
      toastError(t("detailTutor.reportReasonRequired"));
      return;
    }

    const formData = new FormData();
    formData.append("reportable_type", "tutor_profile");
    formData.append("reportable_id", String(tutorId));
    formData.append("category", reportCategory);
    if (reportReason.trim()) {
      formData.append("reason", reportReason.trim());
    }
    if (evidence1) {
      formData.append("evidence_files[]", evidence1);
    }
    if (evidence2) {
      formData.append("evidence_files[]", evidence2);
    }

    setReportSubmitting(true);
    try {
      const response = await apiFetch("/reports", {
        method: "POST",
        body: formData,
      });

      toastSuccess(response.message ?? t("detailTutor.reportSuccess"));
      setReportReason("");
      setReportCategory("penipuan");
      setEvidence1(null);
      setEvidence2(null);
      formRef.current?.reset();
      onOpenChange(false);
    } catch (err: any) {
      toastError(err.message ?? t("detailTutor.reportFailed"));
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100%,480px)] w-full p-0 border border-gray-200 bg-white">
        <DialogHeader className="border-b border-gray-200 px-5 py-3">
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {t("detailTutor.reportTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              {t("detailTutor.reportDescription")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form ref={formRef} className="max-h-[60vh] overflow-y-auto px-5 py-3 space-y-4" onSubmit={(e) => { e.preventDefault(); handleReportSubmit(); }}>
          <div>
            <label className="text-sm font-medium text-gray-900">
              {t("detailTutor.reportCategoryLabel")}
            </label>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {reportCategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900">
              {t("detailTutor.reportReasonLabel")}
            </label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t("detailTutor.reportReasonPlaceholder")}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              {t("detailTutor.reportReasonHelp")}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900">
              {t("detailTutor.reportEvidenceLabel")}
            </label>
            <div className="mt-2 space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-3">
                <label className="text-sm font-medium text-gray-700">
                  {t("detailTutor.reportEvidenceFile1Label")}
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setEvidence1(e.target.files?.[0] ?? null)}
                  className="mt-2 w-full text-sm text-gray-700"
                />
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-3">
                <label className="text-sm font-medium text-gray-700">
                  {t("detailTutor.reportEvidenceFile2Label")}
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setEvidence2(e.target.files?.[0] ?? null)}
                  className="mt-2 w-full text-sm text-gray-700"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t("detailTutor.reportEvidenceHelp")}
            </p>
          </div>

          <div className="border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              {t("detailTutor.reportPreviewTitle")}
            </p>
            <p className="mt-2 text-gray-700">
              {t("detailTutor.reportPreviewDescription")}
            </p>
            <div className="mt-3 border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-1">
              <div>
                <span className="font-semibold">{t("detailTutor.reportPreviewTutor")}</span> {tutorName}
              </div>
              <div>
                <span className="font-semibold">{t("detailTutor.reportPreviewCategory")}</span>{" "}
                {reportCategories.find((item) => item.value === reportCategory)?.label}
              </div>
              {reportReason && (
                <div>
                  <span className="font-semibold">{t("detailTutor.reportPreviewNotes")}</span> {reportReason}
                </div>
              )}
              <div>
                <span className="font-semibold">{t("detailTutor.reportPreviewEvidence")}</span>
                <div className="mt-1 space-y-1 text-sm text-gray-700">
                  <div>{evidence1 ? evidence1.name : t("detailTutor.reportNoEvidence")}</div>
                  <div>{evidence2 ? evidence2.name : t("detailTutor.reportNoEvidence")}</div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end sm:items-center">
          <DialogClose asChild>
            <button 
              type="button" 
              className="w-full sm:w-auto border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none"
            >
              {t("detailTutor.reportCancel")}
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleReportSubmit}
            disabled={reportSubmitting}
            className="w-full sm:w-auto bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
          >
            {reportSubmitting ? t("detailTutor.reportSubmitting") : t("detailTutor.reportSubmit")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}