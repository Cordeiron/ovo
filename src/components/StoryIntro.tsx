import React, { useState } from 'react';
import { Trophy, Volume2, VolumeX, LogOut } from 'lucide-react';
import { DifficultyConfig, DifficultyId, GameBundle, SavedScore } from '../types/game';
import { EggCharacter } from './EggCharacter';
import { soundEngine } from '../utils/sound';

interface StoryIntroProps {
  bundle: GameBundle;
  selectedDifficulty: DifficultyId;
  onSelectDifficulty: (diff: DifficultyId) => void;
  onStartGame: () => void;
  savedScores: SavedScore[];
  muted: boolean;
  onToggleMute: () => void;
  onLockOut: () => void;
}

export const StoryIntro: React.FC<StoryIntroProps> = ({
  bundle,
  selectedDifficulty,
  onSelectDifficulty,
  onStartGame,
  savedScores,
  muted,
  onToggleMute,
  onLockOut,
}) => {
  const [ownerReply, setOwnerReply] = useState<string | null>(null);
  const [choiceMade, setChoiceMade] = useState<'yes' | 'hesitant' | null>(null);

  const handleChoice = (choice: 'yes' | 'hesitant') => {
    soundEngine.playPop();
    setChoiceMade(choice);
    setOwnerReply(choice === 'yes' ? bundle.story.yesReply : bundle.story.hesitantReply);
  };

  const bestScore = savedScores.length > 0 ? savedScores[0] : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FFFBF2] via-[#E0F2FE]/45 to-[#FCE7F3]/50 flex flex-col">
      {/* Compact Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <span className="font-display text-lg sm:text-xl font-bold text-[#1F2937] whitespace-nowrap">
          Rebeca, Cuida do Meu Ovo! 🥚
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Ativar som' : 'Silenciar som'}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-white border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#FEF3C7] transition-colors cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{muted ? 'Mudo' : 'Som'}</span>
          </button>

          <button
            type="button"
            onClick={onLockOut}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-white border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#FFE4E6] transition-colors cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Trancar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 pb-10 flex flex-col justify-center">
        <div className="bg-white border-2 border-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_#1F2937]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Egg Mascot Column */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#FFFBF2] border-2 border-[#1F2937] rounded-2xl p-6">
              <EggCharacter hp={100} mood={choiceMade === 'hesitant' ? 'nervous' : 'happy'} size="lg" />
              <p className="mt-3 text-sm font-semibold text-[#4B5563] text-center">
                {choiceMade === 'hesitant'
                  ? 'O ovo já tá olhando pra Rebeca meio desconfiado...'
                  : 'Esse ovo precioso depende 100% de você, Rebeca!'}
              </p>
            </div>

            {/* Story & Choice Column */}
            <div className="md:col-span-7 flex flex-col">
              <p className="text-xs font-semibold text-[#9D174D] mb-2">
                Missão Exclusiva para Rebeca · Urgente
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2937] leading-tight text-balance mb-3">
                {bundle.story.headline}
              </h1>
              <p className="text-base sm:text-lg text-[#374151] leading-relaxed mb-6">
                "{bundle.story.prompt}"
              </p>

              {/* Difficulty Selector */}
              {!ownerReply && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">
                    Escolha o nível do caos
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {bundle.difficulties.map((diff: DifficultyConfig) => {
                      const active = selectedDifficulty === diff.id;
                      return (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playPop();
                            onSelectDifficulty(diff.id);
                          }}
                          className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            active
                              ? 'bg-[#FEF3C7] border-[#1F2937] shadow-[0_3px_0_#1F2937]'
                              : 'bg-[#F9FAFB] border-[#D1D5DB] hover:border-[#1F2937]'
                          }`}
                        >
                          <div className="font-display font-bold text-sm text-[#1F2937]">{diff.name}</div>
                          <div className="text-xs font-medium text-[#6B7280] mt-0.5">{diff.badgeText}</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-2">
                    {bundle.difficulties.find((d) => d.id === selectedDifficulty)?.description}
                  </p>
                </div>
              )}

              {/* Story Buttons OR Owner Immediate Reply */}
              {!ownerReply ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleChoice('yes')}
                    className="flex-1 min-h-[54px] px-5 py-3.5 rounded-2xl bg-[#FB7185] hover:bg-[#F43F5E] text-white font-display text-lg font-bold border-2 border-[#1F2937] shadow-[0_4px_0_#1F2937] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    {bundle.story.yesButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChoice('hesitant')}
                    className="flex-1 min-h-[54px] px-5 py-3.5 rounded-2xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0C4A6E] font-display text-base font-bold border-2 border-[#1F2937] shadow-[0_4px_0_#1F2937] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    {bundle.story.hesitantButton}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#DCFCE7] border-2 border-[#1F2937] text-[#14532D]">
                    <p className="text-xs font-bold mb-1">Dono do Ovo respondeu:</p>
                    <p className="text-base font-semibold leading-snug">{ownerReply}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSuccess();
                      onStartGame();
                    }}
                    className="w-full min-h-[58px] px-6 py-4 rounded-2xl bg-[#FACC15] hover:bg-[#EAB308] text-[#1F2937] font-display text-xl font-bold border-2 border-[#1F2937] shadow-[0_5px_0_#1F2937] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    COMEÇAR A PROTEGER O OVO! 🥚🔥
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Best Record Strip if Rebeca has played before */}
        {bestScore && (
          <div className="mt-5 bg-white border-2 border-[#1F2937] rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_0_#1F2937]">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#1F2937]">
              <Trophy className="w-5 h-5 text-[#D97706]" />
              <span>Recorde atual da Rebeca:</span>
              <span className="font-mono font-bold tabular-nums text-[#B45309]">
                {bestScore.score} pts
              </span>
            </div>
            <div className="text-xs font-medium text-[#6B7280] tabular-nums">
              {bestScore.hpRemaining}% vida · {bestScore.eventsCleared} perigos evitados
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
