import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, GraduationCap, ChevronRight, Sparkles } from "lucide-react";

interface OnboardingPageProps {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  user: any | null;
  navigate: (page: string) => void;
  onUpdateUser: (user: any | null) => void;
}

const educationLevels = [
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
  { value: "Mahasiswa", label: "Mahasiswa" },
];

const sdClasses = [
  { value: "1", label: "Kelas 1" },
  { value: "2", label: "Kelas 2" },
  { value: "3", label: "Kelas 3" },
  { value: "4", label: "Kelas 4" },
  { value: "5", label: "Kelas 5" },
  { value: "6", label: "Kelas 6" },
];

export default function OnboardingPage({ apiFetch, user, navigate, onUpdateUser }: OnboardingPageProps) {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<string>(user?.education_level ?? "");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedLevel) {
      setError("Pilih jenjang terlebih dahulu.");
      return;
    }

    if (selectedLevel === "SD" && !selectedClass) {
      setError("Pilih kelas untuk jenjang SD.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch("/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          education_level: selectedLevel,
          onboarding_completed: true,
        }),
      });

      const updatedUser = response.data ?? response;
      onUpdateUser(updatedUser);
      navigate("dashboard-siswa");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err?.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Selamat Datang!
            </span>
          </div>
        </div>

        {/* Card utama */}
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 flex-shrink-0">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Pilih Jenjang Pendidikan
              </h1>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                Lengkapi informasi ini agar kami dapat menyesuaikan pengalaman belajar kamu.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <span className="text-sm font-medium text-gray-700">Jenjang</span>
              </div>
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <span className="text-sm text-gray-400">Kelas</span>
              </div>
            </div>

            <div className="space-y-5">
              {/* Jenjang Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Jenjang
                </label>
                <div className="relative">
                  <select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      if (e.target.value !== "SD") {
                        setSelectedClass("");
                      }
                    }}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 pr-10 text-gray-900 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer hover:border-gray-300"
                  >
                    <option value="">Pilih jenjang</option>
                    {educationLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Kelas Select - muncul jika SD dipilih */}
              {selectedLevel === "SD" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pilih Kelas
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 pr-10 text-gray-900 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer hover:border-gray-300"
                    >
                      <option value="">Pilih kelas</option>
                      {sdClasses.map((kelas) => (
                        <option key={kelas.value} value={kelas.value}>
                          {kelas.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info tambahan jika SD dipilih tapi kelas belum dipilih */}
            {selectedLevel === "SD" && !selectedClass && (
              <div className="rounded-xl bg-blue-50 px-4 py-3 border border-blue-100">
                <p className="text-sm text-blue-700">
                  💡 Silakan pilih kelas untuk jenjang SD
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
                <span className="text-red-500 text-lg leading-none">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate("login")}
                className="rounded-xl border-2 border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Lanjutkan
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Data ini akan digunakan untuk rekomendasi tutor yang sesuai
        </p>
      </div>
    </div>
  );
}