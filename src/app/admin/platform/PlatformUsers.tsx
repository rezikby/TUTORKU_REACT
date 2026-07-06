import React, { useEffect, useState } from "react";
import { adminApiFetch } from "../adminApi";
import { alertError, alertSuccess, confirmAction } from "../../lib/swal";
import { Skeleton } from "../../components/ui";
import { Search, Plus, X, User, Mail, Lock, Phone, Shield, Eye, ChevronLeft, ChevronRight } from "lucide-react";

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  email_verified_at?: string | null;
  suspended_until?: string | null;
  created_at?: string | null;
};

type CreateUserFields = {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  phone: string;
};

type EditUserFields = {
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string;
};

type PlatformUsersProps = {
  mode?: "users" | "tutor" | "siswa";
};

export default function PlatformUsers({ mode = "users" }: PlatformUsersProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "tutor" | "siswa">("all");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditUserFields>({
    name: "",
    email: "",
    role: "siswa",
    status: "active",
    phone: "",
  });
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(itemsPerPage));
      if (search) params.set("q", search);
      if (mode === "siswa") {
        params.set("role", "siswa");
      } else if (mode === "tutor") {
        params.set("role", "tutor");
      } else {
        if (roleFilter === "tutor") {
          params.set("role", "tutor");
        } else if (roleFilter === "siswa") {
          params.set("role", "siswa");
        } else {
          params.set("roles", "tutor,siswa");
        }
      }
      const data = await adminApiFetch(`/admin/users?${params.toString()}`);
      setUsers(data.data ?? data);
      setCurrentPage(data.meta?.current_page ?? page);
      setLastPage(data.meta?.last_page ?? 1);
      setTotalItems(data.meta?.total ?? (data.data ? data.data.length : (data.length || 0)));
      if (mode === "users" && roleFilter !== "all") {
        setCurrentPage(1);
      }
    } catch (e) {
      console.error("Gagal memuat pengguna", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mode, roleFilter]);

  const updateUserInState = (updatedUser: UserItem) => {
    setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user)));
  };

  const removeUserFromState = (id: number) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
    setTotalItems((prev) => Math.max(prev - 1, 0));
  };

  const updateStatus = async (id: number, status: string) => {
    setActingId(id);
    try {
      const data = await adminApiFetch(`/admin/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      const updatedUser = data.data ?? data;
      updateUserInState(updatedUser);
      alertSuccess("Status pengguna berhasil diperbarui.");
    } catch (e: any) {
      alertError(e.message || "Gagal memperbarui status pengguna.");
    } finally {
      setActingId(null);
    }
  };

  const beginEdit = (user: UserItem) => {
    setDetailsId(user.id);
    setEditId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone ?? "",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async (id: number) => {
    setActingId(id);
    try {
      const data = await adminApiFetch(`/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      const updatedUser = data.data ?? data;
      setEditId(null);
      updateUserInState(updatedUser);
      alertSuccess("Data pengguna berhasil diperbarui.");
    } catch (e: any) {
      alertError(e.message || "Gagal memperbarui pengguna.");
    } finally {
      setActingId(null);
    }
  };

  const deleteUser = async (id: number) => {
    const confirmed = await confirmAction(
      "Hapus akun?",
      "Aksi ini akan menghapus akun secara permanen.",
      "Hapus Akun",
      "Batal",
    );
    if (!confirmed) return;

    setActingId(id);
    try {
      await adminApiFetch(`/admin/users/${id}`, {
        method: "DELETE",
      });
      setEditId(null);
      removeUserFromState(id);
      alertSuccess("Akun berhasil dihapus.");
    } catch (e: any) {
      alertError(e.message || "Gagal menghapus akun.");
    } finally {
      setActingId(null);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      const data = await adminApiFetch(`/admin/users`, {
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

      const createdUser = data.data ?? data;
      setUsers((prev) => [createdUser, ...prev]);
      setTotalItems((prev) => prev + 1);
      setFormValues({
        name: "",
        email: "",
        password: "",
        role: "siswa",
        status: "active",
        phone: "",
      });
      setShowForm(false);
      alertSuccess("Pengguna berhasil dibuat.");
    } catch (error: any) {
      setFormError(error.message || "Gagal membuat pengguna.");
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "suspended": return "bg-red-100 text-red-700 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const totalPages = Math.max(lastPage, 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      load(page);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              placeholder="Cari nama atau email"
              className="bg-transparent text-sm text-gray-900 outline-none w-40"
            />
          </div>
          {mode === "users" && (
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as "all" | "tutor" | "siswa");
                load(1);
              }}
              className="px-3 py-2 border border-gray-200 bg-white text-sm text-gray-900 outline-none"
            >
              <option value="all">Semua Role</option>
              <option value="tutor">Tutor</option>
              <option value="siswa">Siswa</option>
            </select>
          )}
          <button 
            onClick={() => load(1)} 
            className="px-4 py-2 border border-blue-600 bg-blue-600 text-white text-sm font-semibold"
          >
            Cari
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            {mode === "users" ? "Semua Pengguna" : mode === "tutor" ? "Tutor" : "Siswa"}
          </div>
          <button 
            onClick={() => setShowForm((current) => !current)} 
            className="px-4 py-2 border border-emerald-600 bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Tutup Form" : "Tambah Pengguna"}
          </button>
        </div>
      </div>

      {/* Form Create User */}
      {showForm && (
        <div className="border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Buat Pengguna Baru
            </h2>
            <button 
              onClick={() => setShowForm(false)}
              className="p-1 border border-gray-200 bg-gray-50"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <User className="w-3 h-3" />
                Nama
              </label>
              <input
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                placeholder="Nama lengkap"
                className="mt-1 w-full px-3 py-2 border border-gray-200 bg-white text-sm text-gray-900 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <input
                type="email"
                value={formValues.email}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                placeholder="email@domain.com"
                className="mt-1 w-full px-3 py-2 border border-gray-200 bg-white text-sm text-gray-900 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <input
                type="password"
                value={formValues.password}
                onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                placeholder="Minimal 8 karakter"
                className="mt-1 w-full px-3 py-2 border border-gray-200 bg-white text-sm text-gray-900 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Status</label>
              <select
                value={formValues.status}
                onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-200 bg-white text-sm text-gray-900 outline-none"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone (opsional)
              </label>
              <input
                type="tel"
                value={formValues.phone}
                onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                placeholder="628123456789"
                className="mt-1 w-full px-3 py-2 border border-gray-200 bg-white text-sm text-gray-900 outline-none"
              />
            </div>
            {formError && (
              <div className="md:col-span-2 text-sm text-red-600 border border-red-200 bg-red-50 p-2">
                {formError}
              </div>
            )}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2 border border-gray-200 bg-gray-50 text-sm text-gray-700"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={creating} 
                className="px-4 py-2 border border-blue-600 bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {creating ? "Membuat..." : "Buat Pengguna"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      ) : (
        <>
          <div className="border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                  <th className="p-3 font-medium w-12">No</th>
                  <th className="p-3 font-medium">Nama</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => {
                  const nomor = startIndex + index + 1;
                  return (
                    <React.Fragment key={u.id}>
                      <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="p-3 text-gray-500 text-center">{nomor}</td>
                        <td className="p-3 text-gray-900 font-medium">{u.name}</td>
                        <td className="p-3 text-gray-600">{u.email}</td>
                        <td className="p-3 text-gray-600 capitalize">{u.role}</td>
                        <td className="p-3">
                          <span className={`text-xs font-medium px-2 py-0.5 border ${getStatusColor(u.status)}`}>
                            {u.status === "active" ? "Aktif" : 
                             u.status === "suspended" ? "Ditangguhkan" : 
                             u.status === "pending" ? "Menunggu" : u.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailsId(detailsId === u.id ? null : u.id)}
                              className="px-3 py-1 border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => beginEdit(u)}
                              className="px-3 py-1 border border-blue-600 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUser(u.id)}
                              disabled={u.role === "admin" || actingId === u.id}
                              className="px-3 py-1 border border-red-600 bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              Hapus
                            </button>
                            {u.role === "admin" ? null : u.status === "active" ? (
                              <button 
                                onClick={() => updateStatus(u.id, "suspended")} 
                                disabled={actingId === u.id} 
                                className="px-3 py-1 border border-orange-600 bg-orange-600 text-white text-xs font-semibold disabled:opacity-60"
                              >
                                Tangguhkan
                              </button>
                            ) : (
                              <button 
                                onClick={() => updateStatus(u.id, "active")} 
                                disabled={actingId === u.id} 
                                className="px-3 py-1 border border-emerald-600 bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                              >
                                Aktifkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {detailsId === u.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="p-4 text-sm text-slate-700">
                            {editId === u.id ? (
                              <div className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <label className="text-xs uppercase tracking-wide text-slate-500">Nama</label>
                                    <input
                                      value={editForm.name}
                                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                      className="mt-1 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs uppercase tracking-wide text-slate-500">Email</label>
                                    <input
                                      type="email"
                                      value={editForm.email}
                                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                      className="mt-1 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs uppercase tracking-wide text-slate-500">Telepon</label>
                                    <input
                                      value={editForm.phone}
                                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                      className="mt-1 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs uppercase tracking-wide text-slate-500">Status</label>
                                    <select
                                      value={editForm.status}
                                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                      className="mt-1 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    >
                                      <option value="active">Active</option>
                                      <option value="pending">Pending</option>
                                      <option value="suspended">Suspended</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveEdit(u.id)}
                                    disabled={actingId === u.id}
                                    className="rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                  >
                                    Simpan Perubahan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="grid gap-3 md:grid-cols-3">
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">Telepon</div>
                                  <div className="mt-1 text-slate-900">{u.phone || "-"}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">Alamat</div>
                                  <div className="mt-1 text-slate-900">{u.address || "-"}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">Kota</div>
                                  <div className="mt-1 text-slate-900">{u.city || "-"}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">Jenis Kelamin</div>
                                  <div className="mt-1 text-slate-900">{u.gender || "-"}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">Tanggal Lahir</div>
                                  <div className="mt-1 text-slate-900">{u.date_of_birth || "-"}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">Email Terverifikasi</div>
                                  <div className="mt-1 text-slate-900">{u.email_verified_at ? "Ya" : "Tidak"}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">Ditangguhkan sampai</div>
                                  <div className="mt-1 text-slate-900">{u.suspended_until ? new Date(String(u.suspended_until)).toLocaleString() : "-"}</div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3">
              <div className="text-sm text-gray-600">
                Menampilkan {totalItems === 0 ? "0 pengguna" : `${startIndex + 1} - ${Math.min(endIndex, totalItems)} dari ${totalItems}`}
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