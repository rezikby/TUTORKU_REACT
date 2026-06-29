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

export interface PresenceChannelConfig {
  echo: any; // Laravel Echo instance
  roomId: string;
  userId: number;
  userName: string;
  onMemberJoined?: (member: ParticipantPresence) => void;
  onMemberLeft?: (memberId: number) => void;
  onMemberUpdated?: (member: ParticipantPresence) => void;
  onParticipantsReceived?: (participants: ParticipantPresence[]) => void;
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

      // Listen for all members in the room
      this.channel.here((members: any[]) => {
        this.log('Received here members', { count: members.length });
        this.handleHere(members);
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
      this.channel.listen('.presence-update', (data: any) => {
        this.log('Presence updated', { userId: data.user_id, data });
        this.handlePresenceUpdate(data);
      });

      return Array.from(this.participants.values());
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
  updatePresence(state: Partial<ParticipantPresence>): void {
    try {
      if (!this.channel) {
        this.error('Channel not joined', new Error('Cannot update presence without joining'));
        return;
      }

      this.channel.whisper('presence-update', {
        user_id: this.config.userId,
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

      this.log('Presence updated', state);
    } catch (error) {
      this.error('Failed to update presence', error);
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
    // Clear existing participants except self
    this.participants.clear();

    // Add all members
    members.forEach((member) => {
      const participant: ParticipantPresence = {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        role: member.role,
        isAudioOn: true,
        isVideoOn: true,
        isScreenSharing: false,
        isSpeaking: false,
      };
      this.participants.set(member.id, participant);
    });

    this.log('Participants list updated', { count: this.participants.size });
    this.config.onParticipantsReceived?.(Array.from(this.participants.values()));
  }

  private handleMemberJoined(member: any): void {
    const participant: ParticipantPresence = {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      role: member.role,
      isAudioOn: true,
      isVideoOn: true,
      isScreenSharing: false,
      isSpeaking: false,
    };
    this.participants.set(member.id, participant);
    this.config.onMemberJoined?.(participant);
  }

  private handleMemberLeft(memberId: number): void {
    this.participants.delete(memberId);
    this.config.onMemberLeft?.(memberId);
  }

  private handlePresenceUpdate(data: any): void {
    const participant = this.participants.get(data.user_id);
    if (participant) {
      Object.assign(participant, data);
      this.config.onMemberUpdated?.(participant);
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
