import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

type Page =
  | "landing"
  | "cari-tutor"
  | "detail-tutor"
  | "booking"
  | "live-class"
  | "chat"
  | "dashboard-siswa"
  | "forum"
  | "about"
  | "progress"
  | "settings"
  | "login"
  | "register"
  | "video"
  | "upload-video"
  | "admin"
  | "login-google-otp"
  | "tutor-registration"
  | "booking-saya"
  | "riwayat-belajar"
  | "favorit"
  | "notifikasi"
  | "platform-admin"
  | "tutor-login"
  | "admin-login"
  | "booking-detail";

interface AdminLoginPageProps {
  navigate: (page: Page) => void;
  adminLoginWithPassword: (email: string, password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function AdminLoginPage({
  navigate,
  adminLoginWithPassword,
  loading,
  error,
}: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await adminLoginWithPassword(email.trim(), password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f1] px-4 py-12">
      <div className="w-full max-w-[320px]">
        {/* Header dengan Logo WordPress style */}
        <div className="text-center mb-6">
          <div className="inline-block">
            <div className="w-[84px] h-[84px] mx-auto bg-[#3858e9] rounded-full flex items-center justify-center mb-4 shadow-md">
              <span className="text-white text-3xl font-bold tracking-tight">TK</span>
            </div>
          </div>
          <h1 className="text-2xl font-normal text-[#1e1e1e] tracking-wide">
            Masuk
          </h1>
        </div>

        {/* Error Message - WordPress Style */}
        {error && (
          <div className="mb-4 p-3 bg-[#fcf0f1] border-l-4 border-[#d63638] rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[#d63638] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[#1e1e1e]">{error}</span>
            </div>
          </div>
        )}

        {/* Form - WordPress Style */}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            {/* Username/Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e] mb-1">
                Nama Pengguna atau Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder=""
                className="w-full rounded border border-[#dcdcde] px-3 py-2 text-sm text-[#1e1e1e] outline-none transition-all focus:border-[#3858e9] focus:shadow-[0_0_0_1px_#3858e9] bg-white"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e] mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=""
                className="w-full rounded border border-[#dcdcde] px-3 py-2 text-sm text-[#1e1e1e] outline-none transition-all focus:border-[#3858e9] focus:shadow-[0_0_0_1px_#3858e9] bg-white"
              />
            </div>

            {/* Remember Me Checkbox - WordPress Style */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#1e1e1e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#dcdcde] text-[#3858e9] focus:ring-[#3858e9] focus:ring-offset-0 cursor-pointer"
                />
                <span>Ingat Saya</span>
              </label>
            </div>

            {/* Login Button - WordPress Style */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3858e9] hover:bg-[#2145e0] text-white font-medium py-2.5 rounded transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </div>
        </form>

        {/* Lupa Password Link - WordPress Style */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate("login")}
            className="text-sm text-[#3858e9] hover:text-[#2145e0] hover:underline"
          >
            Lupa kata sandi?
          </button>
        </div>

        {/* Go to Student Page - WordPress Style (mirip "Go to Lutfi's Blog") */}
        <div className="text-center mt-6 pt-4 border-t border-[#dcdcde]">
          <button
            type="button"
            onClick={() => navigate("login")}
            className="text-sm text-[#3858e9] hover:text-[#2145e0] hover:underline"
          >
            ← Kembali ke Halaman Siswa
          </button>
        </div>

        {/* Footer WordPress Style */}
        <div className="mt-8 text-center text-xs text-[#646970] leading-relaxed">
          <p>TUTORKU Admin</p>
          <p className="mt-1 opacity-70">
            © 2026 TUTORKU. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}