import { useState, useEffect } from "react";
import { Camera, User, Mail, Shield, Check, X, Loader2 } from "lucide-react";
import { toastError, toastSuccess } from "../../lib/swal";

export default function ProfileSection({ 
  user, 
  apiFetch,
  onUpdateUser,
}: { 
  user: any | null; 
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onUpdateUser: (user: any | null) => void;
}) {
  const [profileUser, setProfileUser] = useState<any | null>(user);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setProfileUser(user);
    setNameInput(user?.name ?? "");
  }, [user]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      toastError("Nama tidak boleh kosong");
      return;
    }
    try {
      setSavingKey("name");
      const form = new FormData();
      form.append("name", nameInput.trim());
      const res = await apiFetch("/profile", { method: "PUT", body: form } as any);
      const updatedUser = res.data ?? res;
      setProfileUser(updatedUser);
      onUpdateUser(updatedUser);
      setEditingName(false);
      toastSuccess("Nama berhasil diubah");
    } catch (err) {
      toastError("Gagal menyimpan nama");
    } finally {
      setSavingKey(null);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append("avatar", avatarFile);
      const res = await apiFetch("/profile", { method: "PUT", body: form } as any);
      const updatedUser = res.data ?? res;
      setProfileUser(updatedUser);
      onUpdateUser(updatedUser);
      setAvatarFile(null);
      setAvatarPreview(null);
      toastSuccess("Foto profil berhasil diubah");
    } catch (err) {
      toastError("Gagal mengunggah avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = avatarPreview ?? profileUser?.avatar ?? profileUser?.avatar_url ?? null;

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-4">Profile Saya</h2>
      
      <div className="space-y-4">
        {/* Avatar & Name */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profileUser?.name ?? "avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {getInitials(profileUser?.name ?? "")}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors border-2 border-white shadow-sm">
              <Camera size={14} className="text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setAvatarFile(f);
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setAvatarPreview(url);
                  }
                }}
              />
            </label>
          </div>

          {/* Name & Email */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {!editingName ? (
                <>
                  <div className="text-lg font-semibold text-gray-900 truncate">
                    {profileUser?.name ?? "-"}
                  </div>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Ubah
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 border-b border-gray-300 px-0 py-1 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Nama lengkap"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingKey === "name"}
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded disabled:opacity-50"
                  >
                    {savingKey === "name" ? <Loader2 size={14} className="animate-spin" /> : "Simpan"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(profileUser?.name ?? "");
                    }}
                    className="px-3 py-1 border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors rounded"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 mt-0.5">{profileUser?.email ?? "-"}</div>

            {avatarFile && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">{avatarFile.name}</span>
                <button
                  onClick={handleUploadAvatar}
                  disabled={isUploading}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                </button>
                <button
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="px-3 py-1 border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-gray-400" />
            <label className="text-xs font-medium text-gray-500">Role</label>
          </div>
          <p className="text-sm text-gray-900 capitalize mt-0.5">{profileUser?.role ?? "Siswa"}</p>
        </div>

        {/* Email (detail) */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-400" />
            <label className="text-xs font-medium text-gray-500">Email</label>
          </div>
          <p className="text-sm text-gray-900 mt-0.5">{profileUser?.email ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}