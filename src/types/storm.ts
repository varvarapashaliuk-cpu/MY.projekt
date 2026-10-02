export type TreeSpecies = 'oak' | 'birch' | 'spruce' | 'pine';
export type TreeState = 'healthy' | 'striking' | 'charred' | 'saved';

export interface GameTree {
  id: number; // 0, 1, 2, 3
  name: string;
  species: TreeSpecies;
  xPercent: number; // e.g. 18, 40, 62, 84
  state: TreeState;
  hotkey: string; // '1', '2', '3', '4'
}

export type TimeOfDay = 'midnight' | 'twilight' | 'foggy';

export interface StormSettings {
  windSpeed: number; // -100 to 100
  rainIntensity: number; // 0 to 1
  soundEnabled: boolean;
  volume: number; // 0 to 1
  timeOfDay: TimeOfDay;
}

export interface ActiveWave {
  type: 'single' | 'double';
  targetTreeIds: number[];
  savedTreeIds: number[];
  startTime: number;
  durationMs: number;
  expiresAt: number;
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  text: string;
  points: number;
  isDouble: boolean;
  alpha: number;
}

export type GameStatus = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

export interface LightningBolt {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  segments: { x1: number; y1: number; x2: number; y2: number; width: number; alpha: number }[];
  branches: { x1: number; y1: number; x2: number; y2: number; width: number; alpha: number }[];
  life: number;
  maxLife: number;
  intensity: number;
  isTreeStrike: boolean;
  pulses: number;
}

export interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  thickness: number;
}

export interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  isSmoke: boolean;
  treeId: number;
}

export interface GroundRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}
