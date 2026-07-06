/**
 * FILE: frontend/src/app/admin/platform/PlatformTutors.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import { alertError, alertSuccess, confirmAction } from "../../lib/swal";
import { Skeleton } from "../../components/ui";
import TutorDetailPanel from "./TutorDetailPanel";
import {
  User,
  MapPin,
  FileText,
  Image,
  Camera,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type TutorProfile = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo?: string | null;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  province?: string | null;
  address?: string | null;
  price_per_hour?: number | null;
  experience_years?: number | null;
  levels?: string[] | null;
  mode_online?: boolean;
  mode_offline?: boolean;
  badge?: string | null;
  password?: string | null;
  verification_status: string;
  registration_submitted: boolean;
  verification_note?: string | null;
  cv?: string | null;
  ktp_photo?: string | null;
  selfie_ktp?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_holder?: string | null;
  subjects?: { name: string }[];
};

interface PlatformTutorsProps {
  defaultFilter?: "pending" | "verified" | "rejected";
  forceDelete?: boolean;
}

type PlatformFilter = "pending" | "verified" | "rejected";

export default function PlatformTutors({ defaultFilter = "verified", forceDelete = false }: PlatformTutorsProps) {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [filter, setFilter] = useState<PlatformFilter>(defaultFilter);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<TutorProfile>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch(`/admin/tutors?status=${filter}`);
      setTutors(data.data ?? data);
      setCurrentPage(1);
      setDetailsId(null);
      setEditingId(null);
    } catch (e) {
      console.error("Gagal memuat daftar tutor", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilter(defaultFilter);
  }, [defaultFilter]);
  useEffect(() => {
    load();
  }, [filter]);

  const updateTutorInState = (id: number, changes: Partial<TutorProfile>) => {
    setTutors((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  };

  const removeTutorFromState = (id: number) => {
    setTutors((prev) => {
      const next = prev.filter((t) => t.id !== id);
      const nextTotalPages = Math.max(1, Math.ceil(next.length / itemsPerPage));
      if (currentPage > nextTotalPages) {
        setCurrentPage(nextTotalPages);
      }
      return next;
    });
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    if (filter === newStatus) {
      updateTutorInState(id, { verification_status: newStatus });
    } else {
      removeTutorFromState(id);
    }
  };

  const approve = async (id: number) => {
    setActingId(id);
    try {
      await adminApiFetch(`/admin/tutors/${id}/approve`, { method: "POST" });
      handleStatusChange(id, "verified");
      setRejectingId(null);
      if (detailsId === id) {
        setDetailsId(null);
      }
    } catch (e: any) {
      alertError(e.message || "Gagal menyetujui tutor.");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: number) => {
    if (!rejectNote.trim()) {
      alertError("Alasan penolakan wajib diisi.");
      return;
    }
    setActingId(id);
    try {
      await adminApiFetch(`/admin/tutors/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ note: rejectNote }),
      });
      setRejectingId(null);
      setRejectNote("");
      handleStatusChange(id, "rejected");
      if (detailsId === id) {
        setDetailsId(null);
      }
    } catch (e: any) {
      alertError(e.message || "Gagal menolak tutor.");
    } finally {
      setActingId(null);
    }
  };

  const toggleDetails = (id: number) => {
    setDetailsId((current) => (current === id ? null : id));
    setEditingId(null);
  };

  const beginEdit = (tutor: TutorProfile) => {
    setEditingId(tutor.id);
    setDetailsId(tutor.id);
    setEditForm({
      name: tutor.name,
      email: tutor.email,
      phone: tutor.phone,
      headline: tutor.headline,
      bio: tutor.bio,
      city: tutor.city,
      province: tutor.province,
      address: tutor.address,
      price_per_hour: tutor.price_per_hour,
      experience_years: tutor.experience_years,
      levels: tutor.levels,
      mode_online: tutor.mode_online,
      mode_offline: tutor.mode_offline,
      badge: tutor.badge,
      verification_note: tutor.verification_note,
      bank_name: tutor.bank_name,
      bank_account_number: tutor.bank_account_number,
      bank_account_holder: tutor.bank_account_holder,
    });
  };

  const updateField = (field: keyof Partial<TutorProfile>, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveTutor = async (id: number) => {
    setActingId(id);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        password: editForm.password,
        headline: editForm.headline,
        bio: editForm.bio,
        city: editForm.city,
        province: editForm.province,
        address: editForm.address,
        price_per_hour: editForm.price_per_hour,
        experience_years: editForm.experience_years,
        levels: editForm.levels,
        mode_online: editForm.mode_online,
        mode_offline: editForm.mode_offline,
        badge: editForm.badge,
        verification_note: editForm.verification_note,
        bank_name: editForm.bank_name,
        bank_account_number: editForm.bank_account_number,
        bank_account_holder: editForm.bank_account_holder,
      };

      await adminApiFetch(`/admin/tutors/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      updateTutorInState(id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        headline: editForm.headline,
        bio: editForm.bio,
        city: editForm.city,
        province: editForm.province,
        address: editForm.address,
        price_per_hour: editForm.price_per_hour,
        experience_years: editForm.experience_years,
        levels: editForm.levels,
        mode_online: editForm.mode_online,
        mode_offline: editForm.mode_offline,
        badge: editForm.badge,
        verification_note: editForm.verification_note,
        bank_name: editForm.bank_name,
        bank_account_number: editForm.bank_account_number,
        bank_account_holder: editForm.bank_account_holder,
      });
      setEditingId(null);
      alertSuccess("Perubahan tersimpan", "Data tutor berhasil diperbarui.");
    } catch (e: any) {
      alertError(e.message || "Gagal menyimpan perubahan tutor.");
    } finally {
      setActingId(null);
    }
  };

  const deleteTutor = async (id: number) => {
    const confirmed = await confirmAction(
      "Hapus tutor?",
      forceDelete
        ? "Aksi ini akan menghapus tutor secara permanen."
        : "Aksi ini akan menandai tutor sebagai terhapus (soft delete).",
      forceDelete ? "Hapus Tutor" : "Hapus Tutor",
      "Batal",
    );
    if (!confirmed) {
      return;
    }
    setActingId(id);
    try {
      await adminApiFetch(`/admin/tutors/${id}?force=${forceDelete ? "true" : "false"}`, {
        method: "DELETE",
      });
      removeTutorFromState(id);
      setRejectingId((current) => (current === id ? null : current));
      setEditingId((current) => (current === id ? null : current));
      setDetailsId((current) => (current === id ? null : current));
      alertSuccess(
        forceDelete ? "Tutor dihapus" : "Tutor dihapus",
        forceDelete
          ? "Tutor berhasil dihapus secara permanen."
          : "Tutor berhasil dihapus secara soft delete.",
      );
    } catch (e: any) {
      alertError(e.message || "Gagal menghapus tutor.");
    } finally {
      setActingId(null);
    }
  };

  const getFilterLabel = (f: string) => {
    switch(f) {
      case "pending": return "Menunggu";
      case "verified": return "Terverifikasi";
      case "rejected": return "Ditolak";
      default: return f;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "verified":
        return <span className="text-xs font-medium px-2 py-0.5 border border-emerald-200 bg-emerald-100 text-emerald-700">Terverifikasi</span>;
      case "rejected":
        return <span className="text-xs font-medium px-2 py-0.5 border border-red-200 bg-red-100 text-red-700">Ditolak</span>;
      case "pending":
        return <span className="text-xs font-medium px-2 py-0.5 border border-yellow-200 bg-yellow-100 text-yellow-700">Menunggu</span>;
      default:
        return <span className="text-xs font-medium px-2 py-0.5 border border-gray-200 bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(tutors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTutors = tutors.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {(['pending', 'verified', 'rejected'] as PlatformFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border text-xs font-medium capitalize ${
              filter === f 
                ? "border-blue-600 bg-blue-600 text-white" 
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {getFilterLabel(f)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      ) : tutors.length === 0 ? (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Tidak ada tutor pada kategori ini.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {currentTutors.map((t) => (
              <div key={t.id} className="p-4 border border-gray-200 bg-white">
                <div className="flex items-start gap-3 flex-wrap justify-between">
                  <div className="flex items-center gap-3">
                    {t.photo ? (
                      <img 
                        src={t.photo} 
                        alt={t.name} 
                        className="w-12 h-12 object-cover border border-gray-200 bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-gray-900 font-semibold">{t.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {t.headline && <span>{t.headline}</span>}
                        {t.headline && t.city && <span>·</span>}
                        {t.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {t.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                              <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(t.verification_status)}
                    <button
                      type="button"
                      onClick={() => toggleDetails(t.id)}
                      className="px-3 py-1 border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1"
                    >
                      {detailsId === t.id ? <ChevronUp className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      Lihat Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => beginEdit(t)}
                      className="px-3 py-1 border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTutor(t.id)}
                      disabled={actingId === t.id}
                      className="px-3 py-1 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 flex items-center gap-1 disabled:opacity-60"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                    {filter === "pending" && (
                      <>
                        <button 
                          onClick={() => approve(t.id)} 
                          disabled={actingId === t.id} 
                          className="px-3 py-1 border border-emerald-600 bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Setujui
                        </button>
                        <button 
                          onClick={() => { 
                            setRejectingId(rejectingId === t.id ? null : t.id); 
                            setRejectNote(""); 
                          }} 
                          className="px-3 py-1 border border-red-600 bg-red-600 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Tolak
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="flex gap-2 mt-3 text-xs flex-wrap">
                  {t.cv && (
                    <a 
                      href={t.cv} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-2 py-1 border border-gray-200 bg-gray-50 text-gray-600 flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Lihat CV
                    </a>
                  )}
                  {t.ktp_photo && (
                    <a 
                      href={t.ktp_photo} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-2 py-1 border border-gray-200 bg-gray-50 text-gray-600 flex items-center gap-1"
                    >
                      <Image className="w-3 h-3" />
                      Lihat KTP
                    </a>
                  )}
                  {t.selfie_ktp && (
                    <a 
                      href={t.selfie_ktp} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-2 py-1 border border-gray-200 bg-gray-50 text-gray-600 flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      Lihat Selfie KTP
                    </a>
                  )}
                  {!t.cv && !t.ktp_photo && !t.selfie_ktp && (
                    <span className="text-xs text-gray-400">Tidak ada dokumen</span>
                  )}
                </div>

                {detailsId === t.id && (
                  <TutorDetailPanel
                    tutor={t}
                    editForm={editForm}
                    editing={editingId === t.id}
                    acting={actingId === t.id}
                    updateField={(field, value) => updateField(field as keyof Partial<TutorProfile>, value)}
                    onSave={saveTutor}
                    onCancelEdit={() => setEditingId(null)}
                  />
                )}

                {/* Reject Form */}
                {rejectingId === t.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Alasan penolakan (wajib diisi)"
                      className="flex-1 px-3 py-2 border border-gray-200 bg-white text-sm text-gray-900 outline-none"
                    />
                    <button 
                      onClick={() => reject(t.id)} 
                      disabled={actingId === t.id} 
                      className="px-3 py-2 border border-red-600 bg-red-600 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      Kirim Penolakan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {tutors.length > 0 && (
            <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, tutors.length)} dari {tutors.length} data
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-200 bg-white text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 border text-sm ${
                      currentPage === page
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-200 bg-white text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}