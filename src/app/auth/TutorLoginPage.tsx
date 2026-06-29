import React, { useState } from "react";

export default function TutorLoginPage(props: any) {
  const { navigate, tutorLoginWithPassword, startTutorGoogleLogin, loading, error } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await tutorLoginWithPassword(email, password, remember);
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-2">Login Tutor</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Khusus tutor yang sudah disetujui. Gunakan email & password yang dikirim ke emailmu, atau masuk dengan Google.
        </p>

        {error && <p className="mb-4 text-sm text-[#FF5757]">{error}</p>}

        <button
          onClick={startTutorGoogleLogin}
          disabled={loading}
          className="w-full mb-4 flex items-center justify-center gap-3 rounded-2xl border border-border bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-all disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.5 0-14 4.1-17.7 10.7z" />
            <path fill="#4CAF50" d="M24 44c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.6 35.4 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.9 39.8 16.4 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.8l6.6 5.6C41.9 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          Lanjutkan dengan Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">atau</span>
          <div className="h-px flex-1 bg-border" />
        </div>

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
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
            Ingat saya di perangkat ini
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
          Bukan tutor? Kembali ke halaman masuk siswa
        </button>
      </div>
    </div>
  );
}
