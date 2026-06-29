/**
 * FILE: frontend/src/app/admin/platform/PlatformTutors.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import { alertError } from "../../lib/swal";
import { Skeleton } from "../../components/ui";

type TutorProfile = {
  id: number;
  name: string;
  photo?: string | null;
  headline?: string | null;
  city?: string | null;
  verification_status: string;
  registration_submitted: boolean;
  cv?: string | null;
  ktp_photo?: string | null;
  selfie_ktp?: string | null;
};

export default function PlatformTutors() {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch(`/admin/tutors?status=${filter}`);
      setTutors(data.data ?? data);
    } catch (e) {
      console.error("Gagal memuat daftar tutor", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const approve = async (id: number) => {
    setActingId(id);
    try {
      await adminApiFetch(`/admin/tutors/${id}/approve`, { method: "POST" });
      load();
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
      load();
    } catch (e: any) {
      alertError(e.message || "Gagal menolak tutor.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pending", "verified", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize ${filter === f ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-slate-400"}`}
          >
            {f === "pending" ? "Menunggu" : f === "verified" ? "Terverifikasi" : "Ditolak"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      ) : tutors.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Tidak ada tutor pada kategori ini.</p>
      ) : (
        <div className="space-y-3">
          {tutors.map((t) => (
            <div key={t.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3 flex-wrap justify-between">
                <div className="flex items-center gap-3">
                  <img src={t.photo ?? undefined} alt={t.name} className="w-12 h-12 rounded-xl object-cover bg-slate-800" />
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.headline} · {t.city}</div>
                  </div>
                </div>
                {filter === "pending" && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => approve(t.id)} disabled={actingId === t.id} className="px-3 py-1.5 rounded-sm bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60">
                      Approve
                    </button>
                    <button onClick={() => { setRejectingId(rejectingId === t.id ? null : t.id); setRejectNote(""); }} className="px-3 py-1.5 rounded-sm bg-red-600 text-white text-xs font-semibold">
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3 text-xs">
                {t.cv && <a href={t.cv} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-white/10 text-slate-300">Lihat CV</a>}
                {t.ktp_photo && <a href={t.ktp_photo} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-white/10 text-slate-300">Lihat KTP</a>}
                {t.selfie_ktp && <a href={t.selfie_ktp} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-white/10 text-slate-300">Lihat Selfie KTP</a>}
              </div>

              {rejectingId === t.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Alasan penolakan (wajib diisi)"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-sm outline-none"
                  />
                  <button onClick={() => reject(t.id)} disabled={actingId === t.id} className="px-3 py-2 rounded-sm bg-red-600 text-white text-xs font-semibold disabled:opacity-60">
                    Kirim Penolakan
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
