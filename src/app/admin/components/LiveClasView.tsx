import { useEffect, useRef, useState } from "react";
import { adminApiFetch } from "../adminApi";
import {
  Camera,
  Mic,
  MicOff,
  Monitor,
  PenTool,
  Trash2,
  ChevronLeft,
  X,
  MessageCircle,
  PhoneOff,
  Maximize2,
  Eraser,
  Pencil,
  GripVertical,
  Shrink,
  Hand,
  Gift,
  Sparkles,
  ThumbsUp,
  MoreVertical,
} from "lucide-react";
import ChatView from "./ChatView..tsx";
import { Skeleton } from "../../components/ui";

type Page =
  | "landing"
  | "cari-tutor"
  | "detail-tutor"
  | "booking"
  | "live-class"
  | "live-class-tutor"
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
  | "admin-login";

type LiveClasViewProps = {
  navigate: (page: Page) => void;
  bookingId: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  } | null;
};

type Booking = {
  id: number;
  subject?: { name?: string | null };
  tutor?: { name?: string | null; photo?: string | null };
  student?: { name?: string | null };
  date?: string;
  start_time?: string;
  duration_minutes?: number;
  status?: string;
};

type Session = {
  id: number;
  room_id?: string;
  status?: string;
  started_at?: string;
  ended_at?: string;
};

export default function LiveClasView({ navigate, bookingId, user }: LiveClasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tutorVideoRef = useRef<HTMLVideoElement | null>(null);
  const studentVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [studentCamOn, setStudentCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [reactions, setReactions] = useState<string[]>([]);
  const [tutorRaiseHand, setTutorRaiseHand] = useState(false);
  const [studentRaiseHand, setStudentRaiseHand] = useState(false);
  const [tutorGift, setTutorGift] = useState(false);
  const [studentGift, setStudentGift] = useState(false);
  const [tutorClap, setTutorClap] = useState(false);
  const [studentClap, setStudentClap] = useState(false);
  const [tutorSparkle, setTutorSparkle] = useState(false);
  const [studentSparkle, setStudentSparkle] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [lineColor, setLineColor] = useState("#5865F2");
  const [lineWidth, setLineWidth] = useState(3);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardSize, setWhiteboardSize] = useState<"small" | "medium" | "large">("medium");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [whiteboardPosition, setWhiteboardPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      if (!bookingId) {
        setError("Booking ID tidak ditemukan.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const bookingData = await adminApiFetch(`/bookings/${bookingId}`);
        const sessionData = await adminApiFetch(`/bookings/${bookingId}/live-session`);
        if (!active) return;
        setBooking(bookingData.data ?? bookingData);
        setSession(sessionData.data ?? sessionData);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Gagal memuat detail sesi.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, [bookingId]);

  useEffect(() => {
    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (tutorVideoRef.current) {
          tutorVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Tidak dapat mengakses kamera/mikrofon", err);
        setError("Izin kamera/mikrofon diperlukan untuk kelas live.");
      }
    };

    startLocalMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      screenStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (tutorVideoRef.current && localStream) {
      tutorVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicOn((current) => !current);
  };

  const toggleCam = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCamOn((current) => !current);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStream?.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setScreenSharing(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setScreenSharing(true);
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
      }
      const [track] = stream.getVideoTracks();
      track.onended = () => {
        setScreenSharing(false);
        setScreenStream(null);
      };
    } catch (err) {
      console.warn("Gagal membagikan layar", err);
      setError("Gagal memulai screen share.");
    }
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = tool === "pen" ? lineColor : "#1E1F22";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    setDrawing(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawing) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
    setDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleEndClass = async () => {
    if (!bookingId) return;
    try {
      await adminApiFetch(`/bookings/${bookingId}/live-session/end`, { method: "POST" });
      setSession((prev) => prev ? { ...prev, status: "ended" } : prev);
    } catch (err) {
      console.error(err);
      setError("Gagal mengakhiri sesi.");
    }
  };

  const getWhiteboardSizeClass = () => {
    switch (whiteboardSize) {
      case "small": return "w-[350px] h-[260px]";
      case "large": return "w-[700px] h-[520px]";
      default: return "w-[500px] h-[380px]";
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - whiteboardPosition.x, y: e.clientY - whiteboardPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setWhiteboardPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addReaction = (reaction: string) => {
    if (reaction === 'raise-hand') {
      setTutorRaiseHand(true);
      setTimeout(() => setTutorRaiseHand(false), 3000);
    } else if (reaction === 'gift') {
      setTutorGift(true);
      setTimeout(() => setTutorGift(false), 3000);
    } else if (reaction === 'clap') {
      setTutorClap(true);
      setTimeout(() => setTutorClap(false), 3000);
    } else if (reaction === 'sparkle') {
      setTutorSparkle(true);
      setTimeout(() => setTutorSparkle(false), 3000);
    }
    setReactions((prev) => [reaction, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item !== reaction));
    }, 2500);
    setShowReactionMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F22] flex items-center justify-center">
        <div className="text-[#B5BAC1] text-sm">
          <div className="space-y-3">
            <div className="w-64"><Skeleton className="h-6 w-64" /></div>
            <div className="w-96"><Skeleton className="h-48 w-96" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1E1F22] flex items-center justify-center">
        <div className="text-[#DA373C] text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-[60] bg-[#1E1F22]" : "min-h-screen"} bg-[#1E1F22] text-white flex flex-col`}>
      {/* Top Bar */}
      <div className="bg-[#2B2D31] border-b border-[#1E1F22] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("admin")}
            className="text-[#B5BAC1] hover:text-white transition-colors text-sm flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#3F4147]"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
          <div className="w-px h-6 bg-[#3F4147]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#23A55A] rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[#23A55A]">LIVE</span>
          </div>
          <span className="text-sm font-medium text-[#DBDEE1]">{booking?.tutor?.name || "Live Class"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded hover:bg-[#3F4147] transition-colors text-[#B5BAC1] hover:text-white"
          >
            {isFullscreen ? <Shrink size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
          {/* Tutor Video */}
          <div className="relative rounded-2xl overflow-hidden border border-[#3F4147] bg-[#0f172a] shadow-lg min-h-[420px]">
            {screenSharing ? (
              <video
                ref={screenRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <>
                <video
                  ref={tutorVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {!camOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-center px-6 gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/15 shadow-xl">
                      {booking?.tutor?.photo ? (
                        <img src={booking.tutor.photo} alt={booking.tutor?.name || "Tutor"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#3b4258] text-4xl font-bold text-white">
                          {booking?.tutor?.name?.charAt(0).toUpperCase() || "T"}
                        </div>
                      )}
                    </div>
                    <div className="text-white text-lg font-semibold">Kamera mati</div>
                    <div className="text-sm text-slate-400">{booking?.tutor?.name || "Tutor"}</div>
                  </div>
                )}
              </>
            )}

            {tutorRaiseHand && (
              <div className="absolute bottom-6 right-6 animate-bounce text-5xl drop-shadow-lg">✋</div>
            )}
            {tutorGift && (
              <div className="absolute bottom-20 right-6 animate-bounce text-5xl drop-shadow-lg">🎁</div>
            )}
            {tutorClap && (
              <div className="absolute bottom-6 right-20 animate-bounce text-5xl drop-shadow-lg">👏</div>
            )}
            {tutorSparkle && (
              <div className="absolute bottom-20 right-20 animate-bounce text-5xl drop-shadow-lg">✨</div>
            )}

            <div className="absolute left-4 top-4 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs text-white font-medium tracking-wide">
              Tutor
            </div>

            <div className="absolute right-4 top-4 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1">
              {micOn ? (
                <Mic size={14} className="text-[#23A55A]" />
              ) : (
                <MicOff size={14} className="text-[#DA373C]" />
              )}
            </div>
          </div>

          {/* Student Video */}
          <div className="relative rounded-2xl overflow-hidden border border-[#3F4147] bg-[#0f172a] shadow-lg min-h-[420px]">
            <video
              ref={studentVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {!studentCamOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-center px-6 gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/15 shadow-xl">
                  <div className="flex h-full w-full items-center justify-center bg-[#3b4258] text-4xl font-bold text-white">
                    {booking?.student?.name?.charAt(0).toUpperCase() || "S"}
                  </div>
                </div>
                <div className="text-white text-lg font-semibold">Kamera mati</div>
                <div className="text-sm text-slate-400">{booking?.student?.name || "Siswa"}</div>
              </div>
            )}

            {studentRaiseHand && (
              <div className="absolute bottom-6 right-6 animate-bounce text-5xl drop-shadow-lg">✋</div>
            )}

            <div className="absolute left-4 top-4 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs text-white font-medium tracking-wide">
              Siswa
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#2B2D31] border-t border-[#1E1F22] px-4 py-3 flex items-center justify-center gap-1.5 flex-shrink-0 flex-wrap">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition-all duration-200 ${
            micOn 
              ? 'bg-[#3F4147] hover:bg-[#4A4D54] text-[#DBDEE1] hover:scale-105' 
              : 'bg-[#DA373C] text-white hover:bg-[#A1282B] hover:scale-105'
          }`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleCam}
          className={`p-3 rounded-full transition-all duration-200 ${
            camOn 
              ? 'bg-[#3F4147] hover:bg-[#4A4D54] text-[#DBDEE1] hover:scale-105' 
              : 'bg-[#DA373C] text-white hover:bg-[#A1282B] hover:scale-105'
          }`}
        >
          <Camera size={20} />
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-all duration-200 ${
            screenSharing 
              ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] hover:scale-105' 
              : 'bg-[#3F4147] hover:bg-[#4A4D54] text-[#DBDEE1] hover:scale-105'
          }`}
        >
          <Monitor size={20} />
        </button>

        <div className="w-px h-8 bg-[#3F4147]" />

        <button
          onClick={() => setShowWhiteboard(!showWhiteboard)}
          className={`p-3 rounded-full transition-all duration-200 ${
            showWhiteboard 
              ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] hover:scale-105' 
              : 'bg-[#3F4147] hover:bg-[#4A4D54] text-[#DBDEE1] hover:scale-105'
          }`}
        >
          <PenTool size={20} />
        </button>

        <button
          onClick={() => setShowChatPopup(true)}
          className="p-3 rounded-full bg-[#3F4147] hover:bg-[#4A4D54] transition-all duration-200 text-[#DBDEE1] hover:scale-105"
        >
          <MessageCircle size={20} />
        </button>

        <div className="w-px h-8 bg-[#3F4147]" />

        <div className="relative">
          <button
            onClick={() => setShowReactionMenu(!showReactionMenu)}
            className="p-3 rounded-full bg-[#3F4147] hover:bg-[#4A4D54] transition-all duration-200 text-[#DBDEE1] hover:scale-105"
          >
            <MoreVertical size={20} />
          </button>
          
          {showReactionMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#2B2D31] border border-[#3F4147] rounded-lg shadow-xl p-1.5 flex items-center gap-0.5 whitespace-nowrap z-50 animate-fadeIn">
              <button
                onClick={() => addReaction('raise-hand')}
                className="px-3 py-1.5 rounded hover:bg-[#3F4147] transition-colors flex items-center gap-1.5 text-sm text-[#DBDEE1]"
              >
                <Hand size={16} /> Raise
              </button>
              <div className="w-px h-5 bg-[#3F4147]" />
              <button
                onClick={() => addReaction('gift')}
                className="px-3 py-1.5 rounded hover:bg-[#3F4147] transition-colors flex items-center gap-1.5 text-sm text-[#DBDEE1]"
              >
                <Gift size={16} /> Gift
              </button>
              <div className="w-px h-5 bg-[#3F4147]" />
              <button
                onClick={() => addReaction('clap')}
                className="px-3 py-1.5 rounded hover:bg-[#3F4147] transition-colors flex items-center gap-1.5 text-sm text-[#DBDEE1]"
              >
                <ThumbsUp size={16} /> Clap
              </button>
              <div className="w-px h-5 bg-[#3F4147]" />
              <button
                onClick={() => addReaction('sparkle')}
                className="px-3 py-1.5 rounded hover:bg-[#3F4147] transition-colors flex items-center gap-1.5 text-sm text-[#DBDEE1]"
              >
                <Sparkles size={16} /> Sparkle
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-[#3F4147]" />

        <button
          onClick={handleEndClass}
          className="p-3 rounded-full bg-[#DA373C] text-white hover:bg-[#A1282B] transition-all duration-200 hover:scale-105"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Reactions Display */}
      <div className="bg-[#2B2D31] border-t border-[#1E1F22] px-4 py-1.5 flex items-center justify-center gap-2 flex-shrink-0 flex-wrap min-h-[44px]">
        {reactions.map((reaction, index) => (
          <span
            key={`${reaction}-${index}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#DBDEE1] animate-pulse"
          >
            {reaction === 'raise-hand' && '✋ Raise Hand'}
            {reaction === 'gift' && '🎁 Gift'}
            {reaction === 'clap' && '👏 Clap'}
            {reaction === 'sparkle' && '✨ Sparkle'}
          </span>
        ))}
      </div>

      {/* Whiteboard Popup */}
      {showWhiteboard && (
        <div 
          className="fixed z-50 cursor-move"
          style={{
            left: `${whiteboardPosition.x}px`,
            top: `${whiteboardPosition.y}px`,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className={`bg-[#2B2D31] border border-[#3F4147] rounded-lg overflow-hidden shadow-2xl ${getWhiteboardSizeClass()}`}>
            <div 
              className="flex items-center justify-between px-4 py-2 bg-[#1E1F22] border-b border-[#3F4147] cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-[#3F4147]" />
                <PenTool size={16} className="text-[#B5BAC1]" />
                <span className="text-sm font-medium text-[#DBDEE1]">Whiteboard</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWhiteboardSize("small")}
                  className={`px-2 py-1 text-xs rounded ${whiteboardSize === "small" ? 'bg-[#5865F2] text-white' : 'text-[#B5BAC1] hover:bg-[#3F4147]'}`}
                >
                  Kecil
                </button>
                <button
                  onClick={() => setWhiteboardSize("medium")}
                  className={`px-2 py-1 text-xs rounded ${whiteboardSize === "medium" ? 'bg-[#5865F2] text-white' : 'text-[#B5BAC1] hover:bg-[#3F4147]'}`}
                >
                  Sedang
                </button>
                <button
                  onClick={() => setWhiteboardSize("large")}
                  className={`px-2 py-1 text-xs rounded ${whiteboardSize === "large" ? 'bg-[#5865F2] text-white' : 'text-[#B5BAC1] hover:bg-[#3F4147]'}`}
                >
                  Besar
                </button>
                <div className="w-px h-6 bg-[#3F4147]" />
                <button
                  onClick={() => setShowWhiteboard(false)}
                  className="text-[#B5BAC1] hover:text-white transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-[#1E1F22] border-b border-[#3F4147] flex-wrap">
              <button
                onClick={() => setTool("pen")}
                className={`p-1.5 rounded transition-colors ${tool === "pen" ? 'bg-[#5865F2] text-white' : 'text-[#B5BAC1] hover:bg-[#3F4147]'}`}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={`p-1.5 rounded transition-colors ${tool === "eraser" ? 'bg-[#5865F2] text-white' : 'text-[#B5BAC1] hover:bg-[#3F4147]'}`}
              >
                <Eraser size={16} />
              </button>
              <div className="w-px h-6 bg-[#3F4147]" />
              <label className="flex items-center gap-1.5 text-xs text-[#B5BAC1]">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(event) => setLineColor(event.target.value)}
                  className="h-6 w-6 border border-[#3F4147] p-0 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#B5BAC1]">
                <span className="text-[10px]">Tebal</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lineWidth}
                  onChange={(event) => setLineWidth(Number(event.target.value))}
                  className="w-16 accent-[#5865F2]"
                />
              </label>
              <button
                onClick={clearWhiteboard}
                className="ml-auto text-xs text-[#B5BAC1] hover:text-[#DA373C] transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} /> Bersihkan
              </button>
            </div>

            <div className="bg-[#1E1F22]" style={{ height: "calc(100% - 90px)" }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full h-full touch-none"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>
          </div>
        </div>
      )}

      {showChatPopup && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4">
          <div className="absolute inset-0" onClick={() => setShowChatPopup(false)} />
          <div className="relative mx-auto h-full max-h-[calc(100vh-2rem)] w-full max-w-[1100px] overflow-hidden rounded-3xl bg-[#111421] shadow-2xl">
            <button
              onClick={() => setShowChatPopup(false)}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-gray-700 shadow hover:bg-white"
            >
              <X size={20} />
            </button>
            <div className="h-full overflow-hidden">
              <ChatView user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}