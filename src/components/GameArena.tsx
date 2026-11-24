import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Sparkles, Timer, Trophy, Volume2, VolumeX, RotateCcw, MessageCircle } from 'lucide-react';
import {
  DifficultyConfig,
  EndingDefinition,
  GameBundle,
  ThreatDefinition,
} from '../types/game';
import { EggCharacter, EggMood } from './EggCharacter';
import { ThreatIllustration } from './ThreatCharacters';
import { ChatBubble, WhatsAppFeed } from './WhatsAppFeed';
import { soundEngine } from '../utils/sound';

interface ActiveThreat {
  instanceId: string;
  def: ThreatDefinition;
  tapsRemaining: number;
  maxDurationMs: number;
  remainingMs: number;
}

interface FloatingFeedback {
  id: string;
  text: string;
  tone: 'good' | 'bad' | 'heal';
}

export interface GameResult {
  score: number;
  hpRemaining: number;
  eventsCleared: number;
  maxCombo: number;
  ending: EndingDefinition['id'];
}

interface GameArenaProps {
  bundle: GameBundle;
  difficulty: DifficultyConfig;
  muted: boolean;
  onToggleMute: () => void;
  onExitToStory: () => void;
  onFinish: (result: GameResult) => void;
}

function formatTimeNow(): string {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatCountdown(sec: number): string {
  const clamped = Math.max(0, Math.ceil(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const GameArena: React.FC<GameArenaProps> = ({
  bundle,
  difficulty,
  muted,
  onToggleMute,
  onExitToStory,
  onFinish,
}) => {
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [eventsCleared, setEventsCleared] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(difficulty.durationSec);
  const [activeThreats, setActiveThreats] = useState<ActiveThreat[]>([]);
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [hasUmbrella, setHasUmbrella] = useState(false);
  const [healPulse, setHealPulse] = useState(false);
  const [polishCooldownMs, setPolishCooldownMs] = useState(0);
  const [replyCooldownMs, setReplyCooldownMs] = useState(0);

  const [messages, setMessages] = useState<ChatBubble[]>(() => [
    {
      id: 'init-1',
      sender: 'owner',
      text: 'Rebeca, tô saindo agora! Olho nesse ovo pelo amor de Deus 👀🥚',
      time: formatTimeNow(),
    },
  ]);
  const [isOwnerTyping, setIsOwnerTyping] = useState(false);

  // Refs to keep interval loop deterministic and free of stale closures
  const finishedRef = useRef(false);
  const hpRef = useRef(100);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const clearedRef = useRef(0);
  const activeThreatsRef = useRef<ActiveThreat[]>([]);
  const nextSpawnInMsRef = useRef(1300);
  const lastThreatTypeRef = useRef<string | null>(null);
  const scriptTimeoutIdsRef = useRef<number[]>([]);
  const nextAmbientAtSecRef = useRef(difficulty.durationSec - 7);
  const ambientIndexRef = useRef(0);

  const pushChat = useCallback((sender: 'owner' | 'rebeca', text: string) => {
    if (sender === 'owner') {
      soundEngine.playWhatsApp();
    }
    setMessages((prev) => [
      ...prev.slice(-24),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender,
        text,
        time: formatTimeNow(),
      },
    ]);
  }, []);

  const pushFeedback = useCallback((text: string, tone: FloatingFeedback['tone']) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setFeedbacks((prev) => [...prev.slice(-4), { id, text, tone }]);
    const tid = window.setTimeout(() => {
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    }, 950);
    scriptTimeoutIdsRef.current.push(tid);
  }, []);

  const triggerFinish = useCallback(
    (finalHp: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      let ending: EndingDefinition['id'];
      if (finalHp <= 0) {
        ending = 'tragic';
        soundEngine.playTragic();
      } else if (finalHp >= 90) {
        ending = 'legendary';
        soundEngine.playVictory();
      } else if (finalHp >= 50) {
        ending = 'perfect';
        soundEngine.playVictory();
      } else {
        ending = 'chaotic';
        soundEngine.playVictory();
      }

      onFinish({
        score: scoreRef.current,
        hpRemaining: Math.max(0, Math.round(finalHp)),
        eventsCleared: clearedRef.current,
        maxCombo: maxComboRef.current,
        ending,
      });
    },
    [onFinish]
  );

  // Spawn a random threat that isn't duplicating an already active threat
  const spawnThreat = useCallback(() => {
    if (finishedRef.current) return;
    if (activeThreatsRef.current.length >= difficulty.maxSimultaneous) return;

    const activeTypes = new Set(activeThreatsRef.current.map((t) => t.def.type));
    const candidates = bundle.threats.filter(
      (t) => !activeTypes.has(t.type) && t.type !== lastThreatTypeRef.current
    );
    const pool = candidates.length > 0 ? candidates : bundle.threats.filter((t) => !activeTypes.has(t.type));
    if (pool.length === 0) return;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lastThreatTypeRef.current = chosen.type;

    const durationMs = Math.max(1900, Math.round(chosen.baseDurationMs / difficulty.speedMultiplier));
    const newThreat: ActiveThreat = {
      instanceId: `${chosen.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      def: chosen,
      tapsRemaining: chosen.requiredTaps,
      maxDurationMs: durationMs,
      remainingMs: durationMs,
    };

    activeThreatsRef.current = [...activeThreatsRef.current, newThreat];
    setActiveThreats(activeThreatsRef.current);
    soundEngine.playAlert();

    // Owner panics in WhatsApp 65% of the time on spawn (always on cat/falling/thief)
    if (
      chosen.type === 'cat' ||
      chosen.type === 'falling' ||
      chosen.type === 'thief' ||
      Math.random() < 0.6
    ) {
      setIsOwnerTyping(true);
      const tid = window.setTimeout(() => {
        setIsOwnerTyping(false);
        if (!finishedRef.current) {
          pushChat('owner', chosen.ownerPanicMsg);
        }
      }, 450);
      scriptTimeoutIdsRef.current.push(tid);
    }
  }, [bundle.threats, difficulty.maxSimultaneous, difficulty.speedMultiplier, pushChat]);

  // Handle player defending against an active threat
  const handleDefendThreat = useCallback(
    (instanceId: string) => {
      if (finishedRef.current) return;
      const target = activeThreatsRef.current.find((t) => t.instanceId === instanceId);
      if (!target) return;

      const remainingTaps = target.tapsRemaining - 1;
      if (remainingTaps > 0) {
        soundEngine.playPop();
        activeThreatsRef.current = activeThreatsRef.current.map((t) =>
          t.instanceId === instanceId ? { ...t, tapsRemaining: remainingTaps } : t
        );
        setActiveThreats(activeThreatsRef.current);
        return;
      }

      // Threat neutralized!
      soundEngine.playSuccess();
      if (target.def.type === 'rain') {
        setHasUmbrella(true);
        const tid = window.setTimeout(() => setHasUmbrella(false), 1600);
        scriptTimeoutIdsRef.current.push(tid);
      }

      activeThreatsRef.current = activeThreatsRef.current.filter((t) => t.instanceId !== instanceId);
      setActiveThreats(activeThreatsRef.current);

      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);

      if (nextCombo > maxComboRef.current) {
        maxComboRef.current = nextCombo;
        setMaxCombo(nextCombo);
      }

      clearedRef.current += 1;
      setEventsCleared(clearedRef.current);

      const speedBonus = Math.round((target.remainingMs / target.maxDurationMs) * 60);
      const comboBonus = Math.min(nextCombo * 15, 150);
      const earned = Math.round((target.def.points + speedBonus + comboBonus) * difficulty.scoreMultiplier);

      scoreRef.current += earned;
      setScore(scoreRef.current);
      pushFeedback(`+${earned} pts · Salvo!`, 'good');

      // Occasional automatic Rebeca reply on WhatsApp after saving
      if (Math.random() < 0.45) {
        const tid = window.setTimeout(() => {
          if (!finishedRef.current) {
            pushChat('rebeca', target.def.rebecaWinReply);
          }
        }, 350);
        scriptTimeoutIdsRef.current.push(tid);
      }
    },
    [difficulty.scoreMultiplier, pushChat, pushFeedback]
  );

  const handlePolishEgg = useCallback(() => {
    if (finishedRef.current || polishCooldownMs > 0) return;
    soundEngine.playHeal();
    setHealPulse(true);
    const tid = window.setTimeout(() => setHealPulse(false), 400);
    scriptTimeoutIdsRef.current.push(tid);

    const healed = Math.min(100, hpRef.current + 6) - hpRef.current;
    hpRef.current = Math.min(100, hpRef.current + 6);
    setHp(hpRef.current);

    scoreRef.current += 25;
    setScore(scoreRef.current);
    setPolishCooldownMs(6000);
    pushFeedback(healed > 0 ? `+${healed} HP · Ovo brilhando!` : '+25 pts · Carinho no ovo!', 'heal');
  }, [polishCooldownMs, pushFeedback]);

  const handleQuickReply = useCallback(
    (text: string) => {
      if (finishedRef.current || replyCooldownMs > 0) return;
      soundEngine.playPop();
      pushChat('rebeca', text);
      scoreRef.current += 15;
      setScore(scoreRef.current);
      setReplyCooldownMs(2500);
      pushFeedback('+15 pts · Respondeu!', 'good');
    },
    [pushChat, pushFeedback, replyCooldownMs]
  );

  // Keyboard shortcuts (1, 2 for threats, Space for polish)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (finishedRef.current) return;
      if (e.key === '1' && activeThreatsRef.current[0]) {
        e.preventDefault();
        handleDefendThreat(activeThreatsRef.current[0].instanceId);
      } else if (e.key === '2' && activeThreatsRef.current[1]) {
        e.preventDefault();
        handleDefendThreat(activeThreatsRef.current[1].instanceId);
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (activeThreatsRef.current.length === 1) {
          handleDefendThreat(activeThreatsRef.current[0].instanceId);
        } else {
          handlePolishEgg();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDefendThreat, handlePolishEgg]);

  // Main 100ms game tick loop
  useEffect(() => {
    const TICK_MS = 100;
    const interval = window.setInterval(() => {
      if (finishedRef.current) return;

      // Update cooldowns
      setPolishCooldownMs((prev) => Math.max(0, prev - TICK_MS));
      setReplyCooldownMs((prev) => Math.max(0, prev - TICK_MS));

      // Countdown timer
      setTimeLeftSec((prevSec) => {
        const nextSec = Math.max(0, prevSec - TICK_MS / 1000);

        // Trigger scripted ambient WhatsApp exchanges
        if (nextSec <= nextAmbientAtSecRef.current && nextSec > 3) {
          const scriptIdx = ambientIndexRef.current;
          ambientIndexRef.current += 1;
          nextAmbientAtSecRef.current = nextSec - 13;

          if (scriptIdx < bundle.ambientChats.length) {
            const chain = bundle.ambientChats[scriptIdx];
            chain.forEach((line) => {
              const tid = window.setTimeout(() => {
                if (!finishedRef.current) {
                  pushChat(line.sender, line.text);
                }
              }, line.delayMs || 0);
              scriptTimeoutIdsRef.current.push(tid);
            });
          } else {
            const randomLine =
              bundle.standalonePanicLines[
                Math.floor(Math.random() * bundle.standalonePanicLines.length)
              ];
            pushChat('owner', randomLine);
          }
        }

        if (nextSec <= 0) {
          triggerFinish(hpRef.current);
        }
        return nextSec;
      });

      // Spawn timer
      nextSpawnInMsRef.current -= TICK_MS;
      if (nextSpawnInMsRef.current <= 0) {
        spawnThreat();
        const span = difficulty.spawnIntervalMaxMs - difficulty.spawnIntervalMinMs;
        nextSpawnInMsRef.current =
          difficulty.spawnIntervalMinMs + Math.round(Math.random() * span);
      }

      // Tick active threats
      if (activeThreatsRef.current.length > 0) {
        const expired: ActiveThreat[] = [];
        const stillActive: ActiveThreat[] = [];

        for (const t of activeThreatsRef.current) {
          const nextRem = t.remainingMs - TICK_MS;
          if (nextRem <= 0) {
            expired.push(t);
          } else {
            stillActive.push({ ...t, remainingMs: nextRem });
          }
        }

        if (expired.length > 0) {
          let totalDamage = 0;
          for (const exp of expired) {
            totalDamage += Math.round(exp.def.damage * difficulty.damageMultiplier);
          }
          soundEngine.playHurt();
          comboRef.current = 0;
          setCombo(0);

          const nextHp = Math.max(0, hpRef.current - totalDamage);
          hpRef.current = nextHp;
          setHp(nextHp);
          pushFeedback(`-${totalDamage} HP! Ai! 💥`, 'bad');
          pushChat('owner', 'REBECA DO CÉU!! O OVO TOMOU DANO!! NÃO DEIXA ELE QUEBRAR!');

          if (nextHp <= 0) {
            activeThreatsRef.current = [];
            setActiveThreats([]);
            triggerFinish(0);
            return;
          }
        }

        activeThreatsRef.current = stillActive;
        setActiveThreats(stillActive);
      }
    }, TICK_MS);

    return () => {
      window.clearInterval(interval);
      scriptTimeoutIdsRef.current.forEach((tid) => window.clearTimeout(tid));
      scriptTimeoutIdsRef.current = [];
    };
  }, [
    bundle.ambientChats,
    bundle.standalonePanicLines,
    difficulty.damageMultiplier,
    difficulty.spawnIntervalMaxMs,
    difficulty.spawnIntervalMinMs,
    pushChat,
    pushFeedback,
    spawnThreat,
    triggerFinish,
  ]);

  // Derived Egg Mood & Status Label (never color-only!)
  const eggMood: EggMood = useMemo(() => {
    if (hp <= 0) return 'cracked';
    if (activeThreats.some((t) => t.def.type === 'falling')) return 'falling';
    if (activeThreats.length > 0 || hp < 45) return 'panicked';
    if (hp < 75) return 'nervous';
    return 'happy';
  }, [activeThreats, hp]);

  const hpStatusLabel =
    hp >= 80 ? 'Intacto' : hp >= 50 ? 'Assustado' : hp >= 25 ? 'Por um fio!' : 'EM PERIGO!';

  const hpBarColor =
    hp >= 65 ? 'bg-[#34D399]' : hp >= 35 ? 'bg-[#FBBF24]' : 'bg-[#FB7185]';

  const isRaining = activeThreats.some((t) => t.def.type === 'rain');
  const isUfo = activeThreats.some((t) => t.def.type === 'ufo');
  const latestOwnerMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].sender === 'owner') return messages[i];
    }
    return null;
  }, [messages]);

  return (
    <div className="min-h-screen w-full bg-[#FFFBF2] flex flex-col">
      {/* Compact Top HUD (fits comfortably <= 15% on mobile) */}
      <header className="w-full bg-white border-b-2 border-[#1F2937] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display font-bold text-base sm:text-lg text-[#1F2937] truncate">
              Cuida do Ovo, Rebeca! 🥚
            </span>
            <span className="hidden md:inline text-xs font-semibold text-[#6B7280] whitespace-nowrap">
              · {difficulty.name}
            </span>
          </div>

          {/* Core Metrics */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="flex items-center gap-1.5 font-mono font-bold text-sm sm:text-base tabular-nums text-[#1F2937]">
              <Timer className="w-4 h-4 text-[#E11D48]" />
              <span>{formatCountdown(timeLeftSec)}</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono font-bold text-sm sm:text-base tabular-nums text-[#B45309]">
              <Trophy className="w-4 h-4 text-[#D97706]" />
              <span>{score}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Ativar som' : 'Silenciar som'}
                className="p-2 rounded-xl bg-[#FFFBF2] border-2 border-[#1F2937] hover:bg-[#FEF3C7] cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onExitToStory}
                aria-label="Reiniciar ou trocar dificuldade"
                className="p-2 rounded-xl bg-[#FFFBF2] border-2 border-[#1F2937] hover:bg-[#FFE4E6] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout: Arena + WhatsApp Sidebar */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left/Center Play Area */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Mobile-only live WhatsApp notification strip */}
          {latestOwnerMsg && (
            <div className="lg:hidden bg-[#DCFCE7] border-2 border-[#1F2937] rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-[0_3px_0_#1F2937]">
              <MessageCircle className="w-5 h-5 text-[#075E54] shrink-0" />
              <div className="min-w-0 flex-1 text-xs sm:text-sm">
                <span className="font-bold text-[#075E54]">Dono do Ovo: </span>
                <span className="text-[#1F2937] font-medium">{latestOwnerMsg.text}</span>
              </div>
            </div>
          )}

          {/* Egg HP Bar Card */}
          <div className="bg-white border-2 border-[#1F2937] rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_0_#1F2937]">
            <div className="flex items-center justify-between gap-2 mb-2 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-1.5 text-[#1F2937]">
                <Heart className="w-4 h-4 text-[#E11D48] fill-[#FB7185]" />
                <span>Vida do Ovo da Rebeca</span>
              </div>
              <div className="font-mono tabular-nums text-[#1F2937]">
                {hp}/100 · <span className="font-sans">{hpStatusLabel}</span>
                {combo > 1 && <span className="ml-2 text-[#D97706]">· Combo x{combo}</span>}
              </div>
            </div>
            <div className="w-full h-4 bg-[#F3F4F6] rounded-full border-2 border-[#1F2937] overflow-hidden">
              <div
                className={`h-full ${hpBarColor} transition-all duration-200`}
                style={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
              />
            </div>
          </div>

          {/* Interactive Egg Stage */}
          <div
            className={`relative rounded-3xl border-2 border-[#1F2937] p-5 sm:p-7 min-h-[320px] sm:min-h-[370px] flex flex-col items-center justify-between overflow-hidden shadow-[0_6px_0_#1F2937] transition-colors duration-300 ${
              isRaining
                ? 'bg-gradient-to-b from-[#BAE6FD] to-[#E0F2FE]'
                : isUfo
                  ? 'bg-gradient-to-b from-[#DDD6FE] to-[#DCFCE7]'
                  : activeThreats.length > 0
                    ? 'bg-gradient-to-b from-[#FFF1F2] to-[#FEF3C7]'
                    : 'bg-gradient-to-b from-[#FEF9C3]/60 to-[#DCFCE7]/50'
            }`}
          >
            {/* Animated Rain Drops */}
            {isRaining && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                {[12, 24, 38, 52, 66, 78, 90].map((leftPct, i) => (
                  <div
                    key={leftPct}
                    className="absolute top-0 w-1 h-6 rounded-full bg-[#0284C7]/60 animate-rain-drop"
                    style={{ left: `${leftPct}%`, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            )}

            {/* Floating Feedback Popups */}
            <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1 pointer-events-none">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className={`px-3 py-1.5 rounded-xl border-2 border-[#1F2937] font-display font-bold text-sm shadow-[0_2px_0_#1F2937] ${
                    fb.tone === 'good'
                      ? 'bg-[#DCFCE7] text-[#14532D]'
                      : fb.tone === 'heal'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#FFE4E6] text-[#881337]'
                  }`}
                >
                  {fb.text}
                </div>
              ))}
            </div>

            {/* Active Threat Alert Strip */}
            <div className="w-full z-10 min-h-[54px] flex flex-col items-center justify-center">
              {activeThreats.length === 0 ? (
                <p className="text-sm font-semibold text-[#4B5563] text-center">
                  Tudo calmo por enquanto, Rebeca... suspeito demais 👀
                </p>
              ) : (
                <div className="w-full flex flex-wrap items-center justify-center gap-2.5">
                  {activeThreats.map((threat) => {
                    const pct = Math.max(0, Math.round((threat.remainingMs / threat.maxDurationMs) * 100));
                    return (
                      <div
                        key={threat.instanceId}
                        className={`flex-1 min-w-[220px] max-w-sm ${threat.def.accentBg} border-2 border-[#1F2937] rounded-2xl px-3.5 py-2 shadow-[0_3px_0_#1F2937]`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-display font-bold text-[#1F2937]">
                          <span>{threat.def.title}</span>
                          <span className="font-mono tabular-nums">
                            {(threat.remainingMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <p className="text-xs text-[#374151] mt-0.5 leading-snug">{threat.def.subtitle}</p>
                        <div className="mt-1.5 w-full h-2 bg-white/80 rounded-full border border-[#1F2937] overflow-hidden">
                          <div
                            className="h-full bg-[#1F2937] transition-all duration-100"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Center Egg + Surrounding Active Threat Characters */}
            <div className="relative w-full flex items-center justify-center my-2 min-h-[200px]">
              {/* Left Threat Character */}
              {activeThreats[0] && (
                <button
                  type="button"
                  onClick={() => handleDefendThreat(activeThreats[0].instanceId)}
                  aria-label={activeThreats[0].def.actionLabel}
                  className="mr-2 sm:mr-6 p-2 rounded-2xl bg-white/90 border-2 border-[#1F2937] shadow-[0_4px_0_#1F2937] hover:scale-105 active:scale-95 transition-transform cursor-pointer animate-bounce"
                >
                  <ThreatIllustration type={activeThreats[0].def.type} className="w-16 h-16 sm:w-20 sm:h-20" />
                </button>
              )}

              {/* The Egg in a Cozy Nest */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`transition-transform duration-200 ${
                    activeThreats.some((t) => t.def.type === 'falling') ? 'translate-y-4 rotate-12' : ''
                  }`}
                >
                  <EggCharacter
                    hp={hp}
                    mood={eggMood}
                    hasUmbrella={hasUmbrella}
                    isHealedPulse={healPulse}
                    size="lg"
                  />
                </div>
                {/* Nest base */}
                <div className="w-36 h-7 -mt-3 rounded-full bg-[#FDE68A] border-2 border-[#1F2937] shadow-inner" />
              </div>

              {/* Right Threat Character (when 2 threats simultaneously) */}
              {activeThreats[1] && (
                <button
                  type="button"
                  onClick={() => handleDefendThreat(activeThreats[1].instanceId)}
                  aria-label={activeThreats[1].def.actionLabel}
                  className="ml-2 sm:ml-6 p-2 rounded-2xl bg-white/90 border-2 border-[#1F2937] shadow-[0_4px_0_#1F2937] hover:scale-105 active:scale-95 transition-transform cursor-pointer animate-bounce"
                >
                  <ThreatIllustration type={activeThreats[1].def.type} className="w-16 h-16 sm:w-20 sm:h-20" />
                </button>
              )}
            </div>

            <div className="text-xs font-medium text-[#4B5563] text-center">
              Dica da Rebeca: clique nos botões grandes abaixo (ou direto no invasor!)
            </div>
          </div>

          {/* Big Thumb-Friendly Action Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeThreats.map((threat, idx) => (
              <button
                key={threat.instanceId}
                type="button"
                onClick={() => handleDefendThreat(threat.instanceId)}
                className={`min-h-[64px] px-5 py-3.5 rounded-2xl ${threat.def.accentBg} hover:brightness-95 active:translate-y-0.5 text-[#1F2937] font-display text-lg font-bold border-2 border-[#1F2937] shadow-[0_5px_0_#1F2937] transition-all cursor-pointer flex items-center justify-between gap-3`}
              >
                <span className="truncate">{threat.def.actionLabel}</span>
                <span className="shrink-0 text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-[#1F2937] tabular-nums">
                  {threat.tapsRemaining > 1 ? `${threat.tapsRemaining}x` : `Tecla ${idx + 1}`}
                </span>
              </button>
            ))}

            {/* Polish / Calm Egg Button */}
            <button
              type="button"
              onClick={handlePolishEgg}
              disabled={polishCooldownMs > 0}
              className={`min-h-[64px] px-5 py-3.5 rounded-2xl font-display text-base sm:text-lg font-bold border-2 border-[#1F2937] shadow-[0_5px_0_#1F2937] transition-all flex items-center justify-between gap-2 ${
                activeThreats.length === 0 ? 'sm:col-span-2' : ''
              } ${
                polishCooldownMs > 0
                  ? 'bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed opacity-80'
                  : 'bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#1F2937] active:translate-y-0.5 cursor-pointer'
              }`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Sparkles className="w-5 h-5 text-[#D97706] shrink-0" />
                <span>ACALMAR & POLIR O OVO (+6 HP)</span>
              </span>
              <span className="shrink-0 text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-[#1F2937] tabular-nums">
                {polishCooldownMs > 0 ? `${(polishCooldownMs / 1000).toFixed(1)}s` : 'Espaço'}
              </span>
            </button>
          </div>
        </section>

        {/* Right Column: Live WhatsApp Conversation */}
        <div className="lg:col-span-5 xl:col-span-4">
          <WhatsAppFeed
            messages={messages}
            isOwnerTyping={isOwnerTyping}
            quickReplies={bundle.quickReplies}
            onQuickReply={handleQuickReply}
          />
        </div>
      </main>
    </div>
  );
};
