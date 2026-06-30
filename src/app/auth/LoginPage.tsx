import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  GraduationCap,
  ArrowRight,
  AlertCircle,
  Mail,
  Loader2,
  Phone,
} from "lucide-react";

type Page =
  | "landing"
  | "login"
  | "register"
  | "dashboard-siswa"
  | "admin-login"
  | "admin"
  | "platform-admin";

type LoginMode = "student" | "tutor";

interface LoginPageProps {
  navigate: (page: Page) => void;
  startGoogleLogin: (role: "student" | "tutor") => void;
  loginWithPhone: (
    phone: string,
  ) => Promise<{
    success: boolean;
    requires_otp?: boolean;
    phone?: string;
    message?: string;
    role?: string;
  }>;
  verifyPhoneOtp: (
    phone: string,
    otp: string,
  ) => Promise<{
    success: boolean;
    requires_otp?: boolean;
    phone?: string;
    message?: string;
    role?: string;
  }>;
  sendPhoneOtp: (phone: string) => Promise<boolean>;
  otpCooldown: number;
  loading: boolean;
  error: string | null;
  mode?: LoginMode;
}

export default function LoginPage({
  navigate,
  startGoogleLogin,
  loginWithPhone,
  verifyPhoneOtp,
  sendPhoneOtp,
  otpCooldown,
  loading,
  error,
  mode = "student",
}: LoginPageProps) {
  const { t } = useTranslation();
  const [activeMode, setActiveMode] = useState<LoginMode>(mode);
  const [step, setStep] = useState<"login" | "otp">("login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    setActiveMode(mode);
    setStep("login");
    setLoginError(null);
    setOtpError(null);
  }, [mode]);

  useEffect(() => {
    setCountdown(otpCooldown);
  }, [otpCooldown]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (loginError) setLoginError(null);
  }, [phone, activeMode]);

  useEffect(() => {
    if (otpError) setOtpError(null);
  }, [otp]);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim() || phone.length < 10) {
      setLoginError(t("auth.phoneMinDigits"));
      return;
    }

    const result = await loginWithPhone(phone);
    if (result.success) {
      // Route berdasarkan role ke dashboard yang sesuai
      if (result.role === "tutor") {
        navigate("admin"); // Dashboard tutor
      } else if (result.role === "admin") {
        navigate("platform-admin"); // Dashboard admin
      } else {
        navigate("dashboard-siswa"); // Dashboard siswa
      }
    } else if (result.requires_otp) {
      setStep("otp");
      setOtpError(null);
    } else if (result.message) {
      setLoginError(result.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length < 5) {
      setOtpError(t("auth.otpMinDigits"));
      return;
    }

    const verifyResult = await verifyPhoneOtp(phone, otp);
    if (!verifyResult.success) {
      if (verifyResult.message) {
        setOtpError(verifyResult.message);
      }
      return;
    }

    const loginResult = await loginWithPhone(phone);
    if (loginResult.success) {
      if (loginResult.role === "tutor") {
        navigate("admin");
      } else if (loginResult.role === "admin") {
        navigate("platform-admin");
      } else {
        navigate("dashboard-siswa");
      }
      return;
    }

    setOtpError(loginResult.message || t("auth.verifySuccess"));
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const success = await sendPhoneOtp(phone);
    if (success) {
      setCountdown(60);
      setOtpError(null);
    }
  };

  const handleGoogleLogin = () => {
    startGoogleLogin(activeMode);
  };

  const renderModeTabs = () => (
    <div className="mb-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {(["student", "tutor"] as LoginMode[]).map((modeOption) => (
        <button
          key={modeOption}
          type="button"
          onClick={() => setActiveMode(modeOption)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            activeMode === modeOption
              ? "bg-[#2563EB] text-white"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          {modeOption === "student" ? t("auth.student") : t("auth.tutor")}
        </button>
      ))}
    </div>
  );

  if (step === "otp") {
    return (
      <div className="min-h-screen flex bg-white dark:bg-gray-950">
        <div className="hidden lg:flex lg:w-1/2 bg-[#2563EB] flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">TUTORKU</span>
            </div>
            <p className="text-white/60 text-sm mt-2">
              Belajar. Tumbuh. Berprestasi.
            </p>
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              {t("auth.brandTagline")}
            </h2>
            <p className="text-white/70 text-lg">{t("auth.missionText")}</p>
          </div>
          <div className="relative z-10">
            <p className="text-white/50 text-sm">
              © 2024 TUTORKU. Hak cipta dilindungi.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="w-full max-w-md">
            <button
              onClick={() => setStep("login")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all mb-6"
            >
              <ArrowRight size={18} className="rotate-180" />
              <span>{t("auth.back")}</span>
            </button>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("auth.verifyNumber")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {t("auth.verifyNumberDescription", { phone })}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {otpError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("auth.verifyCode")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder={t("auth.verifyCodePlaceholder")}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                    maxLength={5}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {t("auth.verifyCodeHint")}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 5}
                className="w-full py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-[#1D4ED8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("auth.verifying")}
                  </>
                ) : (
                  <>
                    {t("auth.verifyAndLogin")}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `${t("auth.resendCode")} (${countdown}s)`
                    : t("auth.resendCode")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <div className="hidden lg:flex lg:w-1/2 bg-[#2563EB] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="relative w-10 h-10 flex-shrink-0">
                <img
                  src="/img/logo2.png"
                  alt="TUTORKU Logo"
                  className="absolute left-1 -translate-x-1/2 top-1/2 -translate-y-1/2 w-60 h-60 max-w-none max-h-none object-contain"
                />
              </div>
              <p className="text-white/60 text-sm mt-1">
                Belajar. Tumbuh. Berprestasi.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            {t("auth.brandTagline")}
          </h2>
          <p className="text-white/70 text-lg">{t("auth.heroSubtitle")}</p>
        </div>

        <div className="relative z-10">
          <p className="text-white/50 text-sm">
            © 2024 TUTORKU. Hak cipta dilindungi.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("auth.loginTitle")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t("auth.loginDescription")}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("auth.phoneLabel")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("auth.phonePlaceholder")}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                {t("auth.phoneRequired")}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-[#1D4ED8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk dengan Handphone
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-950 text-gray-500">
                {t("atau")}
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            <span>{t("auth.loginWithGoogle")}</span>
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            {t("auth.noAccount")}{" "}
            <button
              onClick={() => navigate("register")}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-all"
            >
              {t("auth.registerHere")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
