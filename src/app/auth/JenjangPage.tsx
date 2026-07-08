import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ChevronRight } from "lucide-react";

interface JenjangPageProps {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  user: any | null;
  navigate: (page: string) => void;
  onUpdateUser: (user: any | null) => void;
}

const jenjangOptions = [
  { value: "SD", label: "SD" },
  { value: "SMP/MTS", label: "SMP / MTs" },
  { value: "SMA/SMK", label: "SMA / SMK" },
  { value: "Universitas/Politeknik", label: "Universitas / Politeknik" },
];

const sdClassOptions = [
  { value: "1", label: "Kelas 1" },
  { value: "2", label: "Kelas 2" },
  { value: "3", label: "Kelas 3" },
  { value: "4", label: "Kelas 4" },
  { value: "5", label: "Kelas 5" },
  { value: "6", label: "Kelas 6" },
];

const smpClassOptions = [
  { value: "7", label: "Kelas 7" },
  { value: "8", label: "Kelas 8" },
  { value: "9", label: "Kelas 9" },
];

const smaClassOptions = [
  { value: "10", label: "Kelas 10" },
  { value: "11", label: "Kelas 11" },
  { value: "12", label: "Kelas 12" },
];

const semesterOptions = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
];

export default function JenjangPage({ apiFetch, user, navigate, onUpdateUser }: JenjangPageProps) {
  const { t } = useTranslation();
  const [selectedJenjang, setSelectedJenjang] = useState<string>(user?.education_level ?? "");
  const [selectedDetail, setSelectedDetail] = useState<string>(user?.education_detail ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedJenjang) {
      setError("Pilih jenjang terlebih dahulu.");
      return;
    }

    if (
      (selectedJenjang === "SD" || selectedJenjang === "SMP/MTS" || selectedJenjang === "SMA/SMK") &&
      !selectedDetail
    ) {
      setError("Pilih kelas untuk jenjang ini.");
      return;
    }

    if (selectedJenjang === "Universitas/Politeknik" && !selectedDetail) {
      setError("Pilih semester untuk jenjang Universitas / Politeknik.");
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
          education_level: selectedJenjang,
          education_detail: selectedDetail,
          onboarding_completed: true,
        }),
      });

      const updatedUser = response.data ?? response;
      onUpdateUser(updatedUser);
      navigate("dashboard-siswa");
    } catch (err: any) {
      console.error("Jenjang update error:", err);
      setError(err?.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12"
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src="/img/logo1.png" 
            alt="Edukasi" 
            className="w-40 h-40 object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Pilih Jenjang Pendidikan
          </h1>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed max-w-md">
            Pilih jenjang pendidikanmu dan detailnya. Untuk kuliah, pilih semester; untuk sekolah pilih kelas.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              1
            </span>
            <span className="text-sm font-medium text-gray-700">Jenjang</span>
          </div>
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-semibold">
              2
            </span>
            <span className="text-sm text-gray-400">Detail</span>
          </div>
        </div>

        {/* Jenjang Select */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Jenjang Pendidikan
          </label>
          <select
            value={selectedJenjang}
            onChange={(e) => {
              setSelectedJenjang(e.target.value);
              setSelectedDetail("");
            }}
            className="w-full border-2 border-gray-200 bg-white px-4 py-3.5 pr-10 text-gray-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer hover:border-gray-300"
          >
            <option value="">Pilih jenjang</option>
            {jenjangOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Detail Select */}
        {(selectedJenjang === "SD" || selectedJenjang === "SMP/MTS" || selectedJenjang === "SMA/SMK" || selectedJenjang === "Universitas/Politeknik") && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {selectedJenjang === "Universitas/Politeknik" ? "Pilih Semester" : "Pilih Kelas"}
            </label>
            <select
              value={selectedDetail}
              onChange={(e) => setSelectedDetail(e.target.value)}
              className="w-full border-2 border-gray-200 bg-white px-4 py-3.5 pr-10 text-gray-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer hover:border-gray-300"
            >
              <option value="">
                {selectedJenjang === "Universitas/Politeknik" ? "Pilih semester" : "Pilih kelas"}
              </option>
              {(selectedJenjang === "SD" ? sdClassOptions : selectedJenjang === "SMP/MTS" ? smpClassOptions : selectedJenjang === "SMA/SMK" ? smaClassOptions : semesterOptions).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <span className="text-red-500 text-lg leading-none">⚠️</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate("login")}
            className="border-2 border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Data ini akan digunakan untuk rekomendasi tutor yang sesuai
        </p>
      </div>
    </form>
  );
}