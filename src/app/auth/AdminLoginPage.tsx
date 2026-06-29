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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await adminLoginWithPassword(email.trim(), password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-2">Login Admin</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Masuk untuk mengelola platform TUTORKU.
        </p>

        {(error || email || password) && error && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300 border border-red-500">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-muted-foreground">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-white outline-none focus:border-primary"
            />
          </label>

          <label className="block text-sm text-muted-foreground">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-white outline-none focus:border-primary"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {loading ? "Memuat..." : "Masuk"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("login")}
          className="w-full mt-4 text-center text-xs text-muted-foreground hover:text-white"
        >
          Kembali ke halaman masuk siswa
        </button>
      </div>
    </div>
  );
}
