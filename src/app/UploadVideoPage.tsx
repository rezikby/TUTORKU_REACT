/**
 * FILE: frontend/src/app/UploadVideoPage.tsx
 * STATUS: DIUBAH (fix Bearer token auth yang hilang)
 */

import React, { useState } from "react";

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "https://rezi-laravel.nlabs.id/api";
const API_ROOT = API_BASE.replace(/\/api\/?$/, "");

/**
 * FIX: versi asli komponen ini POST ke /tutor/materials (dilindungi auth:sanctum)
 * tanpa header Authorization Bearer token sama sekali (hanya credentials:
 * "include"). Karena seluruh API memakai Sanctum Bearer token, bukan cookie
 * session, request ini akan selalu gagal 401. Diperbaiki dengan menambahkan
 * Bearer token dari localStorage (konsisten dengan apiFetch di App.tsx).
 */
export default function UploadVideoPage({ navigate }: { navigate: (p: any) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const ensureCsrf = async () => {
    await fetch(`${API_ROOT}/sanctum/csrf-cookie`, {
      credentials: "include",
    });
  };

  const getXsrfToken = () => {
    return document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul diperlukan.");
      return;
    }
    if (!file) {
      setError("Pilih file video terlebih dahulu.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await ensureCsrf();
      const token = localStorage.getItem("TUTORKU_token");
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("file", file);
      form.append("visibility", visibility);

      const res = await fetch(`${API_BASE}/tutor/materials`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(getXsrfToken() ? { "X-XSRF-TOKEN": decodeURIComponent(getXsrfToken()!) } : {}),
        },
        body: form,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Gagal mengunggah video.");
      }

      setSaved(true);
      try {
        window.dispatchEvent(new CustomEvent("materials:changed"));
      } catch (e) {}
      try {
        localStorage.setItem("TUTORKU:materials", String(Date.now()));
      } catch (e) {}
      setTimeout(() => navigate("video"), 1000);
    } catch (err: any) {
      console.warn(err);
      setError(err.message || "Terjadi kesalahan saat mengunggah.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-white mb-4">Tambah Video</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-300">Judul</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masukkan judul video" className="w-full mt-2 px-3 py-2 rounded-lg bg-card border border-border text-white outline-none" />
        </div>

        <div>
          <label className="text-sm text-slate-300">Deskripsi</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat" className="w-full mt-2 px-3 py-2 rounded-lg bg-card border border-border text-white outline-none h-32" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300">Video File</label>
            <input type="file" accept="video/*" onChange={onFile} className="w-full mt-2 text-sm text-white" />
            {file && <div className="text-xs text-slate-400 mt-1">{file.name}</div>}
          </div>

          <div>
            <label className="text-sm text-slate-300">Pengaturan</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-lg bg-card border border-border text-white outline-none">
              <option value="public">Publik</option>
              <option value="unlisted">Tidak Terdaftar</option>
              <option value="private">Pribadi</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-sm bg-primary text-white">
            {saving ? "Mengunggah..." : "Simpan & Publikasikan"}
          </button>
          <button type="button" onClick={() => navigate("video")} className="px-4 py-2 rounded-sm border border-border text-slate-200">
            Batal
          </button>
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}
        {saved && <div className="text-sm text-green-400">Video tersimpan. Mengalihkan...</div>}
      </form>
    </div>
  );
}
