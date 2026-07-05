/**
 * FILE: frontend/src/app/lib/webrtc.ts
 * WebRTC Peer-to-Peer Connection Management for Live Sessions
 * 
 * Handles:
 * - RTCPeerConnection creation and configuration
 * - Offer/Answer exchange via signaling
 * - ICE candidate gathering and trickling
 * - Local/remote stream management
 * - Connection state tracking
 * - Error handling and logging
 */

export interface RemotePeer {
  userId: number;
  userName: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
  isInitiator: boolean;
  connectionState: RTCPeerConnectionState;
}

import type { WebRTCSignalPayload } from "./webrtcSignal";

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  signalingChannel: any; // Laravel Echo channel
  userId: number;
  roomId: string;
  onRemoteStream?: (userId: number, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (userId: number) => void;
  onSignal?: (signal: WebRTCSignalPayload) => void;
  onConnectionStateChange?: (userId: number, state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
}

export class WebRTCManager {
  private peers: Map<number, RemotePeer> = new Map();
  private pendingIceCandidates: Map<number, RTCIceCandidateInit[]> = new Map();
  private addedIceCandidateKeys: Map<number, Set<string>> = new Map();
  private sentIceCandidateKeys: Map<number, Set<string>> = new Map();
  private pendingNegotiations: Set<number> = new Set();
  // Tracks when we're in the process of creating a local offer for a peer
  private makingOffer: Map<number, boolean> = new Map();
  // Prevent re-entrant setRemoteDescription calls per peer
  private isSettingRemote: Map<number, boolean> = new Map();
  // Track when we're adding initial tracks to a new peer connection
  private isInitiallyAddingTracks: Map<number, boolean> = new Map();
  private config: WebRTCConfig;
  private localStream: MediaStream | null = null;
  private logger: boolean = true;
  private connectionRestartAttempts: Map<number, number> = new Map();

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  /**
   * Setup local media stream (camera + microphone)
   */
  async setupLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      console.log('[WebRTC] Getting user media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!this.localStream) {
        this.localStream = stream;
      } else {
        const existingKinds = new Set(this.localStream.getTracks().map((track) => track.kind));
        stream.getTracks().forEach((track) => {
          if (!existingKinds.has(track.kind)) {
            this.localStream?.addTrack(track);
          }
        });
      }

      this.log('Local stream acquired', { trackCount: this.localStream.getTracks().length });
      this.addLocalStreamTracksToPeers();

      // Small delay to allow the browser to attach the new track and fire
      // any internal negotiationneeded events. This reduces races where an
      // offer is created before the track is fully attached, producing
      // an offer with `m=video 0`.
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        this.log('Paused briefly after replacing local video track to allow attachment', { peerCount: this.peers.size, delayMs: 300 });
      } catch (e) {
        this.log('Delay after replaceVideoTrack interrupted', { e });
      }
      return this.localStream;
    } catch (error) {
      this.error('Failed to get user media', error);
      throw error;
    }
  }

  /**
   * Attach an existing local stream to the manager and its peers
   */
  setLocalStream(stream: MediaStream): void {
    if (!this.localStream) {
      this.localStream = stream;
    } else {
      const existingTrackIds = new Set(this.localStream.getTracks().map((track) => track.id));
      stream.getTracks().forEach((track) => {
        if (!existingTrackIds.has(track.id)) {
          this.localStream?.addTrack(track);
        }
      });
    }

    this.addLocalStreamTracksToPeers();
  }

  /**
   * Retrieve currently stored local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  private getLocalStreamTracksInOrder(): MediaStreamTrack[] {
    if (!this.localStream) return [];

    const audioTracks = this.localStream.getAudioTracks();
    const videoTracks = this.localStream.getVideoTracks();
    return [...audioTracks, ...videoTracks];
  }

  /**
   * Wait for a video sender to be attached to the peer connection.
   * Returns true if a sender with a non-null video track is observed before timeout.
   */
  private async waitForVideoSender(remoteUserId: number, attempts = 5, delayMs = 200): Promise<boolean> {
    for (let i = 0; i < attempts; i++) {
      const peer = this.peers.get(remoteUserId);
      if (!peer) return false;

      try {
        const hasVideoSender = peer.connection.getSenders().some((s) => s.track && s.track.kind === 'video' && s.track.id);
        if (hasVideoSender) {
          this.log('Video sender detected before offer', { remoteUserId, attempt: i });
          return true;
        }
      } catch (err) {
        this.log('Error while checking for video sender', { remoteUserId, err });
      }

      this.log('Waiting for video sender to attach', { remoteUserId, attempt: i, delayMs });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    this.log('Timed out waiting for video sender before offer', { remoteUserId, attempts, delayMs });
    return false;
  }

  private ensureTransceiver(peerConnection: RTCPeerConnection, kind: 'audio' | 'video'): void {
    const existing = peerConnection.getTransceivers().find((transceiver) => {
      const trackKind = transceiver.receiver?.track?.kind ?? transceiver.sender?.track?.kind ?? null;
      return trackKind === kind;
    });

    if (existing) {
      return;
    }

    try {
      peerConnection.addTransceiver(kind, { direction: 'sendrecv' });
      this.log('Added missing transceiver for track kind', { kind });
    } catch (error) {
      this.log('Failed to add transceiver for track kind', { kind, error });
    }
  }

  private addLocalStreamTracksToPeers(): void {
    if (!this.localStream) return;

    // Deduplicate tracks in localStream by kind (keep only first of each kind)
    const seenAudio = new Set<string>();
    const seenVideo = new Set<string>();
    const uniqueTracks: MediaStreamTrack[] = [];

    this.getLocalStreamTracksInOrder().forEach((track) => {
      const trackKey = `${track.kind}:${track.id}`;
      
      if (track.kind === 'audio') {
        if (seenAudio.size === 0) {
          seenAudio.add(trackKey);
          uniqueTracks.push(track);
        } else {
          this.log('Skipping duplicate audio track in localStream', { trackId: track.id });
        }
      } else if (track.kind === 'video') {
        if (seenVideo.size < 2) {  // Allow up to 2 video tracks (camera + screen share)
          seenVideo.add(trackKey);
          uniqueTracks.push(track);
        } else {
          this.log('Skipping extra video track, already have 2 video tracks', { trackId: track.id });
        }
      } else {
        uniqueTracks.push(track);
      }
    });

    uniqueTracks.forEach((track) => {
      for (const [remoteUserId, peer] of this.peers) {
        const existingSenderByTrackId = peer.connection
          .getSenders()
          .find((sender) => sender.track?.id === track.id);

        if (existingSenderByTrackId) {
          continue;
        }

        const existingAudioSender = track.kind === 'audio'
          ? peer.connection.getSenders().find((sender) => sender.track?.kind === 'audio')
          : null;

        if (track.kind === 'audio' && existingAudioSender) {
          if (existingAudioSender.track?.id !== track.id) {
            existingAudioSender
              .replaceTrack(track)
              .then(() => {
                this.log('Replaced existing audio track in peer connection', {
                  remoteUserId,
                  kind: track.kind,
                  senderTrackId: existingAudioSender.track?.id,
                  newTrackId: track.id,
                });
              })
              .catch((error) => {
                this.error('Failed to replace existing audio track in peer connection', error);
              });
          } else {
            existingAudioSender.track.enabled = track.enabled;
          }
          continue;
        }

        try {
          if (track.kind === 'video') {
            // Allow multiple video tracks simultaneously (camera + screen share).
            peer.connection.addTrack(track, this.localStream!);
          } else {
            peer.connection.addTrack(track, this.localStream!);
          }
          this.log('Added new track to peer connection', {
            remoteUserId,
            kind: track.kind,
            trackId: track.id,
          });
          this.log('Peer senders after add', {
            remoteUserId,
            senders: peer.connection.getSenders().map((s) => ({ kind: s.track?.kind, id: s.track?.id })),
          });
        } catch (error) {
          this.error('Failed to add track to peer connection', error);
        }
      }
    });
  }

  /**
   * Create RTCPeerConnection to remote peer
   */
  async createPeerConnection(remoteUserId: number, remoteName: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    try {
      if (this.peers.has(remoteUserId)) {
        this.log('Peer already exists, reusing', { remoteUserId });
        if (!this.pendingIceCandidates.has(remoteUserId)) {
          this.pendingIceCandidates.set(remoteUserId, []);
        }
        if (!this.addedIceCandidateKeys.has(remoteUserId)) {
          this.addedIceCandidateKeys.set(remoteUserId, new Set());
        }
        return this.peers.get(remoteUserId)!.connection;
      }

      const config: RTCConfiguration = {
        iceServers: this.normalizeIceServers(this.config.iceServers),
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 1,
      };

      const peerConnection = new RTCPeerConnection(config);
      this.log('RTCPeerConnection created', {
        remoteUserId,
        isInitiator,
        iceServers: config.iceServers,
      });

      peerConnection.addEventListener('track', (event) => {
        this.log('Peer connection track event', {
          remoteUserId,
          kind: event.track.kind,
          trackId: event.track.id,
          streams: event.streams.length,
          readyState: event.track.readyState,
          enabled: event.track.enabled,
          muted: (event.track as any).muted,
          streamIds: event.streams.map((stream) => stream.id),
        });

        if (event.track.kind === 'audio') {
          console.info('[WebRTC][Audio] Remote audio track received', {
            remoteUserId,
            trackId: event.track.id,
            enabled: event.track.enabled,
            readyState: event.track.readyState,
            streamIds: event.streams.map((stream) => stream.id),
          });
        }
      });

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        this.log('Remote track received', {
          remoteUserId,
          kind: event.track.kind,
          trackId: event.track.id,
          streams: event.streams.length,
          streamIds: event.streams.map((stream) => stream.id),
          readyState: event.track.readyState,
        });

        const peer = this.peers.get(remoteUserId);
        if (!peer) return;

        if (event.track.kind === 'audio') {
          console.info('[WebRTC][Audio] ontrack fired for remote peer', {
            remoteUserId,
            trackId: event.track.id,
            enabled: event.track.enabled,
            readyState: event.track.readyState,
            streamIds: event.streams.map((stream) => stream.id),
          });
        }

        const buildRemoteStream = (): MediaStream => {
          const nextStream = new MediaStream();
          const addTrack = (track: MediaStreamTrack | null | undefined) => {
            if (!track || track.readyState === 'ended') return;
            if (!nextStream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
              nextStream.addTrack(track);
            }
          };

          peer.connection.getReceivers().forEach((receiver) => {
            addTrack(receiver.track);
          });

          event.streams.forEach((stream) => {
            stream.getTracks().forEach(addTrack);
          });

          addTrack(event.track);
          return nextStream;
        };

        const nextStream = buildRemoteStream();
        if (nextStream.getTracks().length === 0) {
          this.log('Remote stream has no tracks yet, waiting for additional track events', { remoteUserId });
          return;
        }

        peer.remoteStream = nextStream;

        event.track.onended = () => {
          this.log('Remote track ended', {
            remoteUserId,
            trackId: event.track.id,
            kind: event.track.kind,
            readyState: event.track.readyState,
          });
          this.refreshRemoteStream(remoteUserId);
        };

        // Extra diagnostics: dump receivers/transceivers and short SDP head to help debug missing video
        try {
          this.log('Remote stream ready - dump receivers/transceivers', {
            remoteUserId,
            receivers: peer.connection.getReceivers().map((r) => ({ id: r.track?.id, kind: r.track?.kind })),
            transceivers: peer.connection.getTransceivers().map((t) => ({ mid: t.mid, direction: t.direction, currentDirection: t.currentDirection })),
            remoteDescriptionHead: peer.connection.remoteDescription?.sdp?.slice(0, 200),
          });
        } catch (err) {
          this.log('Failed dumping diagnostics for remote stream', { remoteUserId, err });
        }

        this.config.onRemoteStream?.(remoteUserId, nextStream);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateInit: RTCIceCandidateInit = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment,
          };
          const candidateKey = this.createIceCandidateKey(candidateInit);
          const outboundKeys = this.sentIceCandidateKeys.get(remoteUserId) ?? new Set();
          if (outboundKeys.has(candidateKey)) {
            this.log('Skipping duplicate outbound ICE candidate', { remoteUserId, candidate: candidateInit.candidate });
            return;
          }
          outboundKeys.add(candidateKey);
          this.sentIceCandidateKeys.set(remoteUserId, outboundKeys);
          this.log('ICE candidate generated', { remoteUserId, candidate: candidateInit.candidate });
          this.config.onSignal?.({
            type: 'ice-candidate',
            payload: candidateInit,
          });
        } else {
          this.log('ICE gathering complete', { remoteUserId });
        }
      };

      peerConnection.onicecandidateerror = (event) => {
        const iceError = event as any;
        this.log('ICE candidate error', {
          remoteUserId,
          errorCode: event.errorCode,
          errorText: event.errorText,
          hostCandidate: iceError.hostCandidate,
          url: iceError.url,
        });
      };

      peerConnection.onicegatheringstatechange = () => {
        this.log('ICE gathering state changed', {
          remoteUserId,
          state: peerConnection.iceGatheringState,
          signalingState: peerConnection.signalingState,
        });
      };

      peerConnection.onnegotiationneeded = async () => {
        this.log('Negotiation needed', {
          remoteUserId,
          signalingState: peerConnection.signalingState,
          connectionState: peerConnection.connectionState,
        });

        // Skip offer creation if we're still in the middle of adding initial tracks
        // to this peer. This prevents creating an offer before all tracks are attached.
        if (this.isInitiallyAddingTracks.get(remoteUserId)) {
          this.log('Skipping negotiationneeded: still adding initial tracks', { remoteUserId });
          return;
        }

        const peer = this.peers.get(remoteUserId);
        if (!peer) {
          this.log('Skipping negotiationneeded: peer missing', { remoteUserId });
          return;
        }

        if (peerConnection.signalingState !== 'stable') {
          this.log('Skipping negotiationneeded: signaling not stable', {
            remoteUserId,
            signalingState: peerConnection.signalingState,
          });
          return;
        }

        try {
          await this.createAndSendOffer(remoteUserId);
        } catch (error) {
          this.error('Failed to renegotiate after negotiationneeded', error);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        this.log('Connection state changed', {
          remoteUserId,
          connectionState: peerConnection.connectionState,
          iceConnectionState: peerConnection.iceConnectionState,
          localDescriptionType: peerConnection.localDescription?.type,
          remoteDescriptionType: peerConnection.remoteDescription?.type,
        });
        const peer = this.peers.get(remoteUserId);
        if (peer) {
          peer.connectionState = peerConnection.connectionState;
        }
        this.config.onConnectionStateChange?.(remoteUserId, peerConnection.connectionState);

        if (peerConnection.connectionState === 'failed') {
          this.handleConnectionFailure(remoteUserId);
        }
        if (peerConnection.connectionState === 'disconnected') {
          this.handleConnectionDisconnect(remoteUserId);
        }
      };

      // Track ICE connection state separately
      peerConnection.oniceconnectionstatechange = () => {
        this.log('ICE connection state changed', {
          remoteUserId,
          iceConnectionState: peerConnection.iceConnectionState,
          connectionState: peerConnection.connectionState,
          iceGatheringState: peerConnection.iceGatheringState,
          localDescriptionType: peerConnection.localDescription?.type,
          remoteDescriptionType: peerConnection.remoteDescription?.type,
        });

        if (peerConnection.iceConnectionState === 'failed') {
          this.handleConnectionFailure(remoteUserId);
        }
      };

      // Store peer early so negotiationneeded can see it if it fires during addTrack
      const peer: RemotePeer = {
        userId: remoteUserId,
        userName: remoteName,
        connection: peerConnection,
        remoteStream: null,
        isInitiator,
        connectionState: 'new',
      };
      this.peers.set(remoteUserId, peer);
      if (!this.pendingIceCandidates.has(remoteUserId)) {
        this.pendingIceCandidates.set(remoteUserId, []);
      }
      if (!this.addedIceCandidateKeys.has(remoteUserId)) {
        this.addedIceCandidateKeys.set(remoteUserId, new Set());
      }

      // Mark that we're adding initial tracks so onnegotiationneeded won't
      // create an offer until we're done with the initial batch
      this.isInitiallyAddingTracks.set(remoteUserId, true);

      // Add local stream tracks to connection after peer registration
      if (this.localStream) {
        // Deduplicate tracks: keep only 1 audio + up to 2 video (camera + screen share)
        const seenAudio = new Set<string>();
        const seenVideo = new Set<string>();
        let addedAnyTrack = false;

        this.getLocalStreamTracksInOrder().forEach((track) => {
          if (track.kind === 'audio') {
            if (seenAudio.size > 0) {
              this.log('Skipping duplicate audio track during peer creation', { trackId: track.id });
              return;
            }
            seenAudio.add(track.id);
          } else if (track.kind === 'video') {
            if (seenVideo.size >= 2) {
              this.log('Skipping extra video track (already have 2)', { trackId: track.id });
              return;
            }
            seenVideo.add(track.id);
          }

          // Do NOT call ensureTransceiver before addTrack - addTrack will create
          // transceivers automatically. Pre-creating transceivers can cause timing
          // issues where negotiationneeded fires before all tracks are added.
          
          const alreadyAdded = peerConnection.getSenders().some(
            (sender) => sender.track?.id === track.id,
          );
          if (alreadyAdded) {
            this.log('Track already exists on new peer, skipping add', {
              remoteUserId,
              kind: track.kind,
              trackId: track.id,
            });
            return;
          }
          try {
            peerConnection.addTrack(track, this.localStream!);
            this.log('Track added to peer connection', { remoteUserId, kind: track.kind, trackId: track.id });
            addedAnyTrack = true;
          } catch (error) {
            this.error('Initial addTrack failed, attempting clone fallback', error);
            if (typeof track.clone === 'function') {
              const clonedTrack = track.clone();
              clonedTrack.enabled = track.enabled;
              peerConnection.addTrack(clonedTrack, this.localStream!);
              this.log('Track clone added to peer connection', {
                remoteUserId,
                kind: clonedTrack.kind,
                originalTrackId: track.id,
                clonedTrackId: clonedTrack.id,
              });
              addedAnyTrack = true;
            } else {
              throw error;
            }
          }
        });

        // Log final sender state after all tracks have been added
        if (addedAnyTrack) {
          const finalSenders = peerConnection.getSenders().map((s) => ({
            kind: s.track?.kind ?? null,
            trackId: s.track?.id ?? null,
          }));
          this.log('Final senders after peer creation track additions', {
            remoteUserId,
            senders: finalSenders,
          });
        }
      }

      // Mark that we've finished adding initial tracks, and it's now safe
      // for onnegotiationneeded to create an offer
      this.isInitiallyAddingTracks.set(remoteUserId, false);

      // Schedule a check to see if an offer needs to be created.
      // This handles the case where onnegotiationneeded events were skipped
      // while we were adding initial tracks.
      if (isInitiator) {
        setTimeout(async () => {
          try {
            const peer = this.peers.get(remoteUserId);
            if (peer && peer.connection.signalingState === 'stable') {
              const hasSenders = peer.connection.getSenders().length > 0;
              if (hasSenders) {
                this.log('Manually triggering offer after initial track setup', { remoteUserId, hasSenders });
                await this.createAndSendOffer(remoteUserId);
              }
            }
          } catch (err) {
            this.log('Error during post-track-add offer creation', { remoteUserId, err });
          }
        }, 0);
      }

      return peerConnection;
    } catch (error) {
      this.error('Failed to create peer connection', error);
      throw error;
    }
  }

  /**
   * Create and send offer to remote peer
   */
  private startNegotiation(remoteUserId: number): boolean {
    if (this.pendingNegotiations.has(remoteUserId)) {
      return false;
    }
    this.pendingNegotiations.add(remoteUserId);
    return true;
  }

  private endNegotiation(remoteUserId: number): void {
    this.pendingNegotiations.delete(remoteUserId);
  }

  async createAndSendOffer(remoteUserId: number): Promise<void> {
    if (!this.startNegotiation(remoteUserId)) {
      this.log('Offer creation skipped because negotiation already in progress', { remoteUserId });
      return;
    }

      try {
        this.makingOffer.set(remoteUserId, true);
        const peer = this.peers.get(remoteUserId);
        if (!peer) throw new Error('Peer not found');

        if (peer.connection.signalingState !== 'stable') {
          this.log('Skipping offer creation because signaling state is not stable', {
            remoteUserId,
            signalingState: peer.connection.signalingState,
          });
          return;
        }

        // Diagnostics: log local track/send state and timestamps to help
        // determine if offers are being created before the screen-share
        // track is attached.
        try {
          const hasLocalStream = !!this.localStream;
          const videoTrack = this.localStream?.getVideoTracks()[0] ?? null;
          const senders = peer.connection.getSenders().map((s) => ({ kind: s.track?.kind ?? null, id: s.track?.id ?? null }));
          this.log('createAndSendOffer: starting', {
            remoteUserId,
            timestamp: Date.now(),
            hasLocalStream,
            videoTrackId: videoTrack?.id ?? null,
            senders,
          });
        } catch (diagErr) {
          this.log('Failed to log offer diagnostics', { remoteUserId, diagErr });
        }

        // Wait briefly for a video sender to be attached to the connection
        // to avoid creating an offer that contains `m=video 0` due to a
        // race where the displayMedia track hasn't been added yet.
        try {
          await this.waitForVideoSender(remoteUserId, 10, 300);
        } catch (waitErr) {
          this.log('waitForVideoSender encountered an error (continuing)', { remoteUserId, waitErr });
        }

          const offer = await peer.connection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        const normalizedOffer: RTCSessionDescriptionInit = {
          type: offer.type,
          sdp: this.normalizeSdp(offer.sdp ?? ''),
        };

        await peer.connection.setLocalDescription(normalizedOffer);

        this.log('Offer created and set as local description', {
          remoteUserId,
          sdpLength: normalizedOffer.sdp?.length,
          timestamp: Date.now(),
        });

        this.config.onSignal?.({ type: 'offer', payload: normalizedOffer });
      } catch (error) {
        this.error('Failed to create/send offer', error);
        throw error;
      } finally {
        this.makingOffer.set(remoteUserId, false);
        this.endNegotiation(remoteUserId);
      }
  }

  async renegotiateWithRemote(remoteUserId: number): Promise<void> {
    if (!this.startNegotiation(remoteUserId)) {
      this.log('Renegotiate skipped because negotiation already in progress', { remoteUserId });
      return;
    }

    try {
      const peer = this.peers.get(remoteUserId);
      if (!peer) return;

      if (peer.connection.signalingState !== 'stable') {
        this.log('Skipping renegotiation because signaling state is not stable', {
          remoteUserId,
          signalingState: peer.connection.signalingState,
        });
        return;
      }

      const offer = await peer.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      const normalizedOffer: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: this.normalizeSdp(offer.sdp ?? ''),
      };

      await peer.connection.setLocalDescription(normalizedOffer);
      this.config.onSignal?.({
        type: 'offer',
        payload: normalizedOffer,
      });
    } catch (error) {
      this.error('Failed to renegotiate with remote peer', error);
    } finally {
      this.endNegotiation(remoteUserId);
    }
  }

  /**
   * Handle incoming offer from remote peer
   */
  async handleOffer(remoteUserId: number, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peer = this.peers.get(remoteUserId);
      if (!peer) throw new Error('Peer not found for offer');

      const description: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: this.normalizeSdp(offer.sdp ?? ''),
      };

      if (!this.isSessionDescription(description)) {
        this.error('Invalid offer payload received', offer);
        throw new Error('Invalid offer payload');
      }

      if (peer.connection.remoteDescription?.type === 'offer') {
        this.log('Duplicate offer received, ignoring', { remoteUserId });
        return;
      }

      // Perfect Negotiation collision handling
      const signalingState = peer.connection.signalingState;
      const makingOffer = this.makingOffer.get(remoteUserId) || false;
      const polite = (this.config.userId ?? 0) < remoteUserId; // deterministic polite decision
      const offerCollision = makingOffer || signalingState !== 'stable';

      if (offerCollision && !polite) {
        // Impolite peer: ignore incoming offer to avoid collision
        this.log('Incoming offer collision and we are impolite — ignoring incoming offer', {
          remoteUserId,
          signalingState,
          makingOffer,
          polite,
        });
        return;
      }

      if (offerCollision && polite) {
        this.log('Incoming offer collision and we are polite — rolling back local offer to accept remote', {
          remoteUserId,
          signalingState,
          makingOffer,
          polite,
        });
        try {
          await peer.connection.setLocalDescription({ type: 'rollback' });
        } catch (err) {
          this.log('Rollback failed (might not be supported), continuing anyway', { remoteUserId, err });
        }
      }

      this.log('Inspecting remote offer before applying', {
        remoteUserId,
        sdpLength: description.sdp?.length,
        type: description.type,
        signalingState,
      });

      // If the remote's offer disables video (m=video 0), add a recvonly
      // video transceiver before setting the remote description so the answer
      // will advertise an active video m=video line. This reduces the race
      // where the remote creates an offer before adding the screen-share track.
      try {
        const sdp = description.sdp ?? '';
        const videoDisabled = /m=video\s+0\b/.test(sdp);
        if (videoDisabled) {
          this.log('Remote offer contains m=video 0 — preparing recvonly video transceiver', { remoteUserId });
          const hasVideoTransceiver = peer.connection.getTransceivers().some((t) => t.receiver?.track?.kind === 'video');
          if (!hasVideoTransceiver) {
            try {
              peer.connection.addTransceiver('video', { direction: 'recvonly' });
              this.log('Proactively added recvonly video transceiver', { remoteUserId });
            } catch (err) {
              this.log('Failed to proactively add recvonly transceiver', { remoteUserId, err });
            }
          } else {
            try {
              peer.connection.getTransceivers().forEach((t) => {
                if (t.receiver?.track?.kind === 'video') {
                  try {
                    // Some browsers allow setting direction directly before answer.
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    t.direction = 'recvonly';
                    this.log('Set existing video transceiver direction to recvonly', { remoteUserId, mid: t.mid });
                  } catch (err) {
                    this.log('Failed to set transceiver direction', { remoteUserId, mid: t.mid, err });
                  }
                }
              });
            } catch (err) {
              this.log('Failed while iterating transceivers to set recvonly', { remoteUserId, err });
            }
          }
        }
      } catch (err) {
        this.log('Error detecting/adding recvonly transceiver', { remoteUserId, err });
      }

      // Now set the remote description and proceed to create an answer.
      this.log('Setting remote offer description', { remoteUserId });
      try {
        // Prevent re-entrant setRemoteDescription for this peer
        if (this.isSettingRemote.get(remoteUserId)) {
          this.log('Already setting remote description for this peer, skipping', { remoteUserId });
          return;
        }
        this.isSettingRemote.set(remoteUserId, true);

        await peer.connection.setRemoteDescription(description);
        await this.flushPendingIceCandidates(remoteUserId);
        this.log('Offer set as remote description', { remoteUserId });
      } catch (err: any) {
        this.isSettingRemote.set(remoteUserId, false);
        const msg = (err && err.message) ? String(err.message) : String(err);
        this.log('setRemoteDescription failed', { remoteUserId, msg });

        // Handle transport/SSL role mismatches and some SDP content errors by
        // recreating the RTCPeerConnection and retrying. This recovers from
        // cases where the local transport role was already assigned incorrectly
        // (e.g., due to a previous local offer) and the browser refuses to
        // apply the remote description.
        if (/Failed to set SSL role|ERROR_CONTENT|Failed to set remote offer sdp/i.test(msg)) {
          this.log('Attempting recovery: rebuilding peer connection and retrying setRemoteDescription', { remoteUserId });
          try {
            const userName = peer.userName;
            const wasInitiator = peer.isInitiator;
            // Close and remove the old peer
            try {
              peer.connection.close();
            } catch (closeErr) {
              this.log('Error closing old peer during recovery', { remoteUserId, closeErr });
            }
            this.peers.delete(remoteUserId);
            // Recreate a fresh peer connection
            const newConn = await this.createPeerConnection(remoteUserId, userName, wasInitiator);
            const newPeer = this.peers.get(remoteUserId);
            if (!newPeer) throw new Error('Failed to recreate peer during recovery');

            // If the offer had video disabled, ensure recvonly transceiver exists
            try {
              const sdp = description.sdp ?? '';
              const videoDisabled = /m=video\s+0\b/.test(sdp);
              if (videoDisabled) {
                const hasVideoTransceiver = newPeer.connection.getTransceivers().some((t) => t.receiver?.track?.kind === 'video');
                if (!hasVideoTransceiver) {
                  newPeer.connection.addTransceiver('video', { direction: 'recvonly' });
                } else {
                  newPeer.connection.getTransceivers().forEach((t) => {
                    if (t.receiver?.track?.kind === 'video') {
                      try {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        t.direction = 'recvonly';
                      } catch (e) {
                        this.log('Failed to set transceiver direction during recovery', { remoteUserId, e });
                      }
                    }
                  });
                }
              }
            } catch (e) {
              this.log('Error preparing transceivers during recovery', { remoteUserId, e });
            }

            // Retry applying remote description on the fresh connection
            await newPeer.connection.setRemoteDescription(description);
            await this.flushPendingIceCandidates(remoteUserId);
            this.log('Recovery succeeded: remote description applied on rebuilt peer', { remoteUserId });
          } catch (recoveryErr) {
            this.error('Recovery attempt failed while applying remote description', recoveryErr);
            throw err;
          }
        } else {
          throw err;
        }
      }

      // ensure we clear isSettingRemote flag if no error
      this.isSettingRemote.set(remoteUserId, false);

      await this.flushPendingIceCandidates(remoteUserId);

      // Create and send answer
      const answer = await peer.connection.createAnswer();
      const normalizedAnswer: RTCSessionDescriptionInit = {
        type: answer.type,
        sdp: this.normalizeSdp(answer.sdp ?? ''),
      };
      await peer.connection.setLocalDescription(normalizedAnswer);
      this.log('Answer created and set as local description', {
        remoteUserId,
        sdpLength: normalizedAnswer.sdp?.length,
      });

      this.config.onSignal?.({
        type: 'answer',
        payload: normalizedAnswer,
      });

      // If the incoming offer had video disabled (m=video 0), it's likely the
      // remote created the offer before starting screen-share. After we answer,
      // request a renegotiation shortly to prompt the remote to include video
      // m-line if they've since added the track.
      try {
        const videoDisabledNow = /m=video\s+0\b/.test(description.sdp ?? '');
        if (videoDisabledNow) {
          this.log('Remote offer had m=video 0 — scheduling renegotiation request', { remoteUserId });
          setTimeout(() => {
            void this.renegotiateWithRemote(remoteUserId).catch((err) => {
              this.log('Renegotiation request after answer failed', { remoteUserId, err });
            });
          }, 500);
        }
      } catch (err) {
        this.log('Error scheduling renegotiation after answer', { remoteUserId, err });
      }
    } catch (error) {
      this.error('Failed to handle offer', error);
      throw error;
    }
  }

  /**
   * Handle incoming answer from remote peer
   */
  async handleAnswer(remoteUserId: number, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peer = this.peers.get(remoteUserId);
      if (!peer) throw new Error('Peer not found for answer');

      const description: RTCSessionDescriptionInit = {
        type: answer.type,
        sdp: this.normalizeSdp(answer.sdp ?? ''),
      };

      if (!this.isSessionDescription(description)) {
        this.error('Invalid answer payload received', answer);
        throw new Error('Invalid answer payload');
      }

      if (peer.connection.remoteDescription?.type === 'answer') {
        this.log('Duplicate answer received, ignoring', { remoteUserId });
        return;
      }

      // Check signaling state - only accept answer if we're waiting for one
      const signalingState = peer.connection.signalingState;
      if (signalingState !== 'have-local-offer') {
        this.log('Ignoring answer in invalid signaling state', {
          remoteUserId,
          signalingState,
          reason: signalingState === 'stable' ? 'Connection already stable, possible race condition' : 'Unexpected state',
        });
        return;
      }

      this.log('Setting remote answer description', {
        remoteUserId,
        sdpLength: description.sdp?.length,
        type: description.type,
        signalingState,
        sdpHead: description.sdp?.slice(0, 120),
      });
      try {
        await peer.connection.setRemoteDescription(description);
        this.log('Remote description after setRemoteDescription', {
          remoteUserId,
          remoteDescriptionType: peer.connection.remoteDescription?.type,
          sdpHead: peer.connection.remoteDescription?.sdp?.slice(0, 120),
        });
        await this.flushPendingIceCandidates(remoteUserId);
        this.log('Answer set as remote description', { remoteUserId });
      } catch (err: any) {
        const msg = (err && err.message) ? String(err.message) : String(err);
        this.log('setRemoteDescription (answer) failed', { remoteUserId, msg });

        // Attempt same recovery path as handleOffer: rebuild the peer
        // connection and retry applying the remote description. This
        // addresses errors like 'Failed to set SSL role' or 'ERROR_CONTENT'
        // which can happen if the transport role is already assigned or
        // the peer is in an unexpected state.
        if (/Failed to set SSL role|ERROR_CONTENT|Failed to set remote offer sdp/i.test(msg)) {
          this.log('Attempting recovery for answer: rebuilding peer and retrying setRemoteDescription', { remoteUserId });
          try {
            const userName = peer.userName;
            const wasInitiator = peer.isInitiator;
            try {
              peer.connection.close();
            } catch (closeErr) {
              this.log('Error closing old peer during answer recovery', { remoteUserId, closeErr });
            }
            this.peers.delete(remoteUserId);
            const newConn = await this.createPeerConnection(remoteUserId, userName, wasInitiator);
            const newPeer = this.peers.get(remoteUserId);
            if (!newPeer) throw new Error('Failed to recreate peer during answer recovery');

            // Instead of trying to apply an answer on a fresh connection (which
            // will fail because we don't have a corresponding local offer),
            // initiate a fresh negotiation by creating and sending a new offer
            // from the rebuilt peer. This avoids 'Called in wrong state: stable'
            // errors and recovers from transport-role / SSL role mismatches by
            // letting the browser establish the correct transport roles.
            await this.flushPendingIceCandidates(remoteUserId);
            try {
              await this.createAndSendOffer(remoteUserId);
              this.log('Recovery succeeded: created new offer after rebuilding peer', { remoteUserId });
            } catch (offerErr) {
              this.log('Recovery: failed to create/send offer after rebuilding peer', { remoteUserId, offerErr });
              throw offerErr;
            }
          } catch (recoveryErr) {
            this.error('Recovery attempt failed while applying remote answer', recoveryErr);
            throw err;
          }
        } else {
          throw err;
        }
      }
    } catch (error) {
      this.error('Failed to handle answer', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate from remote peer
   */
  async addIceCandidate(remoteUserId: number, candidate: RTCIceCandidateInit): Promise<void> {
    let candidateInit: RTCIceCandidateInit | null = null;
    let candidateKey: string | null = null;
    try {
      const peer = this.peers.get(remoteUserId);
      candidateKey = this.createIceCandidateKey(candidate);

      if (!peer) {
        this.log('Peer not yet created for ICE candidate, buffering', { remoteUserId, candidate: candidate.candidate });
        const queue = this.pendingIceCandidates.get(remoteUserId) ?? [];
        if (candidateKey && !queue.some((queued) => this.createIceCandidateKey(queued) === candidateKey)) {
          queue.push(candidate);
          this.pendingIceCandidates.set(remoteUserId, queue);
        }
        return;
      }

      candidateInit = {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      };

      if (!this.isIceCandidate(candidateInit)) {
        this.error('Invalid ICE candidate payload received', candidate);
        throw new Error('Invalid ICE candidate payload');
      }

      const existingKeys = this.addedIceCandidateKeys.get(remoteUserId) ?? new Set();
      if (existingKeys.has(candidateKey)) {
        this.log('Skipping duplicate ICE candidate', { remoteUserId, candidate: candidateInit.candidate });
        return;
      }

      if (!peer.connection.remoteDescription?.type) {
        this.log('Remote description not set yet, queueing ICE candidate', { remoteUserId, candidate: candidateInit.candidate });
        const queue = this.pendingIceCandidates.get(remoteUserId) ?? [];
        if (!queue.some((queued) => this.createIceCandidateKey(queued) === candidateKey)) {
          queue.push(candidateInit);
          this.pendingIceCandidates.set(remoteUserId, queue);
        }
        return;
      }

      this.log('Adding ICE candidate', {
        remoteUserId,
        candidate: candidateInit.candidate,
      });
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidateInit));
      existingKeys.add(candidateKey);
      this.addedIceCandidateKeys.set(remoteUserId, existingKeys);
      this.log('ICE candidate added', { remoteUserId });
    } catch (error: any) {
      const message = error?.message ? String(error.message) : String(error);
      this.log('Could not add ICE candidate (may be race condition)', {
        remoteUserId,
        error: message,
      });

      if (/Unknown ufrag|Failed to parse ICE candidate|ICE candidate error/i.test(message)) {
        this.log('Re-queueing ICE candidate due to transient addIceCandidate failure', {
          remoteUserId,
          candidate: candidateInit?.candidate,
          reason: message,
        });

        if (candidateKey && candidateInit) {
          const queue = this.pendingIceCandidates.get(remoteUserId) ?? [];
          if (!queue.some((queued) => this.createIceCandidateKey(queued) === candidateKey)) {
            queue.push(candidateInit);
            this.pendingIceCandidates.set(remoteUserId, queue);
          }
        }
      }
    }
  }

  /**
   * Close peer connection and cleanup
   */
  closePeer(remoteUserId: number): void {
    const peer = this.peers.get(remoteUserId);
    if (!peer) return;

    try {
      peer.connection.close();
      this.log('Peer connection closed', { remoteUserId });

      if (peer.remoteStream) {
        peer.remoteStream.getTracks().forEach((track) => track.stop());
        this.config.onRemoteStreamRemoved?.(remoteUserId);
      }

      this.peers.delete(remoteUserId);
      this.pendingIceCandidates.delete(remoteUserId);
      this.addedIceCandidateKeys.delete(remoteUserId);
      this.sentIceCandidateKeys.delete(remoteUserId);
      this.connectionRestartAttempts.delete(remoteUserId);
    } catch (error) {
      this.error('Error closing peer', error);
    }
  }

  private buildRemoteStreamFromReceivers(peer: RemotePeer): MediaStream {
    const stream = new MediaStream();
    peer.connection.getReceivers().forEach((receiver) => {
      const track = receiver.track;
      if (!track || track.readyState === 'ended') return;
      if (!stream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
        stream.addTrack(track);
      }
    });
    return stream;
  }

  private refreshRemoteStream(remoteUserId: number): void {
    const peer = this.peers.get(remoteUserId);
    if (!peer) return;

    const nextStream = this.buildRemoteStreamFromReceivers(peer);
    const hadTracks = peer.remoteStream?.getTracks().length ?? 0;
    const hasTracks = nextStream.getTracks().length > 0;

    if (!hasTracks) {
      if (hadTracks) {
        peer.remoteStream = null;
        this.config.onRemoteStreamRemoved?.(remoteUserId);
      }
      return;
    }

    peer.remoteStream = nextStream;
    this.config.onRemoteStream?.(remoteUserId, nextStream);
  }

  /**
   * Close all peer connections
   */
  closeAllPeers(): void {
    this.peers.forEach((peer) => {
      this.closePeer(peer.userId);
    });
  }

  /**
   * Stop local media stream and cleanup
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        this.log('Local track stopped', { kind: track.kind });
      });
      this.localStream = null;
    }
  }

  /**
   * Get list of connected peers
   */
  getPeers(): RemotePeer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get remote stream for specific user
   */
  getRemoteStream(remoteUserId: number): MediaStream | null {
    return this.peers.get(remoteUserId)?.remoteStream || null;
  }

  /**
   * Return the remoteDescription SDP for a given remote peer, if available.
   * Useful for debugging/inspection (do not expose in production).
   */
  getRemoteDescriptionSDP(remoteUserId: number): string | null {
    const peer = this.peers.get(remoteUserId);
    if (!peer) return null;
    return peer.connection.remoteDescription?.sdp ?? null;
  }

  /**
   * Return diagnostics for a peer: receivers, transceivers, and SDP heads.
   */
  getPeerDiagnostics(remoteUserId: number): any | null {
    const peer = this.peers.get(remoteUserId);
    if (!peer) return null;

    try {
      return {
        remoteUserId,
        connectionState: peer.connection.connectionState,
        iceConnectionState: peer.connection.iceConnectionState,
        receivers: peer.connection.getReceivers().map((r) => ({ id: r.track?.id ?? null, kind: r.track?.kind ?? null, muted: (r.track as any)?.muted ?? null })),
        transceivers: peer.connection.getTransceivers().map((t) => ({ mid: t.mid, kind: t.receiver?.track?.kind ?? null, direction: t.direction, currentDirection: t.currentDirection })),
        localDescriptionHead: peer.connection.localDescription?.sdp?.slice(0, 1000) ?? null,
        remoteDescriptionHead: peer.connection.remoteDescription?.sdp?.slice(0, 1000) ?? null,
      };
    } catch (err) {
      this.log('Failed to gather peer diagnostics', { remoteUserId, err });
      return null;
    }
  }

  /**
   * Update constraints for local stream (e.g., turn off camera)
   */
  async setTrackEnabled(kind: 'audio' | 'video', enabled: boolean): Promise<void> {
    if (!this.localStream) {
      this.log('No local stream available, toggling existing senders only', { kind, enabled });
      for (const peer of this.peers.values()) {
        peer.connection.getSenders().forEach((sender) => {
          if (sender.track?.kind === kind) {
            sender.track.enabled = enabled;
            console.info('[WebRTC][Audio] Sender state changed', {
              remoteUserId: peer.userId,
              kind,
              enabled,
              senderTrackId: sender.track.id,
            });
            this.log('Sender track enabled state changed without local stream', {
              remoteUserId: peer.userId,
              kind,
              enabled,
            });
          }
        });
      }
      return;
    }

    const tracks = this.localStream.getTracks().filter((track) => track.kind === kind);
    tracks.forEach((track) => {
      track.enabled = enabled;
      this.log('Track enabled state changed', { kind, enabled, trackId: track.id });
    });

    for (const peer of this.peers.values()) {
      const sender = peer.connection.getSenders().find((candidate) => candidate.track?.kind === kind);
      if (sender?.track) {
        sender.track.enabled = enabled;
        this.log('Peer sender track enabled state changed', {
          remoteUserId: peer.userId,
          kind,
          enabled,
          senderTrackId: sender.track.id,
        });
      }
    }

    if (tracks.length > 0) {
      this.addLocalStreamTracksToPeers();
    }
  }

  /**
   * Replace video track with screen share track
   */
  async replaceVideoTrack(newVideoTrack: MediaStreamTrack): Promise<void> {
    try {
      const videoTracks = this.localStream?.getVideoTracks() || [];
      const oldVideoTrack = videoTracks[0] ?? null;
      const oldVideoTrackEnabled = oldVideoTrack?.enabled ?? true;

      if (!this.localStream) {
        this.localStream = new MediaStream();
      }

      this.log('Replacing local video track', {
        oldTrackId: oldVideoTrack?.id ?? null,
        newTrackId: newVideoTrack.id,
        newTrackKind: newVideoTrack.kind,
        hasOldVideoTrack: Boolean(oldVideoTrack),
        peerCount: this.peers.size,
      });

      if (oldVideoTrack && this.localStream.getTracks().some((track) => track.id === oldVideoTrack.id)) {
        this.localStream.removeTrack(oldVideoTrack);
      }

      if (!this.localStream.getTracks().some((track) => track.id === newVideoTrack.id)) {
        this.localStream.addTrack(newVideoTrack);
      }
      newVideoTrack.enabled = oldVideoTrackEnabled;

      for (const [remoteUserId, peer] of this.peers) {
        const videoSenders = peer.connection.getSenders().filter((sender) => sender.track?.kind === 'video');
        let replacedSender = false;

        for (const sender of videoSenders) {
          if (sender.track?.id === oldVideoTrack?.id) {
            await sender.replaceTrack(newVideoTrack);
            this.log('Replaced old video sender track during video replacement', {
              remoteUserId,
              oldTrackId: oldVideoTrack?.id,
              newTrackId: newVideoTrack.id,
            });
            replacedSender = true;
            break;
          }
        }

        if (!replacedSender && videoSenders.length > 0) {
          const sender = videoSenders[0];
          await sender.replaceTrack(newVideoTrack);
          this.log('Replaced existing video sender track during video replacement', {
            remoteUserId,
            senderTrackId: sender.track?.id,
            newTrackId: newVideoTrack.id,
          });
        }

        if (!replacedSender && videoSenders.length === 0) {
          // If there is no video sender, add the new track explicitly so the
          // remote peer can receive the screen share.
          try {
            peer.connection.addTrack(newVideoTrack, this.localStream!);
            this.log('Added new video track to peer connection during replacement', {
              remoteUserId,
              newTrackId: newVideoTrack.id,
            });
          } catch (error) {
            this.error('Failed to add new video track during replacement', error);
          }
        }
      }

      this.log('Video track replaced successfully');
    } catch (error) {
      this.error('Failed to replace video track', error);
      throw error;
    }
  }

  async removeLocalTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.localStream) return;

    if (this.localStream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
      this.localStream.removeTrack(track);
    }

    for (const [remoteUserId, peer] of this.peers) {
      const sender = peer.connection.getSenders().find((sender) => sender.track?.id === track.id);
      if (!sender) continue;

      try {
        peer.connection.removeTrack(sender);
        this.log('Removed local track from peer connection', {
          remoteUserId,
          trackId: track.id,
          kind: track.kind,
        });
      } catch (error) {
        this.error('Failed to remove track from peer connection', error);
      }

      if (peer.connection.signalingState === 'stable') {
        try {
          await this.renegotiateWithRemote(remoteUserId);
        } catch (error) {
          this.error('Failed to renegotiate after removing local track', error);
        }
      } else {
        this.log('Skipping renegotiation after removeLocalTrack because signaling not stable', {
          remoteUserId,
          signalingState: peer.connection.signalingState,
        });
      }
    }
  }

  /**
   * Cleanup and disconnect everything
   */
  destroy(): void {
    this.closeAllPeers();
    this.pendingIceCandidates.clear();
    this.addedIceCandidateKeys.clear();
    this.stopLocalStream();
    this.log('WebRTC manager destroyed');
  }

  // ──────── Private Methods ────────

  private isSessionDescription(value: any): value is RTCSessionDescriptionInit {
    return (
      value &&
      typeof value === 'object' &&
      typeof value.type === 'string' &&
      typeof value.sdp === 'string'
    );
  }

  private isIceCandidate(value: any): value is RTCIceCandidateInit {
    return (
      value &&
      typeof value === 'object' &&
      (typeof value.candidate === 'string' || typeof value.candidate === 'object')
    );
  }

  private normalizeSdp(sdp: string): string {
    return sdp
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .join('\r\n')
      .replace(/(?:\r\n)*$/, '\r\n');
  }

  private normalizeIceServers(iceServers?: RTCIceServer[]): RTCIceServer[] {
    const fallbackServers: RTCIceServer[] = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      {
        urls: ['turn:openrelay.metered.ca:443?transport=tcp'],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];

    const normalizedIceServers = (iceServers || [])
      .filter((server) => server && (server.urls || (server as any).url))
      .map((server) => {
        const normalized: RTCIceServer = { ...server };

        const serverUrls = typeof normalized.urls === 'string'
          ? normalized.urls
          : Array.isArray(normalized.urls)
          ? normalized.urls.join(',')
          : typeof (server as any).url === 'string'
          ? (server as any).url
          : '';

        const parsedUrls = serverUrls
          .split(',')
          .map((url: string) => url.trim())
          .filter(Boolean);

        normalized.urls = parsedUrls.length > 0 ? parsedUrls : [String((server as any).url)];
        return normalized;
      });

    const hasStun = normalizedIceServers.some((server) =>
      (Array.isArray(server.urls) ? server.urls : [server.urls as string]).some(
        (url) => typeof url === 'string' && url.toLowerCase().startsWith('stun:'),
      ),
    );

    const hasTurn = normalizedIceServers.some((server) =>
      (Array.isArray(server.urls) ? server.urls : [server.urls as string]).some(
        (url) => typeof url === 'string' && url.toLowerCase().startsWith('turn:'),
      ),
    );

    if (!hasStun) {
      normalizedIceServers.unshift(fallbackServers[0]);
    }
    if (!hasTurn) {
      normalizedIceServers.push(fallbackServers[1]);
    }

    return normalizedIceServers;
  }

  private log(message: string, data?: any): void {
    if (this.logger) {
      console.log(`[WebRTC] ${message}`, data || '');
    }
  }

  private async flushPendingIceCandidates(remoteUserId: number): Promise<void> {
    const queue = this.pendingIceCandidates.get(remoteUserId) ?? [];
    if (queue.length === 0) {
      return;
    }

    const peer = this.peers.get(remoteUserId);
    if (!peer) {
      return;
    }

    this.log('Flushing pending ICE candidates', {
      remoteUserId,
      queuedCount: queue.length,
      connectionState: peer.connection.connectionState,
      iceConnectionState: peer.connection.iceConnectionState,
    });

    this.log('Flushing pending ICE candidates', {
      remoteUserId,
      queuedCount: queue.length,
    });

    const existingKeys = this.addedIceCandidateKeys.get(remoteUserId) ?? new Set();
const remainingCandidates: RTCIceCandidateInit[] = [];
      for (const candidate of queue) {
      const candidateKey = this.createIceCandidateKey(candidate);
      if (existingKeys.has(candidateKey)) {
        this.log('Skipping duplicate queued ICE candidate', { remoteUserId, candidate: candidate.candidate });
        continue;
      }

      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        existingKeys.add(candidateKey);
        this.addedIceCandidateKeys.set(remoteUserId, existingKeys);
        this.log('Pending ICE candidate added', { remoteUserId, candidate: candidate.candidate });
      } catch (error: any) {
        const message = error?.message ? String(error.message) : String(error);
        this.log('Failed to add pending ICE candidate', {
          remoteUserId,
          error: message,
          candidate: candidate.candidate,
        });

        if (/Unknown ufrag|Failed to parse ICE candidate|ICE candidate error/i.test(message)) {
          this.log('Re-queueing pending ICE candidate due to transient ICE race', {
            remoteUserId,
            candidate: candidate.candidate,
            message,
          });
          remainingCandidates.push(candidate);
        }
      }
    }

    this.pendingIceCandidates.set(remoteUserId, remainingCandidates);
  }

  private createIceCandidateKey(candidate: RTCIceCandidateInit): string {
    return `${candidate.sdpMid ?? 'null'}|${candidate.sdpMLineIndex ?? 'null'}|${candidate.candidate ?? ''}`;
  }

  private dumpPeerDebugInfo(remoteUserId: number, peer: RemotePeer): void {
    const connection = peer.connection;
    this.log('Peer debug info', {
      remoteUserId,
      connectionState: connection.connectionState,
      iceConnectionState: connection.iceConnectionState,
      iceGatheringState: connection.iceGatheringState,
      localDescriptionType: connection.localDescription?.type,
      remoteDescriptionType: connection.remoteDescription?.type,
      localDescriptionSdpLength: connection.localDescription?.sdp?.length,
      remoteDescriptionSdpLength: connection.remoteDescription?.sdp?.length,
      senders: connection.getSenders().map((sender) => sender.track?.kind),
      receivers: connection.getReceivers().map((receiver) => receiver.track?.kind),
    });
  }

  private async attemptIceRestart(remoteUserId: number): Promise<void> {
    const peer = this.peers.get(remoteUserId);
    if (!peer) {
      this.log('Cannot restart ICE, peer missing', { remoteUserId });
      return;
    }

    const attempts = this.connectionRestartAttempts.get(remoteUserId) ?? 0;
    if (attempts >= 2) {
      this.error('Maximum ICE restart attempts reached', new Error(`Peer ${remoteUserId} ICE restart exhausted`));
      return;
    }

    this.connectionRestartAttempts.set(remoteUserId, attempts + 1);
    this.log('Attempting ICE restart', { remoteUserId, attempt: attempts + 1 });

    try {
      const offer = await peer.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: true,
      });

      const normalizedOffer: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: this.normalizeSdp(offer.sdp ?? ''),
      };

      await peer.connection.setLocalDescription(normalizedOffer);
      this.log('ICE restart offer created and local description set', {
        remoteUserId,
        sdpLength: normalizedOffer.sdp?.length,
      });

      this.config.onSignal?.({
        type: 'offer',
        payload: normalizedOffer,
      });
    } catch (error) {
      this.error('Failed to restart ICE', error);
    }
  }

  private handleConnectionFailure(remoteUserId: number): void {
    const peer = this.peers.get(remoteUserId);
    this.log('Connection failed for peer', { remoteUserId });
    if (peer) {
      this.dumpPeerDebugInfo(remoteUserId, peer);
      void this.attemptIceRestart(remoteUserId);
    }
  }

  private handleConnectionDisconnect(remoteUserId: number): void {
    const peer = this.peers.get(remoteUserId);
    this.log('Connection disconnected for peer', { remoteUserId, iceConnectionState: peer?.connection.iceConnectionState });
    if (peer) {
      this.dumpPeerDebugInfo(remoteUserId, peer);
      void this.attemptIceRestart(remoteUserId);
    }
  }

  private error(message: string, error: any): void {
    console.error(`[WebRTC] ${message}`, error);
    this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}
