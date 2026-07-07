// frontend/src/app/mahasiswa/LiveClassPage.tsx
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import React from 'react';
import { useTranslation } from "react-i18next";
import {
  Pencil,
  Eraser,
  Type,
  Square,
  Trash2,
  Clock,
  Mic,
  Camera,
  Maximize2,
  Send,
  X,
  MicOff,
  VideoOff,
  Monitor,
  MoreVertical,
  Hand,
  Gift,
  Sparkles,
  ThumbsUp,
  Bell,
  Eye,
  EyeOff,
  Users,
  Settings,
  PhoneOff,
  MessageCircle,
  User,
  Shuffle,
  Shrink,
  ChevronLeft,
} from "lucide-react";
import AvatarFallback from '../shared/AvatarFallback';
import { alertError, alertInfo, alertSuccess, toastSuccess, toastError } from "../lib/swal";
import { getEcho, getSocketId } from "../lib/echo";
import { WebRTCManager, type RemotePeer } from "../lib/webrtc";
import {
  createSignalChunks,
  normalizeReceivedChunkedSignal,
  shouldChunkSignal,
  type WebRTCSignalPayload,
  type ChunkedSignalPayload,
} from "../lib/webrtcSignal";
import {
  PresenceChannelManager,
  type ParticipantPresence,
} from "../lib/presence";
import LiveChat from "../admin/components/LiveChat";
import RatingTutorPage from "./RatingTutorPage";

type Page =
  | "landing"
  | "cari-tutor"
  | "detail-tutor"
  | "booking"
  | "live-class"
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

type LiveClassPageProps = {
  navigate: (p: Page) => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  user: { id?: number; role?: string; name?: string } | null;
  bookingId: string | null;
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

export function LiveClassPage({
  navigate,
  apiFetch,
  user,
  bookingId,
}: LiveClassPageProps) {
  const [activeTool, setActiveTool] = useState("pen");
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [ending, setEnding] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenVideoReady, setScreenVideoReady] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showWhiteboardSettings, setShowWhiteboardSettings] =
    useState(true);
  const [whiteboardSize, setWhiteboardSize] = useState<
    "small" | "medium" | "large"
  >("medium");
  const [whiteboardPosition, setWhiteboardPosition] = useState({
    x: 120,
    y: 120,
  });
  const [whiteboardDragging, setWhiteboardDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [reactionOverlay, setReactionOverlay] = useState<React.ReactNode | null>(
    null,
  );
  const [drawing, setDrawing] = useState(false);
  const [isMutedByTutor, setIsMutedByTutor] = useState(false);
  const [isChatBlocked, setIsChatBlocked] = useState(false);
  const [isScreenShareAllowed, setIsScreenShareAllowed] = useState(true);
  const [isKicked, setIsKicked] = useState(false);
  const drawingRef = useRef(false);
  const [lineWidth, setLineWidth] = useState(2);
  const [penColor, setPenColor] = useState("#60a5fa");
  const [eraserSize, setEraserSize] = useState(12);
  const [textInput, setTextInput] = useState("");
  const [shapeMode, setShapeMode] = useState<"rect" | "circle">("rect");
  const [shapeStart, setShapeStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isVideoSwapped, setIsVideoSwapped] = useState(false);
  const [isLandscapeRequired, setIsLandscapeRequired] = useState(false);

  // ── FIX 1: State hasJoined persisten via localStorage ──────────────────────
  const [hasJoined, setHasJoined] = useState<boolean>(() => {
    if (!bookingId) return false;
    return localStorage.getItem(`tutorku_joined_${bookingId}`) === "true";
  });

  // WebRTC & Presence State
  const [participants, setParticipants] = useState<ParticipantPresence[]>(
    [],
  );
  const participantsRef = useRef<ParticipantPresence[]>([]);
  const presenceManagerRef = useRef<PresenceChannelManager | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Map<number, MediaStream>
  >(new Map());

  const normalizeParticipants = (items: ParticipantPresence[]) =>
    Array.from(
      new Map(
        items.map((participant) => [
          Number(participant.id),
          { ...participant, id: Number(participant.id) },
        ]),
      ).values(),
    ).filter((participant) => Number(participant.id) !== Number(user?.id));

  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(null);
  const [presenceManager, setPresenceManager] =
    useState<PresenceChannelManager | null>(null);
  const [connectionErrors, setConnectionErrors] = useState<string[]>([]);
  const signalChunksRef = useRef<Map<string, string[]>>(new Map());
  const [webRtcDebugDump, setWebRtcDebugDump] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [alerted20Min, setAlerted20Min] = useState(false);
  const [alerted10Min, setAlerted10Min] = useState(false);
  const [alerted5Sec, setAlerted5Sec] = useState(false);
  const [hasCountdownEnded, setHasCountdownEnded] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [pretestAccessAllowed, setPretestAccessAllowed] = useState<boolean>(true);
  const signalProcessingQueue = useRef<Map<number, Promise<void>>>(new Map());
  const { t } = useTranslation();

  useEffect(() => {
    if (!bookingId) return;
    const pretestKey = `tutorku_pretest_completed_${bookingId}`;
    const pretestCompleted = localStorage.getItem(pretestKey) === "1";
    if (!pretestCompleted) {
      setPretestAccessAllowed(false);
      window.location.hash = `#/pretest?booking_id=${bookingId}`;
    }
  }, [bookingId]);

  // ── DETEKSI LANDSCAPE UNTUK MOBILE ──────────────────────────────────────────
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      // Jika mobile dan portrait, minta landscape
      if (isMobile && !isLandscape && session?.status === "ongoing") {
        setIsLandscapeRequired(true);
      } else {
        setIsLandscapeRequired(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [session?.status]);

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

  const handleEndSession = async () => {
    if (!bookingId) return;
    setEnding(true);
    try {
      presenceManager?.sendPresenceEvent("UserLeftCall");
      const result = await apiFetch(`/bookings/${bookingId}/live-session/end`, {
        method: "POST",
      });
      setSession(result.data ?? result);
      setBooking((prev: any) => (prev ? { ...prev, status: 'completed' } : prev));
      localStorage.removeItem(`tutorku_joined_${bookingId}`);
      setHasJoined(false);
      alertSuccess(t("liveClass.alert.endSuccess"));
      setShowRatingPopup(true);
    } catch (error) {
      console.error(t("liveClass.alert.endFailed"), error);
    } finally {
      setEnding(false);
    }
  };

  useEffect(() => {
    if (!isCountdownRunning || countdownSeconds === null) return;
    if (countdownSeconds === 1200 && !alerted20Min) {
      alertInfo(t("liveClass.alerts.sessionEndsIn20Minutes"));
      setAlerted20Min(true);
    }
    if (countdownSeconds === 600 && !alerted10Min) {
      alertInfo(t("liveClass.alerts.sessionEndsIn10Minutes"));
      setAlerted10Min(true);
    }
    if (countdownSeconds <= 5 && !alerted5Sec) {
      alertInfo(t("liveClass.alerts.sessionEndsIn5Seconds"));
      setAlerted5Sec(true);
    }
  }, [countdownSeconds, alerted10Min, alerted20Min, alerted5Sec, isCountdownRunning, t]);

  useEffect(() => {
    if (!bookingId || !session || session.status !== "ended") return;
    if (showRatingPopup || reviewSubmitted) return;
    if (user?.role !== "siswa") return;

    const ratingShownKey = `tutorku_rating_shown_${bookingId}`;
    if (localStorage.getItem(ratingShownKey) === "true") return;

    setShowRatingPopup(true);
  }, [bookingId, reviewSubmitted, session?.status, showRatingPopup, user?.role]);

  useEffect(() => {
    if (!isCountdownRunning || countdownSeconds === null) return;
    if (countdownSeconds <= 0) {
      setIsCountdownRunning(false);
      setHasCountdownEnded(true);
      handleEndSession();
      return;
    }

    const timer = window.setInterval(() => {
      setCountdownSeconds((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdownSeconds, isCountdownRunning, t, navigate, handleEndSession]);

  useEffect(() => {
    if (session?.status !== "ended" || !bookingId || showRatingPopup) return;

    localStorage.removeItem(`tutorku_joined_${bookingId}`);
    setHasJoined(false);

    const timeout = window.setTimeout(() => {
      console.log('[LiveClass] Session ended, navigating to dashboard-siswa');
      navigate("dashboard-siswa");
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [session?.status, bookingId, navigate, showRatingPopup]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const getParticipantById = (userId: number) => {
    const participant = participantsRef.current.find((item) => item.id === userId);
    if (participant) return participant;
    return presenceManagerRef.current?.getParticipant(userId);
  };

  const enqueueSignal = (remoteUserId: number, task: () => Promise<void>) => {
    const queue = signalProcessingQueue.current;
    const previous = queue.get(remoteUserId) ?? Promise.resolve();
    const next = previous
      .then(() => task())
      .catch((error) => {
        console.error('[LiveClass] Signal queue error', { remoteUserId, error });
      })
      .finally(() => {
        if (queue.get(remoteUserId) === next) {
          queue.delete(remoteUserId);
        }
      });
    queue.set(remoteUserId, next);
    return next;
  };

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainRemoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const whiteboardContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const remoteVideoRefs = useRef<Map<number, HTMLVideoElement | null>>(new Map());
  const remoteAudioRefs = useRef<Map<number, HTMLAudioElement | null>>(new Map());

  const isScreenTrack = (track: MediaStreamTrack) => {
    const label = track.label.toLowerCase();
    if (/screen|window|display|shared/.test(label)) return true;
    try {
      const settings = track.getSettings() as { displaySurface?: string | null };
      return Boolean(settings?.displaySurface);
    } catch {
      return false;
    }
  };

  const createPreferredVideoStream = (stream: MediaStream): MediaStream | null => {
    const activeVideoTracks = stream
      .getVideoTracks()
      .filter((track) => track.readyState !== 'ended');
    if (activeVideoTracks.length === 0) {
      return null;
    }

    const screenTrack = activeVideoTracks.find((track) => isScreenTrack(track));
    const preferredTrack = activeVideoTracks.find((track) => track !== screenTrack) ?? activeVideoTracks[0];
    return new MediaStream([preferredTrack]);
  };

  const createCameraVideoStream = (stream: MediaStream): MediaStream | null => {
    const cameraTracks = stream
      .getVideoTracks()
      .filter((track) => track.readyState !== 'ended' && track.enabled && !isScreenTrack(track));
    if (cameraTracks.length === 0) {
      return null;
    }
    return new MediaStream([cameraTracks[0]]);
  };

  const attachRemoteStream = (userId: number, stream: MediaStream) => {
    const trackKinds = stream.getTracks().map((track) => track.kind);
    console.log('[LiveClass] attachRemoteStream', {
      userId,
      trackKinds,
      streamId: stream.id,
      audioTrackIds: stream.getAudioTracks().map((track) => track.id),
      videoTrackIds: stream.getVideoTracks().map((track) => track.id),
    });

    const videoEl = remoteVideoRefs.current.get(userId);
    const videoStream = createPreferredVideoStream(stream) ?? stream;
    if (videoEl) {
      if (videoEl.srcObject !== videoStream) {
        console.log('[LiveClass] Binding remote stream to video element', {
          userId,
          currentSrcObject: videoEl.srcObject ? (videoEl.srcObject as MediaStream).id : null,
          newStreamId: videoStream.id,
          originalRemoteStreamId: stream.id,
        });
        videoEl.srcObject = videoStream;
      }

      videoEl.muted = true;
      if (typeof videoEl.load === 'function') {
        try {
          videoEl.load();
        } catch (error) {
          console.warn('[LiveClass] Unable to load remote video element', { userId, error });
        }
      }
      videoEl.play().catch((error) =>
        console.warn('[LiveClass] Failed to play remote video', { userId, error }),
      );
    }

    const audioEl = remoteAudioRefs.current.get(userId);
    if (audioEl) {
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      audioEl.muted = false;
      audioEl.volume = 1;
      if (typeof audioEl.load === 'function') {
        try {
          audioEl.load();
        } catch (error) {
          console.warn('[LiveClass] Unable to load remote audio element', { userId, error });
        }
      }
      audioEl
        .play()
        .then(() => console.log('[LiveClass] remote audio playing', { userId }))
        .catch((error) =>
          console.warn('[LiveClass] Failed to play remote audio', { userId, error }),
        );
    }
  };

  const screenShareParticipant = useMemo(
    () => participants.find((participant) => participant.isScreenSharing),
    [participants],
  );

  const remoteScreenShareStream = useMemo(() => {
    return screenShareParticipant
      ? remoteStreams.get(screenShareParticipant.id) ?? null
      : null;
  }, [screenShareParticipant, remoteStreams]);

  const isRemoteScreenSharing = Boolean(remoteScreenShareStream);

  const remoteScreenShareHasVideo = useMemo(
    () =>
      Boolean(
        remoteScreenShareStream?.getVideoTracks().some((track) => {
          if (track.readyState === "ended") return false;
          if (!track.enabled) return false;
          const label = track.label.toLowerCase();
          return !/screen|window|display|shared/.test(label);
        }),
      ),
    [remoteScreenShareStream],
  );

  const toggleFullScreen = async () => {
    const container = whiteboardContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
        setIsFullScreen(true);
      } catch (error) {
        console.error('Failed to enter fullscreen', error);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error('Failed to exit fullscreen', error);
      }
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
    };
  }, []);

  useLayoutEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      attachRemoteStream(userId, stream);
    });
  }, [remoteStreams]);

  useEffect(() => {
    if (remoteStreams.size === 0) return;

    participants.forEach((participant) => {
      const stream = remoteStreams.get(participant.id);
      if (stream) {
        attachRemoteStream(participant.id, stream);
      }
    });
  }, [participants, remoteStreams]);

  const tools = [
    { id: "pen", icon: <Pencil size={16} />, label: t("liveClass.tools.pen") },
    {
      id: "eraser",
      icon: <Eraser size={16} />,
      label: t("liveClass.tools.eraser"),
    },
    { id: "text", icon: <Type size={16} />, label: t("liveClass.tools.text") },
    {
      id: "shape",
      icon: <Square size={16} />,
      label: t("liveClass.tools.shape"),
    },
  ];

  useEffect(() => {
    if (!bookingId) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/bookings/${bookingId}`);
        const bookingData = data.data ?? data;
        if (active) {
          setBooking(bookingData);
          setSession(bookingData.live_session ?? null);
          if (!bookingData.live_session) {
            const sessionData = await apiFetch(
              `/bookings/${bookingId}/live-session`,
            );
            if (active) setSession(sessionData.data ?? sessionData);
          }
        }
      } catch (error) {
        console.error(t("liveClass.error.loadFailed"), error);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId || !session) return;
    const alreadyJoined = localStorage.getItem(`tutorku_joined_${bookingId}`) === "true";

    if (session.status === "ongoing" && alreadyJoined && !hasJoined) {
      setHasJoined(true);
    }

    if (session.status === "ended") {
      localStorage.removeItem(`tutorku_joined_${bookingId}`);
      setHasJoined(false);
    }
  }, [session?.status, bookingId, hasJoined]);

  useEffect(() => {
    if (!bookingId) return;

    const token = localStorage.getItem("TUTORKU_token");
    const echo = getEcho(token);

    const channel = echo.private(`booking.${bookingId}`);
    const listener = (data: any) => {
      console.log("[LiveClass] Session started notification:", data);
      if (data.session?.status === "ongoing") {
        setSession(data.session);

        const tutorName =
          booking?.tutor?.name ?? t("liveClass.fallbackTutor");
        const message = t("liveClass.notifications.sessionStartedMessage", {
          tutor: tutorName,
        });
        const title = t("liveClass.notifications.sessionLiveStartedTitle");

        if (notificationGranted && "Notification" in window) {
          try {
            const notification = new Notification(title, {
              body: message,
              icon: "/TUTORKU-logo.png",
            });
            setTimeout(() => notification.close(), 5000);
          } catch (err) {
            alertInfo(title, message);
          }
        } else {
          alertInfo(title, message);
        }
      }
    };

    channel.listen(".session.started", listener);

    return () => {
      channel.stopListening(".session.started");
      echo.leaveChannel(`booking.${bookingId}`);
    };
  }, [bookingId, booking?.tutor?.name, notificationGranted]);

  // Setup WebRTC and Presence when session starts
  useEffect(() => {
    if (!session || session.status !== "ongoing" || !bookingId || !user?.id || !hasJoined) {
      return;
    }

    const currentUserId = user.id;
    let isActive = true;
    const setupWebRTC = async () => {
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
          console.warn('[LiveClass] No TURN server configured. Adding public fallback TURN servers.');
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

        console.log('[LiveClass] ICE servers configured', iceServers);

        wrtcManager = new WebRTCManager({
          iceServers,
          signalingChannel: echo,
          userId: currentUserId,
          roomId: session.room_id,
          onRemoteStream: (userId, stream) => {
            if (!isActive) return;
            console.log("[LiveClass] Remote stream received from", userId);
            setRemoteStreams((prev) => new Map(prev).set(userId, stream));
            const videoEl = remoteVideoRefs.current.get(userId);
            if (videoEl) {
              attachRemoteStream(userId, stream);
            }
          },
          onRemoteStreamRemoved: (userId) => {
            if (!isActive) return;
            console.log("[LiveClass] Remote stream removed from", userId);
            setRemoteStreams((prev) => {
              const next = new Map(prev);
              next.delete(userId);
              return next;
            });
          },
          onSignal: (signal) => {
            if (!isActive) return;
            const payloads = shouldChunkSignal(signal)
              ? createSignalChunks(signal)
              : [signal];

            const socketId = getSocketId(echo);
            payloads.forEach((chunk) => {
              console.log("[LiveClass] Sending WebRTC signal", chunk.type, {
                isChunk: chunk.type === 'chunked-signal',
                chunkInfo: chunk.type === 'chunked-signal' ? chunk.payload : undefined,
                socketId,
              });
              apiFetch(`/bookings/${bookingId}/live-session/signal`, {
                method: "POST",
                headers: socketId ? { "X-Socket-Id": socketId } : undefined,
                body: JSON.stringify({
                  type: chunk.type,
                  payload: chunk.payload,
                }),
              }).catch((err) => {
                console.error("[LiveClass] Failed to send signal", err);
              });
            });
          },
          onConnectionStateChange: (userId, state) => {
            if (!isActive) return;
            console.log("[LiveClass] Peer connection state changed", {
              userId,
              state,
            });
          },
          onError: (error) => {
            if (!isActive) return;
            console.error("[LiveClass] WebRTC error", error);
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
        } else {
          console.log('[LiveClass] No local stream yet, requesting media before join');
          const requestedStream = await requestLocalMedia({ video: true, audio: true });
          if (!requestedStream) {
            throw new Error(t("liveClass.error.mediaLoadFailed"));
          }
          wrtcManager.setLocalStream(requestedStream);
        }

        presenceManager = new PresenceChannelManager({
          echo,
          bookingId,
          roomId: session.room_id,
          userId: currentUserId,
          userName: user.name || "User",
          usePolling: false, // use realtime Reverb/echo so we receive whisper events (webrtc.signal/presence updates)
          pollIntervalMs: 1500, // Poll every 1.5 seconds
          apiBaseUrl: '/api',
          onParticipantsReceived: async (participants) => {
            if (!isActive) return;
            console.log("[LiveClass] Participants received", {
              count: participants.length,
            });

            const normalizedParticipants = normalizeParticipants(participants);
            setParticipants(normalizedParticipants);

            for (const participant of normalizedParticipants) {
              try {
                if (wrtcManager!.getPeers().some((peer) => peer.userId === participant.id)) {
                  continue;
                }

                const isInitiator = currentUserId > participant.id;
                await wrtcManager!.createPeerConnection(
                  participant.id,
                  participant.name,
                  isInitiator,
                );

                if (isInitiator) {
                  await wrtcManager!.createAndSendOffer(participant.id);
                }
              } catch (error) {
                console.error("[LiveClass] Failed to setup peer", error);
              }
            }
          },
          onMemberJoined: (member) => {
            if (!isActive) return;
            if (Number(member.id) === currentUserId) return;
            if (wrtcManager!.getPeers().some((peer) => peer.userId === Number(member.id))) {
              console.log("[LiveClass] Member already has peer connection", member.id);
              return;
            }
            console.log("[LiveClass] Member joined", member);
            setParticipants((prev) =>
              normalizeParticipants([
                ...prev.filter((p) => Number(p.id) !== currentUserId),
                member,
              ]),
            );

            wrtcManager!
              .createPeerConnection(
                member.id,
                member.name,
                currentUserId > member.id,
              )
              .then(() => {
                if (currentUserId > member.id) {
                  return wrtcManager!.createAndSendOffer(member.id);
                }
              })
              .catch((error) => {
                console.error("[LiveClass] Failed to setup new peer", error);
              });
          },
          onMemberLeft: (memberId) => {
            if (!isActive) return;
            console.log("[LiveClass] Member left", memberId);
            setParticipants((prev) => prev.filter((p) => p.id !== memberId));
            wrtcManager?.closePeer(memberId);
          },
          onMemberUpdated: (member) => {
            if (!isActive) return;
            if (Number(member.id) === currentUserId) return;
            setParticipants((prev) =>
              normalizeParticipants([
                ...prev.filter((participant) => Number(participant.id) !== currentUserId && Number(participant.id) !== Number(member.id)),
                member,
              ]),
            );
          },
          onPresenceEvent: async (member, event) => {
            if (!isActive) return;
            if (Number(member.id) === currentUserId) return;
            setParticipants((prev) =>
              normalizeParticipants([
                ...prev.filter((participant) => Number(participant.id) !== currentUserId && Number(participant.id) !== Number(member.id)),
                member,
              ]),
            );

            try {
              const started = event === 'UserScreenShareStarted' || member.isScreenSharing;
              if (started && webrtcManager) {
                const existingPeer = webrtcManager.getPeers().find((p) => p.userId === member.id);
                if (!existingPeer) {
                  await webrtcManager.createPeerConnection(member.id, member.name, (user?.id ?? 0) > member.id);
                  console.log('[LiveClass] Created peer connection proactively for incoming screen-share', { userId: member.id });
                }

                const peer = webrtcManager.getPeers().find((p) => p.userId === member.id);
                if (peer) {
                  const hasVideoTransceiver = peer.connection.getTransceivers().some((t) => t.receiver?.track?.kind === 'video');
                  if (!hasVideoTransceiver) {
                    try {
                      peer.connection.addTransceiver('video', { direction: 'recvonly' });
                      console.log('[LiveClass] Added proactive recvonly video transceiver for', { userId: member.id });
                    } catch (err) {
                      console.warn('[LiveClass] Failed to add proactive recvonly transceiver', { userId: member.id, err });
                    }
                  } else {
                    try {
                      peer.connection.getTransceivers().forEach((t) => {
                        if (t.receiver?.track?.kind === 'video') {
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          t.direction = 'recvonly';
                        }
                      });
                      console.log('[LiveClass] Ensured existing video transceivers set to recvonly for', { userId: member.id });
                    } catch (err) {
                      console.warn('[LiveClass] Failed to set transceiver directions', { userId: member.id, err });
                    }
                  }
                }
              }
            } catch (err) {
              console.error('[LiveClass] Error handling proactive screen-share preparation', err);
            }
          },
          onWebRtcSignal: (data: any) => {
            if (!isActive) return;
            console.log('[LiveClass] Received .webrtc.signal', data);
            enqueueSignal(data.from_user_id, async () => {
              await handleWebRTCSignal(data, wrtcManager!);
            });
          },
          onCommandReceived: handleTutorCommand,
          onError: (error) => {
            if (!isActive) return;
            console.error("[LiveClass] Presence error", error);
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
            isAudioOn: !isMuted,
            isVideoOn: !isVideoOff,
            isScreenSharing: screenSharing,
          },
          "UserJoinedCall",
        );

        setPresenceManager(presenceManager);
        presenceManagerRef.current = presenceManager;

      } catch (error) {
        if (isActive) {
          console.error("[LiveClass] Failed to setup WebRTC/Presence", error);
          setConnectionErrors((prev) => [...prev, (error as Error).message]);
        }
      }

      return () => {
        isActive = false;
        presenceManagerRef.current = null;
        if (presenceManager) {
          presenceManager.sendPresenceEvent("UserLeftCall");
          presenceManager.destroy();
        }
        if (wrtcManager) {
          wrtcManager.destroy();
        }
      };
    };

    setupWebRTC();
  }, [session?.status, session?.room_id, bookingId, user?.id, hasJoined]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setNotificationGranted(true);
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        setNotificationGranted(permission === "granted");
      });
    }
  }, []);

  const requestLocalMedia = async (
    constraints: MediaStreamConstraints,
  ): Promise<MediaStream | null> => {
    try {
      const stream = webrtcManager
        ? await webrtcManager.setupLocalStream(constraints)
        : await navigator.mediaDevices.getUserMedia(constraints);

      let resultingStream = stream;
      setLocalStream((prev) => {
        if (!prev) {
          resultingStream = stream;
          return stream;
        }

        if (constraints.video) {
          stream.getVideoTracks().forEach((track) => {
            if (!prev.getVideoTracks().length) {
              prev.addTrack(track);
            }
          });
        }
        if (constraints.audio) {
          stream.getAudioTracks().forEach((track) => {
            if (!prev.getAudioTracks().length) {
              prev.addTrack(track);
            }
          });
        }

        resultingStream = prev;
        return prev;
      });

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = resultingStream;
      }
      if (webrtcManager) {
        webrtcManager.setLocalStream(stream);
      }

      return stream;
    } catch (error) {
      console.error("[LiveClass] Failed to request local media", error);
      setConnectionErrors((prev) => [
        ...prev,
        t("liveClass.error.cameraAccess"),
      ]);
      return null;
    }
  };

  useEffect(() => {
    if (!webrtcManager || !localStream) return;
    webrtcManager.setLocalStream(localStream);
  }, [webrtcManager, localStream]);

  useEffect(() => {
    if (!hasJoined || localStream) return;
    if (session?.status !== "ongoing") return;

    requestLocalMedia({ video: true, audio: true }).catch((error) => {
      console.warn("[LiveClass] Failed to start camera after join", error);
    });
  }, [hasJoined, localStream, session?.status]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;

      screenStream.getVideoTracks().forEach((track) => {
        if (!track.enabled) {
          track.enabled = true;
          console.log('[LiveClass] Enabled screen video track', { trackId: track.id });
        }
      });

      screenVideoRef.current.play().catch((err) => {
        console.warn('[LiveClass] Screen video autoplay failed', err);
      });

      setScreenVideoReady(false);
    }
  }, [screenStream]);

  useEffect(() => {
    const videoEl = remoteScreenShareVideoRef.current;
    if (!videoEl) return;

    if (!remoteScreenShareStream) {
      videoEl.srcObject = null;
      return;
    }

    if (videoEl.srcObject !== remoteScreenShareStream) {
      videoEl.srcObject = remoteScreenShareStream;
    }

    videoEl.muted = true;
    videoEl.play().catch((err) => {
      console.warn('[LiveClass] Failed to play remote screen share', err);
    });
  }, [remoteScreenShareStream]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * ratio;
      canvas.height = parent.clientHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [showWhiteboard, whiteboardSize]);

  const toggleMic = async () => {
    if (!localStream || localStream.getAudioTracks().length === 0) {
      const stream = await requestLocalMedia({ video: false, audio: true });
      if (!stream) return;
      setIsMuted(false);
      setIsMutedByTutor(false);
      await webrtcManager?.setTrackEnabled("audio", true);
      presenceManager?.updatePresence({ isAudioOn: true }, "UserMicOn");
      return;
    }

    const nextMuted = !isMuted;
    const enabled = !nextMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setIsMuted(nextMuted);
    setIsMutedByTutor(false);
    await webrtcManager?.setTrackEnabled("audio", enabled);
    presenceManager?.updatePresence(
      { isAudioOn: enabled },
      enabled ? "UserMicOn" : "UserMicOff",
    );
  };

  const handleTutorCommand = (command: string, payload: any) => {
    console.log('[LiveClass] handleTutorCommand received', { command, payload });
    
    if (command === "countdown-started") {
      const duration = payload?.duration;
      console.log('[LiveClass] countdown-started command', { duration });
      if (typeof duration === "number" && duration > 0) {
        setCountdownSeconds(duration);
        setIsCountdownRunning(true);
        setAlerted20Min(false);
        setAlerted10Min(false);
        setAlerted5Sec(false);
        setHasCountdownEnded(false);
      }
      return;
    }

    if (command === "countdown-extended") {
      const totalSeconds = payload?.totalSeconds;
      console.log('[LiveClass] countdown-extended command received', { totalSeconds, isCountdownRunning, currentCountdownSeconds: countdownSeconds, payload });
      if (typeof totalSeconds === "number" && totalSeconds > 0) {
        console.log('[LiveClass] applying countdown extend', { totalSeconds, previousSeconds: countdownSeconds });
        setCountdownSeconds(totalSeconds);
        if (!isCountdownRunning && countdownSeconds !== null) {
          console.log('[LiveClass] restarting timer after extend');
          setIsCountdownRunning(true);
        }
        alertInfo(t("liveClass.tutorMessages.addedTime"));
      } else {
        console.warn('[LiveClass] countdown-extended invalid payload', { totalSeconds, type: typeof totalSeconds });
      }
      return;
    }

    if (command === "session-paused") {
      setSession((prev: any) => (prev ? { ...prev, status: "paused" } : prev));
      setIsCountdownRunning(false);
      alertInfo(t("liveClass.tutorMessages.sessionPaused"));
      return;
    }

    if (command === "session-resumed") {
      setSession((prev: any) => (prev ? { ...prev, status: "ongoing" } : prev));
      setIsCountdownRunning(true);
      alertInfo(t("liveClass.tutorMessages.sessionResumed"));
      return;
    }

    if (!payload || payload.target_user_id !== user?.id) {
      return;
    }

    switch (command) {
      case "mute-audio": {
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        setIsMuted(true);
        setIsMutedByTutor(true);
        webrtcManager?.setTrackEnabled("audio", false);
        presenceManager?.updatePresence({ isAudioOn: false });
        alertInfo(t("liveClass.tutorMessages.audioMuted"));
        break;
      }
      case "unmute-audio": {
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
        }
        setIsMuted(false);
        setIsMutedByTutor(false);
        webrtcManager?.setTrackEnabled("audio", true);
        presenceManager?.updatePresence({ isAudioOn: true });
        alertInfo(t("liveClass.tutorMessages.audioUnmuted"));
        break;
      }
      case "mute-video": {
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        setIsVideoOff(true);
        webrtcManager?.setTrackEnabled("video", false);
        presenceManager?.updatePresence({ isVideoOn: false });
        alertInfo(t("liveClass.tutorMessages.videoMuted"));
        break;
      }
      case "unmute-video": {
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => {
            track.enabled = true;
          });
        }
        setIsVideoOff(false);
        webrtcManager?.setTrackEnabled("video", true);
        presenceManager?.updatePresence({ isVideoOn: true });
        alertInfo(t("liveClass.tutorMessages.videoUnmuted"));
        break;
      }
      case "stop-screen-share": {
        if (screenSharing) {
          void toggleScreenShare();
        }
        alertInfo(t("liveClass.tutorMessages.screenShareStopped"));
        break;
      }
      case "kick-room": {
        setIsKicked(true);
        setHasJoined(false);
        alertInfo(t("liveClass.tutorMessages.kicked"));
        setTimeout(() => {
          navigate("dashboard-siswa");
        }, 400);
        break;
      }
      case "block-chat": {
        const blocked = payload?.blocked === true;
        setIsChatBlocked(blocked);
        alertInfo(blocked ? t("liveClass.tutorMessages.chatBlocked") : t("liveClass.tutorMessages.chatUnblocked"));
        break;
      }
      case "allow-screen-share": {
        const allowed = payload?.allowed !== false;
        setIsScreenShareAllowed(allowed);
        alertInfo(allowed ? t("liveClass.tutorMessages.screenShareAllowed") : t("liveClass.tutorMessages.screenShareBlocked"));
        if (!allowed && screenSharing) {
          void toggleScreenShare();
        }
        break;
      }
      default:
        break;
    }
  };

  const toggleVideo = async () => {
    if (!localStream || localStream.getVideoTracks().length === 0) {
      const stream = await requestLocalMedia({ video: true, audio: false });
      if (!stream) return;
      setIsVideoOff(false);
      webrtcManager?.setTrackEnabled("video", true);
      presenceManager?.updatePresence({ isVideoOn: true }, "UserCameraOn");
      return;
    }

    const currentVideoEnabled = localStream.getVideoTracks().some(
      (track) => track.enabled,
    );
    const nextVideoEnabled = !currentVideoEnabled;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = nextVideoEnabled;
    });

    setIsVideoOff(!nextVideoEnabled);
    webrtcManager?.setTrackEnabled("video", nextVideoEnabled);
    presenceManager?.updatePresence(
      { isVideoOn: nextVideoEnabled },
      nextVideoEnabled ? "UserCameraOn" : "UserCameraOff",
    );
  };

  const toggleScreenShare = async () => {
    if (!isScreenShareAllowed && !screenSharing) {
      alertError("Tutor belum mengizinkan Anda melakukan screen share.");
      return;
    }

    if (screenSharing) {
      const track = screenStream?.getVideoTracks()[0];
      screenStream?.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setScreenSharing(false);
      setScreenVideoReady(false);
      presenceManager?.updatePresence({ isScreenSharing: false }, "UserScreenShareStopped");

      if (track && webrtcManager) {
        try {
          await webrtcManager.removeLocalTrack(track);
        } catch (err) {
          console.error('[LiveClass] Failed to remove screen share track on stop', err);
        }
      }
      return;
    }

    try {
      if (!localStream) {
        try {
          await requestLocalMedia({ video: false, audio: true });
        } catch (err) {
          console.warn("[LiveClass] Tidak bisa setup audio stream sebelum screen share", err);
        }
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      console.log('[LiveClass] getDisplayMedia resolved', { timestamp: Date.now(), streamId: stream.id });
      setScreenStream(stream);
      setScreenSharing(true);
      presenceManager?.updatePresence({ isScreenSharing: true }, "UserScreenShareStarted");
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      const screenVideoTrack = stream.getVideoTracks()[0];
      console.log('[LiveClass] Starting screen share', {
        trackId: screenVideoTrack?.id,
        enabled: screenVideoTrack?.enabled,
        readyState: screenVideoTrack?.readyState,
      });
      if (screenVideoTrack && webrtcManager) {
        try {
          const senders = webrtcManager.getPeers().map((p) => ({ peerId: p.userId, senders: p.connection.getSenders().map((s) => s.track?.kind ?? null) }));
          console.log('[LiveClass] replace camera with screen share track', { timestamp: Date.now(), senders });
        } catch (err) {
          console.log('[LiveClass] add screen share track diagnostics failed', { err });
        }

        await webrtcManager.replaceVideoTrack(screenVideoTrack);
      }

      if (screenVideoTrack) {
        screenVideoTrack.onended = async () => {
          setScreenStream(null);
          setScreenSharing(false);
          setScreenVideoReady(false);
          presenceManager?.updatePresence({ isScreenSharing: false }, "UserScreenShareStopped");
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            const newVideoTrack = newStream.getVideoTracks()[0];
              if (newVideoTrack && webrtcManager) {
              try {
                console.log('[LiveClass] getUserMedia restored camera resolved', { timestamp: Date.now(), trackId: newVideoTrack.id });
                const senders = webrtcManager.getPeers().map((p) => ({ peerId: p.userId, senders: p.connection.getSenders().map((s) => s.track?.id ?? null) }));
                console.log('[LiveClass] replaceVideoTrack (restore): before replace', { timestamp: Date.now(), senders });
              } catch (diagErr) {
                console.log('[LiveClass] Diagnostics failed before camera restore replace', { diagErr });
              }
              await webrtcManager.replaceVideoTrack(newVideoTrack);

              try {
                for (const peer of webrtcManager.getPeers()) {
                  try {
                    console.log('[LiveClass] createAndSendOffer (restore): invoking', { peerId: peer.userId, timestamp: Date.now(), senders: peer.connection.getSenders().map((s) => s.track?.id ?? null) });
                    await webrtcManager.createAndSendOffer(peer.userId);
                  } catch (err) {
                    console.warn('[LiveClass] createAndSendOffer after camera restore failed', { peerId: peer.userId, err });
                  }
                }
              } catch (err) {
                console.warn('[LiveClass] Failed to trigger offers after camera restore', err);
              }
            }
          } catch (error) {
            console.error(
              t("liveClass.error.restoreCameraAfterScreenShare"),
              error,
            );
          }
        };
      }

      const handleScreenShareStop = async () => {
        stream.getVideoTracks()[0].onended = null;
        setScreenStream(null);
        setScreenSharing(false);
        presenceManager?.updatePresence({ isScreenSharing: false }, "UserScreenShareStopped");
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (newVideoTrack && webrtcManager) {
            await webrtcManager.replaceVideoTrack(newVideoTrack);
          }
        } catch (error) {
          console.error(
            t("liveClass.error.restoreCameraAfterScreenShare"),
            error,
          );
        }
      };
      stream.getVideoTracks()[0].onended = handleScreenShareStop;
    } catch (error) {
      if ((error as any).name !== "NotAllowedError") {
        console.warn(t("liveClass.error.screenShareFailed"), error);
      }
    }
  };

  const handleReaction = (
    type: "raise-hand" | "gift" | "clap" | "sparkle",
  ) => {
    const reactionIconMap = {
      "raise-hand": <Hand size={32} className="text-white" />,
      gift: <Gift size={32} className="text-white" />,
      clap: <ThumbsUp size={32} className="text-white" />,
      sparkle: <Sparkles size={32} className="text-white" />,
    } as const;

    setReactionOverlay(reactionIconMap[type]);
    setShowReactionMenu(false);
    window.setTimeout(() => setReactionOverlay(null), 2200);
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (activeTool === "pen" || activeTool === "eraser") {
      event.currentTarget.setPointerCapture(event.pointerId);
      ctx.strokeStyle = activeTool === "eraser" ? "#111325" : penColor;
      ctx.lineWidth = activeTool === "eraser" ? eraserSize : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      drawingRef.current = true;
      return;
    }

    if (activeTool === "text") {
      if (!textInput.trim()) return;
      ctx.fillStyle = penColor;
      ctx.font = `${Math.max(lineWidth * 3, 16)}px sans-serif`;
      ctx.fillText(textInput, x, y);
      setTextInput("");
      return;
    }

    if (activeTool === "shape") {
      setShapeStart({ x, y });
    }
  };

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (
      !drawingRef.current ||
      (activeTool !== "pen" && activeTool !== "eraser")
    )
      return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = activeTool === "eraser" ? eraserSize : lineWidth;
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (event?: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activeTool === "shape" && shapeStart && event) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.strokeStyle = penColor;
          ctx.lineWidth = lineWidth;
          const width = x - shapeStart.x;
          const height = y - shapeStart.y;
          if (shapeMode === "rect") {
            ctx.strokeRect(shapeStart.x, shapeStart.y, width, height);
          } else {
            const radius = Math.sqrt(width * width + height * height);
            ctx.beginPath();
            ctx.arc(shapeStart.x, shapeStart.y, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      setShapeStart(null);
      return;
    }

    if (event) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
    setDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.closePath();
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getWhiteboardSizeClass = () => {
    switch (whiteboardSize) {
      case "small":
        return "w-[90vw] max-w-[460px] h-[60vh] max-h-[400px]";
      case "large":
        return "w-[96vw] max-w-[1100px] h-[84vh] max-h-[700px]";
      default:
        return "w-[92vw] max-w-[900px] h-[76vh] max-h-[600px]";
    }
  };

  const handleWhiteboardMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    setWhiteboardDragging(true);
    setDragOffset({
      x: event.clientX - whiteboardPosition.x,
      y: event.clientY - whiteboardPosition.y,
    });
  };

  const handleWhiteboardMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!whiteboardDragging) return;
    setWhiteboardPosition({
      x: event.clientX - dragOffset.x,
      y: event.clientY - dragOffset.y,
    });
  };

  const handleWhiteboardMouseUp = () => {
    setWhiteboardDragging(false);
  };

  useEffect(() => {
    if (!whiteboardDragging) return;

    const handleMove = (event: MouseEvent) => {
      setWhiteboardPosition({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y,
      });
    };

    const handleUp = () => {
      setWhiteboardDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [whiteboardDragging, dragOffset]);

  const getIceCandidateString = (payload: any): string | null => {
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.candidate === 'string' && payload.candidate.trim().length > 0) {
      return payload.candidate.trim();
    }
    if (
      payload.candidate &&
      typeof payload.candidate === 'object' &&
      typeof payload.candidate.candidate === 'string' &&
      payload.candidate.candidate.trim().length > 0
    ) {
      return payload.candidate.candidate.trim();
    }
    return null;
  };

  const isValidIceCandidatePayload = (payload: any): payload is RTCIceCandidateInit => {
    return getIceCandidateString(payload) !== null;
  };

  const dumpWebRTCState = () => {
    const peers = webrtcManager?.getPeers().map((peer) => ({
      userId: peer.userId,
      connectionState: peer.connection.connectionState,
      iceConnectionState: peer.connection.iceConnectionState,
      signalingState: peer.connection.signalingState,
      localSenderKinds: peer.connection.getSenders().map((sender) => sender.track?.kind ?? null),
      remoteTrackKinds: peer.remoteStream?.getTracks().map((track) => track.kind) ?? [],
      remoteStreamId: peer.remoteStream?.id ?? null,
      remoteStreamTrackIds: peer.remoteStream?.getTracks().map((track) => track.id) ?? [],
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
      hasJoined,
      isMuted,
      isVideoOff,
      screenSharing,
    };

    console.log('[LiveClass] WebRTC debug dump', dump);
    setWebRtcDebugDump(JSON.stringify(dump, null, 2).slice(0, 1600));
  };

  const handleWebRTCSignal = async (data: any, wrtcManager: WebRTCManager) => {
    const { from_user_id, type, payload } = data;
    const normalizedPayload =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? JSON.parse(JSON.stringify(payload))
        : payload;

    if (from_user_id === user?.id) {
      return;
    }

    if (type === 'chunked-signal') {
      if (!normalizedPayload || typeof normalizedPayload !== 'object') {
        console.warn('[LiveClass] Invalid chunked-signal payload', { from_user_id, payload: normalizedPayload });
        return;
      }

      const chunkResult = normalizeReceivedChunkedSignal(signalChunksRef.current, normalizedPayload as ChunkedSignalPayload);
      console.log('[LiveClass] Received chunked signal', {
        from_user_id,
        baseType: normalizedPayload.baseType,
        chunkIndex: normalizedPayload.chunkIndex,
        chunkCount: normalizedPayload.chunkCount,
        completed: chunkResult.complete,
      });

      if (!chunkResult.complete) {
        return;
      }

      console.log('[LiveClass] Reassembled chunked signal complete', {
        from_user_id,
        type: chunkResult.signal?.type,
      });

      if (chunkResult.signal) {
        await handleWebRTCSignal({ ...data, type: chunkResult.signal.type, payload: chunkResult.signal.payload }, wrtcManager);
      }
      return;
    }

    const participant = participants.find((p) => p.id === from_user_id);
    const isInitiator = user && user.id ? user.id > from_user_id : false;

    console.log("[LiveClass] Received WebRTC signal", {
      from_user_id,
      type,
      participantName: participant?.name,
      isInitiator,
    });

    try {
      switch (type) {
        case "offer": {
          if (!normalizedPayload || typeof normalizedPayload !== "object" || typeof normalizedPayload.sdp !== "string") {
            console.warn("[LiveClass] Invalid offer payload", {
              from_user_id,
              payload: normalizedPayload,
              payloadType: typeof normalizedPayload,
              sdpType: normalizedPayload?.sdp ? typeof normalizedPayload.sdp : 'undefined',
            });
            return;
          }
          if (!wrtcManager.getPeers().find((p) => p.userId === from_user_id)) {
            await wrtcManager.createPeerConnection(
              from_user_id,
              participant?.name || t("liveClass.fallbackUser"),
              false,
            );
          }
          await wrtcManager.handleOffer(from_user_id, normalizedPayload);
          break;
        }

        case "answer": {
          if (!normalizedPayload || typeof normalizedPayload !== "object" || typeof normalizedPayload.sdp !== "string") {
            console.warn("[LiveClass] Invalid answer payload", {
              from_user_id,
              payload: normalizedPayload,
              payloadType: typeof normalizedPayload,
              sdpType: normalizedPayload?.sdp ? typeof normalizedPayload.sdp : 'undefined',
            });
            return;
          }
          if (!wrtcManager.getPeers().find((p) => p.userId === from_user_id)) {
            await wrtcManager.createPeerConnection(
              from_user_id,
              participant?.name || t("liveClass.fallbackUser"),
              isInitiator,
            );
          }
          await wrtcManager.handleAnswer(from_user_id, normalizedPayload);
          break;
        }

        case "ice-candidate": {
          if (!isValidIceCandidatePayload(normalizedPayload)) {
            console.warn("[LiveClass] Invalid ICE payload", {
              from_user_id,
              payload: normalizedPayload,
              payloadType: typeof normalizedPayload,
              candidateString: getIceCandidateString(normalizedPayload),
              candidateType: normalizedPayload?.candidate ? typeof normalizedPayload.candidate : 'undefined',
            });
            return;
          }
          const normalizedIcePayload: RTCIceCandidateInit = {
            candidate: getIceCandidateString(normalizedPayload) as string,
            sdpMid: normalizedPayload.sdpMid,
            sdpMLineIndex: normalizedPayload.sdpMLineIndex,
            usernameFragment: normalizedPayload.usernameFragment,
          };
          if (!wrtcManager.getPeers().find((p) => p.userId === from_user_id)) {
            await wrtcManager.createPeerConnection(
              from_user_id,
              participant?.name || t("liveClass.fallbackUser"),
              isInitiator,
            );
          }
          await wrtcManager.addIceCandidate(from_user_id, normalizedIcePayload);
          break;
        }

        case "hangup":
          wrtcManager.closePeer(from_user_id);
          break;

        default:
          console.warn("[LiveClass] Unknown signal type", type);
      }
    } catch (error) {
      console.error("[LiveClass] Error handling WebRTC signal", error);
    }
  };

  const isTutor = user?.role === "tutor";

  const canJoinSession = useMemo(() => {
    if (!session) return false;

    if (isTutor) {
      return session.status === "scheduled" || session.status === "ongoing" || session.status === "paused";
    }

    return (session.status === "ongoing" || session.status === "paused") && !hasJoined;
  }, [session?.status, isTutor, hasJoined]);

  const joinButtonLabel = useMemo(() => {
    if (joining) return t("liveClass.buttons.joining");
    if (!session) return t("liveClass.buttons.waitTutor");
    if (isTutor) {
      return session.status === "scheduled"
        ? t("liveClass.buttons.startSession")
        : t("liveClass.buttons.joinNow");
    }

    if (hasJoined) return t("liveClass.buttons.joined");
    if (session.status === "ongoing" || session.status === "paused") return t("liveClass.buttons.joinNow");
    return t("liveClass.buttons.waitTutor");
  }, [session?.status, isTutor, joining, hasJoined, t]);

  const handleJoinSession = async () => {
    if (!bookingId) return;

    const pretestKey = `tutorku_pretest_completed_${bookingId}`;
    const pretestCompleted = localStorage.getItem(pretestKey) === "1";
    if (!pretestCompleted) {
      window.location.hash = `#/pretest?booking_id=${bookingId}`;
      return;
    }

    if (!canJoinSession) {
      if (!hasJoined) {
        alertInfo(t("liveClass.alert.waitTutorStart"));
      }
      return;
    }

    setJoining(true);
    try {
      const result = await apiFetch(
        `/bookings/${bookingId}/live-session/join`,
        {
          method: "POST",
        },
      );
      const sessionData = result.data ?? result;
      setSession(sessionData);

      setHasJoined(true);
      localStorage.setItem(`tutorku_joined_${bookingId}`, "true");

      if (!localStream) {
        await requestLocalMedia({ video: true, audio: true });
      }

      console.log("[LiveClass] Join session berhasil", sessionData);
    } catch (error) {
      console.error(t("liveClass.alert.joinFailed"), error);
      alertError(t("liveClass.alert.joinFailed"));
    } finally {
      setJoining(false);
    }
  };

  const title = useMemo(() => {
    const tutorName = booking?.tutor?.name ?? t("liveClass.fallbackTutor");
    return tutorName;
  }, [booking, t]);

  const showJoinLobby = Boolean(
    session && !hasJoined && session.status !== "ended"
  );

  const lobbyTitle = session?.status === "scheduled"
    ? t("liveClass.lobby.titleWaiting")
    : t("liveClass.lobby.titleOngoing");

  const lobbyDescription = session?.status === "scheduled"
    ? t("liveClass.lobby.descriptionWaiting")
    : t("liveClass.lobby.descriptionOngoing");

  const isMobile = window.innerWidth < 768;
  const participantCount = participants.length;

  const remoteTutorName = booking?.tutor?.name ?? t("liveClass.fallbackTutor");
  const remoteTutorPhoto = booking?.tutor?.photo ?? booking?.tutor?.avatar ?? null;
  const localStudentName = booking?.student?.name ?? user?.name ?? "Kamu";
  const localStudentPhoto = booking?.student?.photo ?? booking?.student?.avatar ?? null;

  const mainPlaceholderName = isVideoSwapped ? localStudentName : remoteTutorName;
  const mainPlaceholderPhoto = isVideoSwapped ? localStudentPhoto : remoteTutorPhoto;

  const localVideoActive = useMemo(
    () => localStream?.getVideoTracks().some((track) => track.enabled) ?? false,
    [localStream],
  );

  const localCameraVisible = useMemo(
    () => localVideoActive && !isVideoOff,
    [localVideoActive, isVideoOff],
  );

  // Cari peserta selain user sendiri (biasanya tutor)
  const studentParticipant = useMemo(
    () => participants.find((p) => p.id !== user?.id),
    [participants, user?.id]
  );

  const remoteStudentStream = useMemo(() => {
    if (studentParticipant) {
      return remoteStreams.get(studentParticipant.id);
    }
    return remoteStreams.size > 0 ? Array.from(remoteStreams.values())[0] : undefined;
  }, [remoteStreams, studentParticipant]);

  const remoteStudentHasVideo = useMemo(
    () =>
      Boolean(
        remoteStudentStream?.getVideoTracks().some((track) => {
          if (track.readyState === "ended") return false;
          if (!track.enabled) return false;
          if (track.muted) return false;
          return !isScreenTrack(track);
        }) && studentParticipant?.isVideoOn,
      ),
    [remoteStudentStream, studentParticipant?.isVideoOn],
  );

  const [mainVideoAttached, setMainVideoAttached] = useState(false);

  const showMainPlaceholder = useMemo(
    () => {
      if (screenSharing) return false;
      if (isRemoteScreenSharing) return !remoteScreenShareHasVideo;
      if (isVideoSwapped) {
        return !localCameraVisible;
      }
      return !remoteStudentHasVideo || !mainVideoAttached;
    },
    [screenSharing, isRemoteScreenSharing, remoteScreenShareHasVideo, isVideoSwapped, localCameraVisible, remoteStudentHasVideo, mainVideoAttached],
  );

  useEffect(() => {
    try {
      console.log('[LiveClass][Debug] showMainPlaceholder', {
        showMainPlaceholder,
        remoteStudentHasVideo,
        studentParticipantId: studentParticipant?.id ?? null,
        studentParticipantVideoOn: studentParticipant?.isVideoOn ?? null,
        remoteStudentStreamId: remoteStudentStream?.id ?? null,
        remoteStudentTracks: remoteStudentStream?.getTracks().map((t) => ({ id: t.id, kind: t.kind, enabled: t.enabled, readyState: t.readyState })) ?? null,
        mainRemoteVideoSrc: mainRemoteVideoRef.current?.srcObject ? (mainRemoteVideoRef.current?.srcObject as MediaStream).id : null,
      });
    } catch (err) {
      console.warn('[LiveClass][Debug] Failed to log showMainPlaceholder', err);
    }
  }, [showMainPlaceholder, remoteStudentHasVideo, remoteStudentStream, studentParticipant?.isVideoOn]);

  const previewVideoVisible = useMemo(
    () => {
      if (isVideoSwapped) {
        if (!remoteStudentStream) return false;
        const cameraStream = createCameraVideoStream(remoteStudentStream);
        return Boolean(cameraStream);
      }
      return localCameraVisible;
    },
    [isVideoSwapped, remoteStudentStream, localCameraVisible],
  );

  const canSwapVideo = useMemo(
    () =>
      hasJoined &&
      !screenSharing &&
      !isRemoteScreenSharing &&
      localCameraVisible,
    [hasJoined, screenSharing, isRemoteScreenSharing, localCameraVisible],
  );

  const previewLabel = isVideoSwapped ? remoteTutorName : localStudentName;
  const previewPhoto = isVideoSwapped ? remoteTutorPhoto : localStudentPhoto;

  const previewIsTutor = isVideoSwapped;

  useEffect(() => {
    const videoEl = mainRemoteVideoRef.current;
    if (!videoEl) return;

    if (isVideoSwapped || !remoteStudentStream || !remoteStudentHasVideo) {
      videoEl.srcObject = null;
      return;
    }

    const remoteStream = createCameraVideoStream(remoteStudentStream) ?? createPreferredVideoStream(remoteStudentStream) ?? remoteStudentStream;
    if (videoEl.srcObject !== remoteStream) {
      videoEl.srcObject = remoteStream;
    }
    videoEl.muted = true;

    videoEl
      .play()
      .catch((error) => {
        console.warn('[LiveClass] Failed to play main remote video', error);
      });
  }, [isVideoSwapped, remoteStudentStream, remoteStudentHasVideo]);

  useEffect(() => {
    const previewEl = previewVideoRef.current;
    if (!previewEl) return;

    if (isVideoSwapped) {
      if (!remoteStudentStream || !remoteStudentHasVideo) {
        previewEl.srcObject = null;
        return;
      }
      const remoteStream = createCameraVideoStream(remoteStudentStream) ?? createPreferredVideoStream(remoteStudentStream) ?? remoteStudentStream;
      if (previewEl.srcObject !== remoteStream) {
        previewEl.srcObject = remoteStream;
      }
      previewEl.muted = true;
      previewEl.play().catch((error) => {
        console.warn('[LiveClass] Failed to play preview remote video', error);
      });
      return;
    }

    if (!localStream || !localCameraVisible) {
      previewEl.srcObject = null;
      return;
    }

    if (previewEl.srcObject !== localStream) {
      previewEl.srcObject = localStream;
    }
    previewEl.muted = true;
    previewEl.play().catch((error) => {
      console.warn('[LiveClass] Failed to play preview local video', error);
    });
  }, [isVideoSwapped, remoteStudentStream, localStream, localCameraVisible, remoteStudentHasVideo]);

  useEffect(() => {
    if (!mainLocalVideoRef.current) return;
    if (!isVideoSwapped || !localCameraVisible || !localStream) {
      mainLocalVideoRef.current.srcObject = null;
      return;
    }

    if (mainLocalVideoRef.current.srcObject !== localStream) {
      mainLocalVideoRef.current.srcObject = localStream;
    }
    mainLocalVideoRef.current.muted = true;
    mainLocalVideoRef.current.play().catch((error) => {
      console.warn('[LiveClass] Failed to play main local video', error);
    });
  }, [isVideoSwapped, localStream, localCameraVisible]);

  return (
    <div className="h-screen flex flex-col bg-[#202124] relative">
      {/* Landscape Required Overlay - Mobile Portrait */}
      {isLandscapeRequired && (
        <div className="fixed inset-0 z-[100] bg-[#202124] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-[#8ab4f8]/20 flex items-center justify-center mb-6">
            <Maximize2 size={48} className="text-[#8ab4f8]" />
          </div>
          <h2 className="text-2xl font-bold text-[#e8eaed] mb-3">{t("liveClass.orientation.title")}</h2>
          <p className="text-[#9aa0a6] max-w-sm mb-2">
            {t("liveClass.orientation.description", {
              highlight: t("liveClass.orientation.descriptionHighlight"),
            })}
          </p>
          <p className="text-sm text-[#5f6368]">{t("liveClass.orientation.action")}</p>
          <div className="mt-8 animate-bounce">
            <div className="w-16 h-16 border-4 border-[#8ab4f8]/50 rounded-full flex items-center justify-center rotate-45">
              <div className="w-12 h-8 border-2 border-[#8ab4f8]/30 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Session Status Notification */}
      {session?.status === "ongoing" && (
        <div className="bg-gradient-to-r from-[#1a73e8] to-[#1a73e8]/80 text-white px-4 py-3 text-sm font-medium animate-pulse flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-[#fdd663]" />
            <span>
              {t("liveClass.notifications.sessionStarted")} {" "}
              {!hasJoined && t("liveClass.notifications.clickJoin")}
            </span>
          </div>
          {!hasJoined && (
            <button
              type="button"
              onClick={handleJoinSession}
              disabled={!canJoinSession || joining || hasJoined}
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                !canJoinSession || joining || hasJoined
                  ? "bg-white/20 text-[#9aa0a6] cursor-not-allowed"
                  : "bg-white text-[#1a73e8] hover:bg-white/90"
              }`}
            >
              {joinButtonLabel}
            </button>
          )}
        </div>
      )}
      {booking?.status === "confirmed" && session?.status !== "ongoing" && (
        <div className="bg-[#fdd663]/10 text-[#fdd663] px-4 py-2 text-center text-sm font-medium border border-[#fdd663]/20">
          <Bell size={16} className="inline-block align-middle mr-2" />
          {t("liveClass.notifications.sessionNotStarted", {
            tutor: booking?.tutor?.name ?? t("liveClass.fallbackTutor"),
          })}
        </div>
      )}

      {/* Connection Error Display */}
      {connectionErrors.length > 0 && (
        <div className="bg-[#ea4335]/10 border-l-4 border-[#ea4335] px-4 py-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-[#ea4335]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#ea4335] mb-1">
                {t("liveClass.connectionError.title")}
              </h3>
              <div className="text-[#ea4335] space-y-1">
                {connectionErrors.map((err, idx) => (
                  <div key={idx} className="text-xs">
                    {err}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setConnectionErrors([])}
              className="text-[#ea4335] hover:text-[#ea4335]/80 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showRatingPopup && (
        <RatingTutorPage
          bookingId={bookingId}
          apiFetch={apiFetch}
          onClose={() => {
            if (bookingId) {
              localStorage.setItem(`tutorku_rating_shown_${bookingId}`, "true");
            }
            setShowRatingPopup(false);
            setReviewSubmitted(true);
            navigate("dashboard-siswa");
          }}
          onSubmitted={() => {
            if (bookingId) {
              localStorage.setItem(`tutorku_rating_shown_${bookingId}`, "true");
            }
            setShowRatingPopup(false);
            setReviewSubmitted(true);
            if (bookingId) {
              window.location.hash = `#/posttest?booking_id=${bookingId}`;
            } else {
              navigate("dashboard-siswa");
            }
          }}
        />
      )}

      {/* Top Bar - Google Meet Dark Style */}
      <div className="bg-[#303134] border-b border-[#3c4043] px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate("dashboard-siswa")}
              className="flex h-10 w-10 items-center justify-center text-[#e8eaed] hover:bg-[#3c4043] rounded-full transition flex-shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#ea4335] bg-[#ea4335]/20 px-2 py-0.5 rounded border border-[#ea4335]/30 flex items-center gap-1">
                <Camera size={12} className="text-[#ea4335]" />
                {t("liveClass.preview.liveLabel")}
              </span>
              <span className="text-sm font-semibold text-[#e8eaed] truncate max-w-[120px] sm:max-w-[200px]">
                {title}
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-xs text-[#e8eaed] bg-[#3c4043] px-2.5 py-0.5 rounded-full border border-[#5f6368] flex items-center gap-1">
              <Users size={12} className="text-[#8ab4f8]" />
              {participantCount}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
              connectionErrors.length > 0 
                ? 'bg-[#ea4335]/20 text-[#ea4335] border-[#ea4335]/30'
                : session?.status === 'ongoing' 
                ? 'bg-[#81c995]/20 text-[#81c995] border-[#81c995]/30'
                : 'bg-[#fdd663]/20 text-[#fdd663] border-[#fdd663]/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                connectionErrors.length > 0 ? 'bg-[#ea4335]' : 
                session?.status === 'ongoing' ? 'bg-[#81c995] animate-pulse' : 
                'bg-[#fdd663]'
              }`} />
              {session?.status === 'ongoing'
                ? t('liveClass.status.live')
                : session?.status === 'paused'
                ? t('liveClass.status.paused')
                : t('liveClass.status.ready')}
            </span>
            {countdownSeconds !== null && (
              <span className="text-xs text-[#8ab4f8] bg-[#8ab4f8]/20 px-2 py-0.5 rounded-full border border-[#8ab4f8]/30 font-mono flex items-center gap-1">
                <Clock size={12} className="text-[#8ab4f8]" />
                {formatCountdown(countdownSeconds)}
              </span>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFullScreen}
              className="p-1.5 rounded-lg hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
            >
              {isFullScreen ? <Shrink size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="px-3 py-1.5 bg-[#ea4335]/20 text-[#ea4335] text-xs font-medium hover:bg-[#ea4335]/30 transition-colors rounded disabled:opacity-60"
            >
              {ending ? "..." : t("liveClass.buttons.endSession")}
            </button>
          </div>
        </div>

        {/* Mobile Status Badges */}
        <div className="flex md:hidden items-center gap-1.5 mt-1.5 overflow-x-auto">
          <span className="text-xs text-[#e8eaed] bg-[#3c4043] px-2.5 py-0.5 rounded-full border border-[#5f6368] flex items-center gap-1 whitespace-nowrap">
            <Users size={12} className="text-[#8ab4f8]" />
            {participantCount}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 whitespace-nowrap ${
            connectionErrors.length > 0 
              ? 'bg-[#ea4335]/20 text-[#ea4335] border-[#ea4335]/30'
              : session?.status === 'ongoing' 
              ? 'bg-[#81c995]/20 text-[#81c995] border-[#81c995]/30'
              : 'bg-[#fdd663]/20 text-[#fdd663] border-[#fdd663]/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              connectionErrors.length > 0 ? 'bg-[#ea4335]' : 
              session?.status === 'ongoing' ? 'bg-[#81c995] animate-pulse' : 
              'bg-[#fdd663]'
            }`} />
            {session?.status === 'ongoing'
              ? t('liveClass.status.live')
              : session?.status === 'paused'
              ? t('liveClass.status.paused')
              : t('liveClass.status.ready')}
          </span>
          {countdownSeconds !== null && (
            <span className="text-xs text-[#8ab4f8] bg-[#8ab4f8]/20 px-2 py-0.5 rounded-full border border-[#8ab4f8]/30 font-mono flex items-center gap-1 whitespace-nowrap">
              <Clock size={12} className="text-[#8ab4f8]" />
              {formatCountdown(countdownSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Main Content - Video + RoomChat */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Area */}
        <div className="flex-1 relative">
          <div className={`relative w-full h-full rounded-xl md:rounded-2xl overflow-hidden ${showMainPlaceholder ? 'bg-transparent' : 'bg-[#202124]'}`}>
            {/* Local Camera as Main when swapped */}
            {isVideoSwapped && localCameraVisible && localStream && (
              <video
                ref={mainLocalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Remote Video (Main) */}
            {!isVideoSwapped && !isRemoteScreenSharing && remoteStudentStream && remoteStudentHasVideo && (
              <video
                ref={(el) => {
                  mainRemoteVideoRef.current = el;
                  if (studentParticipant) {
                    if (el) {
                      remoteVideoRefs.current.set(studentParticipant.id, el);
                    } else {
                      remoteVideoRefs.current.delete(studentParticipant.id);
                    }
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Tutor/Local Placeholder main ketika tidak ada video utama */}
            {showMainPlaceholder && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#202124]/95 backdrop-blur-md text-center px-6 gap-3 border border-[#3c4043]/10">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#3c4043]/20 shadow-2xl bg-[#303134]">
                  {mainPlaceholderPhoto ? (
                    <img
                      src={mainPlaceholderPhoto}
                      alt={mainPlaceholderName}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.opacity = '0';
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${mainPlaceholderPhoto ? 'opacity-0' : ''} bg-gradient-to-br ${getAvatarColor(mainPlaceholderName)} text-4xl font-bold text-white`}>
                    {mainPlaceholderName.charAt(0).toUpperCase() || 'T'}
                  </div>
                </div>
                <div className="text-sm text-[#9aa0a6]">{mainPlaceholderName}</div>
              </div>
            )}

            {/* Remote screen share dari tutor */}
            {isRemoteScreenSharing && !screenSharing && remoteScreenShareHasVideo && (
              <div className="absolute inset-0 bg-[#202124]">
                <video
                  ref={remoteScreenShareVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {isVideoSwapped && isVideoOff && !screenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]/70 backdrop-blur-sm text-center px-6 gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#3c4043]/20 shadow-xl bg-[#303134]">
                  {localStudentPhoto ? (
                    <img
                      src={localStudentPhoto}
                      alt={localStudentName}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.opacity = '0';
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${localStudentPhoto ? 'opacity-0' : ''} bg-gradient-to-br ${getAvatarColor(localStudentName)} text-4xl font-bold text-white`}> 
                    {localStudentName.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="text-[#e8eaed] text-xl font-semibold">{localStudentName}</div>
              </div>
            )}

            {/* Reactions */}
            {reactionOverlay && (
              <div className="absolute bottom-6 right-6 animate-bounce drop-shadow-lg">
                <span className="text-4xl">{reactionOverlay}</span>
              </div>
            )}
          </div>

          {/* Hidden remote audio players for participants */}
          {participants.map((participant) => (
            <audio
              key={participant.id}
              ref={(el) => {
                if (el) {
                  remoteAudioRefs.current.set(participant.id, el);
                } else {
                  remoteAudioRefs.current.delete(participant.id);
                }
              }}
              autoPlay
              playsInline
              className="hidden"
            />
          ))}

          {/* Floating Local Video Preview */}
          <div
            onClick={() => {
              if (!canSwapVideo) return;
              setIsVideoSwapped((prev) => !prev);
            }}
            role="button"
            title={canSwapVideo ? t("liveClass.preview.swapHint") : t("liveClass.preview.swapUnavailable")}
            className={`absolute top-3 left-3 z-50 w-[110px] md:w-[140px] lg:w-[170px] aspect-video rounded-3xl overflow-hidden shadow-2xl border border-[#3c4043]/10 bg-[#303134]/80 backdrop-blur-sm transition-all duration-200 ${
              canSwapVideo ? 'cursor-pointer hover:shadow-2xl' : 'cursor-not-allowed opacity-80'
            }`}
          >
            {previewVideoVisible ? (
              <video
                key="preview-video"
                ref={(el) => {
                  previewVideoRef.current = el;
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div key="preview-fallback" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br from-[#303134] via-[#202124] to-[#303134] px-3 text-center text-[#e8eaed]">
                <div className="flex items-center justify-center rounded-full bg-[#202124]/95 p-2 shadow-2xl ring-1 ring-[#3c4043]/10">
                  <AvatarFallback name={previewLabel} photo={previewPhoto} sizeClass="h-16 w-16" alt={previewLabel} />
                </div>
                <div className="text-[11px] text-[#9aa0a6] truncate max-w-full font-semibold">{previewLabel}</div>
                {previewIsTutor && (
                  <div className="rounded-full bg-[#8ab4f8]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8ab4f8]">
                    {t("liveClass.preview.tutorOffline")}
                  </div>
                )}
              </div>
            )}

            {/* Label at bottom */}
            <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-1 bg-[#202124]/60 px-2 py-1 text-[10px] text-[#e8eaed] pointer-events-none">
              <span className="truncate font-medium text-xs">{previewLabel}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#9aa0a6]">
                <User size={10} />
              </span>
            </div>
          </div>

          {/* Join Lobby Overlay */}
          {showJoinLobby && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#202124]/60 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-2xl border border-[#3c4043]/10 bg-[#303134]/95 p-8 text-center shadow-2xl">
                <div className="text-xs uppercase tracking-[0.24em] text-[#8ab4f8] mb-4">
                  {session?.status === "scheduled"
                    ? t("liveClass.lobby.lobbyStatusWaiting")
                    : t("liveClass.lobby.lobbyStatusOngoing")}
                </div>
                <h1 className="text-2xl font-semibold text-[#e8eaed] mb-3">{lobbyTitle}</h1>
                <p className="text-sm text-[#9aa0a6] mb-6">{lobbyDescription}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleJoinSession}
                    disabled={!canJoinSession || joining || hasJoined}
                    className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                      hasJoined
                        ? "bg-[#81c995] text-[#202124] cursor-default opacity-70"
                        : canJoinSession
                        ? "bg-[#1a73e8] text-white hover:bg-[#1a73e8]/90"
                        : "bg-[#3c4043] text-[#9aa0a6] cursor-not-allowed"
                    } ${joining ? "opacity-70 cursor-wait" : ""}`}
                  >
                    {joinButtonLabel}
                  </button>
                  <button
                    onClick={() => setShowChatPopup(true)}
                    className="inline-flex items-center justify-center rounded-full border border-[#3c4043]/10 bg-[#3c4043]/20 px-6 py-2.5 text-sm text-[#e8eaed] transition hover:bg-[#3c4043]/40"
                  >
                    <MessageCircle size={16} className="mr-2 text-[#8ab4f8]" />
                    {t("liveClass.chat.openChat")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Screen Share overlay */}
          {screenSharing && (
            <div className="absolute inset-0 bg-[#202124]">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* RoomChat Panel - Google Meet Dark Style */}
        <div className="hidden md:flex w-[320px] lg:w-[360px] bg-[#202124] border-l border-[#3c4043] flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#3c4043] bg-[#303134] flex-shrink-0">
            <MessageCircle size={18} className="text-[#8ab4f8]" />
            <span className="text-sm font-medium text-[#e8eaed]">{t("liveClass.chat.title")}</span>
            <span className="text-xs text-[#9aa0a6] bg-[#3c4043] px-2 py-0.5 rounded-full">
              {participantCount + 1}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <LiveChat
              bookingId={bookingId}
              hideHeader
              onClose={() => setShowChatPopup(false)}
              apiFetch={apiFetch}
              currentUserId={user?.id}
              currentUserRole={user?.role}
              isBlocked={isChatBlocked}
              blockedMessage={isChatBlocked ? t("liveClass.chat.blockedByTutor") : undefined}
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls - Google Meet Dark Style Floating Glassmorphism */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-[#303134]/80 backdrop-blur-md rounded-2xl shadow-lg border border-[#3c4043]/50 px-2.5 py-2 flex items-center gap-1 overflow-x-auto max-w-[95vw]">
        <button
          onClick={toggleMic}
          disabled={!hasJoined}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            !hasJoined
              ? 'bg-[#3c4043]/50 text-[#5f6368] cursor-not-allowed'
              : isMuted
              ? 'bg-[#ea4335]/30 text-[#ea4335] hover:bg-[#ea4335]/40'
              : 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#e8eaed]'
          }`}
        >
          {isMuted ? <MicOff size={17} className="text-[#ea4335]" /> : <Mic size={17} className="text-[#81c995]" />}
        </button>

        <button
          onClick={toggleVideo}
          disabled={!hasJoined}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            !hasJoined
              ? 'bg-[#3c4043]/50 text-[#5f6368] cursor-not-allowed'
              : isVideoOff
              ? 'bg-[#ea4335]/30 text-[#ea4335] hover:bg-[#ea4335]/40'
              : 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#e8eaed]'
          }`}
        >
          {isVideoOff ? <VideoOff size={17} className="text-[#ea4335]" /> : <Camera size={17} className="text-[#8ab4f8]" />}
        </button>

        <button
          onClick={toggleScreenShare}
          disabled={!hasJoined}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            !hasJoined
              ? 'bg-[#3c4043]/50 text-[#5f6368] cursor-not-allowed'
              : screenSharing
              ? 'bg-[#d7aefb]/30 text-[#d7aefb] hover:bg-[#d7aefb]/40'
              : 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#e8eaed]'
          }`}
        >
          <Monitor size={17} className={screenSharing ? 'text-[#d7aefb]' : 'text-[#9aa0a6]'} />
        </button>

        <button
          onClick={() => setIsVideoSwapped((prev) => !prev)}
            disabled={!canSwapVideo}
            className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
              !canSwapVideo
              ? 'bg-[#3c4043]/50 text-[#5f6368] cursor-not-allowed'
              : 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#e8eaed]'
          }`}
        >
          <Shuffle size={17} className="text-[#8ab4f8]" />
        </button>

        <button
          onClick={() => setShowWhiteboard(true)}
          disabled={!hasJoined}
          className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            !hasJoined
              ? 'bg-[#3c4043]/50 text-[#5f6368] cursor-not-allowed'
              : showWhiteboard
              ? 'bg-[#fdd663]/30 text-[#fdd663] hover:bg-[#fdd663]/40'
              : 'bg-[#3c4043]/60 hover:bg-[#4a4d52]/60 text-[#e8eaed]'
          }`}
        >
          <Pencil size={17} className={showWhiteboard ? 'text-[#fdd663]' : 'text-[#9aa0a6]'} />
        </button>

        <button
          onClick={() => setShowChatPopup(true)}
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
                onClick={() => handleReaction('raise-hand')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <Hand size={15} className="text-[#fdd663]" />
              </button>
              <button
                onClick={() => handleReaction('gift')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <Gift size={15} className="text-[#f28b82]" />
              </button>
              <button
                onClick={() => handleReaction('clap')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <ThumbsUp size={15} className="text-[#8ab4f8]" />
              </button>
              <button
                onClick={() => handleReaction('sparkle')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-[#3c4043] text-sm text-[#e8eaed]"
              >
                <Sparkles size={15} className="text-[#d7aefb]" />
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[#3c4043]" />

        <button
          onClick={handleEndSession}
          disabled={ending}
          className="p-2 rounded-xl bg-[#ea4335]/30 text-[#ea4335] hover:bg-[#ea4335]/40 transition backdrop-blur-sm"
        >
          <PhoneOff size={17} />
        </button>
      </div>

      {/* Participants Modal - Google Meet Dark Style */}
      {showParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/70">
          <div className="w-full max-w-sm rounded-2xl bg-[#303134] border border-[#3c4043] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#e8eaed] flex items-center gap-2">
                <Users size={20} className="text-[#81c995]" />
                {t("liveClass.participants.title")}
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
                    <div className="text-sm font-medium text-[#e8eaed]">{user.name} ({t("liveClass.participants.you")})</div>
                    <div className="text-xs text-[#9aa0a6]">
                      {user.role === 'tutor'
                        ? t("liveClass.participants.roles.tutor")
                        : t("liveClass.participants.roles.student")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mic size={14} className={isMuted ? 'text-[#ea4335]' : 'text-[#81c995]'} />
                    <Camera size={14} className={isVideoOff ? 'text-[#ea4335]' : 'text-[#8ab4f8]'} />
                  </div>
                </div>
              )}
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#3c4043]">
                  <div className="w-8 h-8 rounded-full bg-[#5f6368] flex items-center justify-center text-white font-semibold text-sm">
                    {participant.name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#e8eaed]">{participant.name || t("liveClass.participants.fallbackStudent")}</div>
                    <div className="text-xs text-[#9aa0a6]">{t("liveClass.participants.roles.student")}</div>
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
                {t("liveClass.settings.title")}
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
                  <span className="text-sm text-[#e8eaed]">{t("liveClass.settings.camera")}</span>
                </div>
                <button
                  onClick={toggleVideo}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    isVideoOff ? 'bg-[#ea4335] text-white' : 'bg-[#81c995] text-[#202124]'
                  }`}
                >
                  {isVideoOff ? t("liveClass.status.inactive") : t("liveClass.status.active")}
                </button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#3c4043]">
                <div className="flex items-center gap-2">
                  <Mic size={16} className="text-[#81c995]" />
                  <span className="text-sm text-[#e8eaed]">{t("liveClass.settings.microphone")}</span>
                </div>
                <button
                  onClick={toggleMic}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    isMuted ? 'bg-[#ea4335] text-white' : 'bg-[#81c995] text-[#202124]'
                  }`}
                >
                  {isMuted ? t("liveClass.status.inactive") : t("liveClass.status.active")}
                </button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#3c4043]">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-[#d7aefb]" />
                  <span className="text-sm text-[#e8eaed]">{t("liveClass.settings.screenShare")}</span>
                </div>
                <button
                  onClick={toggleScreenShare}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    screenSharing ? 'bg-[#d7aefb] text-[#202124]' : 'bg-[#3c4043] text-[#9aa0a6]'
                  }`}
                >
                  {screenSharing ? t("liveClass.status.active") : t("liveClass.status.inactive")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Whiteboard Popup - Google Meet Dark Style */}
      {showWhiteboard && (
        <div className="fixed inset-0 z-50 p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-[#202124]/60"
            onClick={() => setShowWhiteboard(false)}
          />
          <div
            className={`absolute ${getWhiteboardSizeClass()} rounded-2xl sm:rounded-3xl border border-[#3c4043] bg-[#303134] shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
            onMouseMove={handleWhiteboardMouseMove}
            onMouseUp={handleWhiteboardMouseUp}
            onMouseLeave={handleWhiteboardMouseUp}
          >
            <div
              className="flex items-center justify-between gap-2 sm:gap-3 bg-[#3c4043] px-3 sm:px-4 py-2 sm:py-3 border-b border-[#5f6368] cursor-grab"
              onMouseDown={handleWhiteboardMouseDown}
            >
              <div className="flex items-center gap-2 text-[#e8eaed]">
                <Pencil size={16} className="sm:size-18 text-[#fdd663]" />
                <span className="text-xs sm:text-sm font-semibold">
                  {t("liveClass.whiteboard.title")}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setWhiteboardSize("small")}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                    whiteboardSize === "small"
                      ? "bg-[#1a73e8] text-white"
                      : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                  }`}
                >
                  {t("liveClass.popup.sizeSmall")}
                </button>
                <button
                  onClick={() => setWhiteboardSize("medium")}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                    whiteboardSize === "medium"
                      ? "bg-[#1a73e8] text-white"
                      : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                  }`}
                >
                  {t("liveClass.popup.sizeMedium")}
                </button>
                <button
                  onClick={() => setWhiteboardSize("large")}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                    whiteboardSize === "large"
                      ? "bg-[#1a73e8] text-white"
                      : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                  }`}
                >
                  {t("liveClass.popup.sizeLarge")}
                </button>
                <button
                  onClick={() => setShowWhiteboard(false)}
                  className="rounded-lg p-1 text-[#9aa0a6] hover:text-[#e8eaed]"
                >
                  <X size={18} className="sm:size-20" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-2 items-center px-2 sm:px-4 py-1.5 sm:py-3 border-b border-[#5f6368] bg-[#3c4043]">
              <button
                onClick={() => setActiveTool("pen")}
                className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                  activeTool === "pen"
                    ? "bg-[#1a73e8] text-white"
                    : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                }`}
              >
                {t("liveClass.tools.pen")}
              </button>
              <button
                onClick={() => setActiveTool("eraser")}
                className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                  activeTool === "eraser"
                    ? "bg-[#1a73e8] text-white"
                    : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                }`}
              >
                {t("liveClass.tools.eraser")}
              </button>
              <button
                onClick={() => setActiveTool("text")}
                className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                  activeTool === "text"
                    ? "bg-[#1a73e8] text-white"
                    : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                }`}
              >
                {t("liveClass.tools.text")}
              </button>
              <button
                onClick={() => setActiveTool("shape")}
                className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                  activeTool === "shape"
                    ? "bg-[#1a73e8] text-white"
                    : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                }`}
              >
                {t("liveClass.tools.shape")}
              </button>
              <label className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-[#e8eaed]">
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="h-6 w-7 sm:h-8 sm:w-10 rounded border border-[#5f6368] bg-transparent"
                />
              </label>
              <label className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-[#e8eaed]">
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={activeTool === "eraser" ? eraserSize : lineWidth}
                  onChange={(e) =>
                    activeTool === "eraser"
                      ? setEraserSize(Number(e.target.value))
                      : setLineWidth(Number(e.target.value))
                  }
                  className="h-5 sm:h-6 w-16 sm:w-20 lg:w-32 accent-[#1a73e8]"
                />
              </label>
              {activeTool === "text" && (
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t("liveClass.whiteboard.textPlaceholder")}
                  className="min-w-[80px] sm:min-w-[120px] lg:min-w-[180px] rounded-lg border border-[#5f6368] bg-[#202124] px-1.5 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-sm text-[#e8eaed] placeholder:text-[#9aa0a6] focus:outline-none focus:border-[#1a73e8]/50"
                />
              )}
              {activeTool === "shape" && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button
                    onClick={() => setShapeMode("rect")}
                    className={`rounded-lg px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs ${
                      shapeMode === "rect"
                        ? "bg-[#1a73e8] text-white"
                        : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                    }`}
                  >
                    ▭
                  </button>
                  <button
                    onClick={() => setShapeMode("circle")}
                    className={`rounded-lg px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs ${
                      shapeMode === "circle"
                        ? "bg-[#1a73e8] text-white"
                        : "bg-[#3c4043] text-[#9aa0a6] hover:bg-[#4a4d52]"
                    }`}
                  >
                    ◯
                  </button>
                </div>
              )}
              <button
                onClick={clearWhiteboard}
                className="ml-auto rounded-lg border border-[#5f6368] bg-[#3c4043] px-1.5 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs text-[#e8eaed] hover:bg-[#4a4d52]"
              >
                {t("liveClass.whiteboard.clear")}
              </button>
            </div>

            <div className="relative flex-1 bg-[#202124] overflow-hidden">
              <div className="absolute inset-0 bg-[#202124] pointer-events-none" />
              {screenSharing && (
                <div className="absolute left-2 sm:left-3 top-2 sm:top-3 rounded-full bg-[#202124]/70 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8eaed] z-10">
                  {t("liveClass.whiteboard.screenActive")}
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none z-10"
                style={{ touchAction: "none" }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                onPointerCancel={stopDrawing}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Popup - Mobile Google Meet Dark Style */}
      {showChatPopup && isMobile && (
        <div className="fixed inset-0 z-50 bg-[#202124]/60">
          <div className="absolute inset-0" onClick={() => setShowChatPopup(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#303134] rounded-t-2xl shadow-2xl overflow-hidden border-t border-[#3c4043]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3c4043] bg-[#3c4043]">
              <h3 className="text-[#e8eaed] font-medium flex items-center gap-2">
                <MessageCircle size={18} className="text-[#8ab4f8]" />
                {t("liveClass.chat.title")}
              </h3>
              <button
                onClick={() => setShowChatPopup(false)}
                className="text-[#9aa0a6] hover:text-[#e8eaed]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(85vh-50px)] overflow-hidden">
              <LiveChat
                bookingId={bookingId}
                onClose={() => setShowChatPopup(false)}
                isMobile={true}
                apiFetch={apiFetch}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                isBlocked={isChatBlocked}
                blockedMessage={isChatBlocked ? t("liveClass.chat.blockedByTutor") : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveClassPage;