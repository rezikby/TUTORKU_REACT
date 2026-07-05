// frontend/src/app/mahasiswa/LiveClassView.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Mic,
  Camera,
  Monitor,
  MicOff,
  VideoOff,
  Send,
  MoreVertical,
  Eye,
  EyeOff,
  Pencil,
  Hand,
  Gift,
  ThumbsUp,
  Sparkles,
} from "lucide-react";
import type { ParticipantPresence } from "../lib/presence";

type LiveClassViewProps = {
  // Local stream & controls
  localStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  isMuted: boolean;
  isVideoOff: boolean;
  screenSharing: boolean;
  
  // Participants & remote streams
  participants: ParticipantPresence[];
  remoteStreams: Map<number, MediaStream>;
  remoteVideoRefs: React.RefObject<Map<number, HTMLVideoElement | null>>;
  remoteAudioRefs: React.RefObject<Map<number, HTMLAudioElement | null>>;
  screenShareParticipant: ParticipantPresence | undefined;
  remoteScreenShareStream: MediaStream | null;
  screenVideoRef: React.RefObject<HTMLVideoElement | null>;
  
  // Whiteboard
  showWhiteboard: boolean;
  showWhiteboardSettings: boolean;
  isFullScreen: boolean;
  
  // Reactions
  reactionOverlay: string | null;
  showReactionMenu: boolean;
  
  // User info
  user: { id?: number; role?: string; name?: string } | null;
  
  // Callbacks
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleWhiteboard: () => void;
  onToggleWhiteboardSettings: () => void;
  onToggleReactionMenu: () => void;
  onOpenChat: () => void;
  onToggleFullScreen: () => void;
  onDumpWebRTCState?: () => void;
  onHandleReaction: (type: "raise-hand" | "gift" | "clap" | "sparkle") => void;
  onJoinSession?: () => void;
  
  // Display settings
  canJoin?: boolean;
  isJoining?: boolean;
};

export function LiveClassView({
  localStream,
  localVideoRef,
  isMuted,
  isVideoOff,
  screenSharing,
  participants,
  remoteStreams,
  remoteVideoRefs,
  remoteAudioRefs,
  screenShareParticipant,
  remoteScreenShareStream,
  screenVideoRef,
  showWhiteboard,
  showWhiteboardSettings,
  isFullScreen,
  reactionOverlay,
  showReactionMenu,
  user,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleWhiteboard,
  onToggleWhiteboardSettings,
  onToggleReactionMenu,
  onOpenChat,
  onToggleFullScreen,
  onDumpWebRTCState,
  onHandleReaction,
  onJoinSession,
  canJoin = false,
  isJoining = false,
}: LiveClassViewProps) {
  const { t } = useTranslation();
  const whiteboardContainerRef = useRef<HTMLDivElement | null>(null);
  const [remoteScreenShareVideoEl, setRemoteScreenShareVideoEl] = useState<HTMLVideoElement | null>(null);

  const remoteParticipants = useMemo(() => {
    const currentUserId = Number(user?.id ?? -1);
    return participants.filter(
      (participant) => Number(participant.id) !== currentUserId,
    );
  }, [participants, user?.id]);

  const mainRemoteParticipant = useMemo(() => {
    const screenSharer = remoteParticipants.find((participant) => participant.isScreenSharing);
    if (screenSharer) return screenSharer;

    if (remoteParticipants.length > 0) return remoteParticipants[0];

    const currentUserId = Number(user?.id ?? -1);
    const fallbackStreamEntry = Array.from(remoteStreams.entries()).find(
      ([userId]) => Number(userId) !== currentUserId,
    );
    if (!fallbackStreamEntry) return null;

    const [fallbackId] = fallbackStreamEntry;
    return {
      id: Number(fallbackId),
      name: t("liveClass.fallbacks.participant") ?? "Participant",
      role: "participant",
      isAudioOn: true,
      isVideoOn: false,
      isScreenSharing: false,
      isSpeaking: false,
    } as ParticipantPresence;
  }, [remoteParticipants, remoteStreams, user?.id, t]);

  const getPreferredVideoTrack = (
    videoTracks: MediaStreamTrack[],
    preferScreenTrack = false,
  ) => {
    const activeTracks = videoTracks.filter((track) => track.readyState !== 'ended');
    if (activeTracks.length === 0) return null;

    const screenTrack =
      activeTracks.find((track) => {
        const label = track.label.toLowerCase();
        return /screen|window|display|shared/.test(label);
      }) ||
      activeTracks.find((track) => {
        try {
          const settings = track.getSettings() as { displaySurface?: string | null };
          return Boolean(settings?.displaySurface);
        } catch {
          return false;
        }
      }) ||
      null;

    if (preferScreenTrack) {
      return screenTrack ?? activeTracks[0];
    }

    return activeTracks.find((track) => track !== screenTrack) ?? screenTrack ?? activeTracks[0];
  };

  const remoteScreenShareVideoStream = useMemo(() => {
    if (!remoteScreenShareStream) return null;

    const videoTrack = getPreferredVideoTrack(
      remoteScreenShareStream.getVideoTracks(),
      true,
    );
    if (!videoTrack) return null;

    // Only show the actual screen share track in the main display.
    if (!/screen|window|display|shared/i.test(videoTrack.label)) {
      return null;
    }

    return new MediaStream([videoTrack]);
  }, [remoteScreenShareStream]);

  const remoteDisplayStreams = useMemo(() => {
    const displayStreams = new Map<number, MediaStream>();
    remoteStreams.forEach((stream, userId) => {
      const videoTrack = getPreferredVideoTrack(stream.getVideoTracks(), false);
      if (videoTrack) {
        displayStreams.set(userId, new MediaStream([videoTrack]));
      }
    });
    return displayStreams;
  }, [remoteStreams]);

  useEffect(() => {
    const videoEl = remoteScreenShareVideoEl;
    if (!videoEl) return;

    if (!remoteScreenShareVideoStream && !remoteScreenShareStream) {
      console.log('[LiveClassView] Clearing remote screen share video srcObject');
      videoEl.srcObject = null;
      return;
    }

    const streamToUse = remoteScreenShareVideoStream ?? remoteScreenShareStream;
    console.log('[LiveClassView] Setting remote screen share stream', {
      streamId: streamToUse?.id,
      trackKinds: streamToUse?.getTracks().map((track) => track.kind),
      currentSrcObject: videoEl.srcObject ? (videoEl.srcObject as MediaStream).id : null,
    });

    if (videoEl.srcObject !== streamToUse) {
      videoEl.srcObject = streamToUse;
    }

    videoEl.muted = true;
    videoEl
      .play()
      .then(() => console.log('[LiveClassView] Remote screen share playing'))
      .catch((error) =>
        console.warn('[LiveClassView] Failed to play remote screen share', error),
      );
  }, [remoteScreenShareStream, remoteScreenShareVideoStream, remoteScreenShareVideoEl]);


  const statusIndicator = useMemo<React.ReactNode>(() => {
    const indicators: React.ReactNode[] = [];
    if (isMuted) {
      indicators.push(
        <span key="muted" className="inline-flex items-center gap-1">
          <MicOff size={12} />
          <span>{t('liveClass.status.micOff')}</span>
        </span>,
      );
    }
    if (isVideoOff) {
      indicators.push(
        <span key="camera" className="inline-flex items-center gap-1">
          <Camera size={12} />
          <span>{t('liveClass.status.cameraOff')}</span>
        </span>,
      );
    }
    if (screenSharing) {
      indicators.push(
        <span key="screenShare" className="inline-flex items-center gap-1">
          <Monitor size={12} />
          <span>{t('liveClass.status.screenShare')}</span>
        </span>,
      );
    }

    return indicators.length > 0 ? (
      <span className="inline-flex items-center gap-2">
        {indicators.reduce<React.ReactNode[]>((acc, indicator, idx) =>
          idx === 0
            ? [indicator]
            : [...acc, <span key={`sep-${idx}`} className="text-gray-400">•</span>, indicator],
          [],
        )}
      </span>
    ) : null;
  }, [isMuted, isVideoOff, screenSharing, t]);

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
      {/* Videos Row */}
      <div className="flex gap-3 h-32 flex-shrink-0 overflow-x-auto">
        {/* Remote Videos */}
        {remoteParticipants.length > 0 &&
          remoteParticipants.map((participant) => {
            const preferredStream =
              remoteDisplayStreams.get(participant.id) ?? remoteStreams.get(participant.id);
            const hasVideoTrack = Boolean(
              preferredStream?.getVideoTracks().some(
                (track) => track.readyState !== 'ended' && track.enabled,
              ),
            );
            const shouldShowVideo = Boolean(preferredStream && hasVideoTrack && participant.isVideoOn);

            return (
              <div
                key={participant.id}
                className="w-32 flex-shrink-0 bg-[#111325] border border-white/10 relative overflow-hidden rounded-lg"
              >
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current?.set(participant.id, el);
                      if (shouldShowVideo && preferredStream) {
                        const videoTrackCount = preferredStream.getVideoTracks().length;
                        const audioTrackCount = preferredStream.getAudioTracks().length;
                        console.info('[LiveClassView][Video] Attaching video element for participant', {
                          participantId: participant.id,
                          streamId: preferredStream.id,
                          videoTrackCount,
                          audioTrackCount,
                          currentSrcObject: el.srcObject ? (el.srcObject as MediaStream).id : null,
                        });

                        if (el.srcObject !== preferredStream) {
                          el.srcObject = preferredStream;
                        }
                        el.muted = true;
                        el.style.display = '';
                        el.play().catch((error) =>
                          console.warn('[LiveClass] Failed to play remote video', {
                            participantId: participant.id,
                            error,
                          }),
                        );
                      } else {
                        if (el.srcObject) {
                          el.srcObject = null;
                        }
                        el.style.display = 'none';
                      }
                    } else {
                      remoteVideoRefs.current?.delete(participant.id);
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  hidden={!shouldShowVideo}
                  style={{ display: shouldShowVideo ? undefined : 'none' }}
                />
                <audio
                  ref={(el) => {
                    if (el) {
                      remoteAudioRefs.current?.set(participant.id, el);
                      const stream = remoteStreams.get(participant.id);
                      if (stream) {
                        console.info('[LiveClassView][Audio] Attaching remote stream to hidden audio element', {
                          participantId: participant.id,
                          streamId: stream.id,
                          trackKinds: stream.getTracks().map((track) => track.kind),
                          audioTrackIds: stream.getAudioTracks().map((track) => track.id),
                        });
                        if (el.srcObject !== stream) {
                          el.srcObject = stream;
                        }
                        el.muted = false;
                        el.volume = 1;
                        el.play().catch((error) =>
                          console.warn('[LiveClass] Failed to play remote audio', {
                            participantId: participant.id,
                            error,
                          }),
                        );
                      }
                    } else {
                      remoteAudioRefs.current?.delete(participant.id);
                    }
                  }}
                  autoPlay
                  className="hidden"
                />
                {!shouldShowVideo && (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#1a1d2e]">
                    <div className="text-center w-full px-2">
                      {participant.avatar ? (
                        <div className="mx-auto mb-2 h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-slate-900">
                          <img
                            src={participant.avatar}
                            alt={participant.name ?? t('liveClass.fallbacks.participant')}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              const target = event.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                            {participant.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                        </div>
                      ) : (
                        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold">
                          {participant.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className="text-sm font-semibold text-white truncate">
                        {participant.name}
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 text-xs text-white font-medium rounded truncate max-w-[80px]">
                  {participant.name}
                </div>
                {participant.isScreenSharing && (
                  <div className="absolute top-2 left-2 rounded-full bg-blue-600/90 px-2 py-0.5 text-[10px] text-white font-semibold flex items-center gap-1">
                    <Monitor size={10} />
                    <span>{t('liveClass.shareLabel')}</span>
                  </div>
                )}
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
              );
            })}

        {/* Local Video */}
        <div className="w-32 flex-shrink-0 bg-[#111325] border border-white/10 relative overflow-hidden rounded-lg">
          {!isVideoOff && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          {(!localStream || isVideoOff) && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#1a1d2e]">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {user?.name ?? t('liveClass.you')}
                </span>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 text-xs text-white font-medium rounded">
            {user?.name ?? t('liveClass.you')} ({t('liveClass.you')})
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

      {/* Main Display Area */}
      <div
        ref={whiteboardContainerRef}
        className="flex-1 relative bg-[#111325] border border-white/10 overflow-hidden rounded-lg min-h-0"
      >
        {/* Reaction Overlay */}
        {reactionOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-black/70 px-5 py-4 text-5xl shadow-2xl animate-bounce">
              {reactionOverlay}
            </div>
          </div>
        )}

        {/* Full Screen Button */}
        {remoteScreenShareVideoStream && (
          <button
            onClick={onToggleFullScreen}
            className="absolute right-3 top-3 z-30 rounded-full bg-white/10 border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/20 transition"
          >
            {isFullScreen ? t('liveClass.fullscreen.exit') : t('liveClass.fullscreen.enter')}
          </button>
        )}

        

{/* Remote Screen Share or Placeholder Display */}
        {remoteScreenShareVideoStream || remoteScreenShareStream ? (
          <div className="absolute inset-0 z-10 bg-black">
            <video
              key={remoteScreenShareVideoStream?.id ?? remoteScreenShareStream?.id ?? "remote-screen-share"}
              ref={(el) => {
                setRemoteScreenShareVideoEl(el);
                const streamToUse = remoteScreenShareVideoStream ?? remoteScreenShareStream;
                if (el && streamToUse && el.srcObject !== streamToUse) {
                  el.srcObject = streamToUse;
                  el.muted = true;
                  el.play().catch((error) =>
                    console.warn('[LiveClassView] Failed to play remote screen share on ref assign', error),
                  );
                }
              }}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                try {
                  const vid = remoteScreenShareVideoEl ?? (document.activeElement as HTMLVideoElement) ?? null;
                  const tracks = (remoteScreenShareVideoStream ?? remoteScreenShareStream)?.getVideoTracks() ?? [];
                  console.log('[LiveClassView] Remote screen video loaded', {
                    videoWidth: vid?.videoWidth,
                    videoHeight: vid?.videoHeight,
                    readyState: vid?.readyState,
                    trackCount: tracks.length,
                    trackInfo: tracks.map((t) => ({ id: t.id, kind: t.kind, enabled: t.enabled, readyState: t.readyState })),
                  });
                } catch (err) {
                  console.warn('[LiveClassView] onLoadedMetadata handler error', err);
                }
              }}
              onPlay={() => console.log('[LiveClassView] Remote screen video playing')}
              onError={(e) => console.error('[LiveClassView] Remote screen video error', e)}
              className="absolute inset-0 h-full w-full object-contain block"
            />
            <div className="absolute left-3 top-3 rounded-full bg-blue-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {t('liveClass.screenShare.activeLabel')}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none">
            <div className="max-w-sm">
              {mainRemoteParticipant?.avatar ? (
                <img
                  src={mainRemoteParticipant.avatar}
                  alt={mainRemoteParticipant.name ?? t('liveClass.fallbacks.participant')}
                  className="mx-auto mb-4 h-24 w-24 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-3xl font-semibold text-white border border-white/10">
                  {mainRemoteParticipant?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <p className="text-lg font-semibold text-white mb-1">
                {mainRemoteParticipant?.name ?? t('liveClass.noScreenShare')}
              </p>
              <p className="text-sm text-gray-400">
                {mainRemoteParticipant
                  ? t('liveClass.noScreenSharePlaceholder')
                  : t('liveClass.noRemoteParticipantPlaceholder')}
              </p>
            </div>
          </div>
        )}

        {/* Grid Pattern Background */}
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

        {/* Control Bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1a1d2e]/90 border border-white/10 px-3 py-2 rounded-lg shadow-xl backdrop-blur-sm flex-wrap justify-center">
          {/* Mic Toggle */}
          <button
            onClick={onToggleMic}
            title={isMuted ? t('liveClass.buttons.unmuteMicrophone') : t('liveClass.buttons.muteMicrophone')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isMuted
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "hover:bg-white/10 text-gray-300"
            }`}
          >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={onToggleVideo}
            title={isVideoOff ? t('liveClass.buttons.turnOnCamera') : t('liveClass.buttons.turnOffCamera')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isVideoOff
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "hover:bg-white/10 text-gray-300"
            }`}
          >
            {isVideoOff ? <VideoOff size={15} /> : <Camera size={15} />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={onToggleScreenShare}
            title={screenSharing ? t('liveClass.buttons.stopScreenShare') : t('liveClass.buttons.startScreenShare')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              screenSharing
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "hover:bg-white/10 text-gray-300"
            }`}
          >
            <Monitor size={15} />
          </button>

          {/* Whiteboard Toggle */}
          <button
            onClick={onToggleWhiteboard}
            title={t('liveClass.buttons.openWhiteboard')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              showWhiteboard
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "hover:bg-white/10 text-gray-300"
            }`}
          >
            <Pencil size={15} />
          </button>

          {/* Whiteboard Settings Toggle */}
          <button
            onClick={onToggleWhiteboardSettings}
            title={t('liveClass.buttons.toggleWhiteboardSettings')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              showWhiteboardSettings
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "hover:bg-white/10 text-gray-300"
            }`}
          >
            {showWhiteboardSettings ? (
              <EyeOff size={15} />
            ) : (
              <Eye size={15} />
            )}
          </button>

          {/* Reactions Menu Toggle */}
          <button
            onClick={onToggleReactionMenu}
            title={t('liveClass.buttons.showReactions')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              showReactionMenu
                ? "bg-white/20 text-white"
                : "hover:bg-white/10 text-gray-300"
            }`}
          >
            <MoreVertical size={15} />
          </button>

          {/* Chat Button */}
          <button
            onClick={onOpenChat}
            title={t('liveClass.buttons.openChat')}
            className="w-9 h-9 rounded-lg hover:bg-white/10 text-gray-300 flex items-center justify-center transition-all"
          >
            <Send size={15} />
          </button>

          {/* Dump Button */}
          <button
            onClick={onDumpWebRTCState}
            title={t('liveClass.buttons.dumpWebRTC')}
            className="w-9 h-9 rounded-lg hover:bg-white/10 text-gray-300 flex items-center justify-center transition-all"
          >
            <span className="text-[11px] font-semibold">D</span>
          </button>
        </div>

        {/* Reactions Menu */}
        {showReactionMenu && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-[#1a1d2e]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
            <button
              onClick={() => onHandleReaction("raise-hand")}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              <Hand size={14} /> {t('liveClass.reactions.raiseHand')}
            </button>
            <button
              onClick={() => onHandleReaction("gift")}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              <Gift size={14} /> {t('liveClass.reactions.gift')}
            </button>
            <button
              onClick={() => onHandleReaction("clap")}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              <ThumbsUp size={14} /> {t('liveClass.reactions.clap')}
            </button>
            <button
              onClick={() => onHandleReaction("sparkle")}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              <Sparkles size={14} /> {t('liveClass.reactions.sparkle')}
            </button>
          </div>
        )}

        {/* Status Info */}
        {statusIndicator && (
          <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 rounded-lg text-xs text-gray-200 whitespace-nowrap">
            {statusIndicator}
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-gray-400">
        {t('liveClass.permissionNotice')}
      </div>
    </div>
  );
}

export default LiveClassView;
