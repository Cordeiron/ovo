import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { EggCharacter } from './EggCharacter';
import { soundEngine } from '../utils/sound';

interface AuthGateProps {
  onAuthenticated: (token: string) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirmRebeca = async () => {
    if (submitting) return;
    soundEngine.playPop();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/confirm-rebeca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedAsRebeca: true }),
      });

      const rawText = await res.text();
      let data: { token?: string; error?: string } = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText) as { token?: string; error?: string };
        } catch {
          // Non-JSON server response (e.g., 404/500 proxy page)
        }
      }

      if (!res.ok || !data.token) {
        setErrorMsg(
          data.error ||
            `Não foi possível liberar a missão agora (erro ${res.status}).`
        );
        soundEngine.playHurt();
        setSubmitting(false);
        return;
      }

      soundEngine.playSuccess();
      onAuthenticated(data.token);
    } catch {
      setErrorMsg('Falha de conexão com o servidor do ovo. Tente novamente!');
      soundEngine.playHurt();
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#FFFBF2] via-[#FFF1F2] to-[#FEF3C7]">
      <div className="w-full max-w-lg bg-white border-2 border-[#1F2937] rounded-3xl p-6 sm:p-10 shadow-[0_8px_0_#1F2937]">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <EggCharacter hp={100} mood="happy" size="md" />
            <div className="absolute -bottom-1 -right-2 w-11 h-11 rounded-2xl bg-[#FECDD3] border-2 border-[#1F2937] flex items-center justify-center shadow-[0_3px_0_#1F2937]">
              <Lock className="w-5 h-5 text-[#881337]" />
            </div>
          </div>

          <p className="text-xs font-semibold tracking-wide text-[#9D174D] mb-2">
            Acesso exclusivo · Somente para a dona do ovo
          </p>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F2937] leading-tight text-balance mb-3">
            OPA! ESSE OVO TEM DONA! 🥚
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-md mb-8 leading-relaxed">
            Este desafio foi preparado especialmente para a <strong className="text-[#1F2937]">Rebeca</strong>.
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="w-full mb-4 p-3.5 rounded-xl bg-[#FFE4E6] border-2 border-[#E11D48] text-sm font-medium text-[#881337]"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirmRebeca}
            disabled={submitting}
            className="w-full min-h-[56px] px-6 py-4 rounded-2xl bg-[#FB7185] hover:bg-[#F43F5E] active:translate-y-0.5 text-white font-display text-xl font-bold border-2 border-[#1F2937] shadow-[0_5px_0_#1F2937] hover:shadow-[0_3px_0_#1F2937] transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {submitting ? 'Liberando o ovo...' : 'SOU A REBECA ❤️'}
          </button>

          <p className="mt-5 text-xs text-[#6B7280] leading-relaxed">
            O conteúdo do jogo só é liberado após confirmar que você é a Rebeca.
          </p>
        </div>
      </div>
    </main>
  );
};
