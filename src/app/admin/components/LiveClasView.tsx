import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import AvatarFallback from '../../shared/AvatarFallback';
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
  VideoOff,
  Users,
  Settings,
  ChevronDown,
  User,
  Clock,
  Link,
  Check,
  Pause,
  Play,
  BookOpen,
  FileText,
  ImagePlus,
  Upload,
  MonitorPlay,
  PanelRightOpen,
  Copy,
  ListChecks,
  BadgeCheck,
  Radio,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getEcho, getSocketId } from "../../lib/echo";
import { WebRTCManager } from "../../lib/webrtc";
import {
  createSignalChunks,
  normalizeReceivedChunkedSignal,
  shouldChunkSignal,
  type WebRTCSignalPayload,
  type ChunkedSignalPayload,
} from "../../lib/webrtcSignal";
import {
  PresenceChannelManager,
  type ParticipantPresence,
  type PresenceEventName,
} from "../../lib/presence";
import { alertError, alertInfo, alertSuccess, alertWarning, confirmAction } from "../../lib/swal";
import LiveChat from "./LiveChat";
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
  subject?: string | { id?: number | string; name?: string | null };
  tutor?: { id?: number | string; name?: string | null; photo?: string | null; avatar?: string | null };
  student?: { id?: number | string; name?: string | null; photo?: string | null; avatar?: string | null };
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
  webrtc_stun_server?: string;
  webrtc_turn_server?: string;
  webrtc_turn_username?: string;
  webrtc_turn_password?: string;
};

type MaterialDraft = {
  title: string;
  type: string;
  url: string;
  file: File | null;
};

type MaterialItem = {
  id: number;
  title: string;
  type: string;
  url: string;
  file_url?: string;
  createdAt: string;
};

type ActivityEvent = {
  id: number;
  label: string;
  timestamp: string;
};

// Fungsi untuk mendapatkan warna berdasarkan nama
const getAvatarColor = (name: string) => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-red-500 to-red-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-cyan-500 to-cyan-600',
    'from-rose-500 to-rose-600',
  ];
  const index = name.length % colors.length;
  return colors[index];
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
  const secs = String(safeSeconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

const formatSessionSchedule = (date?: string, time?: string) => {
  if (!date) return "-";
  const formattedDate = new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  if (!time) return formattedDate;

  return `${formattedDate} ${time}`;
};

const getFileAcceptByMaterialType = (type: string) => {
  switch (type) {
    case 'pdf':
      return '.pdf';
    case 'word':
      return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'powerpoint':
      return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'video':
      return 'video/*';
    case 'image':
      return 'image/*';
    default:
      return '*/*';
  }
};

export default function LiveClasView({ navigate, bookingId, user }: LiveClasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tutorVideoRef = useRef<HTMLVideoElement | null>(null);
  const studentVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewTutorVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewStudentVideoRef = useRef<HTMLVideoElement | null>(null);
  const studentAudioRef = useRef<HTMLAudioElement | null>(null);
  const studentPreviewRef = useRef<HTMLDivElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const signalChunksRef = useRef<Map<string, string[]>>(new Map());
  const [webRtcDebugDump, setWebRtcDebugDump] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const getSubjectLabel = (subject: Booking["subject"]) => {
    if (typeof subject === "string") {
      return subject;
    }

    return subject?.name || "-";
  };
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [studentCamOn, setStudentCamOn] = useState(true);
  const [studentAudioOn, setStudentAudioOn] = useState(true);
  const [studentScreenSharing, setStudentScreenSharing] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [hasJoinedSession, setHasJoinedSession] = useState<boolean>(() => {
    if (!bookingId) return false;
    return localStorage.getItem(`tutorku_tutor_joined_${bookingId}`) === "true";
  });
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [reactions, setReactions] = useState<string[]>([]);
  const [tutorRaiseHand, setTutorRaiseHand] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [countdownExtendCount, setCountdownExtendCount] = useState(0);
  const [alerted20Min, setAlerted20Min] = useState(false);
  const [alerted10Min, setAlerted10Min] = useState(false);
  const [alerted5Min, setAlerted5Min] = useState(false);
  const [alerted5Sec, setAlerted5Sec] = useState(false);
  const [hasCountdownEnded, setHasCountdownEnded] = useState(false);
  const [showSessionActionModal, setShowSessionActionModal] = useState(false);
  const [pausingSession, setPausingSession] = useState(false);
  const [resumingSession, setResumingSession] = useState(false);
  const [ending, setEnding] = useState(false);
  const [studentRaiseHand, setStudentRaiseHand] = useState(false);
  const [tutorGift, setTutorGift] = useState(false);
  const [studentGift, setStudentGift] = useState(false);
  const [tutorClap, setTutorClap] = useState(false);
  const [studentClap, setStudentClap] = useState(false);
  const [tutorSparkle, setTutorSparkle] = useState(false);
  const [studentSparkle, setStudentSparkle] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map());
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(null);
  const [presenceManager, setPresenceManager] = useState<PresenceChannelManager | null>(null);
  const [participants, setParticipants] = useState<ParticipantPresence[]>([]);
  const [studentMutedByTutor, setStudentMutedByTutor] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isVideoSwapped, setIsVideoSwapped] = useState(false);
  const [previewHasVideo, setPreviewHasVideo] = useState(false);
  const [isDashboardOnLeft, setIsDashboardOnLeft] = useState(true);

  const [showChatPopup, setShowChatPopup] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardSize, setWhiteboardSize] = useState<"small" | "medium" | "large">("medium");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [whiteboardPosition, setWhiteboardPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [notePosition, setNotePosition] = useState({ x: 0, y: 96 });
  const [isNoteDragging, setIsNoteDragging] = useState(false);
  const [noteDragStart, setNoteDragStart] = useState({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [lineColor, setLineColor] = useState("#5865F2");
  const [lineWidth, setLineWidth] = useState(3);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenVideoReady, setScreenVideoReady] = useState(false);
  const [isStudentPreviewFullscreen, setIsStudentPreviewFullscreen] = useState(false);
  const [animatedDots, setAnimatedDots] = useState(0);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showMaterialUploadModal, setShowMaterialUploadModal] = useState(false);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showEndClassReviewModal, setShowEndClassReviewModal] = useState(false);
  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused">("idle");
  const [noteText, setNoteText] = useState("");
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft>({ title: "", type: "pdf", url: "", file: null });
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);
  const tutorJoinLoggedRef = useRef(false);
  const studentJoinLoggedRef = useRef(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: string }>>([]);
  const [attendance, setAttendance] = useState({ joinedAt: "", leftAt: "", duration: "00:00:00" });
  const [clockTick, setClockTick] = useState(0);
  const [deviceSettings, setDeviceSettings] = useState({ camera: "Default", microphone: "Default", speaker: "Default", noiseSuppression: true, echoCancellation: true, resolution: "720p" });
  const [endClassReview, setEndClassReview] = useState({ grade: "", comment: "", pr: "", status: "Selesai" });
  const [chatBlocked, setChatBlocked] = useState(false);
  const [screenShareAllowed, setScreenShareAllowed] = useState(true);
  const hadCameraBeforeScreenShareRef = useRef(false);

  const studentParticipant = useMemo(
    () => participants.find((participant) => participant.id !== user?.id),
    [participants, user?.id],
  );

  const addNotification = (message: string, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [{ id, message, type }, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  };

  const addActivity = (label: string) => {
    const timestamp = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setActivityLog((prev) => [{ id: Date.now(), label, timestamp }, ...prev].slice(0, 8));
  };

  const loadMaterials = async () => {
    try {
      const data = await adminApiFetch('/tutor/materials');
      if (Array.isArray(data)) {
        setMaterials(data);
      }
    } catch (error) {
      console.warn('Failed to load tutor materials:', error);
    }
  };

  const clearMaterialDraft = () => {
    setMaterialDraft({ title: "", type: "pdf", url: "", file: null });
  };

  const closeMaterialModal = () => {
    setShowMaterialUploadModal(false);
    clearMaterialDraft();
    setEditingMaterialId(null);
  };

  const openEditMaterial = (item: MaterialItem) => {
    setEditingMaterialId(item.id);
    setMaterialDraft({ title: item.title, type: item.type, url: item.url ?? "", file: null });
    setShowMaterialUploadModal(true);
  };

  const deleteMaterial = async (materialId: number) => {
    const confirmed = await confirmAction(
      "Hapus materi?",
      "Apakah kamu yakin ingin menghapus materi ini?",
      "Ya, hapus",
      "Batal",
    );
    if (!confirmed) {
      return;
    }

    try {
      await adminApiFetch(`/tutor/materials/${materialId}`, { method: 'DELETE' });
      setMaterials((prev) => prev.filter((item) => item.id !== materialId));
      alertSuccess('Materi berhasil dihapus');
      addActivity('Hapus materi');
    } catch (error: any) {
      alertError('Gagal menghapus materi', error?.message ?? 'Silakan coba lagi.');
    }
  };

  const sendMaterialToChat = async (material: MaterialItem) => {
    if (!booking?.student?.id) {
      console.warn('Tidak ada student ID untuk mengirim materi ke chat');
      return;
    }

    const response = await adminApiFetch('/chat/conversations/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: booking.student.id, booking_id: Number(booking.id) }),
    });

    const conversation = response?.data ?? response;
    const conversationId = conversation?.id ?? conversation?.data?.id;
    if (!conversationId) {
      console.warn('Conversation ID tidak ditemukan dari response chat start', response);
      return;
    }

    const link = material.file_url || material.url;
    const payload = {
      title: material.title,
      type: material.type,
      url: link,
    };

    try {
      await adminApiFetch(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ type: 'link', content: JSON.stringify(payload) }),
      });
    } catch (error) {
      console.warn('Gagal mengirim materi ke chat dengan type link, mencoba fallback text:', error);
      const fallbackContent = [
        `Materi baru: ${material.title}`,
        `Tipe: ${material.type.toUpperCase()}`,
        link ? `Buka materi: ${link}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      await adminApiFetch(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ type: 'text', content: fallbackContent }),
      });
    }
  };

  const saveMaterial = async () => {
    if (!materialDraft.title.trim() || (!materialDraft.url.trim() && !materialDraft.file)) {
      alertWarning('Judul dan URL atau file materi diperlukan.');
      return;
    }

    const formData = new FormData();
    formData.append('title', materialDraft.title.trim());
    formData.append('type', materialDraft.type);
    if (materialDraft.url.trim()) {
      formData.append('url', materialDraft.url.trim());
    }
    if (materialDraft.file) {
      formData.append('file', materialDraft.file);
    }

    try {
      const isEditing = editingMaterialId !== null;
      const result = await adminApiFetch(`/tutor/materials${isEditing ? `/${editingMaterialId}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
      });

      const updatedItem: MaterialItem = {
        id: result.id,
        title: result.title,
        type: result.type ?? materialDraft.type,
        url: result.url ?? '',
        file_url: result.file_url ?? '',
        createdAt: result.created_at ?? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMaterials((prev) => {
        if (isEditing) {
          return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
        }
        return [updatedItem, ...prev];
      });

      if (!isEditing) {
        try {
          await sendMaterialToChat(updatedItem);
        } catch (error: any) {
          console.warn("Gagal mengirim materi ke chat:", error);
          alertError("Materi tersimpan, tetapi gagal mengirim notifikasi chat.", error?.message ?? "Silakan coba lagi nanti.");
        }
      }

      clearMaterialDraft();
      setShowMaterialUploadModal(false);
      setEditingMaterialId(null);
      alertSuccess(isEditing ? 'Materi berhasil diperbarui' : 'Materi berhasil ditambahkan');
      addActivity(isEditing ? 'Edit materi' : 'Upload materi');
    } catch (error: any) {
      alertError('Gagal menyimpan materi', error?.message ?? 'Silakan coba lagi.');
    }
  };

  const attendanceDurationLabel = useMemo(() => {
    if (!attendance.joinedAt) return "00:00:00";
    const startedAt = new Date(attendance.joinedAt).getTime();
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return formatDuration(seconds);
  }, [attendance.joinedAt, clockTick]);

  const remoteStudentStream = useMemo(() => {
    const studentStream = studentParticipant
      ? remoteStreams.get(studentParticipant.id)
      : null;
    if (studentStream) {
      return studentStream;
    }

    const screenSharingParticipant = participants.find((participant) => participant.isScreenSharing);
    if (screenSharingParticipant) {
      return remoteStreams.get(screenSharingParticipant.id) ?? null;
    }

    return remoteStreams.size > 0 ? Array.from(remoteStreams.values())[0] : null;
  }, [remoteStreams, participants, studentParticipant]);

  const remoteStudentVideoStream = useMemo(() => {
    if (!remoteStudentStream) return null;

    const videoTracks = remoteStudentStream
      .getVideoTracks()
      .filter((track) => track.readyState !== 'ended' && track.enabled);
    if (videoTracks.length === 0) return null;

    const screenTrack =
      videoTracks.find((track) => {
        const label = track.label.toLowerCase();
        return /screen|window|display|shared/.test(label);
      }) ||
      videoTracks.find((track) => {
        try {
          const settings = track.getSettings() as { displaySurface?: string | null };
          return Boolean(settings?.displaySurface);
        } catch {
          return false;
        }
      }) ||
      null;

    const chosenTrack = screenTrack ?? videoTracks[0];
    const separatedStream = new MediaStream([chosenTrack]);
    remoteStudentStream.getAudioTracks().forEach((track) => {
      if (track.readyState !== 'ended') {
        separatedStream.addTrack(track);
      }
    });
    return separatedStream;
  }, [remoteStudentStream]);

  useEffect(() => {
    // Decide whether the small preview should show a live video or fallback avatar
    const checkPreview = () => {
      try {
        if (!isVideoSwapped) {
          const active = !!localStream && localStream.getVideoTracks().some((t) => t.enabled && t.readyState !== 'ended') && camOn;
          setPreviewHasVideo(active);
          console.info('[LiveClasView][Preview] computed preview for tutor', { active, localVideoTracks: localStream?.getVideoTracks().map((t) => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })) });
        } else {
          const active = !!remoteStudentVideoStream && remoteStudentVideoStream.getVideoTracks().some((t) => t.enabled && t.readyState !== 'ended') && studentCamOn;
          setPreviewHasVideo(active);
          console.info('[LiveClasView][Preview] computed preview for student', { active, remoteVideoTracks: remoteStudentVideoStream?.getVideoTracks().map((t) => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })) });
        }
      } catch (e) {
        setPreviewHasVideo(false);
      }
    };

    checkPreview();
  }, [isVideoSwapped, localStream, remoteStudentVideoStream, camOn, studentCamOn]);

  const getProfileImage = (profile?: { photo?: string | null; avatar?: string | null } | null) => {
    return profile?.photo ?? profile?.avatar ?? null;
  };

  const remoteStudentHasVideo = useMemo(() => {
    if (!remoteStudentVideoStream) return false;
    const enabledTracks = remoteStudentVideoStream.getVideoTracks().filter((track) => track.enabled && track.readyState !== 'ended');
    return enabledTracks.length > 0;
  }, [remoteStudentVideoStream]);

  const localVideoActive = useMemo(
    () => {
      if (!localStream) return false;
      return localStream.getVideoTracks().some((track) => track.enabled && track.readyState !== 'ended');
    },
    [localStream],
  );

  const shouldShowStudentPlaceholder = useMemo(
    () => !remoteStudentVideoStream || !remoteStudentHasVideo || !studentCamOn,
    [remoteStudentVideoStream, remoteStudentHasVideo, studentCamOn],
  );

  const shouldShowTutorPlaceholder = useMemo(
    () => !localStream || !localVideoActive || !camOn,
    [localStream, localVideoActive, camOn],
  );

  const participantsRef = useRef<ParticipantPresence[]>([]);
  const presenceManagerRef = useRef<PresenceChannelManager | null>(null);
  const pollingPresenceRef = useRef<PresenceChannelManager | null>(null);
  const [connectionErrors, setConnectionErrors] = useState<string[]>([]);
  const signalProcessingQueue = useRef<Map<number, Promise<void>>>(new Map());

  const attachStreamToElement = (
    element: HTMLMediaElement | null,
    stream: MediaStream | null,
    muted = false,
  ) => {
    if (!element) return;

    element.muted = muted;
    element.volume = 1;
    element.onloadedmetadata = null;
    element.oncanplay = null;

    if (!stream) {
      element.pause();
      element.srcObject = null;
      return;
    }

    if (element.srcObject !== stream) {
      element.srcObject = stream;
    }

    if (typeof element.load === 'function') {
      try {
        element.load();
      } catch (error) {
        console.warn('[LiveClasView] Unable to load remote media element', error);
      }
    }

    const playMedia = () => {
      element.play().catch((error) => {
        console.warn('[LiveClasView] Unable to autoplay remote student media', error);
      });
    };

    element.onloadedmetadata = playMedia;
    element.oncanplay = playMedia;
    playMedia();
  };

  useEffect(() => {
    // Early presence (polling) so tutor can see students even before session is started
    let active = true;
    (async () => {
      if (!bookingId || !user?.id) return;
      // Do not create polling presence when a live session is already ongoing
      if (session && session.status === 'ongoing') return;

      try {
        const pollManager = new PresenceChannelManager({
          echo: null,
          bookingId: Number(bookingId),
          roomId: String(bookingId),
          userId: user.id,
          userName: user.name || 'Tutor',
          usePolling: true,
          pollIntervalMs: 2000,
          apiBaseUrl: '/api',
          onParticipantsReceived: (parts) => {
            if (!active) return;
            const filtered = parts.filter((p) => p.id !== user.id);
            setParticipants(filtered);
          },
          onMemberJoined: (member) => {
            if (!active) return;
            if (member.id === user.id) return;
            setParticipants((prev) => [...prev.filter((p) => p.id !== member.id), member]);
          },
          onMemberLeft: (memberId) => {
            if (!active) return;
            setParticipants((prev) => prev.filter((p) => p.id !== memberId));
          },
          onMemberUpdated: (member) => {
            if (!active) return;
            setParticipants((prev) => {
              const next = prev.map((p) => (p.id === member.id ? member : p));
              if (!next.some((p) => p.id === member.id)) return [...next, member];
              return next;
            });
          },
        });

        pollingPresenceRef.current = pollManager;
        await pollManager.joinRoom();
        // Announce tutor presence via API so polling endpoint shows tutor as present
        pollManager.updatePresence({ isAudioOn: micOn, isVideoOn: camOn }, 'UserJoinedCall');
      } catch (err) {
        console.warn('[LiveClasView] Polling presence failed', err);
      }
    })();

    return () => {
      active = false;
      try {
        pollingPresenceRef.current?.destroy();
        pollingPresenceRef.current = null;
      } catch (e) {
        /* ignore */
      }
    };
  // run when booking or user changes or session changes
  }, [bookingId, user?.id, session?.status, micOn, camOn]);

  // Fetch pretest data directly from participants endpoint
  useEffect(() => {
    if (!bookingId || !studentParticipant?.id) return;

    const fetchPretestData = async () => {
      try {
        const response = await adminApiFetch(`/bookings/${bookingId}/live-session/participants`);
        if (response.ok) {
          const data = await response.json();
          const student = data.participants?.find((p: ParticipantPresence) => p.id === studentParticipant.id);
          if (student) {
            setParticipants((prev) => [
              ...prev.filter((p) => p.id !== student.id),
              { ...student },
            ]);
          }
        }
      } catch (err) {
        console.warn('[LiveClasView] Failed to fetch participant data', err);
      }
    };

    // Fetch immediately and then every 2 seconds
    fetchPretestData();
    const interval = setInterval(fetchPretestData, 2000);

    return () => clearInterval(interval);
  }, [bookingId, studentParticipant?.id]);

  // Missing useEffect wrapper was removed earlier — restore it so media attachment runs reactively
  useEffect(() => {
    // Only attach video stream if it has enabled video tracks
    const hasEnabledVideoTracks = remoteStudentVideoStream?.getVideoTracks().some(
      (track) => track.enabled && track.readyState !== 'ended'
    ) ?? false;

    if (hasEnabledVideoTracks) {
      attachStreamToElement(studentVideoRef.current, remoteStudentVideoStream, true);
    } else {
      // No valid video stream, ensure element is clear for fallback to show
      attachStreamToElement(studentVideoRef.current, null, true);
    }

    // Audio can be attached from remoteStudentStream even if no video
    attachStreamToElement(
      studentAudioRef.current,
      remoteStudentStream,
      !studentAudioOn || studentMutedByTutor,
    );

    if (remoteStudentStream) {
      console.info('[LiveClasView][Audio] Remote student stream attached to student audio element', {
        streamId: remoteStudentStream.id,
        trackKinds: remoteStudentStream.getTracks().map((track) => track.kind),
        videoTracks: remoteStudentStream.getVideoTracks().length,
        enabledVideoTracks: remoteStudentStream.getVideoTracks().filter((t) => t.enabled && t.readyState !== 'ended').length,
        audioTrackIds: remoteStudentStream.getAudioTracks().map((track) => track.id),
      });
    }
  }, [remoteStudentStream, remoteStudentVideoStream, studentAudioOn, studentMutedByTutor]);

  useEffect(() => {
    if (!studentParticipant) {
      return;
    }

    const explicitStudentStream = remoteStreams.get(studentParticipant.id);
    if (!explicitStudentStream || explicitStudentStream === remoteStudentStream) {
      return;
    }

    console.info('[LiveClasView] studentParticipant became available, attaching explicit stream', {
      studentId: studentParticipant.id,
      streamId: explicitStudentStream.id,
      trackKinds: explicitStudentStream.getTracks().map((track) => track.kind),
    });

    attachStreamToElement(studentVideoRef.current, explicitStudentStream, true);
    attachStreamToElement(
      studentAudioRef.current,
      explicitStudentStream,
      !studentAudioOn || studentMutedByTutor,
    );
  }, [studentParticipant, remoteStreams, remoteStudentStream, studentAudioOn, studentMutedByTutor]);

  useEffect(() => {
    if (!remoteStudentStream) {
      console.info('[LiveClasView] No remote student stream yet', {
        remoteStreamsSize: remoteStreams.size,
        participantsCount: participants.length,
        hasParticipant: !!studentParticipant,
      });
      return;
    }

    console.info('[LiveClasView] remoteStudentStream changed', {
      streamId: remoteStudentStream.id,
      trackKinds: remoteStudentStream.getTracks().map((track) => track.kind),
      videoTrackCount: remoteStudentStream.getVideoTracks().length,
      enabledVideoTracks: remoteStudentStream.getVideoTracks().filter((t) => t.enabled).length,
      audioTrackCount: remoteStudentStream.getAudioTracks().length,
      studentCamOn,
      studentScreenSharing,
      remoteStudentHasVideo,
      shouldShowStudentPlaceholder,
      studentVideoRefExists: !!studentVideoRef.current,
      studentAudioRefExists: !!studentAudioRef.current,
    });
  }, [remoteStudentStream, remoteStreams, participants, studentCamOn, studentScreenSharing, remoteStudentHasVideo, shouldShowStudentPlaceholder]);

  const normalizeParticipants = (items: ParticipantPresence[]) =>
    Array.from(
      new Map(items.map((participant) => [Number(participant.id), participant]))
        .values(),
    ).filter((participant) => participant.id !== user?.id);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const getParticipantById = (userId: number) => {
    const participant = participantsRef.current.find((item) => item.id === userId);
    if (participant) return participant;
    return presenceManagerRef.current?.getParticipant(userId);
  };

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
    loadMaterials();

    return () => {
      active = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId || !session) return;

    const alreadyJoined = localStorage.getItem(`tutorku_tutor_joined_${bookingId}`) === "true";
    if (session.status === "ongoing" && alreadyJoined && !hasJoinedSession) {
      setHasJoinedSession(true);
      if (!tutorJoinLoggedRef.current) {
        addActivity("Tutor join");
        tutorJoinLoggedRef.current = true;
      }
    }

    if (session.status === "ended") {
      localStorage.removeItem(`tutorku_tutor_joined_${bookingId}`);
      setHasJoinedSession(false);
    }
  }, [bookingId, session?.status, hasJoinedSession]);

  // Auto-join for tutor: when tutor opens the tutor view for a session
  // that is already `ongoing`, join immediately without showing any
  // extra approval dialog. This ensures tutors don't need to confirm
  // joining when they start the meet.
  useEffect(() => {
    if (!bookingId || !session) return;
    if (!user || user.role !== 'tutor') return;
    if (session.status !== 'ongoing') return;
    if (hasJoinedSession) return;
    if (isJoiningSession) return;

    // call tutor join flow automatically
    void handleJoinSession();
  }, [bookingId, session?.status, user?.id, user?.role, hasJoinedSession, isJoiningSession]);

  useEffect(() => {
    if (!hasJoinedSession || localStream) return;
    if (session?.status !== "ongoing") return;

    requestLocalMedia({ video: true, audio: true }).catch((error) => {
      console.warn("Failed to start camera after join", error);
    });
  }, [hasJoinedSession, localStream, session?.status]);

  const requestLocalMedia = async (
    constraints: MediaStreamConstraints,
  ): Promise<MediaStream | null> => {
    try {
      const stream = webrtcManager
        ? await webrtcManager.setupLocalStream(constraints)
        : await navigator.mediaDevices.getUserMedia(constraints);

      setLocalStream((prev) => {
        if (!prev) {
          return stream;
        }

        if (constraints.audio) {
          stream.getAudioTracks().forEach((track) => {
            if (!prev.getAudioTracks().length) prev.addTrack(track);
          });
        }
        if (constraints.video) {
          stream.getVideoTracks().forEach((track) => {
            if (!prev.getVideoTracks().length) prev.addTrack(track);
          });
        }

        return prev;
      });

      if (tutorVideoRef.current) {
        tutorVideoRef.current.srcObject = stream;
      }
      if (webrtcManager) {
        webrtcManager.setLocalStream(stream);
      }
      return stream;
    } catch (err) {
      console.warn("Tidak dapat mengakses kamera/mikrofon", err);
      setError("Izin kamera/mikrofon diperlukan untuk kelas live.");
      return null;
    }
  };

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      screenStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (tutorVideoRef.current && localStream) {
      tutorVideoRef.current.srcObject = localStream;
      // Re-play video when camera is toggled on
      if (camOn) {
        tutorVideoRef.current.play().catch((err) => {
          console.warn('[LiveClasView] Failed to play tutor video', err);
        });
      }
    }
  }, [localStream, camOn]);

  // Handle video swap - re-attach stream to correct ref
  useEffect(() => {
    if (isVideoSwapped) {
      // Main area now shows tutor video - ensure tutorVideoRef has stream
      if (tutorVideoRef.current && localStream && camOn) {
        tutorVideoRef.current.srcObject = localStream;
        tutorVideoRef.current.play().catch((err) => {
          console.warn('[LiveClasView] Failed to play tutor video on swap', err);
        });
      }
    } else {
      // Main area now shows student video - ensure studentVideoRef has stream
      if (studentVideoRef.current && remoteStudentVideoStream) {
        studentVideoRef.current.srcObject = remoteStudentVideoStream;
        studentVideoRef.current.play().catch((err) => {
          console.warn('[LiveClasView] Failed to play student video on swap', err);
        });
      }
    }
  }, [isVideoSwapped, localStream, remoteStudentVideoStream, camOn]);

  // Handle preview refs attachment
  useEffect(() => {
    if (!isVideoSwapped && camOn) {
      // Attach tutor stream to preview when camera is on
      if (previewTutorVideoRef.current && localStream) {
        previewTutorVideoRef.current.srcObject = localStream;
        previewTutorVideoRef.current.play().catch((err) => {
          console.warn('[LiveClasView] Failed to play preview tutor video', err);
        });
      }
    }
  }, [!isVideoSwapped && camOn ? localStream : null, isVideoSwapped, camOn]);

  // Handle preview student ref attachment
  useEffect(() => {
    if (isVideoSwapped && remoteStudentHasVideo) {
      // Attach student stream to preview when swapped and student has video
      if (previewStudentVideoRef.current && remoteStudentVideoStream) {
        previewStudentVideoRef.current.srcObject = remoteStudentVideoStream;
        previewStudentVideoRef.current.play().catch((err) => {
          console.warn('[LiveClasView] Failed to play preview student video', err);
        });
      }
    }
  }, [isVideoSwapped && remoteStudentHasVideo ? remoteStudentVideoStream : null, isVideoSwapped, remoteStudentHasVideo]);

  useEffect(() => {
    const studentParticipant = participants.find((participant) => participant.id !== user?.id);
    if (studentParticipant) {
      setStudentCamOn(studentParticipant.isVideoOn);
      setStudentAudioOn(studentParticipant.isAudioOn);
      setStudentScreenSharing(studentParticipant.isScreenSharing);
    }
  }, [participants, user?.id]);

  // Animate loading dots for waiting participant
  useEffect(() => {
    // Only animate when no participants yet
    if (participants.length > 0) {
      setAnimatedDots(0);
      return;
    }

    const interval = setInterval(() => {
      setAnimatedDots((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [participants.length]);

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getInitialCountdown = () => {
    if (!booking?.duration_minutes) return 0;
    return booking.duration_minutes * 60;
  };

  const startCountdown = () => {
    const initial = getInitialCountdown();
    if (initial <= 0) return;
    setCountdownSeconds(initial);
    setIsCountdownRunning(true);
    setHasCountdownEnded(false);
    setAlerted20Min(false);
    setAlerted10Min(false);
    setAlerted5Min(false);
    setAlerted5Sec(false);
    
    if (presenceManagerRef.current) {
      presenceManagerRef.current.sendCommand('countdown-started', { duration: initial });
    }
  };

  const extendCountdown = () => {
    if (!isCountdownRunning || countdownSeconds === null) return;
    if (countdownExtendCount >= 2) {
      alertInfo("Waktu tidak dapat ditambahkan lagi. Batas penambahan 2 kali.");
      return;
    }
    const newCountdown = countdownSeconds + 600;
    setCountdownSeconds(newCountdown);
    setCountdownExtendCount((prev) => prev + 1);
    alertInfo("Waktu sesi ditambahkan 10 menit.");
    
    if (presenceManagerRef.current) {
      presenceManagerRef.current.sendCommand('countdown-extended', { totalSeconds: newCountdown });
    }
  };

  useEffect(() => {
    if (!isCountdownRunning || countdownSeconds === null || countdownSeconds <= 0) return;
    if (countdownSeconds === 1200 && !alerted20Min) {
      alertInfo("Sesi akan berakhir dalam 20 menit.");
      setAlerted20Min(true);
    }
    if (countdownSeconds === 600 && !alerted10Min) {
      alertInfo("Sesi akan berakhir dalam 10 menit.");
      setAlerted10Min(true);
    }
    if (countdownSeconds === 300 && !alerted5Min) {
      alertInfo("Sesi akan berakhir dalam 5 menit.");
      setAlerted5Min(true);
    }
    if (countdownSeconds <= 5 && !alerted5Sec) {
      alertInfo("Sesi akan segera berakhir dalam 5 detik.");
      setAlerted5Sec(true);
    }
  }, [countdownSeconds, alerted20Min, alerted10Min, alerted5Min, alerted5Sec, isCountdownRunning]);

  useEffect(() => {
    if (!isCountdownRunning || countdownSeconds === null) return;
    if (countdownSeconds <= 0) {
      setIsCountdownRunning(false);
      setHasCountdownEnded(true);
      alertInfo("Waktu sesi habis. Sesi akan diakhiri.");
      handleEndClass();
      return;
    }

    const timer = window.setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null) return null;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdownSeconds, isCountdownRunning]);

  useEffect(() => {
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
      
      screenStream.getVideoTracks().forEach((track) => {
        if (!track.enabled) {
          track.enabled = true;
          console.log('[LiveClasView] Enabled screen video track', { trackId: track.id });
        }
      });

      screenRef.current.play().catch((err) => {
        console.warn('[LiveClasView] Screen video autoplay failed', err);
      });

      setScreenVideoReady(false);
    }
  }, [screenStream]);

  const toggleStudentPreviewFullscreen = async () => {
    const container = studentPreviewRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn("Gagal keluar mode fullscreen preview", error);
      }
      setIsStudentPreviewFullscreen(false);
      return;
    }

    try {
      await container.requestFullscreen();
      setIsStudentPreviewFullscreen(true);
    } catch (error) {
      console.warn("Gagal masuk mode fullscreen preview", error);
    }
  };

  const toggleMic = async () => {
    if (!localStream || localStream.getAudioTracks().length === 0) {
      const stream = await requestLocalMedia({ video: false, audio: true });
      if (!stream) return;
      setMicOn(true);
      await webrtcManager?.setTrackEnabled("audio", true);
      presenceManager?.updatePresence({ isAudioOn: true }, "UserMicOn");
      addNotification("Mikrofon aktif", "success");
      addActivity("Mikrofon aktif");
      return;
    }

    const nextMuted = !micOn;
    const enabled = !nextMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setMicOn(nextMuted);
    await webrtcManager?.setTrackEnabled("audio", enabled);
    presenceManager?.updatePresence(
      { isAudioOn: enabled },
      enabled ? "UserMicOn" : "UserMicOff",
    );
    addNotification(enabled ? "Mikrofon diaktifkan" : "Mikrofon dimatikan", enabled ? "success" : "warning");
    addActivity(enabled ? "Mikrofon aktif" : "Mikrofon mati");
  };

  const toggleCam = async () => {
    const nextVideoEnabled = !camOn;
    const hasVideoTracks = !!localStream && localStream.getVideoTracks().length > 0;

    if (!hasVideoTracks) {
      if (!nextVideoEnabled) {
        setCamOn(false);
        presenceManager?.updatePresence({ isVideoOn: false }, "UserCameraOff");
        addNotification("Kamera dimatikan", "warning");
        return;
      }

      const stream = await requestLocalMedia({ video: true, audio: false });
      if (!stream) return;
      setCamOn(true);
      await webrtcManager?.setTrackEnabled("video", true);
      presenceManager?.updatePresence({ isVideoOn: true }, "UserCameraOn");
      addNotification("Kamera aktif", "success");
      return;
    }

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = nextVideoEnabled;
    });

    setCamOn(nextVideoEnabled);
    await webrtcManager?.setTrackEnabled("video", nextVideoEnabled);
    presenceManager?.updatePresence(
      { isVideoOn: nextVideoEnabled },
      nextVideoEnabled ? "UserCameraOn" : "UserCameraOff",
    );
    addNotification(nextVideoEnabled ? "Kamera aktif" : "Kamera dimatikan", nextVideoEnabled ? "success" : "warning");
  };

  const toggleStudentMute = () => {
    if (!presenceManager || !studentParticipant) return;
    const nextMuted = !studentAudioOn;
    const command = nextMuted ? 'mute-audio' : 'unmute-audio';
    presenceManager.sendCommand(command, { target_user_id: studentParticipant.id });
    setStudentAudioOn(!nextMuted);
    setStudentMutedByTutor(nextMuted);
    addActivity(nextMuted ? 'Mikrofon siswa mati' : 'Mikrofon siswa aktif');
  };

  const handleStudentCameraOff = () => {
    if (!presenceManager || !studentParticipant) return;
    const nextCameraOff = studentCamOn;
    presenceManager.sendCommand(nextCameraOff ? 'mute-video' : 'unmute-video', { target_user_id: studentParticipant.id });
    setStudentCamOn(!nextCameraOff);
    addActivity(nextCameraOff ? 'Kamera siswa dimatikan' : 'Kamera siswa diaktifkan');
  };

  const handleStudentScreenShareStop = () => {
    if (!presenceManager || !studentParticipant) return;
    presenceManager.sendCommand('stop-screen-share', { target_user_id: studentParticipant.id });
    setStudentScreenSharing(false);
    addActivity('Screen sharing siswa dihentikan');
  };

  const handleKickStudent = () => {
    if (!presenceManager || !studentParticipant) return;
    presenceManager.sendCommand('kick-room', { target_user_id: studentParticipant.id });
    setParticipants((prev) => prev.filter((participant) => participant.id !== studentParticipant.id));
    setStudentCamOn(true);
    setStudentAudioOn(true);
    setStudentScreenSharing(false);
    addActivity('Siswa keluar dari room');
  };

  const handleToggleChatBlock = () => {
    const nextBlocked = !chatBlocked;
    setChatBlocked(nextBlocked);
    if (presenceManager && studentParticipant) {
      presenceManager.sendCommand('block-chat', { target_user_id: studentParticipant.id, blocked: nextBlocked });
    }
    addActivity(nextBlocked ? 'Chat diblokir' : 'Chat diizinkan');
  };

  const handleToggleScreenSharePermission = () => {
    const nextAllowed = !screenShareAllowed;
    setScreenShareAllowed(nextAllowed);
    if (presenceManager && studentParticipant) {
      presenceManager.sendCommand('allow-screen-share', { target_user_id: studentParticipant.id, allowed: nextAllowed });
    }
    addActivity(nextAllowed ? 'Share screen siswa diizinkan' : 'Share screen siswa dibatasi');
  };

  const handleSaveEndClassReview = () => {
    setShowEndClassReviewModal(false);
    addNotification('Review kelas tersimpan', 'success');
    addActivity('Review kelas tersimpan');
  };

  const restoreCameraAfterScreenShare = async () => {
    if (!hadCameraBeforeScreenShareRef.current || !webrtcManager) return;

    try {
      let cameraStream = localStream;
      const activeVideoTracks = cameraStream?.getVideoTracks().filter(
        (track) => track.readyState !== 'ended',
      );

      if (!cameraStream || !activeVideoTracks || activeVideoTracks.length === 0) {
        cameraStream = await requestLocalMedia({ video: true, audio: false });
      } else {
        activeVideoTracks.forEach((track) => {
          track.enabled = true;
        });
      }

      const newVideoTrack = cameraStream?.getVideoTracks().find(
        (track) => track.readyState !== 'ended',
      );
      if (newVideoTrack) {
        await webrtcManager.replaceVideoTrack(newVideoTrack);
      }
    } catch (err) {
      console.warn("Gagal memulihkan kamera setelah screen share", err);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      const track = screenStream?.getVideoTracks()[0];
      screenStream?.getTracks().forEach((track) => track.stop());
      if (track && localStream?.getTracks().some((t) => t.id === track.id)) {
        localStream.removeTrack(track);
      }
      setScreenStream(null);
      setScreenSharing(false);
      setScreenVideoReady(false);
      presenceManager?.updatePresence({ isScreenSharing: false }, "UserScreenShareStopped");
      addNotification("Berbagi layar dihentikan", "info");
      addActivity("Berhenti berbagi layar");
      return;
    }

    try {
      hadCameraBeforeScreenShareRef.current =
        !!localStream?.getVideoTracks().length || camOn;

      if (!localStream) {
        try {
          await requestLocalMedia({ video: false, audio: true });
        } catch (err) {
          console.warn("Tidak bisa setup audio stream sebelum screen share", err);
        }
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      console.log('[LiveClasView] getDisplayMedia resolved', { timestamp: Date.now(), streamId: stream.id });
      setScreenStream(stream);
      setScreenSharing(true);
      presenceManager?.updatePresence({ isScreenSharing: true }, "UserScreenShareStarted");
      addNotification("Screen sharing dimulai", "success");
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
      }
      const [track] = stream.getVideoTracks();
      if (track && webrtcManager) {
        try {
          console.log('[LiveClasView] replace camera with screen share track', { timestamp: Date.now(), trackId: track.id, peers: webrtcManager.getPeers().map((p) => p.userId) });
        } catch (diagErr) {
          console.log('[LiveClasView] Diagnostics failure before replacing video track', { diagErr });
        }

        await webrtcManager.replaceVideoTrack(track);
      }
      track.onended = async () => {
        setScreenSharing(false);
        setScreenStream(null);
        setScreenVideoReady(false);
        presenceManager?.updatePresence({ isScreenSharing: false }, "UserScreenShareStopped");

        if (hadCameraBeforeScreenShareRef.current) {
          await restoreCameraAfterScreenShare();
        }
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
    ctx.strokeStyle = tool === "pen" ? lineColor : "#374151";
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

  const handleJoinSession = async () => {
    if (!bookingId || !session || hasJoinedSession || session.status === "ended") {
      return;
    }

    setIsJoiningSession(true);
    try {
      const result = await adminApiFetch(`/bookings/${bookingId}/live-session/join`, {
        method: "POST",
      });
      const sessionData = result.data ?? result;
      setSession(sessionData);
      setHasJoinedSession(true);
      localStorage.setItem(`tutorku_tutor_joined_${bookingId}`, "true");
      setAttendance((prev) => ({ ...prev, joinedAt: new Date().toISOString() }));
      if (!tutorJoinLoggedRef.current) {
        addActivity("Tutor join");
        tutorJoinLoggedRef.current = true;
      }
      // Visual confirmation for tutor after joining (auto-join or manual)
      addNotification("Anda telah bergabung sebagai tutor", "success");

      if (!localStream) {
        await requestLocalMedia({ video: true, audio: true });
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Gagal memulai sesi live.");
    } finally {
      setIsJoiningSession(false);
    }
  };

  const setupWebRTC = async () => {
    if (!session || session.status !== "ongoing" || !bookingId || !user?.id) return;

    let isActive = true;
    let wrtcManager: WebRTCManager | null = null;
    let presenceManager: PresenceChannelManager | null = null;

    try {
      const token = localStorage.getItem("TUTORKU_token");
      const echo = getEcho(token);

      const iceServers: RTCIceServer[] = [];
      if (session.webrtc_turn_server) {
        iceServers.push({
          urls: [session.webrtc_turn_server],
          username: session.webrtc_turn_username || undefined,
          credential: session.webrtc_turn_password || undefined,
        });
      }
      if (session.webrtc_stun_server) {
        iceServers.push({ urls: [session.webrtc_stun_server] });
      }
      if (iceServers.length === 0) {
        iceServers.push({
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
          ],
        });
      }

      const hasTurn = iceServers.some((server) =>
        (Array.isArray(server.urls)
          ? server.urls
          : typeof server.urls === 'string'
          ? [server.urls]
          : []
        ).some((url) => url.toLowerCase().startsWith('turn:')),
      );

      if (!hasTurn) {
        console.warn('[LiveClasView] No TURN server configured. Adding public fallback TURN servers.');
        iceServers.push({
          urls: ['turn:openrelay.metered.ca:443?transport=tcp'],
          username: 'openrelayproject',
          credential: 'openrelayproject',
        });
        iceServers.push({
          urls: ['turn:numb.viagenie.ca'],
          username: 'webrtc@live.com',
          credential: 'muazkh',
        });
      }

      console.log('[LiveClasView] ICE servers configured', iceServers);

      wrtcManager = new WebRTCManager({
        iceServers,
        signalingChannel: echo,
        userId: user.id,
        roomId: session.room_id!,
        onRemoteStream: (userId, stream) => {
          if (!isActive) return;
          console.log('[LiveClasView] onRemoteStream', {
            userId,
            trackCount: stream.getTracks().length,
            trackKinds: stream.getTracks().map((t) => t.kind),
            streamId: stream.id,
          });
          setRemoteStreams((prev) => new Map(prev).set(userId, stream));

          if (studentParticipant && userId === studentParticipant.id) {
            attachStreamToElement(studentVideoRef.current, stream, true);
            attachStreamToElement(
              studentAudioRef.current,
              stream,
              !studentAudioOn || studentMutedByTutor,
            );
          }
        },
        onRemoteStreamRemoved: (userId) => {
          if (!isActive) return;
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
          });
          if (studentVideoRef.current) {
            studentVideoRef.current.srcObject = null;
          }
          if (studentAudioRef.current) {
            studentAudioRef.current.srcObject = null;
          }
        },
        onSignal: (signal) => {
          if (!isActive) return;
          const payloads = shouldChunkSignal(signal)
            ? createSignalChunks(signal)
            : [signal];

          const socketId = getSocketId(echo);
          payloads.forEach((chunk) => {
            console.log("[LiveClasView] Sending WebRTC signal", chunk.type, {
              isChunk: chunk.type === 'chunked-signal',
              chunkInfo: chunk.type === 'chunked-signal' ? chunk.payload : undefined,
              socketId,
            });
            adminApiFetch(`/bookings/${bookingId}/live-session/signal`, {
              method: "POST",
              headers: socketId ? { "X-Socket-Id": socketId } : undefined,
              body: JSON.stringify({
                type: chunk.type,
                payload: chunk.payload,
              }),
            }).catch((err) => {
              console.error("[LiveClasView] Failed to send signal", err);
            });
          });
        },
        onConnectionStateChange: (userId, state) => {
          console.log("[LiveClasView] Peer connection state changed", { userId, state });
        },
        onError: (error) => {
          if (!isActive) return;
          console.error("[LiveClasView] WebRTC error", error);
          setConnectionErrors((prev) => [...prev, error.message]);
        },
      });

      setWebrtcManager(wrtcManager);
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.__webrtcManager = wrtcManager;
      } catch (e) {
        /* ignore */
      }
      if (localStream) {
        wrtcManager.setLocalStream(localStream);
      }

      presenceManager = new PresenceChannelManager({
        echo,
        bookingId: Number(bookingId),
        roomId: session.room_id!,
        userId: user.id,
        userName: user.name || "Tutor",
        usePolling: false, // use realtime Reverb/echo so whispers (webrtc.signal) are received
        pollIntervalMs: 1500, // Poll every 1.5 seconds
        apiBaseUrl: '/api',
        onParticipantsReceived: async (participants) => {
          if (!isActive) return;
          const filteredParticipants = participants.filter((participant) => participant.id !== user.id);
          setParticipants(filteredParticipants);

          for (const participant of filteredParticipants) {
            try {
              if (wrtcManager!.getPeers().some((peer) => peer.userId === participant.id)) {
                console.log("[LiveClasView] Skipping duplicate peer for participant", participant.id);
                continue;
              }

              setStudentCamOn(participant.isVideoOn);
              setStudentAudioOn(participant.isAudioOn);
              setStudentScreenSharing(participant.isScreenSharing);

              await wrtcManager!.createPeerConnection(participant.id, participant.name, user.id > participant.id);
              if (user.id > participant.id) {
                await wrtcManager!.createAndSendOffer(participant.id);
              }
            } catch (err) {
              console.error("[LiveClasView] Failed to setup peer", err);
            }
          }
        },
        onMemberUpdated: (member) => {
          if (!isActive || member.id === user.id) return;
          setParticipants((prev) => {
            const next = prev.map((participant) =>
              participant.id === member.id ? member : participant,
            );
            if (!next.some((participant) => participant.id === member.id)) {
              return [...next, member];
            }
            return next;
          });
          setStudentCamOn(member.isVideoOn);
          setStudentAudioOn(member.isAudioOn);
          setStudentScreenSharing(member.isScreenSharing);
        },
        onPresenceEvent: (member, event) => {
          if (!isActive || member.id === user.id) return;
          setParticipants((prev) => {
            const next = prev.map((participant) =>
              participant.id === member.id ? member : participant,
            );
            if (!next.some((participant) => participant.id === member.id)) {
              return [...next, member];
            }
            return next;
          });
          setStudentCamOn(member.isVideoOn);
          setStudentAudioOn(member.isAudioOn);
          setStudentScreenSharing(member.isScreenSharing);
        },
        onWebRtcSignal: (data: any) => {
          if (!isActive) return;
          console.log('[LiveClasView] Received .webrtc.signal', data);
          enqueueSignal(data.from_user_id, async () => {
            await handleWebRTCSignal(data, wrtcManager!);
          });
        },
        onMemberJoined: async (member) => {
          if (!isActive) return;
          if (member.id === user.id) return;
          if (!studentJoinLoggedRef.current) {
            addActivity("Student join");
            studentJoinLoggedRef.current = true;
          }
          if (wrtcManager!.getPeers().some((peer) => peer.userId === member.id)) {
            console.log("[LiveClasView] Member already connected", member.id);
            setParticipants((prev) => [...prev.filter((p) => p.id !== member.id), member]);
            setStudentCamOn(member.isVideoOn);
            setStudentAudioOn(member.isAudioOn);
            setStudentScreenSharing(member.isScreenSharing);
            return;
          }

          setParticipants((prev) => [...prev.filter((p) => p.id !== member.id), member]);
          setStudentCamOn(member.isVideoOn);
          setStudentAudioOn(member.isAudioOn);
          setStudentScreenSharing(member.isScreenSharing);
          try {
            await wrtcManager!.createPeerConnection(member.id, member.name, user.id > member.id);
            if (user.id > member.id) {
              await wrtcManager!.createAndSendOffer(member.id);
            }
          } catch (err) {
            console.error("[LiveClasView] Failed to setup new peer", err);
          }
        },
        onMemberLeft: (memberId) => {
          if (!isActive) return;
          setParticipants((prev) => prev.filter((p) => p.id !== memberId));
          setStudentCamOn(true);
          setStudentAudioOn(true);
          setStudentScreenSharing(false);
          wrtcManager?.closePeer(memberId);
        },
        onError: (error) => {
          if (!isActive) return;
          console.error("[LiveClasView] Presence error", error);
          setConnectionErrors((prev) => [...prev, error.message]);
        },
      });

      const roomParticipants = await presenceManager.joinRoom();
      if (!isActive) {
        wrtcManager?.destroy();
        presenceManager?.destroy();
        return () => {};
      }

      presenceManager.updatePresence(
        {
          isAudioOn: micOn,
          isVideoOn: camOn,
          isScreenSharing: screenSharing,
        },
        "UserJoinedCall",
      );

      const studentParticipant = roomParticipants.find((participant) => participant.id !== user.id);
      if (studentParticipant) {
        setStudentCamOn(studentParticipant.isVideoOn);
        if (!studentJoinLoggedRef.current) {
          addActivity("Student join");
          studentJoinLoggedRef.current = true;
        }
      }

      setPresenceManager(presenceManager);
      presenceManagerRef.current = presenceManager;

    } catch (err) {
      if (isActive) {
        console.error("[LiveClasView] Failed to setup WebRTC/Presence", err);
        setConnectionErrors((prev) => [...prev, (err as Error).message]);
      }
    }

    return () => {
      isActive = false;
      presenceManagerRef.current = null;
      presenceManager?.sendPresenceEvent("UserLeftCall");
      wrtcManager?.destroy();
      presenceManager?.destroy();
    };
  };

  useEffect(() => {
    if (!session || session.status !== "ongoing" || !bookingId || !user?.id || !hasJoinedSession) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let active = true;

    const init = async () => {
      cleanup = await setupWebRTC();
    };

    init();

    return () => {
      active = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [session?.status, session?.room_id, bookingId, user?.id, hasJoinedSession, localStream]);

  const handleEndClass = async () => {
    if (!bookingId) return;
    setEnding(true);

    try {
      setShowSessionActionModal(false);
      presenceManager?.sendPresenceEvent("UserLeftCall");
      await adminApiFetch(`/bookings/${bookingId}/live-session/end`, { method: "POST" });
      setSession((prev) => prev ? { ...prev, status: "ended" } : prev);
      setAttendance((prev) => ({ ...prev, leftAt: new Date().toISOString() }));
      localStorage.removeItem(`tutorku_tutor_joined_${bookingId}`);
      setHasJoinedSession(false);
      setShowEndClassReviewModal(true);
      addNotification("Kelas selesai", "info");
      addActivity("Kelas selesai");
      
      setTimeout(() => {
        console.log('[LiveClasView] Session ended, navigating to admin');
        navigate("admin");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Gagal mengakhiri sesi.");
    } finally {
      setEnding(false);
    }
  };

  const handlePauseSession = async () => {
    if (!bookingId) return;
    setPausingSession(true);

    try {
      const result = await adminApiFetch(`/bookings/${bookingId}/live-session/pause`, {
        method: "POST",
      });
      setSession(result.data ?? result);
      setShowSessionActionModal(false);
      setIsCountdownRunning(false);
      presenceManagerRef.current?.sendCommand("session-paused", {});
      alertInfo("Sesi dijeda.");
    } catch (err) {
      console.error(err);
      setError("Gagal menjeda sesi.");
    } finally {
      setPausingSession(false);
    }
  };

  const handleResumeSession = async () => {
    if (!bookingId) return;
    setResumingSession(true);

    try {
      const result = await adminApiFetch(`/bookings/${bookingId}/live-session/resume`, {
        method: "POST",
      });
      setSession(result.data ?? result);
      setShowSessionActionModal(false);
      setIsCountdownRunning(true);
      presenceManagerRef.current?.sendCommand("session-resumed", {});
      alertInfo("Sesi dilanjutkan.");
    } catch (err) {
      console.error(err);
      setError("Gagal melanjutkan sesi.");
    } finally {
      setResumingSession(false);
    }
  };

  const canJoinSession = useMemo(() => {
    if (!session) return false;
    return session.status !== "ended" && !hasJoinedSession;
  }, [session, hasJoinedSession]);

  const joinButtonLabel = useMemo(() => {
    if (!session) return "Muat kelas...";
    if (session.status === "ended") return "Sesi berakhir";
    if (hasJoinedSession) return "✓ Terhubung";
    return session.status === "scheduled" ? "Mulai Kelas" : "Gabung Sekarang";
  }, [session?.status, hasJoinedSession]);

  const isMeetingActive = session?.status === "ongoing" && hasJoinedSession;
  const participantCount = participants.length;
  const peerConnectionCount = webrtcManager?.getPeers().length ?? 0;
  const roomIdLabel = session?.room_id ? `Room ${session.room_id}` : null;

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

  const handleNoteMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNoteDragging(true);
    setNoteDragStart({ x: e.clientX - notePosition.x, y: e.clientY - notePosition.y });
  };

  useEffect(() => {
    if (!isNoteDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      setNotePosition({
        x: e.clientX - noteDragStart.x,
        y: e.clientY - noteDragStart.y,
      });
    };

    const handleWindowMouseUp = () => {
      setIsNoteDragging(false);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isNoteDragging, noteDragStart]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const enqueueSignal = (remoteUserId: number, task: () => Promise<void>) => {
    const queue = signalProcessingQueue.current;
    const previous = queue.get(remoteUserId) ?? Promise.resolve();
    const next = previous
      .then(() => task())
      .catch((error) => {
        console.error('[LiveClasView] Signal queue error', { remoteUserId, error });
      })
      .finally(() => {
        if (queue.get(remoteUserId) === next) {
          queue.delete(remoteUserId);
        }
      });
    queue.set(remoteUserId, next);
    return next;
  };

  const dumpWebRTCState = () => {
    const peers = webrtcManager?.getPeers().map((peer) => ({
      userId: peer.userId,
      connectionState: peer.connection.connectionState,
      iceConnectionState: peer.connection.iceConnectionState,
      signalingState: peer.connection.signalingState,
      localSenderKinds: peer.connection.getSenders().map((sender: RTCRtpSender) => sender.track?.kind ?? null),
      remoteTrackKinds: peer.remoteStream?.getTracks().map((track: MediaStreamTrack) => track.kind) ?? [],
      remoteStreamId: peer.remoteStream?.id ?? null,
      remoteStreamTrackIds: peer.remoteStream?.getTracks().map((track: MediaStreamTrack) => track.id) ?? [],
    })) ?? [];

    const remoteStreamsSummary = Array.from(remoteStreams.entries()).map(
      ([userId, stream]) => ({
        userId,
        streamId: stream.id,
        trackKinds: stream.getTracks().map((track) => track.kind),
        trackIds: stream.getTracks().map((track) => track.id),
      }),
    );

    const dump = {
      peers,
      remoteStreams: remoteStreamsSummary,
      participants,
      pendingSignalQueueUserIds: Array.from(signalProcessingQueue.current.keys()),
      pendingChunkKeys: Array.from(signalChunksRef.current.keys()),
      connectionErrors,
      studentCamOn,
      studentAudioOn,
      studentScreenSharing,
    };

    console.log('[LiveClasView] WebRTC debug dump', dump);
    setWebRtcDebugDump(JSON.stringify(dump, null, 2).slice(0, 1600));
  };

  const handleWebRTCSignal = async (data: any, wrtcManager: WebRTCManager) => {
    const { from_user_id, type, payload } = data;
    const normalizedPayload =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? JSON.parse(JSON.stringify(payload))
        : payload;

    if (from_user_id === user?.id) {
      console.log('[LiveClasView] Ignoring own WebRTC signal', { from_user_id, type });
      return;
    }

    if (type === 'offer' || type === 'answer') {
      const sdp = typeof normalizedPayload?.sdp === 'string' ? normalizedPayload.sdp : '';
      console.log('[LiveClasView] Signal SDP size', { type, sdpLength: sdp.length });
    }

    if (type === 'chunked-signal') {
      if (!normalizedPayload || typeof normalizedPayload !== 'object') {
        console.warn('[LiveClasView] Invalid chunked-signal payload', { from_user_id, payload: normalizedPayload });
        return;
      }

      const chunkResult = normalizeReceivedChunkedSignal(signalChunksRef.current, normalizedPayload as ChunkedSignalPayload);
      console.log('[LiveClasView] Received chunked signal', {
        from_user_id,
        baseType: normalizedPayload.baseType,
        chunkIndex: normalizedPayload.chunkIndex,
        chunkCount: normalizedPayload.chunkCount,
        completed: chunkResult.complete,
      });

      if (!chunkResult.complete) {
        return;
      }

      console.log('[LiveClasView] Reassembled chunked signal complete', {
        from_user_id,
        type: chunkResult.signal?.type,
      });

      if (chunkResult.signal) {
        await handleWebRTCSignal({ ...data, type: chunkResult.signal.type, payload: chunkResult.signal.payload }, wrtcManager);
      }
      return;
    }

    try {
      console.log("[LiveClasView] handleWebRTCSignal", { from_user_id, type, payloadKeys: normalizedPayload ? Object.keys(normalizedPayload) : null });
      switch (type) {
        case "offer": {
          console.log("[LiveClasView] handling offer", { from_user_id });
          if (!normalizedPayload || typeof normalizedPayload !== "object" || typeof normalizedPayload.sdp !== "string") {
            console.warn("[LiveClasView] Invalid offer payload", {
              from_user_id,
              payload: normalizedPayload,
              payloadType: typeof normalizedPayload,
              sdpType: normalizedPayload?.sdp ? typeof normalizedPayload.sdp : 'undefined',
            });
            return;
          }

          if (!wrtcManager.getPeers().find((peer) => peer.userId === from_user_id)) {
            const participant = getParticipantById(from_user_id);
            await wrtcManager.createPeerConnection(
              from_user_id,
              participant?.name || "User",
              false,
            );
          }

          await wrtcManager.handleOffer(from_user_id, normalizedPayload);
          break;
        }

        case "answer": {
          console.log("[LiveClasView] handling answer", { from_user_id });
          if (!normalizedPayload || typeof normalizedPayload !== "object" || typeof normalizedPayload.sdp !== "string") {
            console.warn("[LiveClasView] Invalid answer payload", {
              from_user_id,
              payload: normalizedPayload,
              payloadType: typeof normalizedPayload,
              sdpType: normalizedPayload?.sdp ? typeof normalizedPayload.sdp : 'undefined',
            });
            return;
          }

          if (!wrtcManager.getPeers().find((peer) => peer.userId === from_user_id)) {
            const participant = getParticipantById(from_user_id);
            await wrtcManager.createPeerConnection(
              from_user_id,
              participant?.name || "User",
              true,
            );
          }

          await wrtcManager.handleAnswer(from_user_id, normalizedPayload);
          break;
        }

        case "ice-candidate": {
          console.log("[LiveClasView] handling ice-candidate", { from_user_id });
          if (!normalizedPayload || typeof normalizedPayload !== "object") {
            console.warn("[LiveClasView] Invalid ICE payload", {
              from_user_id,
              payload: normalizedPayload,
              payloadType: typeof normalizedPayload,
            });
            return;
          }

          const candidateData = normalizedPayload.candidate;
          const candidateValue = typeof candidateData === "string"
            ? candidateData
            : candidateData && typeof candidateData === "object"
            ? candidateData.candidate
            : undefined;

          if (!candidateValue || typeof candidateValue !== "string") {
            console.warn("[LiveClasView] Invalid ICE payload", {
              from_user_id,
              payload: normalizedPayload,
              payloadType: typeof normalizedPayload,
              candidateType: candidateData ? typeof candidateData : 'undefined',
            });
            return;
          }

          const icePayload: RTCIceCandidateInit = {
            candidate: candidateValue,
            sdpMid: normalizedPayload.sdpMid ?? (candidateData?.sdpMid ?? undefined),
            sdpMLineIndex: normalizedPayload.sdpMLineIndex ?? (candidateData?.sdpMLineIndex ?? undefined),
            usernameFragment: normalizedPayload.usernameFragment ?? (candidateData?.usernameFragment ?? undefined),
          };

          if (!wrtcManager.getPeers().find((peer) => peer.userId === from_user_id)) {
            const participant = getParticipantById(from_user_id);
            await wrtcManager.createPeerConnection(
              from_user_id,
              participant?.name || "User",
              true,
            );
          }

          await wrtcManager.addIceCandidate(from_user_id, icePayload);
          break;
        }

        case "hangup":
          wrtcManager.closePeer(from_user_id);
          break;

        default:
          console.warn("Unknown WebRTC signal type", type);
      }
    } catch (err) {
      console.error("Failed to handle WebRTC signal", err);
    }
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

  const swapVideo = () => {
    setIsVideoSwapped(!isVideoSwapped);
  };

  const isMobile = window.innerWidth < 768;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-gray-400 text-sm">
          <div className="space-y-3">
            <div className="w-64"><Skeleton className="h-6 w-64 bg-[#303134]" /></div>
            <div className="w-96"><Skeleton className="h-48 w-96 bg-[#303134]" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-[60] bg-[#202124]" : "h-screen"} bg-[#202124] text-[#e8eaed] flex flex-col`}>
      {/* Header - Google Meet Dark Style */}
      <div className="bg-[#303134] border-b border-[#3c4043] px-4 py-2.5 flex-shrink-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Left - Back & Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("admin")}
              className="p-1.5 rounded-lg hover:bg-[#3c4043] transition-colors text-[#9aa0a6] hover:text-[#e8eaed]"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#ea4335] bg-[#ea4335]/20 px-2 py-0.5 rounded border border-[#ea4335]/30 flex items-center gap-1">
                <Camera size={12} className="text-[#ea4335]" />
                LIVE
              </span>
              <span className="text-sm font-semibold text-[#e8eaed] truncate max-w-[120px] sm:max-w-[200px]">
                {booking?.tutor?.name || "Live Class"}
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-px h-5 bg-[#3c4043]" />

          {/* Status Badges - Google Meet Style */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#e8eaed] bg-[#3c4043] px-2.5 py-0.5 rounded-full border border-[#5f6368] flex items-center gap-1">
              <Users size={12} className="text-[#8ab4f8]" />
              {participantCount}
            </span>
            {roomIdLabel && (
              <span className="text-xs text-[#9aa0a6] bg-[#3c4043] px-2 py-0.5 rounded-full border border-[#5f6368] font-mono flex items-center gap-1">
                <Link size={12} className="text-[#8ab4f8]" />
                {roomIdLabel}
              </span>
            )}
            {countdownSeconds !== null && (
              <span className="text-xs text-[#8ab4f8] bg-[#8ab4f8]/20 px-2 py-0.5 rounded-full border border-[#8ab4f8]/30 font-mono flex items-center gap-1">
                <Clock size={12} className="text-[#8ab4f8]" />
                {formatCountdown(countdownSeconds)}
              </span>
            )}
            <span className="text-xs text-[#9aa0a6] bg-[#3c4043] px-2 py-0.5 rounded-full border border-[#5f6368] flex items-center gap-1">
              <Users size={12} className="text-[#81c995]" />
              {peerConnectionCount}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setIsDashboardOnLeft((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d52] text-xs font-semibold transition-colors"
            >
              {isDashboardOnLeft ? "Tukar ke Chat" : "Tukar ke Dashboard"}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
            >
              {isFullscreen ? <Shrink size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={() => {
                if (!isCountdownRunning) {
                  startCountdown();
                  return;
                }
                extendCountdown();
              }}
              disabled={hasCountdownEnded || countdownExtendCount >= 2}
              className="text-xs font-medium bg-[#3c4043] hover:bg-[#4a4d52] px-3 py-1.5 rounded-lg text-[#e8eaed] transition disabled:opacity-50 border border-[#5f6368] flex items-center gap-1"
            >
              <Clock size={14} className="text-[#8ab4f8]" />
              {isCountdownRunning ? `+10m (${countdownExtendCount}/2)` : "Mulai"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden">
        {isDashboardOnLeft ? (
          <>
            {!isFocusMode && (
              <div className="hidden xl:flex w-[320px] min-h-0 h-full bg-[#202124] border-r border-[#3c4043] flex-col">
                <div className="flex-shrink-0 border-b border-[#3c4043] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PanelRightOpen size={16} className="text-[#8ab4f8]" />
                      <div>
                        <div className="text-sm font-semibold text-[#e8eaed]">Dashboard Kelas</div>
                        <div className="text-[11px] text-[#9aa0a6]">Informasi & kontrol tutor</div>
                      </div>
                    </div>
                    <button onClick={() => setShowAdvancedTools((prev) => !prev)} className="rounded-lg px-2 py-1 text-[11px] text-[#9aa0a6] hover:bg-[#3c4043]">
                      {showAdvancedTools ? "Sembunyikan" : "Lihat"}
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
                  <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><BookOpen size={15} className="text-[#8ab4f8]" /> Informasi Kelas</div>
                    <div className="space-y-2 text-xs text-[#e8eaed]">
                      <div><span className="text-[#9aa0a6]">Siswa</span> : {booking?.student?.name || "-"}</div>
                      <div><span className="text-[#9aa0a6]">Mata pelajaran</span> : {getSubjectLabel(booking?.subject)}</div>
                      <div><span className="text-[#9aa0a6]">Booking</span> : #{booking?.id || bookingId || "-"}</div>
                      <div><span className="text-[#9aa0a6]">Jadwal</span> : {formatSessionSchedule(booking?.date, booking?.start_time)}</div>
                      <div><span className="text-[#9aa0a6]">Durasi</span> : {booking?.duration_minutes ? `${booking.duration_minutes} menit` : "-"}</div>
                      <div><span className="text-[#9aa0a6]">Status</span> : <span className="text-[#81c995]">Connected</span></div>
                    </div>
                    {materials.length > 0 && (
                      <div className="mt-3 rounded-lg border border-[#3c4043] bg-[#3c4043] p-2">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa0a6]">Materi terupload</div>
                        <div className="space-y-1">
                          {materials.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded bg-[#303134] px-2 py-1 text-[11px] text-[#e8eaed]">
                              <span>{item.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="uppercase text-[#9aa0a6]">{item.type}</span>
                                <button
                                  type="button"
                                  onClick={() => openEditMaterial(item)}
                                  className="text-[#8ab4f8] hover:text-white"
                                  aria-label="Edit materi"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteMaterial(item.id)}
                                  className="text-[#ea4335] hover:text-white"
                                  aria-label="Hapus materi"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><Users size={15} className="text-[#81c995]" /> Panel Peserta</div>
                    <div className="space-y-2 text-xs text-[#e8eaed]">
                      <div className="flex items-center justify-between rounded-lg bg-[#3c4043] px-2 py-2">
                        <span>Tutor</span>
                        <span className="text-[#81c995]">● Mic</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-[#3c4043] px-2 py-2">
                        <span>{booking?.student?.name || "Siswa"}</span>
                        <span className="text-[#fdd663]">● Camera</span>
                      </div>
                    </div>
                  </div>

                  {showAdvancedTools && (
                    <>
                      <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><Settings size={15} className="text-[#9aa0a6]" /> Kontrol Peserta</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#e8eaed]">
                          <button onClick={toggleStudentMute} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            {studentAudioOn ? <Mic size={14} /> : <MicOff size={14} />}
                            <span>{studentAudioOn ? 'Mute siswa' : 'Unmute siswa'}</span>
                          </button>
                          <button onClick={handleStudentCameraOff} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            {studentCamOn ? <Camera size={14} /> : <VideoOff size={14} />}
                            <span>{studentCamOn ? 'Matikan kamera' : 'Nyalakan kamera'}</span>
                          </button>
                          <button onClick={handleStudentScreenShareStop} disabled={!studentScreenSharing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52] disabled:opacity-50">
                            <MonitorPlay size={14} />
                            <span>Hentikan share</span>
                          </button>
                          <button onClick={handleKickStudent} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            <X size={14} />
                            <span>Kick room</span>
                          </button>
                          <button onClick={handleToggleChatBlock} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            <MessageCircle size={14} />
                            <span>{chatBlocked ? 'Izinkan chat' : 'Block chat'}</span>
                          </button>
                          <button onClick={handleToggleScreenSharePermission} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            <Monitor size={14} />
                            <span>{screenShareAllowed ? 'Batasi share' : 'Izinkan share'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><Radio size={15} className="text-[#ea4335]" /> Status Aktivitas</div>
                        <div className="space-y-1 text-xs text-[#e8eaed]">
                          {activityLog.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#3c4043] px-2 py-2">
                              <span>{item.label}</span>
                              <span className="text-[#9aa0a6]">{item.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className={`flex-1 min-h-0 relative bg-transparent p-0 ${isFocusMode ? "xl:flex-[2]" : ""}`}>
              <div className="relative w-full h-full rounded-none overflow-hidden bg-[#202124]">
                {/* Pretest Score Display */}
                {studentParticipant?.pretestCompleted && (
                  <div className="absolute top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 rounded-lg shadow-lg">
                    <div className="text-white font-semibold text-sm">
                      Nilai Pre-Test: <span className="text-lg font-bold">{studentParticipant.pretestScore ?? 0}/{studentParticipant.pretestTotalQuestions ?? 0}</span>
                    </div>
                  </div>
                )}
                
                {/* Tutor Video Element */}
                <video
                  ref={tutorVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: isVideoSwapped && localStream && camOn ? 'block' : 'none' }}
                  className="w-full h-full object-cover"
                />

                {/* Student Video Element */}
                <video
                  ref={studentVideoRef}
                  autoPlay
                  playsInline
                  muted={true}
                  style={{ display: !isVideoSwapped && remoteStudentHasVideo ? 'block' : 'none' }}
                  className="w-full h-full object-cover"
                />

                {!isVideoSwapped && shouldShowStudentPlaceholder && !studentScreenSharing && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#202124]/95 backdrop-blur-md text-center px-6 gap-3 border border-[#3c4043]/10">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#3c4043]/20 shadow-2xl bg-[#303134]">
                      {getProfileImage(booking?.student) ? (
                        <img
                          src={getProfileImage(booking?.student) as string}
                          alt={booking?.student?.name || 'Siswa'}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.opacity = '0';
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${getProfileImage(booking?.student) ? 'opacity-0' : ''} bg-gradient-to-br ${getAvatarColor(booking?.student?.name || 'Siswa')} text-4xl font-bold text-white`}>
                        {booking?.student?.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                    </div>
                    <div className="text-[#e8eaed] text-xl font-semibold">{booking?.student?.name || 'Siswa'}</div>
                    {participants.length === 0 && (
                      <div className="text-[#9aa0a6] text-sm font-medium tracking-wide">
                        Menunggu Siswa{''.padEnd(animatedDots, '.')}
                      </div>
                    )}
                  </div>
                )}

                {isVideoSwapped && !localVideoActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]/70 backdrop-blur-sm text-center px-6 gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#3c4043]/20 shadow-xl bg-[#303134]">
                      {getProfileImage(booking?.tutor) ? (
                        <img
                          src={getProfileImage(booking?.tutor) as string}
                          alt={booking?.tutor?.name || 'Tutor'}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.opacity = '0';
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${getProfileImage(booking?.tutor) ? 'opacity-0' : ''} bg-gradient-to-br ${getAvatarColor(booking?.tutor?.name || 'Tutor')} text-3xl font-bold text-white`}>
                        {booking?.tutor?.name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                    </div>
                    <div className="text-sm text-[#9aa0a6]">{booking?.tutor?.name || 'Tutor'}</div>
                  </div>
                )}

                {screenSharing && !isVideoSwapped && (
                  <div className="absolute inset-0 bg-[#202124]">
                    <video
                      ref={screenRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {tutorRaiseHand && (
                  <div className="absolute bottom-6 right-6 animate-bounce drop-shadow-lg">
                    <Hand size={40} className="text-[#fdd663]" />
                  </div>
                )}
                {tutorGift && (
                  <div className="absolute bottom-20 right-6 animate-bounce drop-shadow-lg">
                    <Gift size={40} className="text-[#f28b82]" />
                  </div>
                )}
                {tutorClap && (
                  <div className="absolute bottom-6 right-20 animate-bounce drop-shadow-lg">
                    <ThumbsUp size={40} className="text-[#8ab4f8]" />
                  </div>
                )}
                {tutorSparkle && (
                  <div className="absolute bottom-20 right-20 animate-bounce drop-shadow-lg">
                    <Sparkles size={40} className="text-[#d7aefb]" />
                  </div>
                )}
              </div>

              <div
                className="absolute top-3 left-3 z-50 w-[110px] md:w-[140px] lg:w-[170px] aspect-video rounded-3xl overflow-hidden shadow-2xl border border-[#3c4043]/10 bg-[#303134] backdrop-blur-sm transition-all duration-200 cursor-pointer"
                onClick={swapVideo}
              >
                {!isVideoSwapped && camOn && (
                  <video
                    ref={previewTutorVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                {!isVideoSwapped && !camOn && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#303134] to-[#202124] px-2 text-center text-[#e8eaed]">
                    <AvatarFallback name={booking?.tutor?.name ?? 'Tutor'} photo={getProfileImage(booking?.tutor)} sizeClass="h-12 w-12" alt={booking?.tutor?.name ?? undefined} />
                    <div className="text-[9px] text-[#9aa0a6] truncate max-w-full flex-shrink-0">{booking?.tutor?.name || 'Tutor'}</div>
                  </div>
                )}
                {isVideoSwapped && remoteStudentHasVideo && (
                  <video
                    ref={previewStudentVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                {isVideoSwapped && !remoteStudentHasVideo && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#303134] to-[#202124] px-2 text-center text-[#e8eaed]">
                    <AvatarFallback name={booking?.student?.name ?? 'Siswa'} photo={getProfileImage(booking?.student)} sizeClass="h-12 w-12" alt={booking?.student?.name ?? undefined} />
                    <div className="text-[9px] text-[#9aa0a6] truncate max-w-full flex-shrink-0">{booking?.student?.name || 'Siswa'}</div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-1 bg-[#202124]/60 px-2 py-1 text-[10px] text-[#e8eaed] pointer-events-none">
                  <span className="truncate font-medium text-xs">{isVideoSwapped ? 'Siswa' : 'Kamu'}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#9aa0a6]">
                    <User size={10} />
                  </span>
                </div>
              </div>

              <div className="absolute top-3 right-3 z-40 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-[#81c995]/30 bg-[#81c995]/15 px-3 py-1 text-[11px] font-semibold text-[#81c995] backdrop-blur">
                  <span className="mr-1 inline-flex h-2 w-2 rounded-full bg-[#81c995]" />{studentParticipant?.name || booking?.student?.name || "Siswa"}
                </div>
                <div className="rounded-full border border-[#8ab4f8]/30 bg-[#8ab4f8]/15 px-3 py-1 text-[11px] font-semibold text-[#8ab4f8] backdrop-blur">
                  {getSubjectLabel(booking?.subject) || "Kelas Live"}
                </div>
              </div>

              {!isMeetingActive && session && session.status !== "ended" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-2xl bg-[#303134]/95 p-6 text-center shadow-2xl backdrop-blur-sm border border-[#3c4043]">
                    <div className="text-xs uppercase text-[#8ab4f8] tracking-[0.24em] mb-3 flex items-center justify-center gap-2">
                      <Camera size={14} className="text-[#8ab4f8]" />
                      {session.status === "scheduled" ? "Ruang Tunggu" : "Live Meeting"}
                    </div>
                    <div className="text-xl font-semibold text-[#e8eaed] mb-2">
                      {session.status === "scheduled"
                        ? "Sesi belum dimulai"
                        : "Sesi sedang berlangsung"}
                    </div>
                    <p className="text-sm text-[#9aa0a6] mb-4">
                      {session.status === "scheduled"
                        ? "Klik Mulai Kelas ketika Anda siap."
                        : "Tekan Gabung Sekarang untuk mulai mengajar."}
                    </p>
                    <button
                      onClick={handleJoinSession}
                      disabled={!canJoinSession || isJoiningSession}
                      className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                        hasJoinedSession
                          ? "bg-[#3c4043] text-[#9aa0a6] cursor-default opacity-70"
                          : "bg-[#1a73e8] text-white hover:bg-[#1a73e8]/90"
                      } ${isJoiningSession ? "opacity-70 cursor-wait" : ""}`}
                    >
                      {isJoiningSession ? "Memuat..." : joinButtonLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden xl:flex w-[280px] lg:w-[320px] min-h-0 h-full bg-[#202124] border-l border-[#3c4043] flex-col">
              <div className="flex-shrink-0 border-b border-[#3c4043] px-4 py-3">
                <div className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-[#8ab4f8]" />
                  <div>
                    <div className="text-sm font-semibold text-[#e8eaed]">Room Chat</div>
                    <div className="text-xs text-[#9aa0a6]">Live session chat</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <LiveChat bookingId={bookingId} hideHeader apiFetch={adminApiFetch} onClose={() => setShowChatPopup(false)} currentUserId={user?.id} currentUserRole={user?.role} isBlocked={chatBlocked} blockedMessage={chatBlocked ? 'Chat sedang diblokir oleh tutor.' : undefined} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="hidden xl:flex w-[280px] lg:w-[320px] min-h-0 h-full bg-[#202124] border-r border-[#3c4043] flex-col">
              <div className="flex-shrink-0 border-b border-[#3c4043] px-4 py-3">
                <div className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-[#8ab4f8]" />
                  <div>
                    <div className="text-sm font-semibold text-[#e8eaed]">Room Chat</div>
                    <div className="text-xs text-[#9aa0a6]">Live session chat</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <LiveChat bookingId={bookingId} hideHeader apiFetch={adminApiFetch} onClose={() => setShowChatPopup(false)} currentUserId={user?.id} currentUserRole={user?.role} isBlocked={chatBlocked} blockedMessage={chatBlocked ? 'Chat sedang diblokir oleh tutor.' : undefined} />
              </div>
            </div>

            <div className={`flex-1 min-h-0 relative bg-transparent p-0 ${isFocusMode ? "xl:flex-[2]" : ""}`}>
              <div className="relative w-full h-full rounded-none overflow-hidden bg-[#202124]">
                <video
                  ref={tutorVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: isVideoSwapped && localStream && camOn ? 'block' : 'none' }}
                  className="w-full h-full object-cover"
                />

                <video
                  ref={studentVideoRef}
                  autoPlay
                  playsInline
                  muted={true}
                  style={{ display: !isVideoSwapped && remoteStudentHasVideo ? 'block' : 'none' }}
                  className="w-full h-full object-cover"
                />

                {!isVideoSwapped && shouldShowStudentPlaceholder && !studentScreenSharing && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#202124]/95 backdrop-blur-md text-center px-6 gap-3 border border-[#3c4043]/10">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#3c4043]/20 shadow-2xl bg-[#303134]">
                      {getProfileImage(booking?.student) ? (
                        <img
                          src={getProfileImage(booking?.student) as string}
                          alt={booking?.student?.name || 'Siswa'}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.opacity = '0';
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${getProfileImage(booking?.student) ? 'opacity-0' : ''} bg-gradient-to-br ${getAvatarColor(booking?.student?.name || 'Siswa')} text-4xl font-bold text-white`}>
                        {booking?.student?.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                    </div>
                    <div className="text-[#e8eaed] text-xl font-semibold">{booking?.student?.name || 'Siswa'}</div>
                    {participants.length === 0 && (
                      <div className="text-[#9aa0a6] text-sm font-medium tracking-wide">
                        Menunggu Siswa{''.padEnd(animatedDots, '.')}
                      </div>
                    )}
                  </div>
                )}

                {isVideoSwapped && !localVideoActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]/70 backdrop-blur-sm text-center px-6 gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#3c4043]/20 shadow-xl bg-[#303134]">
                      {getProfileImage(booking?.tutor) ? (
                        <img
                          src={getProfileImage(booking?.tutor) as string}
                          alt={booking?.tutor?.name || 'Tutor'}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.opacity = '0';
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${getProfileImage(booking?.tutor) ? 'opacity-0' : ''} bg-gradient-to-br ${getAvatarColor(booking?.tutor?.name || 'Tutor')} text-3xl font-bold text-white`}>
                        {booking?.tutor?.name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                    </div>
                    <div className="text-sm text-[#9aa0a6]">{booking?.tutor?.name || 'Tutor'}</div>
                  </div>
                )}

                {screenSharing && !isVideoSwapped && (
                  <div className="absolute inset-0 bg-[#202124]">
                    <video
                      ref={screenRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {tutorRaiseHand && (
                  <div className="absolute bottom-6 right-6 animate-bounce drop-shadow-lg">
                    <Hand size={40} className="text-[#fdd663]" />
                  </div>
                )}
                {tutorGift && (
                  <div className="absolute bottom-20 right-6 animate-bounce drop-shadow-lg">
                    <Gift size={40} className="text-[#f28b82]" />
                  </div>
                )}
                {tutorClap && (
                  <div className="absolute bottom-6 right-20 animate-bounce drop-shadow-lg">
                    <ThumbsUp size={40} className="text-[#8ab4f8]" />
                  </div>
                )}
                {tutorSparkle && (
                  <div className="absolute bottom-20 right-20 animate-bounce drop-shadow-lg">
                    <Sparkles size={40} className="text-[#d7aefb]" />
                  </div>
                )}
              </div>

              <div
                className="absolute top-3 left-3 z-50 w-[110px] md:w-[140px] lg:w-[170px] aspect-video rounded-3xl overflow-hidden shadow-2xl border border-[#3c4043]/10 bg-[#303134] backdrop-blur-sm transition-all duration-200 cursor-pointer"
                onClick={swapVideo}
              >
                {!isVideoSwapped && camOn && (
                  <video
                    ref={previewTutorVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                {!isVideoSwapped && !camOn && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#303134] to-[#202124] px-2 text-center text-[#e8eaed]">
                    <AvatarFallback name={booking?.tutor?.name ?? 'Tutor'} photo={getProfileImage(booking?.tutor)} sizeClass="h-12 w-12" alt={booking?.tutor?.name ?? undefined} />
                    <div className="text-[9px] text-[#9aa0a6] truncate max-w-full flex-shrink-0">{booking?.tutor?.name || 'Tutor'}</div>
                  </div>
                )}
                {isVideoSwapped && remoteStudentHasVideo && (
                  <video
                    ref={previewStudentVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                {isVideoSwapped && !remoteStudentHasVideo && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#303134] to-[#202124] px-2 text-center text-[#e8eaed]">
                    <AvatarFallback name={booking?.student?.name ?? 'Siswa'} photo={getProfileImage(booking?.student)} sizeClass="h-12 w-12" alt={booking?.student?.name ?? undefined} />
                    <div className="text-[9px] text-[#9aa0a6] truncate max-w-full flex-shrink-0">{booking?.student?.name || 'Siswa'}</div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-1 bg-[#202124]/60 px-2 py-1 text-[10px] text-[#e8eaed] pointer-events-none">
                  <span className="truncate font-medium text-xs">{isVideoSwapped ? 'Siswa' : 'Kamu'}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#9aa0a6]">
                    <User size={10} />
                  </span>
                </div>
              </div>

              <div className="absolute top-3 right-3 z-40 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-[#81c995]/30 bg-[#81c995]/15 px-3 py-1 text-[11px] font-semibold text-[#81c995] backdrop-blur">
                  <span className="mr-1 inline-flex h-2 w-2 rounded-full bg-[#81c995]" />{studentParticipant?.name || booking?.student?.name || "Siswa"}
                </div>
                <div className="rounded-full border border-[#8ab4f8]/30 bg-[#8ab4f8]/15 px-3 py-1 text-[11px] font-semibold text-[#8ab4f8] backdrop-blur">
                  {getSubjectLabel(booking?.subject) || "Kelas Live"}
                </div>
              </div>


              {!isMeetingActive && session && session.status !== "ended" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-2xl bg-[#303134]/95 p-6 text-center shadow-2xl backdrop-blur-sm border border-[#3c4043]">
                    <div className="text-xs uppercase text-[#8ab4f8] tracking-[0.24em] mb-3 flex items-center justify-center gap-2">
                      <Camera size={14} className="text-[#8ab4f8]" />
                      {session.status === "scheduled" ? "Ruang Tunggu" : "Live Meeting"}
                    </div>
                    <div className="text-xl font-semibold text-[#e8eaed] mb-2">
                      {session.status === "scheduled"
                        ? "Sesi belum dimulai"
                        : "Sesi sedang berlangsung"}
                    </div>
                    <p className="text-sm text-[#9aa0a6] mb-4">
                      {session.status === "scheduled"
                        ? "Klik Mulai Kelas ketika Anda siap."
                        : "Tekan Gabung Sekarang untuk mulai mengajar."}
                    </p>
                    <button
                      onClick={handleJoinSession}
                      disabled={!canJoinSession || isJoiningSession}
                      className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                        hasJoinedSession
                          ? "bg-[#3c4043] text-[#9aa0a6] cursor-default opacity-70"
                          : "bg-[#1a73e8] text-white hover:bg-[#1a73e8]/90"
                      } ${isJoiningSession ? "opacity-70 cursor-wait" : ""}`}
                    >
                      {isJoiningSession ? "Memuat..." : joinButtonLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isFocusMode && (
              <div className="hidden xl:flex w-[320px] min-h-0 h-full bg-[#202124] border-l border-[#3c4043] flex-col">
                <div className="flex-shrink-0 border-b border-[#3c4043] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PanelRightOpen size={16} className="text-[#8ab4f8]" />
                      <div>
                        <div className="text-sm font-semibold text-[#e8eaed]">Dashboard Kelas</div>
                        <div className="text-[11px] text-[#9aa0a6]">Informasi & kontrol tutor</div>
                      </div>
                    </div>
                    <button onClick={() => setShowAdvancedTools((prev) => !prev)} className="rounded-lg px-2 py-1 text-[11px] text-[#9aa0a6] hover:bg-[#3c4043]">
                      {showAdvancedTools ? "Sembunyikan" : "Lihat"}
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
                  <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><BookOpen size={15} className="text-[#8ab4f8]" /> Informasi Kelas</div>
                    <div className="space-y-2 text-xs text-[#e8eaed]">
                      <div><span className="text-[#9aa0a6]">Siswa</span> : {booking?.student?.name || "-"}</div>
                      <div><span className="text-[#9aa0a6]">Mata pelajaran</span> : {getSubjectLabel(booking?.subject)}</div>
                      <div><span className="text-[#9aa0a6]">Booking</span> : #{booking?.id || bookingId || "-"}</div>
                      <div><span className="text-[#9aa0a6]">Jadwal</span> : {formatSessionSchedule(booking?.date, booking?.start_time)}</div>
                      <div><span className="text-[#9aa0a6]">Durasi</span> : {booking?.duration_minutes ? `${booking.duration_minutes} menit` : "-"}</div>
                      <div><span className="text-[#9aa0a6]">Status</span> : <span className="text-[#81c995]">Connected</span></div>
                    </div>
                    {materials.length > 0 && (
                      <div className="mt-3 rounded-lg border border-[#3c4043] bg-[#3c4043] p-2">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa0a6]">Materi terupload</div>
                        <div className="space-y-1">
                          {materials.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded bg-[#303134] px-2 py-1 text-[11px] text-[#e8eaed]">
                              <span>{item.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="uppercase text-[#9aa0a6]">{item.type}</span>
                                <button
                                  type="button"
                                  onClick={() => openEditMaterial(item)}
                                  className="text-[#8ab4f8] hover:text-white"
                                  aria-label="Edit materi"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteMaterial(item.id)}
                                  className="text-[#ea4335] hover:text-white"
                                  aria-label="Hapus materi"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><Users size={15} className="text-[#81c995]" /> Panel Peserta</div>
                    <div className="space-y-2 text-xs text-[#e8eaed]">
                      <div className="flex items-center justify-between rounded-lg bg-[#3c4043] px-2 py-2">
                        <span>Tutor</span>
                        <span className="text-[#81c995]">● Mic</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-[#3c4043] px-2 py-2">
                        <span>{booking?.student?.name || "Siswa"}</span>
                        <span className="text-[#fdd663]">● Camera</span>
                      </div>
                    </div>
                  </div>

                  {showAdvancedTools && (
                    <>
                      <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><Settings size={15} className="text-[#9aa0a6]" /> Kontrol Peserta</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#e8eaed]">
                          <button onClick={toggleStudentMute} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            {studentAudioOn ? <Mic size={14} /> : <MicOff size={14} />}
                            <span>{studentAudioOn ? 'Mute siswa' : 'Unmute siswa'}</span>
                          </button>
                          <button onClick={handleStudentCameraOff} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            {studentCamOn ? <Camera size={14} /> : <VideoOff size={14} />}
                            <span>{studentCamOn ? 'Matikan kamera' : 'Nyalakan kamera'}</span>
                          </button>
                          <button onClick={handleStudentScreenShareStop} disabled={!studentScreenSharing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52] disabled:opacity-50">
                            <MonitorPlay size={14} />
                            <span>Hentikan share</span>
                          </button>
                          <button onClick={handleKickStudent} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            <X size={14} />
                            <span>Kick room</span>
                          </button>
                          <button onClick={handleToggleChatBlock} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            <MessageCircle size={14} />
                            <span>{chatBlocked ? 'Izinkan chat' : 'Block chat'}</span>
                          </button>
                          <button onClick={handleToggleScreenSharePermission} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3c4043] px-2 py-2 hover:bg-[#4a4d52]">
                            <Monitor size={14} />
                            <span>{screenShareAllowed ? 'Batasi share' : 'Izinkan share'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#3c4043] bg-[#303134] p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><Radio size={15} className="text-[#ea4335]" /> Status Aktivitas</div>
                        <div className="space-y-1 text-xs text-[#e8eaed]">
                          {activityLog.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#3c4043] px-2 py-2">
                              <span>{item.label}</span>
                              <span className="text-[#9aa0a6]">{item.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[#3c4043] px-4 py-3 bg-[#202124]">
        <div className="w-px h-6 bg-[#3c4043]" />

        <button
          onClick={toggleMic}
          disabled={!hasJoinedSession}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            !hasJoinedSession
              ? 'bg-[#3c4043]/50 text-[#9aa0a6] cursor-not-allowed'
              : micOn
              ? 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#81c995]'
              : 'bg-[#ea4335]/30 text-[#ea4335] hover:bg-[#ea4335]/40'
          }`}
        >
          {micOn ? <Mic size={17} className="text-[#81c995]" /> : <MicOff size={17} className="text-[#ea4335]" />}
        </button>

        <button
          type="button"
          onClick={toggleCam}
          disabled={!hasJoinedSession}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm pointer-events-auto ${
            !hasJoinedSession
              ? 'bg-[#3c4043]/50 text-[#9aa0a6] cursor-not-allowed'
              : camOn
              ? 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#8ab4f8]'
              : 'bg-[#ea4335]/30 text-[#ea4335] hover:bg-[#ea4335]/40'
          }`}
        >
          <Camera size={17} className={camOn ? 'text-[#8ab4f8]' : 'text-[#ea4335]'} />
        </button>

        <button
          onClick={toggleScreenShare}
          disabled={!hasJoinedSession}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            !hasJoinedSession
              ? 'bg-[#3c4043]/50 text-[#9aa0a6] cursor-not-allowed'
              : screenSharing
              ? 'bg-[#d7aefb]/30 text-[#d7aefb] hover:bg-[#d7aefb]/40'
              : 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#e8eaed]'
          }`}
        >
          <Monitor size={17} className={screenSharing ? 'text-[#d7aefb]' : 'text-[#9aa0a6]'} />
        </button>

        <button
          onClick={() => setShowWhiteboard(!showWhiteboard)}
          disabled={!hasJoinedSession}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            !hasJoinedSession
              ? 'bg-[#3c4043]/50 text-[#9aa0a6] cursor-not-allowed'
              : showWhiteboard
              ? 'bg-[#fdd663]/30 text-[#fdd663] hover:bg-[#fdd663]/40'
              : 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#e8eaed]'
          }`}
        >
          <PenTool size={17} className={showWhiteboard ? 'text-[#fdd663]' : 'text-[#9aa0a6]'} />
        </button>

        <button
          onClick={() => setShowNotesPanel((prev) => !prev)}
          className="p-2 rounded-xl bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 transition-all duration-200 text-[#e8eaed] backdrop-blur-sm"
        >
          <FileText size={17} className="text-[#fdd663]" />
        </button>

        {/* Upload materi UI removed per request */}


        <button
          onClick={() => setIsFocusMode((prev) => !prev)}
          className="p-2 rounded-xl bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 transition-all duration-200 text-[#e8eaed] backdrop-blur-sm"
        >
          <BadgeCheck size={17} className={isFocusMode ? "text-[#81c995]" : "text-[#9aa0a6]"} />
        </button>

        {/* Upload materi UI removed per request */}

        <button
          onClick={() => {
            if (isMobile) {
              setShowChatPopup(true);
            }
          }}
          className="p-2 rounded-xl bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 transition-all duration-200 text-[#e8eaed] backdrop-blur-sm md:hidden"
        >
          <MessageCircle size={17} className="text-[#8ab4f8]" />
        </button>

        <button
          onClick={() => setShowParticipants(true)}
          className="p-2 rounded-xl bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 transition-all duration-200 text-[#e8eaed] backdrop-blur-sm"
        >
          <Users size={17} className="text-[#81c995]" />
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-xl bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 transition-all duration-200 text-[#e8eaed] backdrop-blur-sm"
        >
          <Settings size={17} className="text-[#9aa0a6]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowReactionMenu(!showReactionMenu)}
            className="p-2 rounded-xl bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 transition-all duration-200 text-[#e8eaed] backdrop-blur-sm"
          >
            <MoreVertical size={17} className="text-[#fdd663]" />
          </button>
          
          {showReactionMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#303134]/95 backdrop-blur-md border border-[#3c4043] rounded-xl shadow-lg p-1.5 flex items-center gap-0.5 z-50">
              <button
                onClick={() => addReaction('raise-hand')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <Hand size={15} className="text-[#fdd663]" />
              </button>
              <button
                onClick={() => addReaction('gift')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <Gift size={15} className="text-[#f28b82]" />
              </button>
              <button
                onClick={() => addReaction('clap')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <ThumbsUp size={15} className="text-[#8ab4f8]" />
              </button>
              <button
                onClick={() => addReaction('sparkle')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <Sparkles size={15} className="text-[#d7aefb]" />
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[#3c4043]" />

        {session?.status === 'paused' ? (
          <button
            onClick={handleResumeSession}
            disabled={resumingSession}
            className="p-2 rounded-xl bg-[#81c995]/80 text-white hover:bg-[#81c995]/90 transition backdrop-blur-sm disabled:opacity-60 flex items-center gap-1"
          >
            <Play size={14} />
            Lanjut
          </button>
        ) : (
          <button
            onClick={() => setShowSessionActionModal(true)}
            className="p-2 rounded-xl bg-[#ea4335]/80 text-white hover:bg-[#ea4335]/90 transition backdrop-blur-sm"
          >
            <PhoneOff size={17} />
          </button>
        )}
      </div>

      {/* Participants Modal - Google Meet Dark Style */}
      {showParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/70">
          <div className="w-full max-w-sm rounded-2xl bg-[#303134] border border-[#3c4043] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#e8eaed] flex items-center gap-2">
                <Users size={20} className="text-[#81c995]" />
                Peserta
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-[#9aa0a6] hover:text-[#e8eaed]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {user && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-[#3c4043]">
                  <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#e8eaed]">{user.name} (Anda)</div>
                    <div className="text-xs text-[#9aa0a6]">Tutor</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mic size={14} className={micOn ? 'text-[#81c995]' : 'text-[#ea4335]'} />
                    <Camera size={14} className={camOn ? 'text-[#8ab4f8]' : 'text-[#ea4335]'} />
                  </div>
                </div>
              )}
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#3c4043]">
                  <div className="w-8 h-8 rounded-full bg-[#5f6368] flex items-center justify-center text-white font-semibold text-sm">
                    {participant.name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#e8eaed]">{participant.name || "Siswa"}</div>
                    <div className="text-xs text-[#9aa0a6]">
                      {participant.pretestCompleted
                        ? `Pretest ${participant.pretestScore ?? 0}/${participant.pretestTotalQuestions ?? 0}`
                        : "Belum menyelesaikan pretest"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mic size={14} className={participant.isAudioOn ? 'text-[#81c995]' : 'text-[#ea4335]'} />
                    <Camera size={14} className={participant.isVideoOn ? 'text-[#8ab4f8]' : 'text-[#ea4335]'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Google Meet Dark Style */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/70">
          <div className="w-full max-w-sm rounded-2xl bg-[#303134] border border-[#3c4043] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#e8eaed] flex items-center gap-2">
                <Settings size={20} className="text-[#9aa0a6]" />
                Pengaturan
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#9aa0a6] hover:text-[#e8eaed]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#3c4043]">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-[#8ab4f8]" />
                  <span className="text-sm text-[#e8eaed]">Kamera</span>
                </div>
                <button
                  onClick={toggleCam}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    camOn ? 'bg-[#81c995] text-[#202124]' : 'bg-[#ea4335] text-white'
                  }`}
                >
                  {camOn ? 'Aktif' : 'Mati'}
                </button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#3c4043]">
                <div className="flex items-center gap-2">
                  <Mic size={16} className="text-[#81c995]" />
                  <span className="text-sm text-[#e8eaed]">Mikrofon</span>
                </div>
                <button
                  onClick={toggleMic}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    micOn ? 'bg-[#81c995] text-[#202124]' : 'bg-[#ea4335] text-white'
                  }`}
                >
                  {micOn ? 'Aktif' : 'Mati'}
                </button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#3c4043]">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-[#d7aefb]" />
                  <span className="text-sm text-[#e8eaed]">Bagikan Layar</span>
                </div>
                <button
                  onClick={toggleScreenShare}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    screenSharing ? 'bg-[#d7aefb] text-[#202124]' : 'bg-[#3c4043] text-[#9aa0a6]'
                  }`}
                >
                  {screenSharing ? 'Aktif' : 'Mati'}
                </button>
              </div>
              <div className="rounded-lg bg-[#3c4043] p-2 space-y-2 text-sm text-[#e8eaed]">
                <div className="flex items-center justify-between">
                  <span>Noise Suppression</span>
                  <button onClick={() => setDeviceSettings((prev) => ({ ...prev, noiseSuppression: !prev.noiseSuppression }))} className={`rounded-full px-2 py-1 text-[11px] ${deviceSettings.noiseSuppression ? 'bg-[#81c995] text-[#202124]' : 'bg-[#5f6368] text-[#9aa0a6]'}`}>
                    {deviceSettings.noiseSuppression ? 'Aktif' : 'Mati'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Echo Cancellation</span>
                  <button onClick={() => setDeviceSettings((prev) => ({ ...prev, echoCancellation: !prev.echoCancellation }))} className={`rounded-full px-2 py-1 text-[11px] ${deviceSettings.echoCancellation ? 'bg-[#81c995] text-[#202124]' : 'bg-[#5f6368] text-[#9aa0a6]'}`}>
                    {deviceSettings.echoCancellation ? 'Aktif' : 'Mati'}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Resolusi</span>
                  <select value={deviceSettings.resolution} onChange={(event) => setDeviceSettings((prev) => ({ ...prev, resolution: event.target.value }))} className="rounded-lg border border-[#3c4043] bg-[#202124] px-2 py-1 text-xs outline-none text-[#e8eaed]">
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Action Modal - Google Meet Dark Style */}
      {showSessionActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/70">
          <div className="w-full max-w-xl rounded-2xl bg-[#303134] border border-[#3c4043] p-6 text-center shadow-2xl">
            <h2 className="text-xl font-semibold text-[#e8eaed] mb-2">Pilih Tindakan</h2>
            <p className="text-sm text-[#9aa0a6] mb-5">
              Jeda atau akhiri sesi live class.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handlePauseSession}
                disabled={pausingSession || session?.status === 'paused'}
                className="rounded-xl bg-[#3c4043] px-5 py-2.5 text-sm font-semibold text-[#e8eaed] hover:bg-[#4a4d52] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Pause size={16} />
                Jeda Sesi
              </button>
              <button
                onClick={handleEndClass}
                disabled={ending}
                className="rounded-xl bg-[#ea4335] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ea4335]/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PhoneOff size={16} />
                Akhiri Sesi
              </button>
            </div>
            <button
              onClick={() => setShowSessionActionModal(false)}
              className="mt-4 text-sm text-[#9aa0a6] hover:text-[#e8eaed]"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="pointer-events-none absolute right-4 top-16 z-[70] flex flex-col gap-2">
          {notifications.map((item) => (
            <div key={item.id} className={`rounded-xl border px-3 py-2 text-sm backdrop-blur ${item.type === "warning" ? "border-[#fdd663]/30 bg-[#fdd663]/15 text-[#fdd663]" : item.type === "success" ? "border-[#81c995]/30 bg-[#81c995]/15 text-[#81c995]" : "border-[#8ab4f8]/30 bg-[#8ab4f8]/15 text-[#8ab4f8]"}`}>
              {item.message}
            </div>
          ))}
        </div>
      )}

      {showNotesPanel && (
        <div
          className="fixed z-[60] w-[360px] bg-[#f8e49f] shadow-[0_35px_90px_-40px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out"
          style={{ left: `${notePosition.x}px`, top: `${notePosition.y}px` }}
        >
          <div
            className="flex items-center justify-between bg-[#e5d06e] px-4 py-3 cursor-grab"
            onMouseDown={handleNoteMouseDown}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#3b3212]">
              <FileText size={16} className="text-[#6e5f2e]" />
              <span>Notes</span>
            </div>
            <X
              size={18}
              onClick={() => setShowNotesPanel(false)}
              className="cursor-pointer text-[#3d3a1d] transition hover:text-[#1f1a0a]"
            />
          </div>

          <div className="min-h-[240px] bg-[#fff8c2] px-4 py-4 text-sm text-[#3d3a1d] shadow-inner shadow-[#d6c26f]/20">
            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              rows={10}
              placeholder="tidak ada catatan"
              className="h-full w-full resize-none bg-transparent p-0 text-sm leading-6 text-[#3d3a1d] outline-none placeholder:text-[#8d7b3b]"
            />
          </div>
        </div>
      )}


      {/* Reactions Display */}
      {reactions.length > 0 && (
        <div className="bg-[#202124] border-t border-[#3c4043] px-4 py-1 flex items-center justify-center gap-2 flex-shrink-0 flex-wrap min-h-[36px]">
          {reactions.map((reaction, index) => (
            <span
              key={`${reaction}-${index}`}
              className="rounded-full border border-[#3c4043] bg-[#303134] px-2.5 py-0.5 text-xs text-[#e8eaed] animate-pulse flex items-center gap-1"
            >
              {reaction === 'raise-hand' && <Hand size={12} className="text-[#fdd663]" />}
              {reaction === 'gift' && <Gift size={12} className="text-[#f28b82]" />}
              {reaction === 'clap' && <ThumbsUp size={12} className="text-[#8ab4f8]" />}
              {reaction === 'sparkle' && <Sparkles size={12} className="text-[#d7aefb]" />}
              {reaction === 'raise-hand' && ' Raise'}
              {reaction === 'gift' && ' Gift'}
              {reaction === 'clap' && ' Clap'}
              {reaction === 'sparkle' && ' Sparkle'}
            </span>
          ))}
        </div>
      )}

      {/* Whiteboard Popup - Google Meet Dark Style */}
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
          <div className={`bg-[#303134] border border-[#3c4043] rounded-lg overflow-hidden shadow-2xl ${getWhiteboardSizeClass()}`}>
            <div 
              className="flex items-center justify-between px-3 py-1.5 bg-[#3c4043] border-b border-[#5f6368] cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-[#9aa0a6]" />
                <PenTool size={14} className="text-[#fdd663]" />
                <span className="text-sm font-medium text-[#e8eaed]">Whiteboard</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWhiteboardSize("small")}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${whiteboardSize === "small" ? 'bg-[#1a73e8] text-white' : 'text-[#9aa0a6] hover:bg-[#4a4d52]'}`}
                >
                  Kecil
                </button>
                <button
                  onClick={() => setWhiteboardSize("medium")}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${whiteboardSize === "medium" ? 'bg-[#1a73e8] text-white' : 'text-[#9aa0a6] hover:bg-[#4a4d52]'}`}
                >
                  Sedang
                </button>
                <button
                  onClick={() => setWhiteboardSize("large")}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${whiteboardSize === "large" ? 'bg-[#1a73e8] text-white' : 'text-[#9aa0a6] hover:bg-[#4a4d52]'}`}
                >
                  Besar
                </button>
                <div className="w-px h-4 bg-[#5f6368]" />
                <button
                  onClick={() => setShowWhiteboard(false)}
                  className="text-[#9aa0a6] hover:text-[#e8eaed] p-0.5"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3c4043] border-b border-[#5f6368] flex-wrap">
              <button
                onClick={() => setTool("pen")}
                className={`p-1 rounded transition-colors ${tool === "pen" ? 'bg-[#1a73e8] text-white' : 'text-[#9aa0a6] hover:bg-[#4a4d52]'}`}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={`p-1 rounded transition-colors ${tool === "eraser" ? 'bg-[#1a73e8] text-white' : 'text-[#9aa0a6] hover:bg-[#4a4d52]'}`}
              >
                <Eraser size={14} />
              </button>
              <div className="w-px h-5 bg-[#5f6368]" />
              <label className="flex items-center gap-1 text-xs text-[#9aa0a6]">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(event) => setLineColor(event.target.value)}
                  className="h-5 w-5 border border-[#5f6368] p-0 rounded cursor-pointer bg-transparent"
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-[#9aa0a6]">
                <span className="text-[9px]">Tebal</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lineWidth}
                  onChange={(event) => setLineWidth(Number(event.target.value))}
                  className="w-12 accent-[#1a73e8]"
                />
              </label>
              <button
                onClick={clearWhiteboard}
                className="ml-auto text-xs text-[#9aa0a6] hover:text-[#ea4335] flex items-center gap-0.5"
              >
                <Trash2 size={12} /> Bersihkan
              </button>
            </div>

            <div className="bg-[#202124]" style={{ height: "calc(100% - 80px)" }}>
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

      {/* Upload materi modal removed per request */}

      {showEndClassReviewModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#202124]/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#3c4043] bg-[#303134] p-5 shadow-2xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#e8eaed]"><BadgeCheck size={15} className="text-[#81c995]" /> Review Kelas</div>
            <div className="space-y-3 text-sm text-[#e8eaed]">
              <input value={endClassReview.grade} onChange={(event) => setEndClassReview((prev) => ({ ...prev, grade: event.target.value }))} placeholder="Nilai" className="w-full rounded-lg border border-[#3c4043] bg-[#202124] px-3 py-2 outline-none text-[#e8eaed] placeholder:text-[#9aa0a6]" />
              <textarea value={endClassReview.comment} onChange={(event) => setEndClassReview((prev) => ({ ...prev, comment: event.target.value }))} placeholder="Komentar" rows={3} className="w-full rounded-lg border border-[#3c4043] bg-[#202124] px-3 py-2 outline-none text-[#e8eaed] placeholder:text-[#9aa0a6]" />
              <input value={endClassReview.pr} onChange={(event) => setEndClassReview((prev) => ({ ...prev, pr: event.target.value }))} placeholder="PR" className="w-full rounded-lg border border-[#3c4043] bg-[#202124] px-3 py-2 outline-none text-[#e8eaed] placeholder:text-[#9aa0a6]" />
              <input value={endClassReview.status} onChange={(event) => setEndClassReview((prev) => ({ ...prev, status: event.target.value }))} placeholder="Status selesai" className="w-full rounded-lg border border-[#3c4043] bg-[#202124] px-3 py-2 outline-none text-[#e8eaed] placeholder:text-[#9aa0a6]" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowEndClassReviewModal(false)} className="rounded-lg bg-[#3c4043] px-3 py-2 text-sm text-[#e8eaed]">Tutup</button>
              <button onClick={handleSaveEndClassReview} className="rounded-lg bg-[#81c995] px-3 py-2 text-sm font-semibold text-[#202124]">Simpan review</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Bottom Sheet - Mobile Dark */}
      {showChatPopup && isMobile && (
        <div className="fixed inset-0 z-50 bg-[#202124]/70">
          <div className="absolute inset-0" onClick={() => setShowChatPopup(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#303134] rounded-t-2xl shadow-2xl overflow-hidden border-t border-[#3c4043]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3c4043]">
              <h3 className="text-[#e8eaed] font-medium flex items-center gap-2">
                <MessageCircle size={18} className="text-[#8ab4f8]" />
                Room Chat
              </h3>
              <button
                onClick={() => setShowChatPopup(false)}
                className="text-[#9aa0a6] hover:text-[#e8eaed]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(85vh-50px)] overflow-hidden">
              <LiveChat bookingId={bookingId} onClose={() => setShowChatPopup(false)} apiFetch={adminApiFetch} currentUserId={user?.id} currentUserRole={user?.role} isMobile={true} isBlocked={chatBlocked} blockedMessage={chatBlocked ? 'Chat sedang diblokir oleh tutor.' : undefined} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
