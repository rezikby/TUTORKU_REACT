/**
 * FILE: frontend/src/app/admin/platform/PlatformUsers.tsx
 * STATUS: BARU
 */

import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import { alertError, alertSuccess } from "../../lib/swal";
import { Skeleton } from "../../components/ui";

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string | null;
};

type CreateUserFields = {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  phone: string;
};

export default function PlatformUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formValues, setFormValues] = useState<CreateUserFields>({
    name: "",
    email: "",
    password: "",
    role: "siswa",
    status: "active",
    phone: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (roleFilter) params.set("role", roleFilter);
      const data = await adminApiFetch(`/admin/users?${params.toString()}`);
      setUsers(data.data ?? data);
    } catch (e) {
      console.error("Gagal memuat pengguna", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [roleFilter]);

  const updateStatus = async (id: number, status: string) => {
    setActingId(id);
    try {
      await adminApiFetch(`/admin/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e: any) {
      alertError(e.message || "Gagal memperbarui status pengguna.");
    } finally {
      setActingId(null);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      await adminApiFetch(`/admin/users`, {
        method: "POST",
        body: JSON.stringify({
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
          role: formValues.role,
          status: formValues.status,
          phone: formValues.phone.trim() || null,
        }),
      });

      setFormValues({
        name: "",
        email: "",
        password: "",
        role: "siswa",
        status: "active",
        phone: "",
      });
      setShowForm(false);
      load();
      alertSuccess("Pengguna berhasil dibuat.");
    } catch (error: any) {
      setFormError(error.message || "Gagal membuat pengguna.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Cari nama / email..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm">
            <option value="">Semua Role</option>
            <option value="siswa">Siswa</option>
            <option value="tutor">Tutor</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={load} className="px-4 py-2 rounded-sm bg-blue-600 text-white text-sm font-semibold">Cari</button>
        </div>

        <button onClick={() => setShowForm((current) => !current)} className="px-4 py-2 rounded-sm bg-emerald-600 text-white text-sm font-semibold">
          {showForm ? "Tutup Form" : "Tambah Pengguna"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Buat Pengguna Baru</h2>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-300">Nama</label>
              <input
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                placeholder="Nama lengkap"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Email</label>
              <input
                type="email"
                value={formValues.email}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                placeholder="email@domain.com"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Password</label>
              <input
                type="password"
                value={formValues.password}
                onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                placeholder="Minimal 8 karakter"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Role</label>
              <select
                value={formValues.role}
                onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none"
              >
                <option value="siswa">Siswa</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300">Status</label>
              <select
                value={formValues.status}
                onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300">Phone (opsional)</label>
              <input
                type="tel"
                value={formValues.phone}
                onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                placeholder="628123456789"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none"
              />
            </div>
            {formError && (
              <div className="md:col-span-2 text-sm text-red-400">{formError}</div>
            )}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-sm bg-white/5 text-white text-sm">
                Batal
              </button>
              <button type="submit" disabled={creating} className="px-4 py-2 rounded-sm bg-blue-600 text-white text-sm font-semibold disabled:opacity-60">
                {creating ? "Membuat..." : "Buat Pengguna"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-white/10">
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="p-3 text-white">{u.name}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3 text-slate-400 capitalize">{u.role}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-emerald-500/15 text-emerald-400" : u.status === "suspended" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.role === "admin" ? (
                      <span className="text-xs text-slate-500">Tidak dapat diubah</span>
                    ) : u.status === "active" ? (
                      <button onClick={() => updateStatus(u.id, "suspended")} disabled={actingId === u.id} className="px-3 py-1 rounded-sm bg-red-600 text-white text-xs font-semibold disabled:opacity-60">
                        Suspend
                      </button>
                    ) : (
                      <button onClick={() => updateStatus(u.id, "active")} disabled={actingId === u.id} className="px-3 py-1 rounded-sm bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60">
                        Aktifkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
