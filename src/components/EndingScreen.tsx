import React from 'react';
import { Award, HeartCrack, RotateCcw, SlidersHorizontal, Trophy } from 'lucide-react';
import { DifficultyConfig, GameBundle, SavedScore } from '../types/game';
import { EggCharacter } from './EggCharacter';
import { GameResult } from './GameArena';
import { soundEngine } from '../utils/sound';

interface EndingScreenProps {
  bundle: GameBundle;
  difficulty: DifficultyConfig;
  result: GameResult;
  savedScores: SavedScore[];
  savingScore: boolean;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({
  bundle,
  difficulty,
  result,
  savedScores,
  savingScore,
  onPlayAgain,
  onChangeDifficulty,
}) => {
  const ending = bundle.endings[result.ending];
  const isTragic = result.ending === 'tragic';

  return (
    <main
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 ${
        isTragic
          ? 'bg-gradient-to-b from-[#1F2937] via-[#374151] to-[#111827]'
          : 'bg-gradient-to-b from-[#FFFBF2] via-[#FEF3C7]/60 to-[#DCFCE7]/60'
      }`}
    >
      <div className="w-full max-w-3xl space-y-5">
        {/* Main Ending Card */}
        <div className="bg-white border-2 border-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_#1F2937]">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <EggCharacter
                hp={result.hpRemaining}
                mood={isTragic ? 'cracked' : result.hpRemaining < 50 ? 'nervous' : 'happy'}
                size="lg"
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">
              {ending.title} · {difficulty.name}
            </p>

            <h1
              className={`font-display text-2xl sm:text-4xl font-bold leading-tight text-balance mb-3 ${
                isTragic ? 'text-[#BE123C]' : 'text-[#1F2937]'
              }`}
            >
              {ending.headline}
            </h1>

            <p className="text-base text-[#374151] max-w-xl leading-relaxed mb-5">
              {ending.subtext}
            </p>

            {/* Owner Final WhatsApp Quote */}
            <div
              className={`w-full max-w-xl p-4 rounded-2xl border-2 border-[#1F2937] ${ending.toneBg} text-left mb-6`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F2937] mb-1">
                {isTragic ? (
                  <HeartCrack className="w-4 h-4 text-[#BE123C]" />
                ) : (
                  <Award className="w-4 h-4 text-[#B45309]" />
                )}
                <span>Última mensagem do Dono do Ovo pra Rebeca:</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-[#1F2937] leading-snug">
                "{ending.ownerFinalMsg}"
              </p>
            </div>

            {/* Stats Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#1F2937]">
                <div className="text-xs font-semibold text-[#6B7280]">Pontuação</div>
                <div className="font-mono font-bold text-xl text-[#1F2937] tabular-nums">
                  {result.score}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#1F2937]">
                <div className="text-xs font-semibold text-[#6B7280]">Vida do Ovo</div>
                <div className="font-mono font-bold text-xl text-[#1F2937] tabular-nums">
                  {result.hpRemaining}%
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#1F2937]">
                <div className="text-xs font-semibold text-[#6B7280]">Perigos Evitados</div>
                <div className="font-mono font-bold text-xl text-[#1F2937] tabular-nums">
                  {result.eventsCleared}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#1F2937]">
                <div className="text-xs font-semibold text-[#6B7280]">Melhor Combo</div>
                <div className="font-mono font-bold text-xl text-[#1F2937] tabular-nums">
                  x{result.maxCombo}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  onPlayAgain();
                }}
                className="flex-1 min-h-[56px] px-6 py-3.5 rounded-2xl bg-[#FACC15] hover:bg-[#EAB308] text-[#1F2937] font-display text-lg font-bold border-2 border-[#1F2937] shadow-[0_5px_0_#1F2937] active:translate-y-0.5 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>CUIDAR DE OUTRO OVO 🔄</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  onChangeDifficulty();
                }}
                className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0C4A6E] font-display text-base font-bold border-2 border-[#1F2937] shadow-[0_5px_0_#1F2937] active:translate-y-0.5 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Trocar Dificuldade</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saved High Scores Card */}
        <div className="bg-white border-2 border-[#1F2937] rounded-3xl p-5 sm:p-6 shadow-[0_6px_0_#1F2937]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-display text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D97706]" />
              <span>Ranking Histórico da Rebeca</span>
            </h2>
            <span className="text-xs font-medium text-[#6B7280]">
              {savingScore ? 'Salvando pontuação...' : 'Salvo no servidor'}
            </span>
          </div>

          {savedScores.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Nenhuma pontuação registrada ainda.</p>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {savedScores.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-[#6B7280] w-6 tabular-nums">
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-[#1F2937] truncate">
                      {bundle.endings[entry.ending]?.title || entry.ending}
                    </span>
                    <span className="hidden sm:inline text-xs text-[#6B7280]">
                      · {entry.difficulty === 'chill' ? 'Tranquilo' : entry.difficulty === 'normal' ? 'Clássico' : 'Apocalipse'}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-[#1F2937] tabular-nums shrink-0">
                    {entry.score} pts · {entry.hpRemaining}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
