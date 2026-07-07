/**
 * FILE: frontend/src/app/lib/presence.ts
 * Presence Channel Management for Live Sessions
 *
 * Handles:
 * - Joining/leaving presence channels
 * - Tracking participant list
 * - Presence state changes (online, camera, mic, etc.)
 * 
 * POLLING MODE:
 * - For shared hosting environments without real-time WebSocket support
 * - Polls participants list every 1-2 seconds
 * - Reduces server load while maintaining acceptable UX
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
  pretestCompleted?: boolean;
  pretestScore?: number | null;
  pretestTotalQuestions?: number | null;
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
  echo: any; // Laravel Echo instance (optional, untuk Reverb mode)
  bookingId: number; // For polling API calls
  roomId: string;
  userId: number;
  userName: string;
  usePolling?: boolean; // Enable polling instead of Reverb
  pollIntervalMs?: number; // Polling interval in milliseconds (default 1500)
  apiBaseUrl?: string; // API base URL for polling
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
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private lastParticipantIds: Set<number> = new Set();
  private usePolling: boolean = false;
  private pollIntervalMs: number = 1500;
  private apiBaseUrl: string = '';

  constructor(config: PresenceChannelConfig) {
    this.config = config;
    this.usePolling = config.usePolling ?? false;
    this.pollIntervalMs = config.pollIntervalMs ?? 1500;
    this.apiBaseUrl = config.apiBaseUrl ?? '/api';
  }

  /**
   * Join the presence channel for the room
   */
  async joinRoom(): Promise<ParticipantPresence[]> {
    try {
      this.log('Joining presence channel', { usePolling: this.usePolling });

      if (this.usePolling) {
        return this.joinRoomWithPolling();
      } else {
        return this.joinRoomWithReverb();
      }
    } catch (error) {
      this.error('Failed to join presence channel', error);
      throw error;
    }
  }

  /**
   * Join room using polling (for shared hosting)
   */
  private async joinRoomWithPolling(): Promise<ParticipantPresence[]> {
    try {
      // Initial fetch of participants
      const initialParticipants = await this.fetchParticipants();
      this.handleHere(initialParticipants);

      // Start polling
      this.startPolling();

      return initialParticipants;
    } catch (error) {
      this.error('Failed to join room with polling', error);
      throw error;
    }
  }

  /**
   * Join room using Reverb (traditional WebSocket)
   */
  private async joinRoomWithReverb(): Promise<ParticipantPresence[]> {
    try {
      const channelName = `live-session.${this.config.roomId}`;
      this.log('Joining presence channel via Reverb', { channelName });

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
        this.channel.listenForWhisper('participant-updated', (data: any) => {
          this.log('Participant updated whisper received', { userId: data.user_id, data });
          this.handleParticipantUpdated(data);
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
        this.channel.listen('.participant.updated', (data: any) => {
          this.log('Participant updated (fallback)', { userId: data.user_id, data });
          this.handleParticipantUpdated(data);
        });
      }

      return initialParticipantsPromise;
    } catch (error) {
      this.error('Failed to join presence channel via Reverb', error);
      throw error;
    }
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('TUTORKU_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Fetch participants from polling API
   */
  private async fetchParticipants(): Promise<ParticipantPresence[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/bookings/${this.config.bookingId}/live-session/participants`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const text = await response.text();
        this.error('Failed to fetch participants', new Error(`status=${response.status} body=${text}`));
        throw new Error(`Failed to fetch participants: ${response.status}`);
      }

      const data = await response.json();
      return data.participants || [];
    } catch (error) {
      this.error('Failed to fetch participants', error);
      return [];
    }
  }

  /**
   * Start polling for participant updates
   */
  private startPolling(): void {
    this.log('Starting polling', { intervalMs: this.pollIntervalMs });
    
    this.pollingIntervalId = setInterval(async () => {
      try {
        const participants = await this.fetchParticipants();
        this.detectParticipantChanges(participants);
      } catch (error) {
        this.error('Polling error', error);
      }
    }, this.pollIntervalMs);
  }

  /**
   * Detect changes in participant list and fire appropriate callbacks
   */
  private detectParticipantChanges(newParticipants: ParticipantPresence[]): void {
    const newParticipantIds = new Set(newParticipants.map(p => p.id));
    const oldParticipantIds = new Set(this.participants.keys());

    // Find joined participants
    for (const id of newParticipantIds) {
      if (!oldParticipantIds.has(id)) {
        const participant = newParticipants.find(p => p.id === id)!;
        this.handleMemberJoined(participant);
      }
    }

    // Find left participants
    for (const id of oldParticipantIds) {
      if (!newParticipantIds.has(id)) {
        this.handleMemberLeft(id);
      }
    }

    // Update existing participants
    for (const participant of newParticipants) {
      const existing = this.participants.get(participant.id);
      if (existing) {
        // Check for state changes
        const changed = 
          existing.isAudioOn !== participant.isAudioOn ||
          existing.isVideoOn !== participant.isVideoOn ||
          existing.isScreenSharing !== participant.isScreenSharing ||
          existing.isSpeaking !== participant.isSpeaking;

        if (changed) {
          Object.assign(existing, participant);
          this.config.onMemberUpdated?.(existing);
        }
      }
    }

    this.lastParticipantIds = newParticipantIds;
  }

  /**
   * Leave the presence channel
   */
  leaveRoom(): void {
    try {
      if (this.usePolling) {
        this.stopPolling();
      } else {
        if (this.channel) {
          this.config.echo.leave(`live-session.${this.config.roomId}`);
          this.channel = null;
        }
      }
      this.log('Left presence channel');
    } catch (error) {
      this.error('Failed to leave presence channel', error);
    }
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
      this.log('Stopped polling');
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
      if (this.usePolling) {
        this.updatePresenceViaAPI(state, event);
      } else {
        this.updatePresenceViaReverb(state, event);
      }
    } catch (error) {
      this.error('Failed to update presence', error);
    }
  }

  /**
   * Update presence via polling API
   */
  private async updatePresenceViaAPI(
    state: Partial<ParticipantPresence>,
    event?: PresenceEventName,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/bookings/${this.config.bookingId}/live-session/participants`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            is_audio_on: state.isAudioOn,
            is_video_on: state.isVideoOn,
            is_screen_sharing: state.isScreenSharing,
            is_speaking: state.isSpeaking,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        this.error('Failed to update presence', new Error(`status=${response.status} body=${text}`));
        throw new Error(`Failed to update presence: ${response.status}`);
      }

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
      this.log('Presence updated via API', { state, event });
    } catch (error) {
      this.error('Failed to update presence via API', error);
    }
  }

  /**
   * Update presence via Reverb whisper
   */
  private updatePresenceViaReverb(
    state: Partial<ParticipantPresence>,
    event?: PresenceEventName,
  ): void {
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
    this.log('Presence updated via Reverb', { state, event });
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
    this.stopPolling();
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
        pretestCompleted: member.pretestCompleted ?? member.pretest_completed ?? false,
        pretestScore: member.pretestScore ?? member.pretest_score ?? null,
        pretestTotalQuestions: member.pretestTotalQuestions ?? member.pretest_total_questions ?? null,
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
      pretestCompleted: member.pretestCompleted ?? member.pretest_completed ?? false,
      pretestScore: member.pretestScore ?? member.pretest_score ?? null,
      pretestTotalQuestions: member.pretestTotalQuestions ?? member.pretest_total_questions ?? null,
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
      pretestCompleted: data.pretestCompleted ?? data.pretest_completed ?? false,
      pretestScore: data.pretestScore ?? data.pretest_score ?? null,
      pretestTotalQuestions: data.pretestTotalQuestions ?? data.pretest_total_questions ?? null,
    };

    this.participants.set(participantId, newParticipant);
    this.config.onMemberUpdated?.(newParticipant);
    if (event) {
      this.config.onPresenceEvent?.(newParticipant, event, data);
    }
  }

  private handleParticipantUpdated(eventData: any): void {
    const participantId = Number(eventData.user_id);
    if (!participantId) {
      return;
    }

    const participantData = eventData.data;
    if (!participantData) {
      return;
    }

    const participant = this.participants.get(participantId);
    if (participant) {
      // Merge updated data
      Object.assign(participant, participantData);
      this.config.onMemberUpdated?.(participant);
      this.log('Participant updated via broadcast', { participantId, participant });
      return;
    }

    // If participant not in local list, create new one
    const newParticipant: ParticipantPresence = {
      id: participantData.id,
      name: participantData.name ?? `User ${participantId}`,
      avatar: participantData.avatar,
      role: participantData.role ?? 'user',
      isAudioOn: participantData.isAudioOn ?? true,
      isVideoOn: participantData.isVideoOn ?? true,
      isScreenSharing: participantData.isScreenSharing ?? false,
      isSpeaking: participantData.isSpeaking ?? false,
      pretestCompleted: participantData.pretestCompleted ?? false,
      pretestScore: participantData.pretestScore ?? null,
      pretestTotalQuestions: participantData.pretestTotalQuestions ?? null,
    };

    this.participants.set(participantId, newParticipant);
    this.config.onMemberUpdated?.(newParticipant);
    this.log('New participant added via broadcast', { participantId, participant: newParticipant });
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
