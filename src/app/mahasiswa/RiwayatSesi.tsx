import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Page } from "../types.ts";

type SessionDetail = {
  id: number;
  booking_id: number;
  subject_name: string;
  tutor_name: string;
  date: string;
  start_time: string;
  end_time?: string;
  status: string;
  pretest_completed?: boolean;
  pretest_score?: number | null;
  pretest_total_questions?: number | null;
  posttest_completed?: boolean;
  posttest_score?: number | null;
  posttest_total_questions?: number | null;
  points_earned?: number | null;
  rating?: number | null;
  review?: string | null;
};

type SessionRow = {
  id: number;
  booking_id: number;
  subject?: { name?: string } | string;
  tutor?: { name?: string } | string;
  date?: string;
  start_time?: string;
  status?: string;
};

export default function RiwayatSesi({
  apiFetch,
  navigate,
  user,
}: {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  navigate: (p: Page) => void;
  user: any;
}) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/bookings?status=completed&limit=50");
      const bookings = response.data ?? response;
      
      if (!Array.isArray(bookings)) {
        setSessions([]);
        return;
      }

      const sessionsList: SessionDetail[] = bookings.map((booking: SessionRow) => {
        const subjectName = typeof booking.subject === "object" 
          ? booking.subject?.name 
          : booking.subject;
        const tutorName = typeof booking.tutor === "object" 
          ? booking.tutor?.name 
          : booking.tutor;

        return {
          id: booking.id,
          booking_id: booking.id,
          subject_name: subjectName || undefined,
          tutor_name: tutorName || undefined,
          date: booking.date || "-",
          start_time: booking.start_time || "-",
          status: booking.status || "completed",
        };
      });

      setSessions(sessionsList);
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      setError(err?.message || t("sessionHistory.loadFailed"));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantValue = <T,>(
    participant: any,
    camelKey: string,
    snakeKey: string,
    fallback: T,
  ): T => {
    if (!participant) {
      return fallback;
    }

    if (participant[camelKey] !== undefined) {
      return participant[camelKey];
    }

    if (participant[snakeKey] !== undefined) {
      return participant[snakeKey];
    }

    return fallback;
  };

  const loadSessionDetail = async (bookingId: number) => {
    try {
      // Fetch booking detail
      const bookingRes = await apiFetch(`/bookings/${bookingId}`);
      const booking = bookingRes.data ?? bookingRes;

      // Fetch live session participants for pretest/posttest data
      const participantsRes = await apiFetch(
        `/bookings/${bookingId}/live-session/participants`
      );
      const participants = participantsRes.participants ?? [];
      const studentParticipant = participants.find((p: any) => {
        const participantId = p?.id ?? p?.user_id;
        return (
          participantId !== undefined &&
          String(participantId) === String(user?.id)
        );
      });

      const pretestCompleted = getParticipantValue(
        studentParticipant,
        "pretestCompleted",
        "pretest_completed",
        false,
      );
      const pretestScore = getParticipantValue<number | null>(
        studentParticipant,
        "pretestScore",
        "pretest_score",
        null,
      );
      const pretestTotalQuestions = getParticipantValue<number | null>(
        studentParticipant,
        "pretestTotalQuestions",
        "pretest_total_questions",
        null,
      );
      const posttestCompleted = getParticipantValue(
        studentParticipant,
        "posttestCompleted",
        "posttest_completed",
        false,
      );
      const posttestScore = getParticipantValue<number | null>(
        studentParticipant,
        "posttestScore",
        "posttest_score",
        null,
      );
      const posttestTotalQuestions = getParticipantValue<number | null>(
        studentParticipant,
        "posttestTotalQuestions",
        "posttest_total_questions",
        null,
      );

      // Update the session with detail data
      setSessions((prev) =>
        prev.map((s) =>
          s.id === bookingId
            ? {
                ...s,
                pretest_completed: pretestCompleted,
                pretest_score: pretestScore,
                pretest_total_questions: pretestTotalQuestions,
                posttest_completed: posttestCompleted,
                posttest_score: posttestScore,
                posttest_total_questions: posttestTotalQuestions,
              }
            : s
        )
      );
    } catch (err) {
      console.warn(`Failed to load detail for booking ${bookingId}:`, err);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const handleExpandSession = (sessionId: number) => {
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
    if (expandedSessionId !== sessionId) {
      const bookingId = sessions.find((s) => s.id === sessionId)?.booking_id;
      if (bookingId) {
        void loadSessionDetail(bookingId);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-4 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("dashboard-siswa")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={16} /> {t("sessionHistory.back")}
          </button>
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="h-10 w-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-3 text-sm text-gray-600">{t("sessionHistory.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white pt-4 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("dashboard-siswa")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={16} /> {t("sessionHistory.back")}
          </button>
          <div className="border border-red-200 bg-red-50 p-4 rounded text-center">
            <AlertCircle size={24} className="mx-auto text-red-600 mb-2" />
              <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => void loadSessions()}
              className="mt-3 inline-flex items-center gap-2 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 rounded"
            >
              {t("sessionHistory.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-4 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("dashboard-siswa")}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={16} /> {t("sessionHistory.back")}
            </button>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("sessionHistory.title")}</h1>
              <p className="text-sm text-gray-500">{t("sessionHistory.subtitle")}</p>
            </div>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="border border-gray-200 bg-gray-50 rounded p-8 text-center">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-medium text-gray-600">{t("sessionHistory.emptyTitle")}</p>
            <p className="mt-1 text-sm text-gray-500">{t("sessionHistory.emptyDescription")}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const pretestPercentage = session.pretest_total_questions
                ? Math.round(
                    ((session.pretest_score ?? 0) /
                      session.pretest_total_questions) *
                      100
                  )
                : 0;
              const posttestPercentage = session.posttest_total_questions
                ? Math.round(
                    ((session.posttest_score ?? 0) /
                      session.posttest_total_questions) *
                      100
                  )
                : 0;

              return (
                <div key={session.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition">
                  {/* Session Header - Always Visible */}
                  <div
                    onClick={() => handleExpandSession(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleExpandSession(session.id);
                      }
                    }}
                    className="w-full text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {session.subject_name ?? t("sessionHistory.subjectFallback")}
                        </h3>
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                          <CheckCircle size={12} /> {t("sessionHistory.completed")}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          {session.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          {session.start_time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Award size={14} className="text-gray-400" />
                          {session.tutor_name ?? t("sessionHistory.tutorFallback")}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ml-3 p-1 text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandSession(session.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>

                  {/* Session Detail - Expandable */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 mt-3 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Pretest Section */}
                        <div className="bg-white p-3 border border-gray-200 rounded">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                            <BookOpen size={16} className="text-blue-600" />
                            {t("sessionHistory.pretestTitle")}
                          </h4>
                          {session.pretest_completed ? (
                            <div>
                              <div className="mb-2">
                                <div className="flex justify-between items-center mb-1 text-xs text-gray-600">
                                  <span>{t("sessionHistory.score")}</span>
                                  <span className="text-lg font-bold text-blue-600">
                                    {session.pretest_score ?? 0} {t("sessionHistory.outOf")} {session.pretest_total_questions ?? 0}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded transition-all"
                                    style={{
                                      width: `${pretestPercentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-center mt-2">
                                <p className="text-base font-semibold text-blue-600">
                                  {pretestPercentage}%
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-3 text-gray-500">
                              <AlertCircle size={18} className="mx-auto mb-1 text-gray-400" />
                              <p className="text-xs">{t("sessionHistory.notCompletedPretest")}</p>
                            </div>
                          )}
                        </div>

                        {/* Posttest Section */}
                        <div className="bg-white p-3 border border-gray-200 rounded">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-emerald-600" />
                            {t("sessionHistory.posttestTitle")}
                          </h4>
                          {session.posttest_completed ? (
                            <div>
                              <div className="mb-2">
                                <div className="flex justify-between items-center mb-1 text-xs text-gray-600">
                                  <span>{t("sessionHistory.score")}</span>
                                  <span className="text-lg font-bold text-emerald-600">
                                    {session.posttest_score ?? 0} {t("sessionHistory.outOf")} {session.posttest_total_questions ?? 0}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded h-1.5">
                                  <div
                                    className="bg-emerald-600 h-1.5 rounded transition-all"
                                    style={{
                                      width: `${posttestPercentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-center mt-2">
                                <p className="text-base font-semibold text-emerald-600">
                                  {posttestPercentage}%
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-3 text-gray-500">
                              <AlertCircle size={18} className="mx-auto mb-1 text-gray-400" />
                                <p className="text-xs">{t("sessionHistory.notCompletedPosttest")}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Points Section */}
                      {session.points_earned !== null && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <Award size={18} className="text-yellow-600" />
                            <div>
                              <p className="text-xs text-yellow-700 font-medium">{t("sessionHistory.pointsEarned")}</p>
                              <p className="font-bold text-yellow-600">+{session.points_earned}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rating Section */}
                      {session.rating !== null && (
                        <div className="mt-3 bg-indigo-50 border border-indigo-200 p-3 rounded text-sm">
                          <p className="text-xs text-indigo-700 font-medium mb-1">{t("sessionHistory.ratingTitle")}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i < (session.rating ?? 0)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          {session.review && (
                            <p className="mt-2 text-xs text-gray-700 italic">
                              "{session.review}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
