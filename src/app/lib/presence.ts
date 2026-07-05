/**
 * FILE: frontend/src/app/lib/presence.ts
 * Presence Channel Management for Live Sessions
 *
 * Handles:
 * - Joining/leaving presence channels
 * - Tracking participant list
 * - Presence state changes (online, camera, mic, etc.)
 */

export interface ParticipantPresence {
  id: number;
  name: string;
  avatar?: string;
  role: string;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export type PresenceEventName =
  | "UserCameraOn"
  | "UserCameraOff"
  | "UserMicOn"
  | "UserMicOff"
  | "UserScreenShareStarted"
  | "UserScreenShareStopped"
  | "UserJoinedCall"
  | "UserLeftCall";

export interface PresenceChannelConfig {
  echo: any; // Laravel Echo instance
  roomId: string;
  userId: number;
  userName: string;
  onMemberJoined?: (member: ParticipantPresence) => void;
  onMemberLeft?: (memberId: number) => void;
  onMemberUpdated?: (member: ParticipantPresence) => void;
  onParticipantsReceived?: (participants: ParticipantPresence[]) => void;
  onWebRtcSignal?: (data: any) => void;
  onCommandReceived?: (command: string, payload: any) => void;
  onPresenceEvent?: (
    participant: ParticipantPresence,
    event: PresenceEventName,
    payload?: any,
  ) => void;
  onError?: (error: Error) => void;
}

export class PresenceChannelManager {
  private config: PresenceChannelConfig;
  private channel: any = null;
  private participants: Map<number, ParticipantPresence> = new Map();
  private logger: boolean = true;

  constructor(config: PresenceChannelConfig) {
    this.config = config;
  }

  /**
   * Join the presence channel for the room
   */
  async joinRoom(): Promise<ParticipantPresence[]> {
    try {
      const channelName = `live-session.${this.config.roomId}`;
      this.log('Joining presence channel', { channelName });

      this.channel = this.config.echo.join(channelName);

      if (typeof this.channel.listen === 'function') {
        this.channel.listen('.webrtc.signal', (data: any) => {
          this.log('WebRTC signal received', data);
          this.config.onWebRtcSignal?.(data);
        });
      }

      const initialParticipantsPromise = new Promise<ParticipantPresence[]>((resolve) => {
        this.channel.here((members: any[]) => {
          this.log('Received here members', { count: members.length });
          this.handleHere(members);
          resolve(Array.from(this.participants.values()));
        });
      });

      // Listen for user joining
      this.channel.joining((member: any) => {
        this.log('Member joined', { memberId: member.id, name: member.name });
        this.handleMemberJoined(member);
      });

      // Listen for user leaving
      this.channel.leaving((member: any) => {
        this.log('Member leaving', { memberId: member.id });
        this.handleMemberLeft(member.id);
      });

      // Listen for state updates (e.g., mic/camera toggle)
      if (typeof this.channel.listenForWhisper === 'function') {
        this.channel.listenForWhisper('presence-update', (data: any) => {
          this.log('Presence whisper received', { userId: data.user_id, data });
          this.handlePresenceUpdate(data);
        });
        this.channel.listenForWhisper('tutor-command', (data: any) => {
          this.log('Tutor command whisper received', { data, command: data.command, payload: data.payload, userId: data.user_id });
          this.config.onCommandReceived?.(data.command, data.payload);
        });
      } else {
        this.channel.listen('.presence-update', (data: any) => {
          this.log('Presence updated (fallback)', { userId: data.user_id, data });
          this.handlePresenceUpdate(data);
        });
        this.channel.listen('.tutor-command', (data: any) => {
          console.log('[PresenceChannelManager] Tutor command received (fallback)', { data, command: data.command, payload: data.payload });
          this.log('Tutor command received (fallback)', { data });
          this.config.onCommandReceived?.(data.command, data.payload);
        });
      }

      return initialParticipantsPromise;
    } catch (error) {
      this.error('Failed to join presence channel', error);
      throw error;
    }
  }

  /**
   * Leave the presence channel
   */
  leaveRoom(): void {
    try {
      if (this.channel) {
        this.config.echo.leave(`live-session.${this.config.roomId}`);
        this.channel = null;
        this.log('Left presence channel');
      }
    } catch (error) {
      this.error('Failed to leave presence channel', error);
    }
  }

  /**
   * Broadcast a state update to other participants
   */
  updatePresence(
    state: Partial<ParticipantPresence>,
    event?: PresenceEventName,
  ): void {
    try {
      if (!this.channel) {
        this.error('Channel not joined', new Error('Cannot update presence without joining'));
        return;
      }

      this.channel.whisper('presence-update', {
        user_id: this.config.userId,
        event,
        ...state,
      });

      // Update local state
      const currentParticipant = this.participants.get(this.config.userId) || {
        id: this.config.userId,
        name: this.config.userName,
        role: 'user',
        isAudioOn: true,
        isVideoOn: true,
        isScreenSharing: false,
        isSpeaking: false,
      };

      Object.assign(currentParticipant, state);
      this.participants.set(this.config.userId, currentParticipant);

      if (event) {
        this.config.onPresenceEvent?.(currentParticipant, event, state);
      }
      this.log('Presence updated', { state, event });
    } catch (error) {
      this.error('Failed to update presence', error);
    }
  }

  /**
   * Send a presence event to other participants without changing full presence state.
   */
  sendPresenceEvent(
    event: PresenceEventName,
    payload: Record<string, any> = {},
  ): void {
    try {
      if (!this.channel) {
        this.error('Channel not joined', new Error('Cannot send command without joining'));
        return;
      }

      this.channel.whisper('presence-update', {
        user_id: this.config.userId,
        event,
        ...payload,
      });

      this.log('Presence event sent', { event, payload });
    } catch (error) {
      this.error('Failed to send presence event', error);
    }
  }

  /**
   * Send a command to other participants via presence whisper
   */
  sendCommand(command: string, payload: Record<string, any> = {}): void {
    try {
      if (!this.channel) {
        this.error('Channel not joined', new Error('Cannot send command without joining'));
        return;
      }

      const commandData = {
        user_id: this.config.userId,
        command,
        payload,
      };

      console.log('[PresenceChannelManager] sendCommand called', { command, payload, commandData, channelExists: !!this.channel });
      this.channel.whisper('tutor-command', commandData);
      console.log('[PresenceChannelManager] whisper sent successfully', { command, payload });

      this.log('Tutor command sent', { command, payload });
    } catch (error) {
      console.error('[PresenceChannelManager] sendCommand error', { command, payload, error });
      this.error('Failed to send command', error);
    }
  }

  /**
   * Get all participants in the room
   */
  getParticipants(): ParticipantPresence[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get specific participant
   */
  getParticipant(userId: number): ParticipantPresence | undefined {
    return this.participants.get(userId);
  }

  /**
   * Add participant (for testing or initial setup)
   */
  addParticipant(participant: ParticipantPresence): void {
    this.participants.set(participant.id, participant);
    this.log('Participant added', participant);
  }

  /**
   * Get channel instance (for sending signals, etc.)
   */
  getChannel(): any {
    return this.channel;
  }

  /**
   * Cleanup and leave channel
   */
  destroy(): void {
    this.leaveRoom();
    this.participants.clear();
    this.log('Presence manager destroyed');
  }

  // ──────── Private Methods ────────

  private handleHere(members: any[]): void {
    // Normalize and clear existing participants
    this.participants.clear();

    // Add all members with actual presence state
    members.forEach((member) => {
      const participantId = Number(member.id);
      const participant: ParticipantPresence = {
        id: participantId,
        name: member.name,
        avatar: member.avatar,
        role: member.role,
        isAudioOn: member.isAudioOn ?? true,
        isVideoOn: member.isVideoOn ?? true,
        isScreenSharing: member.isScreenSharing ?? false,
        isSpeaking: member.isSpeaking ?? false,
      };
      this.participants.set(participantId, participant);
    });

    this.log('Participants list updated', { count: this.participants.size });
    this.config.onParticipantsReceived?.(Array.from(this.participants.values()));
  }

  private handleMemberJoined(member: any): void {
    const participantId = Number(member.id);
    const participant: ParticipantPresence = {
      id: participantId,
      name: member.name,
      avatar: member.avatar,
      role: member.role,
      isAudioOn: member.isAudioOn ?? true,
      isVideoOn: member.isVideoOn ?? true,
      isScreenSharing: member.isScreenSharing ?? false,
      isSpeaking: member.isSpeaking ?? false,
    };
    this.participants.set(participantId, participant);
    this.config.onMemberJoined?.(participant);
  }

  private handleMemberLeft(memberId: number): void {
    const participantId = Number(memberId);
    this.participants.delete(participantId);
    this.config.onMemberLeft?.(participantId);
  }

  private handlePresenceUpdate(data: any): void {
    const participantId = Number(data.user_id);
    if (!participantId) {
      return;
    }

    const event = data.event as PresenceEventName | undefined;

    const participant = this.participants.get(participantId);
    if (participant) {
      Object.assign(participant, data);
      this.config.onMemberUpdated?.(participant);
      if (event) {
        this.config.onPresenceEvent?.(participant, event, data);
      }
      return;
    }

    const newParticipant: ParticipantPresence = {
      id: participantId,
      name: data.name ?? `User ${participantId}`,
      avatar: data.avatar,
      role: data.role ?? 'user',
      isAudioOn: data.isAudioOn ?? true,
      isVideoOn: data.isVideoOn ?? true,
      isScreenSharing: data.isScreenSharing ?? false,
      isSpeaking: data.isSpeaking ?? false,
    };

    this.participants.set(participantId, newParticipant);
    this.config.onMemberUpdated?.(newParticipant);
    if (event) {
      this.config.onPresenceEvent?.(newParticipant, event, data);
    }
  }

  private log(message: string, data?: any): void {
    if (this.logger) {
      console.log(`[Presence] ${message}`, data || '');
    }
  }

  private error(message: string, error: any): void {
    console.error(`[Presence] ${message}`, error);
    this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}
