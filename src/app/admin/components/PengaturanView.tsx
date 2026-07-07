// frontend/src/app/admin/components/PengaturanView.tsx
import { useEffect, useState } from "react";
import { User, Mail, BookOpen, GraduationCap, FileText, Video, Camera, Save, Loader2, MapPin } from "lucide-react";
import { adminApiFetch } from "../adminApi";
import { alertError, alertSuccess } from "../../lib/swal";

type Subject = { id: number; name: string };

type ProfileData = {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  tutor_profile?: {
    bio?: string | null;
    headline?: string | null;
    levels?: string[];
    subjects?: Subject[];
    intro_video_url?: string | null;
    intro_video_path?: string | null;
  };
};

const LEVEL_OPTIONS = ["SD", "SMP", "SMA", "Mahasiswa"];

const normalizeTutorLevel = (level: string) => {
  const normalized = level.trim();
  const lower = normalized.toLowerCase();

  if (lower === "sd") return "SD";
  if (lower.includes("smp") || lower.includes("mts")) return "SMP";
  if (lower.includes("sma") || lower.includes("smk")) return "SMA";
  if (lower.includes("mahasiswa") || lower.includes("universitas") || lower.includes("politeknik")) return "Mahasiswa";

  return "";
};

const normalizeTutorLevels = (levels?: string[] | null) =>
  (levels ?? []).map(normalizeTutorLevel).filter((value, index, array) => value && array.indexOf(value) === index);

export default function PengaturanView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [introVideoFile, setIntroVideoFile] = useState<File | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminApiFetch("/profile")
      .then((data) => {
        const user = data.data ?? data;
        setProfile(user);
        setName(user.name ?? "");
        setHeadline(user.tutor_profile?.headline ?? "");
        setBio(user.tutor_profile?.bio ?? "");
        setGoogleMapsUrl(user.tutor_profile?.google_maps_url ?? "");
        setLevels(normalizeTutorLevels(user.tutor_profile?.levels ?? []));
        setSelectedSubjectIds((user.tutor_profile?.subjects ?? []).map((subject: Subject) => subject.id));
      })
      .catch((error) => console.error(error));

    adminApiFetch("/subjects")
      .then((data) => setSubjects(data.data ?? data))
      .catch((error) => console.error(error));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", name);
      payload.append("tutor_profile[headline]", headline);
      payload.append("tutor_profile[bio]", bio);
      const normalizedLevels = normalizeTutorLevels(levels);
      normalizedLevels.forEach((level) => payload.append("tutor_profile[levels][]", level));
      selectedSubjectIds.forEach((subjectId) => {
        payload.append("tutor_profile[subject_ids][]", String(subjectId));
      });
      payload.append("tutor_profile[google_maps_url]", googleMapsUrl);

      if (avatarFile) {
        payload.append("avatar", avatarFile);
      }

      if (introVideoFile) {
        payload.append("intro_video", introVideoFile);
      }

      const data = await adminApiFetch("/profile", {
        method: "PUT",
        body: payload,
      });

      const user = data.data ?? data;
      setProfile(user);
      setName(user.name ?? "");
      setHeadline(user.tutor_profile?.headline ?? "");
      setBio(user.tutor_profile?.bio ?? "");
      setLevels(normalizeTutorLevels(user.tutor_profile?.levels ?? []));
      setSelectedSubjectIds((user.tutor_profile?.subjects ?? []).map((subject: Subject) => subject.id));
      setAvatarFile(null);
      setAvatarPreview(null);
      alertSuccess("Perubahan berhasil disimpan.");
    } catch (error) {
      console.error(error);
      alertError("Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pengaturan</h2>
        <p className="text-sm text-gray-400 mt-0.5">Kelola profil dan pengaturan akun tutor</p>
      </div>

      {/* Layout 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Info */}
        <div className="lg:col-span-1 border border-gray-200 p-6 rounded bg-white h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {avatarPreview || profile?.avatar ? (
                  <img
                    src={avatarPreview ?? profile?.avatar ?? ""}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-400">
                    {getInitials(profile?.name ?? "")}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors border-2 border-white shadow-sm">
                <Camera size={15} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAvatarFile(file);
                    setAvatarPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </label>
            </div>
            <div className="mt-4">
              <div className="text-base font-semibold text-gray-900">{profile?.name ?? "Tutor"}</div>
              <div className="text-sm text-gray-400">{profile?.email ?? "-"}</div>
              <div className="text-xs text-gray-400 mt-1">Tutor</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600 font-medium">Aktif</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jenjang</span>
                <span className="text-gray-700">{levels.length > 0 ? levels.join(", ") : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mapel</span>
                <span className="text-gray-700">{selectedSubjectIds.length} mapel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2 border border-gray-200 p-6 rounded bg-white">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Informasi Profil</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama</label>
                <div className="flex items-center gap-2 border-b border-gray-200 px-0 py-1">
                  <User size={16} className="text-gray-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <div className="flex items-center gap-2 border-b border-gray-200 px-0 py-1 opacity-60">
                  <Mail size={16} className="text-gray-400" />
                  <input
                    value={profile?.email ?? ""}
                    disabled
                    className="w-full bg-transparent text-sm text-gray-900 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Headline</label>
              <div className="flex items-center gap-2 border-b border-gray-200 px-0 py-1">
                <BookOpen size={16} className="text-gray-400" />
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Tutor Matematika SMA Berpengalaman 5 Tahun"
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tentang Tutor</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 transition-colors rounded resize-none"
                rows={3}
                placeholder="Ceritakan tentang diri kamu sebagai tutor..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Link Google Maps</label>
              <div className="flex items-center gap-2 border-b border-gray-200 px-0 py-1">
                <MapPin size={16} className="text-gray-400" />
                <input
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/..."
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jenjang</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {LEVEL_OPTIONS.map((levelOption) => (
                    <button
                      key={levelOption}
                      type="button"
                      onClick={() =>
                        setLevels((current) =>
                          current.includes(levelOption)
                            ? current.filter((level) => level !== levelOption)
                            : [...current, levelOption],
                        )
                      }
                      className={`px-3 py-1 text-xs font-medium border rounded transition-colors ${
                        levels.includes(levelOption)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {levelOption}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mapel</label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {subjects.slice(0, 6).map((subject) => (
                    <label key={subject.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.includes(subject.id)}
                        onChange={(e) => {
                          setSelectedSubjectIds((current) =>
                            e.target.checked
                              ? [...current, subject.id]
                              : current.filter((id) => id !== subject.id),
                          );
                        }}
                        className="accent-blue-600 w-3.5 h-3.5"
                      />
                      {subject.name}
                    </label>
                  ))}
                </div>
                {subjects.length > 6 && (
                  <p className="text-[10px] text-gray-400 mt-1">+{subjects.length - 6} mapel lainnya</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Video Perkenalan</label>
              <div className="flex items-center gap-2 border-b border-gray-200 px-0 py-1">
                <Video size={16} className="text-gray-400" />
                <input
                  type="file"
                  accept="video/mp4,video/mov,video/webm"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setIntroVideoFile(file);
                  }}
                  className="text-sm text-gray-500 bg-transparent"
                />
              </div>
              {introVideoFile && (
                <p className="mt-1 text-xs text-gray-400">{introVideoFile.name}</p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded disabled:opacity-50 w-full sm:w-auto mt-2"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}