export type WebRTCSignalType = 'offer' | 'answer' | 'ice-candidate' | 'hangup' | 'chunked-signal';

export interface WebRTCSignalPayload {
  type: WebRTCSignalType;
  payload: any;
}

export interface ChunkedSignalPayload {
  baseType: 'offer' | 'answer';
  chunkId: string;
  chunkIndex: number;
  chunkCount: number;
  data: string;
}

const CHUNK_SIZE = 7000;

export const shouldChunkSignal = (signal: WebRTCSignalPayload): boolean => {
  if (signal.type !== 'offer' && signal.type !== 'answer') {
    return false;
  }

  const sdp = signal.payload?.sdp;
  return typeof sdp === 'string' && sdp.length > CHUNK_SIZE;
};

export const createSignalChunks = (signal: WebRTCSignalPayload): WebRTCSignalPayload[] => {
  const sdp = signal.payload?.sdp;
  if (typeof sdp !== 'string') {
    return [signal];
  }

  const chunkId = `${signal.type}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const chunks: WebRTCSignalPayload[] = [];
  const totalChunks = Math.ceil(sdp.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i += 1) {
    const data = sdp.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    chunks.push({
      type: 'chunked-signal',
      payload: {
        baseType: signal.type,
        chunkId,
        chunkIndex: i,
        chunkCount: totalChunks,
        data,
      } as ChunkedSignalPayload,
    });
  }

  return chunks;
};

export const normalizeReceivedChunkedSignal = (
  stateMap: Map<string, string[]>,
  payload: ChunkedSignalPayload,
): { complete: boolean; signal?: WebRTCSignalPayload } => {
  const key = `${payload.baseType}:${payload.chunkId}`;
  const existing = stateMap.get(key) ?? [];
  existing[payload.chunkIndex] = payload.data;
  stateMap.set(key, existing);

  if (existing.filter(Boolean).length !== payload.chunkCount) {
    return { complete: false };
  }

  const sdp = existing.join('');
  stateMap.delete(key);

  return {
    complete: true,
    signal: {
      type: payload.baseType,
      payload: { type: payload.baseType, sdp },
    },
  };
};
