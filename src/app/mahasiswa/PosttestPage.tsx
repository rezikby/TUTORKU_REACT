import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  ChevronRight,
} from "lucide-react";
import type { Page } from "../types.ts";

const LEVEL_TIME_PER_QUESTION: Record<string, number> = {
  SD: 60,
  "SMP/MTS": 45,
  "SMA/SMK": 35,
  "Universitas/Politeknik": 30,
};

const DEFAULT_QUESTIONS = 10;

type PosttestQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type User = {
  id?: number;
  name?: string;
  education_level?: string | null;
  education_detail?: string | null;
};

function getTimePerQuestion(level?: string | null) {
  return LEVEL_TIME_PER_QUESTION[level ?? ""] ?? 35;
}

function buildAiPrompt(level: string | null, detail: string | null, subject: string | null, seed?: string) {
  const safeLevel = level || "SMA/SMK";
  const safeDetail = detail ? ` (${detail})` : "";
  const safeSubject = subject || "pelajaran umum";
  const safeSeed = seed ? ` (seed: ${seed})` : "";

  return `Buat ${DEFAULT_QUESTIONS} soal pilihan ganda posttest yang sesuai dengan jenjang ${safeLevel}${safeDetail} untuk materi ${safeSubject}${safeSeed}. Fokus pada evaluasi pemahaman akhir setelah sesi belajar. Setiap soal harus berbeda jika prompt dipanggil lagi. Setiap soal harus memiliki 4 opsi jawaban A, B, C, dan D. Berikan jawaban benar dalam properti "answer" menggunakan huruf A, B, C, atau D. Balas hanya dengan JSON array yang valid dengan format:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "answer": "A"
  },
  ...
]`;
}

function parseQuestionsFromAi(text: string): PosttestQuestion[] {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\[([\s\S]*)\]$/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map((item) => ({
            question: String(item.question || ""),
            options: Array.isArray(item.options)
              ? item.options.map((opt: any) => String(opt || ""))
              : [],
            answer: String(item.answer || "").trim().toUpperCase(),
          }))
          .filter(
            (item) =>
              item.question &&
              item.options.length === 4 &&
              ["A", "B", "C", "D"].includes(item.answer),
          );
      }
    } catch {
      // fall through
    }
  }

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim());
  const questions: PosttestQuestion[] = [];
  let current: Partial<PosttestQuestion> = {};

  for (const line of lines) {
    if (!line) continue;
    const questionMatch = line.match(/^\d+\.\s*(.+)$/);
    const optionMatch = line.match(/^[A-D][\.)]\s*(.+)$/i);
    const answerMatch = line.match(/^(?:Jawaban|Answer|Benar|Kunci)[:\s]*([A-D])/i);

    if (questionMatch) {
      if (current.question && current.options && current.options.length === 4 && current.answer) {
        questions.push(current as PosttestQuestion);
      }
      current = { question: questionMatch[1].trim(), options: [], answer: "" };
      continue;
    }

    if (optionMatch && current.options) {
      current.options = [...current.options, optionMatch[1].trim()];
      continue;
    }

    if (answerMatch && current) {
      current.answer = answerMatch[1].trim().toUpperCase();
    }
  }

  if (current.question && current.options && current.options.length === 4 && current.answer) {
    questions.push(current as PosttestQuestion);
  }

  return questions;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fallbackQuestions(level?: string | null, subject?: string | null): PosttestQuestion[] {
  const normalized = (subject || "").toLowerCase();

  if (normalized.includes("matematika") || normalized.includes("math") || normalized.includes("aljabar")) {
    return [
      { question: "Hasil dari 12 × 8 adalah?", options: ["86", "90", "96", "100"], answer: "C" },
      { question: "Persamaan 2x + 3 = 11, maka x = ?", options: ["3", "4", "5", "6"], answer: "C" },
      { question: "Luas persegi panjang 8 cm × 5 cm adalah?", options: ["30 cm²", "35 cm²", "40 cm²", "45 cm²"], answer: "C" },
      { question: "Berapakah 25% dari 80?", options: ["10", "15", "20", "25"], answer: "C" },
      { question: "Nilai dari 3² + 4² adalah?", options: ["12", "20", "25", "30"], answer: "C" },
      { question: "Berapakah hasil 7 × 7?", options: ["42", "47", "49", "56"], answer: "C" },
      { question: "Jika x = 3, maka 2x + 5 = ?", options: ["9", "10", "11", "12"], answer: "C" },
      { question: "Suku ke-3 deret aritmetika dengan suku pertama 2 dan beda 3 adalah?", options: ["5", "8", "11", "14"], answer: "B" },
      { question: "Berapa akar kuadrat dari 81?", options: ["7", "8", "9", "10"], answer: "C" },
      { question: "Jika 5x = 35, maka x = ?", options: ["5", "6", "7", "8"], answer: "C" },
    ];
  }

  if (normalized.includes("inggris") || normalized.includes("english") || normalized.includes("bahasa")) {
    return [
      { question: "Which sentence is grammatically correct?", options: ["She go to school every day", "She goes to school every day", "She going to school every day", "She gone to school every day"], answer: "B" },
      { question: "The opposite of 'difficult' is?", options: ["Hard", "Easy", "Tall", "Slow"], answer: "B" },
      { question: "What is the past tense of 'eat'?", options: ["Ate", "Eaten", "Eating", "Eat"], answer: "A" },
      { question: "Choose the correct article: ___ apple", options: ["A", "An", "The", "No article"], answer: "B" },
      { question: "I ___ a book right now.", options: ["read", "am reading", "reads", "reading"], answer: "B" },
      { question: "Which word is a noun?", options: ["Run", "Happy", "House", "Quickly"], answer: "C" },
      { question: "Select the correct plural form: 'child'", options: ["childs", "children", "childes", "child"], answer: "B" },
      { question: "Fill in the blank: She ___ to the store yesterday.", options: ["go", "went", "gone", "going"], answer: "B" },
      { question: "Which is a synonym of 'big'?", options: ["Small", "Huge", "Tiny", "Thin"], answer: "B" },
      { question: "Choose the correct preposition: He is good ___ math.", options: ["in", "at", "on", "for"], answer: "B" },
    ];
  }

  switch (level) {
    case "SD":
      return [
        { question: "Berapakah 7 + 5?", options: ["10", "11", "12", "13"], answer: "C" },
        { question: "Manakah yang merupakan warna primer?", options: ["Hijau", "Merah", "Ungu", "Coklat"], answer: "B" },
        { question: "Berapakah hasil 6 × 7?", options: ["36", "42", "48", "54"], answer: "B" },
        { question: "Planet yang kita tinggali adalah?", options: ["Mars", "Bumi", "Jupiter", "Saturnus"], answer: "B" },
        { question: "Hari setelah hari Selasa adalah?", options: ["Rabu", "Kamis", "Senin", "Jumat"], answer: "A" },
        { question: "Berapakah 10 - 3?", options: ["6", "7", "8", "9"], answer: "B" },
        { question: "Manakah hewan mamalia?", options: ["Ikan", "Burung", "Kucing", "Cicak"], answer: "C" },
        { question: "Warna campuran dari merah dan putih adalah?", options: ["Merah Muda", "Ungu", "Oranye", "Coklat"], answer: "A" },
        { question: "Berapakah 5 × 5?", options: ["20", "25", "30", "15"], answer: "B" },
        { question: "Apa yang digunakan untuk menulis?", options: ["Pensil", "Meja", "Buku", "Kursi"], answer: "A" },
      ];
    case "SMP/MTS":
      return [
        { question: "Hasil dari 9 × 6 adalah?", options: ["45", "52", "54", "63"], answer: "C" },
        { question: "Satuan untuk massa adalah?", options: ["Meter", "Kilogram", "Sekon", "Kelvin"], answer: "B" },
        { question: "Planet terdekat dengan Matahari adalah?", options: ["Bumi", "Mars", "Merkurius", "Venus"], answer: "C" },
        { question: "Apa fungsi akar pada tumbuhan?", options: ["Menyerap air", "Menghasilkan buah", "Membuat bunga", "Menyimpan cahaya"], answer: "A" },
        { question: "Hasil dari 81 ÷ 9 adalah?", options: ["7", "8", "9", "10"], answer: "C" },
        { question: "Manakah sifat bilangan prima?", options: ["Hanya habis dibagi 1 dan dirinya", "Selalu genap", "Selalu ganjil", "Lebih dari 10"], answer: "A" },
        { question: "Salah satu perubahan fisika adalah?", options: ["Pembakaran", "Pembekuan", "Pembusukan", "Pencemaran"], answer: "B" },
        { question: "Berapakah volume kubus sisi 3 cm?", options: ["9 cm³", "18 cm³", "27 cm³", "81 cm³"], answer: "C" },
        { question: "Apa fungsi daun pada tumbuhan?", options: ["Menyerap air", "Fotosintesis", "Memperbanyak sel", "Menyimpan makanan"], answer: "B" },
        { question: "Apa hasil dari 7 + 8?", options: ["13", "14", "15", "16"], answer: "C" },
      ];
    case "SMA/SMK":
      return [
        { question: "Hasil dari 12 × 12 adalah?", options: ["132", "144", "156", "164"], answer: "B" },
        { question: "Manakah rumus kimia air?", options: ["CO2", "H2O", "O2", "NaCl"], answer: "B" },
        { question: "Hukum Newton kedua dituliskan sebagai?", options: ["Aksi = reaksi", "F = m × a", "Inersia", "Energi"], answer: "B" },
        { question: "Apa fungsi enzim dalam tubuh?", options: ["Menghambat reaksi", "Mempercepat reaksi", "Mengganti hormon", "Membentuk sel"], answer: "B" },
        { question: "Salah satu jenis segitiga berdasarkan sisi adalah?", options: ["Segitiga tumpul", "Segitiga sama sisi", "Segitiga siku-siku", "Segitiga lancip"], answer: "B" },
        { question: "Apa itu reaksi eksoterm?", options: ["Menyerap panas", "Melepaskan panas", "Menimbulkan bau", "Mengubah warna"], answer: "B" },
        { question: "Manakah yang termasuk fungsi logaritma?", options: ["Mengalikan","Membagi","Mengubah pangkat","Menambahkan"], answer: "C" },
        { question: "Berapa konstanta gas ideal (R) dalam satuan J/(mol·K)?", options: ["8.314", "0.0821", "6.022", "9.81"], answer: "A" },
        { question: "Salah satu contoh homonim adalah?", options: ["Buku (bacaan) dan buku (mencatat)", "Kucing dan anjing", "Meja dan kursi", "Baju dan celana"], answer: "A" },
        { question: "Apa yang dimaksud dengan fotosintesis?", options: ["Proses penguapan air","Proses pembentukan makanan oleh tumbuhan","Proses pencernaan","Proses pembelahan sel"], answer: "B" },
      ];
    default:
      return [
        { question: "Berapakah 7 + 5?", options: ["10", "11", "12", "13"], answer: "C" },
        { question: "Manakah yang termasuk warna primer?", options: ["Hijau", "Merah", "Ungu", "Coklat"], answer: "B" },
        { question: "Berapakah 15 - 7?", options: ["6", "7", "8", "9"], answer: "C" },
        { question: "Apa fungsi jantung?", options: ["Mencerna makanan", "Memompa darah", "Menyaring darah", "Menghasilkan insulin"], answer: "B" },
        { question: "Manakah salah satu planet di tata surya?", options: ["Pluto", "Mars", "Eropa", "Titan"], answer: "B" },
      ];
  }
}

export default function PosttestPage({
  apiFetch,
  navigate,
  user,
  bookingId,
}: {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
  user: User | null;
  bookingId: string | null;
}) {
  const { t } = useTranslation();
  const [booking, setBooking] = useState<any>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<PosttestQuestion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "in_progress" | "completed" | "error">("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [score, setScore] = useState<number | null>(null);
  const [resetWarning, setResetWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const educationLevel = user?.education_level ?? "SMA/SMK";
  const educationDetail = user?.education_detail ?? null;
  const timePerQuestion = useMemo(() => getTimePerQuestion(educationLevel), [educationLevel]);

  const loadBooking = async () => {
    if (!bookingId) return;
    setIsLoadingBooking(true);
    try {
      const data = await apiFetch(`/bookings/${bookingId}`);
      setBooking(data.data ?? data);
    } catch (err) {
      console.error("Gagal memuat data booking posttest:", err);
      setError("Gagal memuat data booking. Silakan coba lagi.");
    } finally {
      setIsLoadingBooking(false);
    }
  };

  const generateQuestions = async () => {
    setIsGenerating(true);
    setError(null);
    setStatus("loading");

    try {
      const subjectName = booking?.subject?.name ?? booking?.subject ?? null;
      const seed = `${user?.id ?? "anon"}_${Date.now()}`;
      const prompt = buildAiPrompt(educationLevel, educationDetail, subjectName, seed);
      const response = await apiFetch("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: prompt }),
      });
      const reply = response?.data?.response || response?.reply || response?.message || response?.response || response?.content || "";
      const parsed = typeof reply === "string" ? parseQuestionsFromAi(reply) : [];

      // Combine AI-generated questions with fallback bank to guarantee DEFAULT_QUESTIONS
      const fallbackBank = fallbackQuestions(educationLevel, subjectName);
      let finalQuestions: PosttestQuestion[] = [];

      if (parsed.length >= DEFAULT_QUESTIONS) {
        finalQuestions = parsed.slice(0, DEFAULT_QUESTIONS);
      } else if (parsed.length > 0) {
        // keep parsed ones and fill the rest from fallback
        const needed = DEFAULT_QUESTIONS - parsed.length;
        const filler = shuffleArray(fallbackBank).slice(0, needed);
        finalQuestions = [...parsed, ...filler].slice(0, DEFAULT_QUESTIONS);
      } else {
        finalQuestions = shuffleArray(fallbackBank).slice(0, DEFAULT_QUESTIONS);
      }

      setQuestions(finalQuestions);
      setSelectedAnswers(Array(finalQuestions.length).fill(""));
      setStatus("ready");
    } catch (err) {
      console.error("Gagal membuat soal posttest:", err);
      const fallbackBank = fallbackQuestions(educationLevel, booking?.subject?.name ?? booking?.subject ?? null);
      const finalQuestions = shuffleArray(fallbackBank).slice(0, DEFAULT_QUESTIONS);
      setQuestions(finalQuestions);
      setSelectedAnswers(Array(finalQuestions.length).fill(""));
      setStatus("ready");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!booking && bookingId) {
      void loadBooking();
    }
  }, [bookingId, booking]);

  useEffect(() => {
    if (booking && status === "idle") {
      void generateQuestions();
    }
  }, [booking, status]);

  useEffect(() => {
    if (status !== "in_progress") return;

    if (timeLeft <= 0) {
      handleAdvance();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [status, timeLeft]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && status === "in_progress") {
        resetQuiz();
      }
    };

    const handleWindowBlur = () => {
      if (status === "in_progress") {
        resetQuiz();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [status]);

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(Array(questions.length).fill(""));
    setTimeLeft(timePerQuestion);
    setResetWarning("Kamu meninggalkan tab atau berpindah aplikasi, posttest direset ke soal pertama.");
    window.setTimeout(() => setResetWarning(null), 6000);
    if (booking) {
      void generateQuestions();
    }
  };

  const handleStart = () => {
    if (!questions.length) return;
    setStatus("in_progress");
    setCurrentQuestionIndex(0);
    setSelectedAnswers(Array(questions.length).fill(""));
    setTimeLeft(timePerQuestion);
    setScore(null);
  };

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIndex] = option;
      return next;
    });
  };

  const finishQuiz = async (answers: string[]) => {
    const calculatedScore = questions.reduce((acc, question, index) => {
      return acc + (answers[index] === question.answer ? 1 : 0);
    }, 0);
    setScore(calculatedScore);
    setStatus("completed");
    setTimeLeft(0);

    if (bookingId) {
      try {
        localStorage.setItem(`tutorku_posttest_completed_${bookingId}`, "1");
        localStorage.setItem(`tutorku_posttest_score_${bookingId}`, String(calculatedScore));
        localStorage.setItem(`tutorku_posttest_total_${bookingId}`, String(questions.length));
      } catch (err) {
        console.warn("Could not persist posttest completion:", err);
      }

      try {
        await apiFetch(`/bookings/${bookingId}/live-session/participants`, {
          method: "PATCH",
          body: JSON.stringify({
            posttest_completed: true,
            posttest_score: calculatedScore,
            posttest_total_questions: questions.length,
          }),
        });
      } catch (err) {
        console.warn("Could not sync posttest score to live session participants:", err);
      }
    }
  };

  const handleAdvance = (selectedOption?: string) => {
    const nextAnswers = [...selectedAnswers];
    if (selectedOption) {
      nextAnswers[currentQuestionIndex] = selectedOption;
    }

    if (currentQuestionIndex + 1 >= questions.length) {
      void finishQuiz(nextAnswers);
      return;
    }

    setSelectedAnswers(nextAnswers);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(timePerQuestion);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = selectedAnswers[currentQuestionIndex] || "";

  const contentTitle = booking?.tutor?.name
    ? `Posttest untuk kelas bersama ${booking.tutor.name}`
    : "Posttest setelah sesi kelas";

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-white pt-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto py-16 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="mt-6 text-xl font-semibold text-gray-900">Posttest tidak tersedia</h1>
          <p className="mt-2 text-sm text-gray-500">Tidak ada sesi yang dipilih. Silakan kembali ke halaman booking kamu.</p>
          <button
            onClick={() => navigate("booking-saya")}
            className="mt-6 inline-flex items-center justify-center bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Kembali ke Booking Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-indigo-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => window.location.hash = `#/booking-saya`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.3em]">Posttest</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">{contentTitle}</h1>
            </div>
            <div className="bg-emerald-50 px-4 py-3 border border-emerald-100 inline-flex items-center gap-2">
              <Clock size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-600">Waktu per soal</p>
                <p className="text-sm font-semibold text-emerald-700">{timePerQuestion} detik</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Jenjang</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{educationLevel}</p>
              {educationDetail && <p className="mt-1 text-sm text-gray-500">{educationDetail}</p>}
            </div>
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Sesi</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{booking?.subject?.name ?? booking?.subject ?? "Pelajaran umum"}</p>
              <p className="mt-1 text-sm text-gray-500">{booking?.date ?? "-"} · {booking?.start_time ?? "-"}</p>
            </div>
          </div>

          <div className="mt-6">
            {isLoadingBooking || status === "loading" ? (
              <div className="border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
                <p className="font-medium">Memuat posttest...</p>
                <p className="mt-2 text-sm">Tunggu sebentar, kami sedang menyiapkan soal evaluasi akhir yang sesuai dengan materi sesi kamu.</p>
              </div>
            ) : status === "error" ? (
              <div className="border border-red-200 bg-red-50 p-6 text-center text-red-800">
                <p className="font-medium">Terjadi kesalahan</p>
                <p className="mt-2 text-sm">{error || "Gagal memuat posttest. Silakan coba lagi."}</p>
                <button
                  onClick={() => void generateQuestions()}
                  className="mt-4 inline-flex items-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <RefreshCw size={16} /> Coba lagi
                </button>
              </div>
            ) : status === "ready" ? (
              <div className="bg-gray-50 border border-gray-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Posttest siap</p>
                    <p className="mt-2 text-sm text-gray-700">Terdapat {questions.length} soal pilihan ganda dengan durasi {timePerQuestion} detik setiap soal.</p>
                  </div>
                  <button
                    onClick={handleStart}
                    className="inline-flex items-center gap-2 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <Play size={16} /> Mulai Posttest
                  </button>
                </div>
              </div>
            ) : status === "in_progress" && currentQuestion ? (
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Soal {currentQuestionIndex + 1} dari {questions.length}</p>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">{currentQuestion.question}</h2>
                  </div>
                  <div className="bg-emerald-50 px-4 py-3 text-center border border-emerald-100">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-600">Waktu</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{timeLeft}s</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const optionLabel = String.fromCharCode(65 + index);
                    const isSelected = selectedOption === optionLabel;
                    return (
                      <button
                        key={optionLabel}
                        type="button"
                        onClick={() => handleAnswerSelect(optionLabel)}
                        className={`w-full border px-4 py-4 text-left transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex h-8 w-8 items-center justify-center border ${isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white text-gray-600"} text-sm font-semibold`}>{optionLabel}</span>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {resetWarning && <div className="border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">{resetWarning}</div>}
                  <button
                    onClick={() => handleAdvance(selectedOption || undefined)}
                    className="inline-flex items-center justify-center bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    {currentQuestionIndex + 1 === questions.length ? "Selesaikan" : "Soal berikutnya"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : status === "completed" ? (
              <div className="bg-gray-50 border border-gray-200 p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center bg-green-100 text-green-700">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Posttest selesai</h2>
                <p className="mt-2 text-sm text-gray-600">Skor kamu {score} dari {questions.length} soal.</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => navigate("dashboard-siswa")}
                    className="inline-flex items-center justify-center bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Kembali ke Dashboard
                  </button>
                  <button
                    onClick={() => navigate("booking-saya")}
                    className="inline-flex items-center justify-center border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Kembali ke Booking Saya
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 bg-white p-6 text-center text-gray-600">
                <p className="font-medium">Menyiapkan posttest...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
