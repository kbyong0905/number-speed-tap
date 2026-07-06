export type GameMode = 'classic' | 'reverse' | 'even_odd' | 'shuffle';

export interface LeaderboardEntry {
  id: string;
  name: string;
  time: number; // in seconds
  accuracy: number; // percentage
  date: string;
  isPlayer?: boolean;
  deviceId?: string;
  mode?: GameMode;
}

export type GameStatus = 'idle' | 'playing' | 'completed';

export interface NumberBlock {
  value: number;
  isCompleted: boolean;
  // Dynamic random offsets for subtle visual styling or layout
  offsetX: number;
  offsetY: number;
  scale: number;
}

export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'completed';

export interface PlayerState {
  id: string;
  name: string;
  status: PlayerStatus;
  progress: number; // 0 to 30
  time: number | null;
  accuracy: number | null;
}

export interface Room {
  roomId: string;
  host: PlayerState | null;
  guest: PlayerState | null;
  gameMode: GameMode;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  winnerId: string | null;
  createdAt: number;
}
