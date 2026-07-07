import React, { useEffect, useMemo, useState } from "react";
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

type PretestQuestion = {
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
  // prefer subject.name but allow subject to be a plain string
  const safeSubject = subject || "pelajaran umum";
  const safeSeed = seed ? ` (seed: ${seed})` : "";

  return `Buat ${DEFAULT_QUESTIONS} soal pilihan ganda yang sesuai dengan jenjang ${safeLevel}${safeDetail} untuk materi ${safeSubject}${safeSeed}. Buat setiap soal berbeda jika prompt dipanggil lagi — variasikan soal, pilihan jawaban, dan penjelasan. Setiap soal harus memiliki 4 opsi jawaban A, B, C, dan D. Berikan jawaban benar dalam properti \"answer\" menggunakan huruf A, B, C, atau D. Balas hanya dengan JSON array yang valid dengan format:\n[\n  {\n    \"question\": \"...\",\n    \"options\": [\"...\", \"...\", \"...\", \"...\"],\n    \"answer\": \"A\"\n  },\n  ...\n]`;
}

function parseQuestionsFromAi(text: string): PretestQuestion[] {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\[([\s\S]*)\]$/);

  if (jsonMatch) {
    try {
      const jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);
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
    } catch (err) {
      // fall through to line parsing
    }
  }

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim());
  const questions: PretestQuestion[] = [];
  let current: Partial<PretestQuestion> = {};

  for (const line of lines) {
    if (!line) continue;
    const questionMatch = line.match(/^\d+\.\s*(.+)$/);
    const optionMatch = line.match(/^[A-D][\.)]\s*(.+)$/i);
    const answerMatch = line.match(/^(?:Jawaban|Answer|Benar|Kunci)[:\s]*([A-D])/i);

    if (questionMatch) {
      if (current.question && current.options && current.options.length === 4 && current.answer) {
        questions.push(current as PretestQuestion);
      }
      current = {
        question: questionMatch[1].trim(),
        options: [],
        answer: "",
      };
      continue;
    }

    if (optionMatch && current.options) {
      current.options = [...current.options, optionMatch[1].trim()];
      continue;
    }

    if (answerMatch && current) {
      current.answer = answerMatch[1].trim().toUpperCase();
      continue;
    }
  }

  if (current.question && current.options && current.options.length === 4 && current.answer) {
    questions.push(current as PretestQuestion);
  }

  return questions;
}

function fallbackQuestions(level?: string | null): PretestQuestion[] {
  switch (level) {
    case "SD":
      return [
        { question: "Berapakah 8 + 7?", options: ["12", "13", "14", "15"], answer: "B" },
        { question: "Manakah yang merupakan hewan herbivora?", options: ["Kucing", "Sapi", "Ayam", "Ikan"], answer: "B" },
        { question: "Huruf pertama dari kata 'BOLA' adalah?", options: ["A", "B", "C", "D"], answer: "B" },
        { question: "Berapakah 5 × 3?", options: ["8", "15", "10", "18"], answer: "B" },
        { question: "Warna campuran merah dan putih menghasilkan?", options: ["Ungu", "Merah muda", "Coklat", "Hijau"], answer: "B" },
        { question: "Alat untuk menulis disebut?", options: ["Pensil", "Kertas", "Penghapus", "Penggaris"], answer: "A" },
        { question: "Ibu kota Indonesia adalah?", options: ["Jakarta", "Bandung", "Surabaya", "Medan"], answer: "A" },
        { question: "Berapakah hasil 10 - 4?", options: ["4", "5", "6", "7"], answer: "C" },
        { question: "Manakah yang bukan buah?", options: ["Apel", "Tomat", "Kentang", "Jeruk"], answer: "C" },
        { question: "Berapa jumlah sisi pada segitiga?", options: ["2", "3", "4", "5"], answer: "B" },
      ];
    case "SMP/MTS":
      return [
        { question: "Hasil dari 9 × 6 adalah?", options: ["45", "52", "54", "63"], answer: "C" },
        { question: "Manakah rumus luas persegi panjang?", options: ["p + l", "p × l", "2 × (p + l)", "p ÷ l"], answer: "B" },
        { question: "Sebuah segitiga sama sisi memiliki berapa sisi yang sama panjang?", options: ["1", "2", "3", "4"], answer: "C" },
        { question: "Jika x = 3, maka 2x + 5 = ?", options: ["11", "10", "9", "8"], answer: "A" },
        { question: "Planet terdekat dengan Matahari adalah?", options: ["Bumi", "Mars", "Merkurius", "Venus"], answer: "C" },
        { question: "Satuan untuk massa adalah?", options: ["Meter", "Kilogram", "Sekon", "Kelvin"], answer: "B" },
        { question: "Hasil dari 81 ÷ 9 adalah?", options: ["7", "8", "9", "10"], answer: "C" },
        { question: "Apa fungsi klorofil pada tumbuhan?", options: ["Respirasi", "Fotosintesis", "Pencernaan", "Pengangkutan"], answer: "B" },
        { question: "Salah satu contoh perubahan kimia adalah?", options: ["Membelah kertas", "Membakar kayu", "Melayukan daun", "Memotong buah"], answer: "B" },
        { question: "Bagian tumbuhan yang menyerap air adalah?", options: ["Batang", "Daun", "Akar", "Bunga"], answer: "C" },
      ];
    case "SMA/SMK":
      return [
        { question: "Hasil dari 12 × 12 adalah?", options: ["132", "144", "156", "164"], answer: "B" },
        { question: "Manakah bidang garis yang melalui titik (0, 2) dan memiliki gradien 3?", options: ["y = 3x + 2", "y = 3x - 2", "y = x + 2", "y = 2x + 3"], answer: "A" },
        { question: "Manakah unsur berikut yang berupa gas pada suhu kamar?", options: ["Oksigen", "Besi", "Tembaga", "Perak"], answer: "A" },
        { question: "Jika f(x) = x^2, maka f'(x) = ?", options: ["2x", "x", "x^2", "1"], answer: "A" },
        { question: "Manakah rumus kimia air?", options: ["CO2", "H2O", "O2", "NaCl"], answer: "B" },
        { question: "Suku keenam dari barisan aritmetika 2, 5, 8,... adalah?", options: ["17", "20", "23", "26"], answer: "A" },
        { question: "Konstanta percepatan gravitasi di bumi (m/s^2) sekitar?", options: ["9.8", "8.9", "10.5", "7.2"], answer: "A" },
        { question: "Manakah hukum Newton kedua?", options: ["Aksi = Reaksi", "F = m × a", "Inersia", "Hukum Kepler"], answer: "B" },
        { question: "Apa fungsi enzim dalam tubuh?", options: ["Menghambat reaksi", "Mempercepat reaksi", "Mengganti hormon", "Membentuk sel"], answer: "B" },
        { question: "Salah satu jenis segitiga berdasarkan sisi adalah?", options: ["Segitiga tumpul", "Segitiga sama sisi", "Segitiga siku-siku", "Segitiga lancip"], answer: "B" },
      ];
    case "Universitas/Politeknik":
      return [
        { question: "Jika fungsi f(x) = 2x + 3, nilai f(4) adalah?", options: ["8", "9", "10", "11"], answer: "C" },
        { question: "Manakah yang merupakan konsep dasar ekonomi?", options: ["Kelangkaan", "Fotosintesis", "Hukum Ohm", "Depresi"], answer: "A" },
        { question: "Dalam bahasa Indonesia, sinonim kata 'cepat' adalah?", options: ["Lambat", "Ringan", "Cepat", "Kilap"], answer: "C" },
        { question: "Apa itu derivatif dalam kalkulus?", options: ["Gradien fungsi", "Integral fungsi", "Limit fungsi", "Nilai maksimum"], answer: "A" },
        { question: "Dalam statistik, mean adalah?", options: ["Median", "Modus", "Rata-rata", "Varians"], answer: "C" },
        { question: "Manakah struktur data yang menggunakan FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], answer: "B" },
        { question: "Protokol untuk mengirim halaman web adalah?", options: ["FTP", "SMTP", "HTTP", "SSH"], answer: "C" },
        { question: "Manakah algoritma pencarian yang terbaik untuk data terurut?", options: ["Linear Search", "Binary Search", "Bubble Sort", "Selection Sort"], answer: "B" },
        { question: "Apa itu OOP?", options: ["Operasi Output", "Object Oriented Programming", "Only One Process", "Open Office Project"], answer: "B" },
        { question: "Salah satu prinsip dasar ekonomi mikro adalah?", options: ["Permintaan dan penawaran", "Pertumbuhan ekonomi nasional", "Anggaran belanja negara", "Inflasi"], answer: "A" },
      ];
    default:
      return [
        { question: "Berapakah 7 + 5?", options: ["10", "11", "12", "13"], answer: "C" },
        { question: "Manakah yang termasuk warna primer?", options: ["Hijau", "Merah", "Ungu", "Coklat"], answer: "B" },
        { question: "Bagaimana bentuk bumi?", options: ["Datar", "Persegi", "Bulat", "Segitiga"], answer: "C" },
        { question: "Berapakah 15 - 7?", options: ["6", "7", "8", "9"], answer: "C" },
        { question: "Apa warna campuran biru dan kuning?", options: ["Hijau", "Ungu", "Coklat", "Merah"], answer: "A" },
        { question: "Salah satu alat peraga di kelas adalah?", options: ["Meja", "Mobil", "Komputer", "Telepon"], answer: "A" },
        { question: "Berapakah hasil 6 × 7?", options: ["36", "42", "48", "54"], answer: "B" },
        { question: "Manakah yang merupakan bilangan prima?", options: ["4", "6", "7", "9"], answer: "C" },
        { question: "Apa fungsi jantung?", options: ["Mencerna makanan", "Memompa darah", "Menyaring darah", "Menghasilkan insulin"], answer: "B" },
        { question: "Salah satu planet di tata surya adalah?", options: ["Pluto", "Mars", "Eropa", "Titan"], answer: "B" },
      ];
  }
}

export default function PretestPage({
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
  const [questions, setQuestions] = useState<PretestQuestion[]>([]);
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
      console.error("Gagal memuat data booking:", err);
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
      // include booking subject (string or object) and a random seed so AI returns varied quizzes
      const subjectName = booking?.subject?.name ?? booking?.subject ?? null;
      const seed = `${user?.id ?? 'anon'}_${Date.now()}`;
      const prompt = buildAiPrompt(educationLevel, educationDetail, subjectName, seed);
      const response = await apiFetch("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: prompt }),
      });
      const reply =
        response?.data?.response || response?.reply || response?.message || response?.response || response?.content || "";
      const parsed = typeof reply === "string" ? parseQuestionsFromAi(reply) : [];

      if (parsed.length >= DEFAULT_QUESTIONS) {
        setQuestions(parsed.slice(0, DEFAULT_QUESTIONS));
        setSelectedAnswers(Array(DEFAULT_QUESTIONS).fill(""));
        setStatus("ready");
      } else {
        // Fallback: shuffle fallback question bank so students get varied sets
        const fallbackBank = fallbackQuestions(educationLevel);
        const shuffled = shuffleArray(fallbackBank).slice(0, DEFAULT_QUESTIONS);
        setQuestions(shuffled);
        setSelectedAnswers(Array(shuffled.length).fill(""));
        setStatus("ready");
      }
    } catch (err) {
      console.error("Gagal membuat soal AI:", err);
      const fallbackBank = fallbackQuestions(educationLevel);
      const shuffled = shuffleArray(fallbackBank).slice(0, DEFAULT_QUESTIONS);
      setQuestions(shuffled);
      setSelectedAnswers(Array(shuffled.length).fill(""));
      setStatus("ready");
    } finally {
      setIsGenerating(false);
    }
  };

// Utility: Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
    if (status !== "in_progress") {
      return;
    }

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
    setResetWarning("Kamu meninggalkan tab atau berpindah aplikasi, pretest direset ke soal pertama.");
    window.setTimeout(() => setResetWarning(null), 6000);
    // regenerate questions so the quiz is different when resumed
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
        localStorage.setItem(`tutorku_pretest_completed_${bookingId}`, "1");
        localStorage.setItem(`tutorku_pretest_score_${bookingId}`, String(calculatedScore));
        localStorage.setItem(`tutorku_pretest_total_${bookingId}`, String(questions.length));
      } catch (err) {
        console.warn("Could not persist pretest completion:", err);
      }

      try {
        await apiFetch(`/bookings/${bookingId}/live-session/participants`, {
          method: "PATCH",
          body: JSON.stringify({
            pretest_completed: true,
            pretest_score: calculatedScore,
            pretest_total_questions: questions.length,
          }),
        });
      } catch (err) {
        console.warn("Could not sync pretest score to live session participants:", err);
      }
    }
  };

  const handleAdvance = (selectedOption?: string) => {
    const nextAnswers = [...selectedAnswers];
    if (selectedOption) {
      nextAnswers[currentQuestionIndex] = selectedOption;
    }

    if (currentQuestionIndex + 1 >= questions.length) {
      finishQuiz(nextAnswers);
      return;
    }

    setSelectedAnswers(nextAnswers);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(timePerQuestion);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = selectedAnswers[currentQuestionIndex] || "";

  const contentTitle = booking?.tutor?.name
    ? `Pretest untuk kelas bersama ${booking.tutor.name}`
    : "Pretest sebelum masuk kelas";

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-white pt-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto py-16 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="mt-6 text-xl font-semibold text-gray-900">Pretest tidak tersedia</h1>
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
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
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.3em]">Pretest</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">{contentTitle}</h1>
            </div>
            <div className="bg-blue-50 px-4 py-3 border border-blue-100 inline-flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Waktu per soal</p>
                <p className="text-sm font-semibold text-blue-700">{timePerQuestion} detik</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Jenjang</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{educationLevel}</p>
              {educationDetail && (
                <p className="mt-1 text-sm text-gray-500">{educationDetail}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Sesi</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{booking?.subject?.name ?? "Pelajaran umum"}</p>
              <p className="mt-1 text-sm text-gray-500">{booking?.date ?? "-"} · {booking?.start_time ?? "-"}</p>
            </div>
          </div>

          <div className="mt-6">
            {isLoadingBooking || status === "loading" ? (
              <div className="border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
                <p className="font-medium">Memuat pretest...</p>
                <p className="mt-2 text-sm">Tunggu sebentar, kami sedang menyiapkan soal yang sesuai dengan jenjang kamu.</p>
              </div>
            ) : status === "error" ? (
              <div className="border border-red-200 bg-red-50 p-6 text-center text-red-800">
                <p className="font-medium">Terjadi kesalahan</p>
                <p className="mt-2 text-sm">{error || "Gagal memuat pretest. Silakan coba lagi."}</p>
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
                    <p className="text-sm font-medium text-gray-500">Pretest siap</p>
                    <p className="mt-2 text-sm text-gray-700">Terdapat {questions.length} soal pilihan ganda dengan durasi {timePerQuestion} detik setiap soal.</p>
                  </div>
                  <button
                    onClick={handleStart}
                    className="inline-flex items-center gap-2 bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Play size={16} /> Mulai Pretest
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
                  <div className="bg-blue-50 px-4 py-3 text-center border border-blue-100">
                    <p className="text-xs uppercase tracking-[0.16em] text-blue-600">Waktu</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">{timeLeft}s</p>
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
                            ? "border-blue-600 bg-blue-50 text-blue-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex h-8 w-8 items-center justify-center border ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600'} text-sm font-semibold`}>{optionLabel}</span>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {resetWarning && (
                    <div className="border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">{resetWarning}</div>
                  )}
                  <button
                    onClick={() => handleAdvance(selectedOption || undefined)}
                    className="inline-flex items-center justify-center bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
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
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Pretest selesai</h2>
                <p className="mt-2 text-sm text-gray-600">Skor kamu {score} dari {questions.length} soal.</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => {
                      if (bookingId) {
                        window.location.hash = `#/live-class?booking_id=${bookingId}`;
                      }
                    }}
                    className="inline-flex items-center justify-center bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Lanjut ke Kelas
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
                <p className="font-medium">Menyiapkan pretest...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}