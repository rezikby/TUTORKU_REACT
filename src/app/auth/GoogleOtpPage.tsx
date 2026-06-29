// frontend/src/app/auth/GoogleOtpPage.tsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ShieldCheck, ArrowLeft, GraduationCap, ArrowRight, AlertCircle } from "lucide-react";

type Page = "landing" | "login" | "dashboard-siswa" | "login-google-otp";

interface GoogleOtpPageProps {
  navigate: (page: Page) => void;
  verifyGoogleOtp: (otp: string) => Promise<boolean>;
  resendGoogleOtp: () => Promise<void>;
  otpCooldown: number;
  loading: boolean;
  error: string | null;
}

export default function GoogleOtpPage({
  navigate,
  verifyGoogleOtp,
  resendGoogleOtp,
  otpCooldown,
  loading,
  error,
}: GoogleOtpPageProps) {
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(otpCooldown);
  const [otpError, setOtpError] = useState<string | null>(null);
  const { t } = useTranslation();

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    setCountdown(otpCooldown);
  }, [otpCooldown]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (otpError) setOtpError(null);
  }, [otp]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 4) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 5);
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 5) newOtp[i] = digit;
      });
      setOtp(newOtp);
      if (digits.length > 0) {
        const lastIndex = Math.min(digits.length - 1, 4);
        inputRefs[lastIndex].current?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join("");
    if (otpCode.length < 5) {
      setOtpError(t("auth.otpMinDigits"));
      return;
    }

    setVerifying(true);
    setOtpError(null);
    
    try {
      const success = await verifyGoogleOtp(otpCode);
      if (success) {
        navigate("dashboard-siswa");
      }
    } catch (err: any) {
      setOtpError(err.message || t("auth.verifyFailed"));
      setOtp(["", "", "", "", ""]);
      inputRefs[0].current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    
    setResending(true);
    setOtpError(null);
    
    try {
      await resendGoogleOtp();
      setCountdown(60);
    } catch (err: any) {
      setOtpError(err.message || t("auth.otpResendFailed"));
    } finally {
      setResending(false);
    }
  };

  const displayError = error || otpError;
  const otpCode = otp.join("");

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Left Panel - Branding */}
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
            <div>
              <span className="text-2xl font-bold text-white">TUTORKU</span>
              <p className="text-white/60 text-sm mt-1">{t("auth.tagline")}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            {t("auth.brandTagline")}
          </h2>
          <p className="text-white/70 text-lg">
            {t("auth.verifyEmailDescription")}
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-white/50 text-sm">© 2024 TUTORKU. Hak cipta dilindungi.</p>
        </div>
      </div>

      {/* Right Panel - OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => navigate("login")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all mb-6"
          >
            <ArrowLeft size={18} />
            <span>{t("auth.backToLogin")}</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                <ShieldCheck size={18} className="text-[#2563EB]" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("auth.verifyEmail")}
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.otpSentEmail")}
            </p>
          </div>

          {displayError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t("auth.verifyCode")}
              </label>
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3, 4].map((index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    value={otp[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-14 h-14 text-center text-2xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all"
                    maxLength={1}
                    autoFocus={index === 0}
                    disabled={verifying || loading}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                {t("auth.sentToEmail")}
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying || loading || otpCode.length < 5}
              className="w-full py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-[#1D4ED8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
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
          </form>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {t("auth.sendingOtp")}
                </span>
              ) : countdown > 0 ? (
                <span>{t("auth.resendCode")} ({countdown}s)</span>
              ) : (
                <span>{t("auth.resendCode")}</span>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            {t("auth.verifyEmailHint")}
          </p>
        </div>
      </div>
    </div>
  );
}