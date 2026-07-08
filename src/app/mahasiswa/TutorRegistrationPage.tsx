// frontend/src/components/TutorRegistrationPage.tsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, ShieldCheck, ChevronLeft, User, GraduationCap, FileText, Send, Plus, Trash2 } from "lucide-react";
import { toastSuccess, toastError, alertSuccess } from "../lib/swal";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
};

type Page = "landing" | "cari-tutor" | "detail-tutor" | "booking" | "live-class" | "chat" | "dashboard-siswa" | "forum" | "about" | "progress" | "settings" | "login" | "register" | "video" | "upload-video" | "admin" | "login-google-otp" | "tutor-registration" | "booking-saya" | "riwayat-belajar" | "favorit" | "notifikasi" | "platform-admin" | "tutor-login" | "admin-login";

export function TutorRegistrationPage({
  apiFetch, navigate, user,
}: {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
  user: User | null;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const initialCaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [initialCaptchaToken, setInitialCaptchaToken] = useState<string | null>(null);
  const recaptchaSiteKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY ?? "";

  // Step 2 — Data Diri
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [pricePerHour, setPricePerHour] = useState(50000);
  const [experienceYears, setExperienceYears] = useState(1);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [modeOnline, setModeOnline] = useState(true);
  const [modeOffline, setModeOffline] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 3 — Pendidikan
  const [educations, setEducations] = useState([{ degree: "", institution: "", major: "", year_end: "" }]);

  // Step 4 — Dokumen
  const [cv, setCv] = useState<File | null>(null);
  const [ktpPhoto, setKtpPhoto] = useState<File | null>(null);
  const [selfieKtp, setSelfieKtp] = useState<File | null>(null);
  const [introVideo, setIntroVideo] = useState<File | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const { t } = useTranslation();
  const levelOptions = [
    { key: "SD", label: t("tutorRegistration.levels.sd") },
    { key: "SMP", label: t("tutorRegistration.levels.smp") },
    { key: "SMA", label: t("tutorRegistration.levels.sma") },
    { key: "Mahasiswa", label: t("tutorRegistration.levels.university") },
  ];

  const loadOrStart = async () => {
    setLoadingProfile(true);
    try {
      const data = await apiFetch("/tutor/registration");
      setProfile(data.data ?? data);
    } catch (error) {
      try {
        const data = await apiFetch("/tutor/registration/start", { method: "POST" });
        setProfile(data.data ?? data);
      } catch (e: any) {
        toastError(e.message || t("tutorRegistration.startFailed"));
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadOrStart();
  }, []);

  useEffect(() => {
    if (!profile) return;

    setHeadline(profile.headline ?? "");
    setEmail(profile.email ?? "");
    setBio(profile.bio ?? "");
    setPricePerHour(profile.price_per_hour ?? 50000);
    setExperienceYears(profile.experience_years ?? 1);
    setGoogleMapsUrl(profile.google_maps_url ?? "");
    setLevels(profile.levels ?? []);
    setModeOnline(profile.mode_online ?? true);
    setModeOffline(profile.mode_offline ?? false);
  }, [profile]);

  // When user picks a profile photo, upload it immediately for profile preview.
  useEffect(() => {
    if (!profilePhoto) return;

    const upload = async () => {
      setUploadingPhoto(true);
      try {
        const fd = new FormData();
        fd.append("profile_photo", profilePhoto);
        const data = await apiFetch("/tutor/registration/photo", { method: "POST", body: fd });
        const prof = data.data ?? data;
        setProfile(prof);
        if (prof?.google_maps_url) setGoogleMapsUrl(prof.google_maps_url);
        toastSuccess(t("tutorRegistration.step2Saved"));
      } catch (e: any) {
        toastError(e.message || t("tutorRegistration.step2SaveFailed"));
      } finally {
        setUploadingPhoto(false);
      }
    };

    upload();
  }, [profilePhoto]);

  // Show success alert when tutor verified by admin
  useEffect(() => {
    if (profile?.registration_submitted && profile?.verification_status === "verified") {
      setTimeout(() => {
        alertSuccess(t("tutorRegistration.submittedVerifiedAlert"), t("tutorRegistration.submittedVerifiedAlertMessage"));
      }, 500);
    }
  }, [profile?.verification_status]);

  // Load reCAPTCHA script
  useEffect(() => {
    if ((window as any).grecaptcha) return;
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Render initial CAPTCHA verification (before registration form)
  useEffect(() => {
    if (loadingProfile || captchaVerified || !recaptchaSiteKey) return;
    const interval = setInterval(() => {
      const grecaptcha = (window as any).grecaptcha;
      if (grecaptcha && initialCaptchaRef.current && !initialCaptchaRef.current.hasChildNodes()) {
        grecaptcha.render(initialCaptchaRef.current, {
          sitekey: recaptchaSiteKey,
          callback: (token: string) => {
            setInitialCaptchaToken(token);
            setCaptchaVerified(true);
          },
        });
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [loadingProfile, captchaVerified, recaptchaSiteKey]);

  useEffect(() => {
    if (profile?.registration_step !== 4) return;
    if ((window as any).grecaptcha) return;
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [profile?.registration_step]);

  if (loadingProfile || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t("tutorRegistration.loadingApplication")}</div>
      </div>
    );
  }

  // Show CAPTCHA verification screen if not verified yet
  if (!captchaVerified && recaptchaSiteKey) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div ref={initialCaptchaRef} className="flex justify-center" />
          <button
            onClick={() => navigate("dashboard-siswa")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  const step = profile.registration_step ?? 1;

  const submitStep2 = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("headline", headline);
      formData.append("email", email);
      formData.append("bio", bio);
      formData.append("price_per_hour", String(pricePerHour));
      formData.append("experience_years", String(experienceYears));
      formData.append("google_maps_url", googleMapsUrl);
      levels.forEach((l) => formData.append("levels[]", l));
      formData.append("mode_online", modeOnline ? "1" : "0");
      formData.append("mode_offline", modeOffline ? "1" : "0");
      formData.append("subject_ids[]", "1");
      if (profilePhoto) formData.append("profile_photo", profilePhoto);

      const data = await apiFetch("/tutor/registration/step-2", { method: "PUT", body: formData });
      setProfile(data.data ?? data);
      toastSuccess(t("tutorRegistration.step2Saved"));
    } catch (error: any) {
      toastError(error.message || t("tutorRegistration.step2SaveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitStep3 = async () => {
    setSubmitting(true);
    try {
      const data = await apiFetch("/tutor/registration/step-3", {
        method: "PUT",
        body: JSON.stringify({ educations: educations.filter((e) => e.degree && e.institution) }),
      });
      setProfile(data.data ?? data);
      toastSuccess(t("tutorRegistration.step3Saved"));
    } catch (error: any) {
      toastError(error.message || t("tutorRegistration.step3SaveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitStep4 = async () => {
    if (!cv || !ktpPhoto || !selfieKtp) {
      toastError(t("tutorRegistration.step4MissingDocuments"));
      return;
    }

    setSubmitting(true);
    try {
      if (!initialCaptchaToken) {
        toastError("reCAPTCHA belum diverifikasi. Silakan coba lagi.");
        return;
      }

      const formData = new FormData();
      formData.append("cv", cv);
      formData.append("ktp_photo", ktpPhoto);
      formData.append("selfie_ktp", selfieKtp);
      if (introVideo) formData.append("intro_video", introVideo);
      formData.append("bank_name", bankName);
      formData.append("bank_account_number", bankAccountNumber);
      formData.append("bank_account_holder", bankAccountHolder);
      formData.append("recaptcha_token", initialCaptchaToken);

      const data = await apiFetch("/tutor/registration/step-4", { method: "POST", body: formData });
      setProfile(data.data ?? data);
      toastSuccess(t("tutorRegistration.step4Uploaded"));
    } catch (error: any) {
      toastError(error.message || t("tutorRegistration.step4UploadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitFinal = async () => {
    setSubmitting(true);
    try {
      const data = await apiFetch("/tutor/registration/submit", { method: "POST" });
      setProfile(data.data ?? data);
      alertSuccess(t("tutorRegistration.submittedTitle"), t("tutorRegistration.submittedMessagePending"));
    } catch (error: any) {
      toastError(error.message || t("tutorRegistration.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (profile.registration_submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full border border-gray-200 p-6 text-center rounded">
          <div className={`w-16 h-16 border flex items-center justify-center mx-auto mb-4 rounded ${
            profile.verification_status === "verified" 
              ? "bg-green-50 border-green-200" 
              : "bg-blue-50 border-blue-200"
          }`}>
            <ShieldCheck size={28} className={profile.verification_status === "verified" ? "text-green-600" : "text-blue-600"} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            {profile.verification_status === "verified" ? t("tutorRegistration.submittedHeadingVerified") : 
             profile.verification_status === "rejected" ? t("tutorRegistration.submittedHeadingRejected") : 
             t("tutorRegistration.submittedHeadingPending")}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {profile.verification_status === "verified" && t("tutorRegistration.submittedVerifiedDescription")}
            {profile.verification_status === "rejected" && (profile.verification_note || t("tutorRegistration.submittedRejectedDefault"))}
            {profile.verification_status === "pending" && t("tutorRegistration.submittedPendingDescription")}
          </p>
          <button onClick={() => navigate("dashboard-siswa")} className="w-full py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded">
            {t("tutorRegistration.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 1, label: t("tutorRegistration.steps.dataDiri"), icon: <User size={14} /> },
    { key: 2, label: t("tutorRegistration.steps.pendidikan"), icon: <GraduationCap size={14} /> },
    { key: 3, label: t("tutorRegistration.steps.dokumen"), icon: <FileText size={14} /> },
    { key: 4, label: t("tutorRegistration.steps.submit"), icon: <Send size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-4">

        {/* Back */}
        <button
          onClick={() => navigate("dashboard-siswa")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> {t("tutorRegistration.back")}
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-gray-900">{t("tutorRegistration.pageTitle")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("tutorRegistration.pageSubtitle")}</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-3">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0 border rounded ${
                s.key < step ? "border-green-500 bg-green-50 text-green-600" :
                s.key === step ? "border-blue-600 bg-blue-600 text-white" :
                "border-gray-200 bg-white text-gray-400"
              }`}>
                {s.key < step ? <Check size={12} /> : s.icon}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${s.key < step ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-6 text-[10px] font-medium text-gray-400">
          {steps.map((s) => (
            <span key={s.key} className={`${s.key === step ? "text-blue-600" : ""}`}>
              {s.label}
            </span>
          ))}
        </div>

        {/* ── STEP 1: DATA DIRI ── */}
        {step === 1 && (
          <div className="border border-gray-200 p-4 rounded">
            <h3 className="text-base font-bold text-gray-900 mb-4">{t("tutorRegistration.step1Title")}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.headlineLabel")}</label>
                <input 
                  value={headline} 
                  onChange={(e) => setHeadline(e.target.value)} 
                  placeholder={t("tutorRegistration.headlinePlaceholder")}
                  className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="nama@email.com"
                  className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Email yang akan menerima password tutor saat disetujui admin</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.bioLabel")}</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  rows={3}
                  placeholder={t("tutorRegistration.bioPlaceholder")}
                  className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.pricePerHourLabel")}</label>
                  <input 
                    type="number" 
                    value={pricePerHour} 
                    onChange={(e) => setPricePerHour(Number(e.target.value))} 
                    className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.experienceYearsLabel")}</label>
                  <input 
                    type="number" 
                    value={experienceYears} 
                    onChange={(e) => setExperienceYears(Number(e.target.value))} 
                    className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.googleMapsUrlLabel")}</label>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder={t("tutorRegistration.googleMapsUrlPlaceholder")}
                  className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">{t("tutorRegistration.googleMapsUrlHint")}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">{t("tutorRegistration.teachingLevelsLabel")}</label>
                <div className="flex gap-2 flex-wrap">
                  {levelOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setLevels((prev) => (prev.includes(option.key) ? prev.filter((x) => x !== option.key) : [...prev, option.key]))}
                      className={`px-4 py-1.5 text-xs font-medium border rounded transition-colors ${
                        levels.includes(option.key) 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={modeOnline} onChange={(e) => setModeOnline(e.target.checked)} /> Online
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={modeOffline} onChange={(e) => setModeOffline(e.target.checked)} /> Offline
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.profilePhotoLabel")}</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setProfilePhoto(e.target.files?.[0] ?? null)} 
                  className="w-full text-sm text-gray-500 border-b border-gray-200 py-1.5"
                />
              </div>

              <button 
                onClick={submitStep2} 
                disabled={submitting} 
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 rounded mt-2"
              >
                {submitting ? t("tutorRegistration.saving") : t("tutorRegistration.saveAndContinue")}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PENDIDIKAN ── */}
        {step === 2 && (
          <div className="border border-gray-200 p-4 rounded">
            <h3 className="text-base font-bold text-gray-900 mb-4">{t("tutorRegistration.step2Title")}</h3>
            <div className="space-y-4">
              {educations.map((edu, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.educationDegreeLabel")}</label>
                      <input 
                        placeholder={t("tutorRegistration.educationDegreePlaceholder")} 
                        value={edu.degree} 
                        onChange={(e) => setEducations((prev) => prev.map((x, idx) => idx === i ? { ...x, degree: e.target.value } : x))} 
                        className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.educationInstitutionLabel")}</label>
                      <input 
                        placeholder={t("tutorRegistration.educationInstitutionPlaceholder")} 
                        value={edu.institution} 
                        onChange={(e) => setEducations((prev) => prev.map((x, idx) => idx === i ? { ...x, institution: e.target.value } : x))} 
                        className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.educationMajorLabel")}</label>
                      <input 
                        placeholder={t("tutorRegistration.educationMajorPlaceholder")} 
                        value={edu.major} 
                        onChange={(e) => setEducations((prev) => prev.map((x, idx) => idx === i ? { ...x, major: e.target.value } : x))} 
                        className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.educationGraduationYearLabel")}</label>
                        <input 
                          placeholder={t("tutorRegistration.educationGraduationYearPlaceholder")} 
                          value={edu.year_end} 
                          onChange={(e) => setEducations((prev) => prev.map((x, idx) => idx === i ? { ...x, year_end: e.target.value } : x))} 
                          className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      {educations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEducations((prev) => prev.filter((_, idx) => idx !== i))}
                          className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors rounded shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setEducations((prev) => [...prev, { degree: "", institution: "", major: "", year_end: "" }])} 
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus size={16} /> {t("tutorRegistration.addEducation")}
              </button>
              <button 
                onClick={submitStep3} 
                disabled={submitting} 
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 rounded mt-4"
              >
                {submitting ? t("tutorRegistration.saving") : t("tutorRegistration.saveAndContinue")}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: DOKUMEN ── */}
        {step === 3 && (
          <div className="border border-gray-200 p-4 rounded">
            <h3 className="text-base font-bold text-gray-900 mb-4">{t("tutorRegistration.step3Title")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.cvLabel")}</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setCv(e.target.files?.[0] ?? null)} 
                  className="w-full text-sm text-gray-500 border-b border-gray-200 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.ktpPhotoLabel")}</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setKtpPhoto(e.target.files?.[0] ?? null)} 
                  className="w-full text-sm text-gray-500 border-b border-gray-200 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.selfieKtpLabel")}</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setSelfieKtp(e.target.files?.[0] ?? null)} 
                  className="w-full text-sm text-gray-500 border-b border-gray-200 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.introVideoLabel")}</label>
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={(e) => setIntroVideo(e.target.files?.[0] ?? null)} 
                  className="w-full text-sm text-gray-500 border-b border-gray-200 py-1.5"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.bankNameLabel")}</label>
                  <input 
                    placeholder={t("tutorRegistration.bankNamePlaceholder")} 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                    className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.bankAccountNumberLabel")}</label>
                  <input 
                    placeholder={t("tutorRegistration.bankAccountNumberPlaceholder")} 
                    value={bankAccountNumber} 
                    onChange={(e) => setBankAccountNumber(e.target.value)} 
                    className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("tutorRegistration.bankAccountHolderLabel")}</label>
                  <input 
                    placeholder={t("tutorRegistration.bankAccountHolderPlaceholder")} 
                    value={bankAccountHolder} 
                    onChange={(e) => setBankAccountHolder(e.target.value)} 
                    className="w-full border-b border-gray-200 px-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <button 
                onClick={submitStep4} 
                disabled={submitting} 
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 rounded"
              >
                {submitting ? t("tutorRegistration.uploading") : t("tutorRegistration.uploadAndContinue")}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: SUBMIT ── */}
        {step >= 4 && (
          <div className="border border-gray-200 p-4 rounded text-center">
            <h3 className="text-base font-bold text-gray-900 mb-2">{t("tutorRegistration.step4Title")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("tutorRegistration.step4Description")}</p>
            <button 
              onClick={submitFinal} 
              disabled={submitting} 
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 rounded"
            >
              {submitting ? t("tutorRegistration.submitting") : t("tutorRegistration.submitNow")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default TutorRegistrationPage;