export type GameMode = 'classic' | 'reverse' | 'even_odd' | 'shuffle';

export interface LeaderboardEntry {
  id: string;
  name: string;
  time: number; // in seconds
  accuracy: number; // percentage
  date: string;
  isPlayer?: boolean;
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
