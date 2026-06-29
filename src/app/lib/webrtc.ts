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

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  signalingChannel: any; // Laravel Echo channel
  userId: number;
  roomId: string;
  onRemoteStream?: (userId: number, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (userId: number) => void;
  onSignal?: (signal: { type: string; payload: any }) => void;
  onConnectionStateChange?: (userId: number, state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
}

export class WebRTCManager {
  private peers: Map<number, RemotePeer> = new Map();
  private config: WebRTCConfig;
  private localStream: MediaStream | null = null;
  private logger: boolean = true;

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  /**
   * Setup local media stream (camera + microphone)
   */
  async setupLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      console.log('[WebRTC] Getting user media with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.log('Local stream acquired', { trackCount: this.localStream.getTracks().length });
      return this.localStream;
    } catch (error) {
      this.error('Failed to get user media', error);
      throw error;
    }
  }

  /**
   * Retrieve currently stored local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Create RTCPeerConnection to remote peer
   */
  async createPeerConnection(remoteUserId: number, remoteName: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    try {
      if (this.peers.has(remoteUserId)) {
        this.log('Peer already exists, reusing', { remoteUserId });
        return this.peers.get(remoteUserId)!.connection;
      }

      const config: RTCConfiguration = {
        iceServers: this.config.iceServers || [
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        ],
      };

      const peerConnection = new RTCPeerConnection(config);
      this.log('RTCPeerConnection created', { remoteUserId, isInitiator });

      // Add local stream tracks to connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, this.localStream!);
          this.log('Track added to peer connection', { remoteUserId, kind: track.kind });
        });
      }

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        this.log('Remote track received', { remoteUserId, kind: event.track.kind });
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          const peer = this.peers.get(remoteUserId);
          if (peer) {
            peer.remoteStream = remoteStream;
            this.config.onRemoteStream?.(remoteUserId, remoteStream);
          }
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.log('ICE candidate generated', { remoteUserId, candidate: event.candidate.candidate });
          this.config.onSignal?.({
            type: 'ice-candidate',
            payload: event.candidate,
          });
        } else {
          this.log('ICE gathering complete', { remoteUserId });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        this.log('Connection state changed', { remoteUserId, state: peerConnection.connectionState });
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
        this.log('ICE connection state changed', { remoteUserId, state: peerConnection.iceConnectionState });
      };

      // Store peer
      const peer: RemotePeer = {
        userId: remoteUserId,
        userName: remoteName,
        connection: peerConnection,
        remoteStream: null,
        isInitiator,
        connectionState: 'new',
      };
      this.peers.set(remoteUserId, peer);

      return peerConnection;
    } catch (error) {
      this.error('Failed to create peer connection', error);
      throw error;
    }
  }

  /**
   * Create and send offer to remote peer
   */
  async createAndSendOffer(remoteUserId: number): Promise<void> {
    try {
      const peer = this.peers.get(remoteUserId);
      if (!peer) throw new Error('Peer not found');

      const offer = await peer.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peer.connection.setLocalDescription(offer);
      this.log('Offer created and set as local description', { remoteUserId });

      this.config.onSignal?.({
        type: 'offer',
        payload: offer,
      });
    } catch (error) {
      this.error('Failed to create/send offer', error);
      throw error;
    }
  }

  /**
   * Handle incoming offer from remote peer
   */
  async handleOffer(remoteUserId: number, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peer = this.peers.get(remoteUserId);
      if (!peer) throw new Error('Peer not found for offer');

      await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));
      this.log('Offer set as remote description', { remoteUserId });

      // Create and send answer
      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);
      this.log('Answer created and set as local description', { remoteUserId });

      this.config.onSignal?.({
        type: 'answer',
        payload: answer,
      });
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

      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
      this.log('Answer set as remote description', { remoteUserId });
    } catch (error) {
      this.error('Failed to handle answer', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate from remote peer
   */
  async addIceCandidate(remoteUserId: number, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const peer = this.peers.get(remoteUserId);
      if (!peer) {
        this.log('Peer not yet created for ICE candidate, buffering', { remoteUserId });
        return;
      }

      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      this.log('ICE candidate added', { remoteUserId });
    } catch (error) {
      // It's normal if ICE candidate is added before remote description is set
      this.log('Could not add ICE candidate (may be race condition)', { remoteUserId, error: (error as Error).message });
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
    } catch (error) {
      this.error('Error closing peer', error);
    }
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
   * Update constraints for local stream (e.g., turn off camera)
   */
  async setTrackEnabled(kind: 'audio' | 'video', enabled: boolean): Promise<void> {
    if (!this.localStream) {
      this.error('No local stream available');
      return;
    }

    this.localStream.getTracks().forEach((track) => {
      if (track.kind === kind) {
        track.enabled = enabled;
        this.log('Track enabled state changed', { kind, enabled });
      }
    });
  }

  /**
   * Replace video track with screen share track
   */
  async replaceVideoTrack(newVideoTrack: MediaStreamTrack): Promise<void> {
    try {
      // Get current video track
      const videoTracks = this.localStream?.getVideoTracks() || [];
      if (videoTracks.length === 0) {
        this.error('No video track available to replace', new Error('No local video track'));
        return;
      }

      const oldVideoTrack = videoTracks[0];

      // Replace in all peer connections
      for (const [remoteUserId, peer] of this.peers) {
        const sender = peer.connection
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          try {
            await sender.replaceTrack(newVideoTrack);
            this.log('Video track replaced in peer connection', { remoteUserId });
          } catch (error) {
            this.error('Failed to replace track in peer connection', error);
          }
        }
      }

      // Stop old track and update local stream
      oldVideoTrack.stop();
      if (this.localStream) {
        this.localStream.removeTrack(oldVideoTrack);
        this.localStream.addTrack(newVideoTrack);
      }

      this.log('Video track replaced successfully');
    } catch (error) {
      this.error('Failed to replace video track', error);
      throw error;
    }
  }

  /**
   * Cleanup and disconnect everything
   */
  destroy(): void {
    this.closeAllPeers();
    this.stopLocalStream();
    this.log('WebRTC manager destroyed');
  }

  // ──────── Private Methods ────────

  private handleConnectionFailure(remoteUserId: number): void {
    this.error('Connection failed for peer', new Error(`Peer ${remoteUserId} connection failed`));
    // TODO: Implement reconnection logic here
  }

  private handleConnectionDisconnect(remoteUserId: number): void {
    this.log('Connection disconnected for peer', { remoteUserId });
    // TODO: Implement reconnection logic here
  }

  private log(message: string, data?: any): void {
    if (this.logger) {
      console.log(`[WebRTC] ${message}`, data || '');
    }
  }

  private error(message: string, error: any): void {
    console.error(`[WebRTC] ${message}`, error);
    this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}
