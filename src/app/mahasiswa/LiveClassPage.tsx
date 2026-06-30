// frontend/src/app/mahasiswa/LiveClassPage.tsx
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
  ChevronLeft,
  X,
  MicOff,
  VideoOff,
  Monitor,
  MoreVertical,
  Hand,
  Gift,
  Sparkles,
  ThumbsUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { alertError, alertInfo } from "../lib/swal";
import { getEcho } from "../lib/echo";
import { WebRTCManager, type RemotePeer } from "../lib/webrtc";
import {
  PresenceChannelManager,
  type ParticipantPresence,
} from "../lib/presence";
import ChatPage from "./ChatPage";

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
  const [reactionOverlay, setReactionOverlay] = useState<string | null>(
    null,
  );
  const [drawing, setDrawing] = useState(false);
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

  // ── FIX 1: State hasJoined persisten via localStorage ──────────────────────
  // Mencegah tombol balik ke "Join Now" setelah join berhasil,
  // bahkan jika WebSocket gagal atau komponen re-render.
  const [hasJoined, setHasJoined] = useState<boolean>(() => {
    if (!bookingId) return false;
    return localStorage.getItem(`tutorku_joined_${bookingId}`) === "true";
  });

  // WebRTC & Presence State
  const [participants, setParticipants] = useState<ParticipantPresence[]>(
    [],
  );
  const [remoteStreams, setRemoteStreams] = useState<
    Map<number, MediaStream>
  >(new Map());
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(
    null,
  );
  const [presenceManager, setPresenceManager] =
    useState<PresenceChannelManager | null>(null);
  const [connectionErrors, setConnectionErrors] = useState<string[]>([]);
  const { t } = useTranslation();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Map<number, HTMLVideoElement | null>>(
    new Map(),
  );

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

  // ── FIX 2: Sinkronisasi hasJoined saat session ongoing dimuat dari API ──────
  // Jika siswa refresh halaman dan session sudah ongoing + sudah pernah join,
  // pastikan hasJoined tetap true agar tombol tidak muncul lagi.
  useEffect(() => {
    if (!bookingId || !session) return;
    if (session.status === "ongoing") {
      const alreadyJoined = localStorage.getItem(`tutorku_joined_${bookingId}`) === "true";
      if (alreadyJoined && !hasJoined) {
        setHasJoined(true);
      }
    }
    // Reset flag jika sesi sudah berakhir
    if (session.status === "ended") {
      localStorage.removeItem(`tutorku_joined_${bookingId}`);
      setHasJoined(false);
    }
  }, [session?.status, bookingId]);

  // Listen untuk real-time notification saat tutor mulai sesi
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
    if (
      !session ||
      session.status !== "ongoing" ||
      !bookingId ||
      !user?.id ||
      !localStream
    ) {
      return;
    }

    const currentUserId = user.id;
    let isActive = true;
    const setupWebRTC = async () => {
      try {
        const token = localStorage.getItem("TUTORKU_token");
        const echo = getEcho(token);

        // Setup WebRTC Manager
        const wrtcManager = new WebRTCManager({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
              ],
            },
          ],
          signalingChannel: echo,
          userId: currentUserId,
          roomId: session.room_id,
          onRemoteStream: (userId, stream) => {
            if (!isActive) return;
            console.log("[LiveClass] Remote stream received from", userId);
            setRemoteStreams((prev) => new Map(prev).set(userId, stream));
            const videoEl = remoteVideoRefs.current.get(userId);
            if (videoEl) {
              videoEl.srcObject = stream;
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
            console.log("[LiveClass] Sending WebRTC signal", signal.type);
            apiFetch(`/bookings/${bookingId}/live-session/signal`, {
              method: "POST",
              body: JSON.stringify({
                type: signal.type,
                payload: signal.payload,
              }),
            }).catch((err) => {
              console.error("[LiveClass] Failed to send signal", err);
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

        await wrtcManager.setupLocalStream({ video: true, audio: true });
        setWebrtcManager(wrtcManager);

        // Setup Presence Manager
        const presenceManager = new PresenceChannelManager({
          echo,
          roomId: session.room_id,
          userId: currentUserId,
          userName: user.name || "User",
          onParticipantsReceived: (participants) => {
            if (!isActive) return;
            console.log("[LiveClass] Participants received", {
              count: participants.length,
            });
            setParticipants(participants);

            participants.forEach(async (participant) => {
              if (participant.id === currentUserId) return;

              try {
                const isInitiator = currentUserId > participant.id;
                await wrtcManager.createPeerConnection(
                  participant.id,
                  participant.name,
                  isInitiator,
                );

                if (isInitiator) {
                  await wrtcManager.createAndSendOffer(participant.id);
                }
              } catch (error) {
                console.error("[LiveClass] Failed to setup peer", error);
              }
            });
          },
          onMemberJoined: (member) => {
            if (!isActive) return;
            console.log("[LiveClass] Member joined", member);
            setParticipants((prev) => {
              const next = prev.filter((p) => p.id !== member.id);
              return [...next, member];
            });

            wrtcManager
              .createPeerConnection(
                member.id,
                member.name,
                currentUserId > member.id,
              )
              .then(() => {
                if (currentUserId > member.id) {
                  return wrtcManager.createAndSendOffer(member.id);
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
            wrtcManager.closePeer(memberId);
          },
          onError: (error) => {
            if (!isActive) return;
            console.error("[LiveClass] Presence error", error);
            setConnectionErrors((prev) => [...prev, error.message]);
          },
        });

        const roomParticipants = await presenceManager.joinRoom();
        setPresenceManager(presenceManager);

        const presenceChannel = presenceManager.getChannel();
        if (presenceChannel) {
          presenceChannel.listen(".webrtc.signal", (data: any) => {
            if (!isActive) return;
            handleWebRTCSignal(data, wrtcManager);
          });
        }
      } catch (error) {
        if (isActive) {
          console.error("[LiveClass] Failed to setup WebRTC/Presence", error);
          setConnectionErrors((prev) => [...prev, (error as Error).message]);
        }
      }
    };

    setupWebRTC();

    return () => {
      isActive = false;
      if (webrtcManager) {
        webrtcManager.destroy();
      }
      if (presenceManager) {
        presenceManager.destroy();
      }
    };
  }, [session?.status, session?.room_id, bookingId, user?.id, localStream]);

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

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startLocalMedia = async () => {
      try {
        console.log("[LiveClass] Requesting camera/microphone access");
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log("[LiveClass] Local stream acquired successfully");
      } catch (error) {
        console.error("[LiveClass] Failed to get camera/microphone", error);
        setConnectionErrors((prev) => [
          ...prev,
          t("liveClass.error.cameraAccess"),
        ]);
      }
    };

    startLocalMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          console.log("[LiveClass] Stopping local track", { kind: track.kind });
          track.stop();
        });
      }
    };
  }, []);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

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

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
    webrtcManager?.setTrackEnabled("audio", isMuted);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsVideoOff((prev) => !prev);
    webrtcManager?.setTrackEnabled("video", isVideoOff);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStream?.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setScreenSharing(false);

      try {
        if (localStream) {
          const videoTracks = localStream.getVideoTracks();
          if (videoTracks.length === 0) {
            const newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (newVideoTrack && webrtcManager) {
              await webrtcManager.replaceVideoTrack(newVideoTrack);
            }
          }
        }
      } catch (error) {
        console.error(
          t("liveClass.error.restoreCameraAfterScreenShare"),
          error,
        );
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setScreenStream(stream);
      setScreenSharing(true);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      const screenVideoTrack = stream.getVideoTracks()[0];
      if (screenVideoTrack && webrtcManager) {
        await webrtcManager.replaceVideoTrack(screenVideoTrack);
      }

      const handleScreenShareStop = () => {
        stream.getVideoTracks()[0].onended = null;
        setScreenStream(null);
        setScreenSharing(false);
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((cameraStream) => {
            const cameraVideoTrack = cameraStream.getVideoTracks()[0];
            if (cameraVideoTrack && webrtcManager) {
              webrtcManager.replaceVideoTrack(cameraVideoTrack);
            }
          })
          .catch((error) =>
            console.error(t("liveClass.error.restoreCamera"), error),
          );
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
    const emojiMap = {
      "raise-hand": "✋",
      gift: "🎁",
      clap: "👏",
      sparkle: "✨",
    } as const;

    setReactionOverlay(emojiMap[type]);
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

  const handleWebRTCSignal = async (data: any, wrtcManager: WebRTCManager) => {
    const { from_user_id, type, payload } = data;

    if (from_user_id === user?.id) {
      return;
    }

    console.log("[LiveClass] Received WebRTC signal", {
      from_user_id,
      type,
    });

    try {
      switch (type) {
        case "offer":
          if (!wrtcManager.getPeers().find((p) => p.userId === from_user_id)) {
            const participant = participants.find(
              (p) => p.id === from_user_id,
            );
            await wrtcManager.createPeerConnection(
              from_user_id,
              participant?.name || "User",
              false,
            );
          }
          await wrtcManager.handleOffer(from_user_id, payload);
          break;

        case "answer":
          await wrtcManager.handleAnswer(from_user_id, payload);
          break;

        case "ice-candidate":
          await wrtcManager.addIceCandidate(from_user_id, payload);
          break;

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

  // ── FIX 3: canJoinSession — siswa yang sudah join tidak perlu join lagi ──────
  const canJoinSession = useMemo(() => {
    if (!session) return false;

    if (isTutor) {
      return (
        session.status === "scheduled" || session.status === "ongoing"
      );
    }

    // Siswa: hanya bisa join jika session ongoing DAN belum join sebelumnya
    return session.status === "ongoing" && !hasJoined;
  }, [session?.status, isTutor, hasJoined]);

  // ── FIX 4: joinButtonLabel — tampilkan "Bergabung" setelah berhasil join ──────
  const joinButtonLabel = useMemo(() => {
    if (joining) return t("liveClass.buttons.joining");
    if (!session) return t("liveClass.buttons.waitTutor");

    if (isTutor) {
      return session.status === "scheduled"
        ? t("liveClass.buttons.startSession")
        : t("liveClass.buttons.joinNow");
    }

    // Siswa
    if (hasJoined) return t("liveClass.buttons.joined"); // "✓ Bergabung"
    return session.status === "ongoing"
      ? t("liveClass.buttons.joinNow")
      : t("liveClass.buttons.waitTutor");
  }, [session?.status, isTutor, joining, hasJoined]);

  // ── FIX 5: handleJoinSession — simpan hasJoined ke localStorage ──────────────
  const handleJoinSession = async () => {
    if (!bookingId) return;

    if (!canJoinSession) {
      // Jika sudah join, tidak perlu info lagi — cukup diam
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

      // Tandai sebagai sudah join — persisten meski WebSocket mati
      setHasJoined(true);
      localStorage.setItem(`tutorku_joined_${bookingId}`, "true");

      console.log("[LiveClass] Join session berhasil", sessionData);
    } catch (error) {
      console.error(t("liveClass.alert.joinFailed"), error);
      alertError(t("liveClass.alert.joinFailed"));
      // Jangan set hasJoined jika ada error
    } finally {
      setJoining(false);
    }
  };

  const handleEndSession = async () => {
    if (!bookingId) return;
    setEnding(true);
    try {
      const result = await apiFetch(`/bookings/${bookingId}/live-session/end`, {
        method: "POST",
      });
      setSession(result.data ?? result);
      // Hapus flag join saat sesi berakhir
      localStorage.removeItem(`tutorku_joined_${bookingId}`);
      setHasJoined(false);
    } catch (error) {
      console.error(t("liveClass.alert.endFailed"), error);
    } finally {
      setEnding(false);
    }
  };

  const title = useMemo(() => {
    const tutorName = booking?.tutor?.name ?? t("liveClass.fallbackTutor");
    return tutorName;
  }, [booking, t]);

  return (
    <div className="h-screen flex flex-col bg-[#1a1d2e]">
      {/* Session Status Notification */}
      {session?.status === "ongoing" && (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 text-center text-sm font-medium animate-pulse">
          ✨ {t("liveClass.notifications.sessionStarted")}{" "}
          {/* ── FIX 6: Hanya tampilkan "klik join" jika belum join ── */}
          {!hasJoined && t("liveClass.notifications.clickJoin")}
        </div>
      )}
      {booking?.status === "confirmed" && session?.status !== "ongoing" && (
        <div className="bg-yellow-500/10 text-yellow-900 px-4 py-2 text-center text-sm font-medium border border-yellow-200">
          🔔{" "}
          {t("liveClass.notifications.sessionNotStarted", {
            tutor: booking?.tutor?.name ?? t("liveClass.fallbackTutor"),
          })}
        </div>
      )}

      {/* Connection Error Display */}
      {connectionErrors.length > 0 && (
        <div className="bg-red-500/10 border-l-4 border-red-500 px-4 py-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-red-500"
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
              <h3 className="font-semibold text-red-600 mb-1">
                {t("liveClass.connectionError.title")}
              </h3>
              <div className="text-red-500 space-y-1">
                {connectionErrors.map((err, idx) => (
                  <div key={idx} className="text-xs">
                    {err}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setConnectionErrors([])}
              className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1d2e]/90 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("dashboard-siswa")}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> {t("common.back")}
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">
              {t("liveClass.status.live").toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-300 truncate max-w-[150px]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded">
            <Clock size={13} className="text-yellow-400" />
            <span className="text-xs font-bold text-white">
              {session?.status === "ongoing"
                ? t("liveClass.status.live")
                : t("liveClass.status.ready")}
            </span>
          </div>
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors rounded disabled:opacity-60"
          >
            {ending ? "..." : t("liveClass.buttons.endSession")}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
          {/* Videos */}
          <div className="flex gap-3 h-32 flex-shrink-0 overflow-x-auto">
            {/* Remote Videos */}
            {participants.length > 0 &&
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className="w-32 flex-shrink-0 bg-[#111325] border border-white/10 relative overflow-hidden rounded-lg"
                >
                  <video
                    ref={(el) => {
                      if (el) remoteVideoRefs.current.set(participant.id, el);
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!remoteStreams.has(participant.id) && (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#1a1d2e]">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg font-bold text-white">
                            {participant.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {participant.name}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 text-xs text-white font-medium rounded truncate max-w-[80px]">
                    {participant.name}
                  </div>
                  {!participant.isAudioOn && (
                    <div className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1">
                      <MicOff size={10} className="text-white" />
                    </div>
                  )}
                  {!participant.isVideoOn && (
                    <div className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1">
                      <VideoOff size={10} className="text-white" />
                    </div>
                  )}
                </div>
              ))}

            {/* Local Video */}
            <div className="w-32 flex-shrink-0 bg-[#111325] border border-white/10 relative overflow-hidden rounded-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!localStream && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#1a1d2e]">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase() ??
                          t("liveClass.you").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {user?.name ?? t("liveClass.you")}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 text-xs text-white font-medium rounded">
                {user?.name ?? t("liveClass.you")} ({t("liveClass.you")})
              </div>
              {isMuted && (
                <div className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1">
                  <MicOff size={10} className="text-white" />
                </div>
              )}
              {isVideoOff && (
                <div className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1">
                  <VideoOff size={10} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Whiteboard Area */}
          <div className="flex-1 relative bg-[#111325] border border-white/10 overflow-hidden rounded-lg min-h-0">
            {reactionOverlay && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="rounded-full bg-black/70 px-5 py-4 text-5xl shadow-2xl animate-bounce">
                  {reactionOverlay}
                </div>
              </div>
            )}

            {screenSharing && showWhiteboard ? (
              <div className="absolute inset-0 z-10 bg-black">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-contain"
                />
                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                  {t("liveClass.screenShare.active")}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none">
                <div>
                  <div className="w-16 h-16 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                    <Pencil size={24} className="text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-300 font-medium">
                    {t("liveClass.whiteboard.instructions")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {session?.status === "ongoing"
                      ? t("liveClass.whiteboard.statusTeaching")
                      : t("liveClass.whiteboard.statusWaiting")}
                  </p>
                </div>
              </div>
            )}

            <svg
              className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {showWhiteboardSettings && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-[#1a1d2e]/90 border border-white/10 p-1.5 rounded-lg shadow-xl backdrop-blur-sm">
                {tools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id)}
                    title={t.label}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      activeTool === t.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            )}

            {showWhiteboardSettings && (
              <div className="absolute left-20 bottom-24 flex flex-wrap gap-2 rounded-lg border border-white/10 bg-[#1a1d2e]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <span>{t("liveClass.whiteboard.color")}</span>
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="h-8 w-10 rounded border border-white/10 bg-transparent"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <span>
                    {activeTool === "eraser"
                      ? t("liveClass.whiteboard.eraserSize")
                      : t("liveClass.whiteboard.penSize")}
                  </span>
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
                    className="h-8 w-32"
                  />
                </label>
                {activeTool === "text" && (
                  <input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t("liveClass.whiteboard.textPlaceholder")}
                    className="min-w-[160px] rounded-lg border border-white/10 bg-[#0f1427] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                )}
                {activeTool === "shape" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShapeMode("rect")}
                      className={`rounded-lg px-2 py-1 text-xs ${
                        shapeMode === "rect"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {t("liveClass.whiteboard.shapeRect")}
                    </button>
                    <button
                      onClick={() => setShapeMode("circle")}
                      className={`rounded-lg px-2 py-1 text-xs ${
                        shapeMode === "circle"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {t("liveClass.whiteboard.shapeCircle")}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearWhiteboard}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
                >
                  {t("liveClass.whiteboard.reset")}
                </button>
              </div>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1a1d2e]/90 border border-white/10 px-3 py-2 rounded-lg shadow-xl backdrop-blur-sm flex-wrap justify-center">
              {/* ── FIX 7: Tombol join — disable + warna beda jika sudah join ── */}
              <button
                onClick={handleJoinSession}
                disabled={joining || hasJoined}
                className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors mr-2 ${
                  hasJoined
                    ? "bg-emerald-800 opacity-70 cursor-default"
                    : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                }`}
              >
                {joinButtonLabel}
              </button>
              <button
                onClick={toggleMic}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  isMuted
                    ? "bg-red-500/20 text-red-400"
                    : "hover:bg-white/10 text-gray-300"
                }`}
              >
                {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              <button
                onClick={toggleVideo}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  isVideoOff
                    ? "bg-red-500/20 text-red-400"
                    : "hover:bg-white/10 text-gray-300"
                }`}
              >
                {isVideoOff ? <VideoOff size={15} /> : <Camera size={15} />}
              </button>
              <button
                onClick={toggleScreenShare}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  screenSharing
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "hover:bg-white/10 text-gray-300"
                }`}
              >
                <Monitor size={15} />
              </button>
              <button
                onClick={() => setShowWhiteboard(true)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  showWhiteboard
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "hover:bg-white/10 text-gray-300"
                }`}
                title={t("liveClass.buttons.openWhiteboard")}
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() =>
                  setShowWhiteboardSettings((prev) => !prev)
                }
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  showWhiteboardSettings
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "hover:bg-white/10 text-gray-300"
                }`}
                title={t("liveClass.buttons.toggleControls")}
              >
                {showWhiteboardSettings ? (
                  <EyeOff size={15} />
                ) : (
                  <Eye size={15} />
                )}
              </button>
              <button
                onClick={() => setShowReactionMenu((prev) => !prev)}
                className="w-9 h-9 rounded-lg hover:bg-white/10 text-gray-300 flex items-center justify-center transition-all"
              >
                <MoreVertical size={15} />
              </button>
              <button
                onClick={() => setShowChatPopup(true)}
                className="w-9 h-9 rounded-lg hover:bg-white/10 text-gray-300 flex items-center justify-center transition-all"
              >
                <Send size={15} />
              </button>
            </div>

            {showReactionMenu && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-[#1a1d2e]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
                <button
                  onClick={() => handleReaction("raise-hand")}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
                >
                  <Hand size={14} /> ✋
                </button>
                <button
                  onClick={() => handleReaction("gift")}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
                >
                  <Gift size={14} /> 🎁
                </button>
                <button
                  onClick={() => handleReaction("clap")}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
                >
                  <ThumbsUp size={14} /> 👏
                </button>
                <button
                  onClick={() => handleReaction("sparkle")}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
                >
                  <Sparkles size={14} /> ✨
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Whiteboard Popup */}
        {showWhiteboard && (
          <div className="fixed inset-0 z-50 p-2 sm:p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowWhiteboard(false)}
            />
            <div
              className={`absolute ${getWhiteboardSizeClass()} rounded-2xl sm:rounded-3xl border border-white/10 bg-[#111421] shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
              onMouseMove={handleWhiteboardMouseMove}
              onMouseUp={handleWhiteboardMouseUp}
              onMouseLeave={handleWhiteboardMouseUp}
            >
              <div
                className="flex items-center justify-between gap-2 sm:gap-3 bg-[#12182c] px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 cursor-grab"
                onMouseDown={handleWhiteboardMouseDown}
              >
                <div className="flex items-center gap-2 text-white">
                  <Pencil size={16} className="sm:size-18" />
                  <span className="text-xs sm:text-sm font-semibold">
                    {t("liveClass.popup.title")}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setWhiteboardSize("small")}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                      whiteboardSize === "small"
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {t("liveClass.popup.sizeSmall")}
                  </button>
                  <button
                    onClick={() => setWhiteboardSize("medium")}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                      whiteboardSize === "medium"
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {t("liveClass.popup.sizeMedium")}
                  </button>
                  <button
                    onClick={() => setWhiteboardSize("large")}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                      whiteboardSize === "large"
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {t("liveClass.popup.sizeLarge")}
                  </button>
                  <button
                    onClick={() => setShowWhiteboard(false)}
                    className="rounded-lg p-1 text-gray-300 hover:text-white"
                  >
                    <X size={18} className="sm:size-20" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 sm:gap-2 items-center px-2 sm:px-4 py-1.5 sm:py-3 border-b border-white/10 bg-[#111821]">
                <button
                  onClick={() => setActiveTool("pen")}
                  className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                    activeTool === "pen"
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {t("liveClass.toolButtons.pen")}
                </button>
                <button
                  onClick={() => setActiveTool("eraser")}
                  className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                    activeTool === "eraser"
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {t("liveClass.toolButtons.eraser")}
                </button>
                <button
                  onClick={() => setActiveTool("text")}
                  className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                    activeTool === "text"
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {t("liveClass.toolButtons.text")}
                </button>
                <button
                  onClick={() => setActiveTool("shape")}
                  className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs ${
                    activeTool === "shape"
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {t("liveClass.toolButtons.shape")}
                </button>
                <label className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-200">
                  <span className="hidden xs:inline">
                    {t("liveClass.whiteboard.color")}
                  </span>
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="h-6 w-7 sm:h-8 sm:w-10 rounded border border-white/10 bg-transparent"
                  />
                </label>
                <label className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-200">
                  <span className="hidden xs:inline">
                    {activeTool === "eraser"
                      ? t("liveClass.whiteboard.eraser")
                      : t("liveClass.whiteboard.size")}
                  </span>
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
                    className="h-5 sm:h-6 w-16 sm:w-20 lg:w-32 accent-blue-500"
                  />
                </label>
                {activeTool === "text" && (
                  <input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t("liveClass.whiteboard.textPlaceholder")}
                    className="min-w-[80px] sm:min-w-[120px] lg:min-w-[180px] rounded-lg border border-white/10 bg-[#0f1427] px-1.5 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                )}
                {activeTool === "shape" && (
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <button
                      onClick={() => setShapeMode("rect")}
                      className={`rounded-lg px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs ${
                        shapeMode === "rect"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      ▭
                    </button>
                    <button
                      onClick={() => setShapeMode("circle")}
                      className={`rounded-lg px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs ${
                        shapeMode === "circle"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      ◯
                    </button>
                  </div>
                )}
                <button
                  onClick={clearWhiteboard}
                  className="ml-auto rounded-lg border border-white/10 bg-white/5 px-1.5 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs text-white hover:bg-white/10"
                >
                  {t("liveClass.whiteboard.clear")}
                </button>
              </div>

              <div className="relative flex-1 bg-[#121926] overflow-hidden">
                <div className="absolute inset-0 bg-[#121926] pointer-events-none" />
                {screenSharing && (
                  <div className="absolute left-2 sm:left-3 top-2 sm:top-3 rounded-full bg-black/70 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white z-10">
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

        {showChatPopup && (
          <div className="fixed inset-0 z-50 bg-black/60 p-4">
            <div
              className="absolute inset-0"
              onClick={() => setShowChatPopup(false)}
            />
            <div className="relative mx-auto h-full max-h-[calc(100vh-2rem)] w-full max-w-[1200px] overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                onClick={() => setShowChatPopup(false)}
                className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-gray-700 shadow hover:bg-white"
              >
                <X size={20} />
              </button>
              <div className="h-full overflow-hidden">
                <ChatPage
                  apiFetch={apiFetch}
                  token={localStorage.getItem("TUTORKU_token")}
                  currentUserId={user?.id}
                  navigate={navigate}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default LiveClassPage;