export type DifficultyId = 'chill' | 'normal' | 'apocalypse';

export type ThreatType =
  | 'cat'
  | 'dog'
  | 'rain'
  | 'hen'
  | 'pigeon'
  | 'falling'
  | 'thief'
  | 'ufo'
  | 'frying_pan'
  | 'wind'
  | 'mosquito'
  | 'paparazzi';

export interface ThreatDefinition {
  type: ThreatType;
  title: string;
  subtitle: string;
  actionLabel: string;
  emoji: string;
  requiredTaps: number;
  baseDurationMs: number;
  damage: number;
  points: number;
  ownerPanicMsg: string;
  rebecaWinReply: string;
  accentBg: string;
  accentBorder: string;
}

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  badgeText: string;
  description: string;
  durationSec: number;
  spawnIntervalMinMs: number;
  spawnIntervalMaxMs: number;
  maxSimultaneous: number;
  speedMultiplier: number;
  damageMultiplier: number;
  scoreMultiplier: number;
}

export interface WhatsAppScript {
  id: string;
  sender: 'owner' | 'rebeca';
  text: string;
  delayMs?: number;
}

export interface EndingDefinition {
  id: 'legendary' | 'perfect' | 'chaotic' | 'tragic';
  title: string;
  headline: string;
  subtext: string;
  ownerFinalMsg: string;
  badge: string;
  toneBg: string;
  toneBorder: string;
}

export interface GameBundle {
  story: {
    headline: string;
    prompt: string;
    yesButton: string;
    hesitantButton: string;
    yesReply: string;
    hesitantReply: string;
  };
  difficulties: DifficultyConfig[];
  threats: ThreatDefinition[];
  ambientChats: WhatsAppScript[][];
  standalonePanicLines: string[];
  quickReplies: string[];
  endings: Record<'legendary' | 'perfect' | 'chaotic' | 'tragic', EndingDefinition>;
}

export interface SavedScore {
  id: string;
  score: number;
  hpRemaining: number;
  difficulty: DifficultyId;
  ending: 'legendary' | 'perfect' | 'chaotic' | 'tragic';
  eventsCleared: number;
  maxCombo: number;
  createdAt: string;
}
