import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowRight, AlertCircle, Shield, CheckCircle } from "lucide-react";

type LoginResult = {
  success: boolean;
  requires_otp?: boolean;
  phone?: string;
  message?: string;
  role?: string;
  token?: string;
  user?: any;
};

interface RegisterOtpPageProps {
  phone: string;
  name: string;
  navigate: (page: string) => void;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<LoginResult>;
  registerWithPhone: (phone: string, name: string) => Promise<{
    success: boolean;
    token?: string;
    role?: string;
    message?: string;
  }>;
  sendPhoneOtp: (phone: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  otpCooldown: number;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

export default function RegisterOtpPage({
  phone,
  name,
  navigate,
  verifyPhoneOtp,
  registerWithPhone,
  sendPhoneOtp,
  otpCooldown,
  loading,
  error,
  onBack,
}: RegisterOtpPageProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { t } = useTranslation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setCountdown(otpCooldown);
  }, [otpCooldown]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (otpError) {
      setOtpError(null);
    }
  }, [otp]);

  useEffect(() => {
    if (error) {
      const secs = parseCooldownFromMessage(error);
      if (secs && countdown <= 0) {
        setCountdown(secs);
      }
    }
  }, [error]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const parseCooldownFromMessage = (msg?: string | null): number | null => {
    if (!msg) return null;
    const m = msg.match(/(\d+\.?\d*)/);
    if (!m) return null;
    const val = Math.ceil(parseFloat(m[1]));
    return val > 0 ? val : 1;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "Enter" && otp.join("").length === 5) {
      e.preventDefault();
      handleVerifyOtp(e as any);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 5);
    const digits = pastedData.split("").filter((char) => /^\d$/.test(char));

    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 5) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);

      const lastIndex = Math.min(digits.length - 1, 4);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length < 5) {
      setOtpError(t("auth.otpMinDigits"));
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const verified = await verifyPhoneOtp(phone, otpString);

      if (!verified.success) {
        setOtpError(verified.message || t("auth.verifyFailed"));
        setIsVerifying(false);
        return;
      }

      const token = verified.token || localStorage.getItem("TUTORKU_token");

      if (token) {
        if (!localStorage.getItem("TUTORKU_token")) {
          localStorage.setItem("TUTORKU_token", token);
        }

        const role = verified.role || "siswa";
        if (role === "tutor") {
          navigate("dashboard-tutor");
        } else {
          navigate("dashboard-siswa");
        }
      } else {
        setOtpError("Token tidak ditemukan. Silakan login ulang.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      const secs = parseCooldownFromMessage(err?.message);
      if (secs) setCountdown(secs);
      setOtpError(err.message || t("auth.verifyFailed"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendSuccess(false);
    setOtpError(null);

    try {
      const result = await sendPhoneOtp(phone);

      if (result.success) {
        setCountdown(60);
        setOtp(["", "", "", "", ""]);
        setResendSuccess(true);
        inputRefs.current[0]?.focus();

        setTimeout(() => {
          setResendSuccess(false);
        }, 3000);
      } else {
        const secs = parseCooldownFromMessage(result.message);
        if (secs) {
          setCountdown(secs);
        }
        setOtpError(result.message || "Gagal mengirim ulang OTP");
      }
    } catch (err: any) {
      const secs = parseCooldownFromMessage(err?.message);
      if (secs) {
        setCountdown(secs);
      }
      setOtpError(err.message || "Gagal mengirim ulang OTP");
    } finally {
      setIsResending(false);
    }
  };

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
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">TUTORKU</span>
              <p className="text-white/60 text-sm mt-1">{t("auth.tagline")}</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">{t("auth.brandTagline")}</h2>
          <p className="text-white/70 text-lg">{t("auth.registerMissionText")}</p>
        </div>
        <div className="relative z-10">
          <p className="text-white/50 text-sm">© 2024 TUTORKU. Hak cipta dilindungi.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all mb-6"
          >
            <ArrowRight size={18} className="rotate-180" />
            <span>{t("auth.back")}</span>
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("auth.verifyNumber")}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t("auth.otpSent")}</p>
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

          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Kode OTP baru telah dikirim ke WhatsApp Anda</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("auth.verifyCode")}
              </label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-14 h-14 text-center text-xl font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    maxLength={1}
                    autoFocus={index === 0}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={isVerifying || loading}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                {t("auth.sentToPhone", { phone })}
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifying || loading || otp.join("").length < 5}
              className="w-full py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-[#1D4ED8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying || loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Verifikasi & Daftar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading || isResending}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : countdown > 0 ? (
                  `${t("auth.resendCode")} (${countdown}s)`
                ) : (
                  t("auth.resendCode")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}