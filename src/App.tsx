import { useCallback, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { EndingScreen } from './components/EndingScreen';
import { GameArena, GameResult } from './components/GameArena';
import { StoryIntro } from './components/StoryIntro';
import { DifficultyId, GameBundle, SavedScore } from './types/game';
import { soundEngine } from './utils/sound';

type ScreenState = 'GATE' | 'STORY' | 'PLAYING' | 'ENDING';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('GATE');
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [bundle, setBundle] = useState<GameBundle | null>(null);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('normal');
  const [gameRunKey, setGameRunKey] = useState(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [savedScores, setSavedScores] = useState<SavedScore[]>([]);
  const [savingScore, setSavingScore] = useState(false);
  const [muted, setMuted] = useState(false);

  const handleAuthenticated = useCallback(async (token: string) => {
    setAuthToken(token);
    setLoadingBundle(true);
    setBundleError(null);

    try {
      const [bundleRes, scoresRes] = await Promise.all([
        fetch('/api/game/bundle', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/scores', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (bundleRes.status === 401 || scoresRes.status === 401) {
        setAuthToken(null);
        setScreen('GATE');
        return;
      }

      if (!bundleRes.ok) {
        throw new Error('Falha ao carregar o jogo da Rebeca.');
      }

      const bundleData = (await bundleRes.json()) as GameBundle;
      setBundle(bundleData);

      if (scoresRes.ok) {
        const scoresData = (await scoresRes.json()) as { scores: SavedScore[] };
        setSavedScores(scoresData.scores || []);
      }

      setScreen('STORY');
    } catch {
      setBundleError('Não foi possível carregar os dados protegidos do ovo. Tente entrar novamente.');
      setAuthToken(null);
      setScreen('GATE');
    } finally {
      setLoadingBundle(false);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      if (!next) {
        soundEngine.playPop();
      }
      return next;
    });
  }, []);

  const handleLockOut = useCallback(() => {
    soundEngine.playPop();
    setAuthToken(null);
    setBundle(null);
    setLastResult(null);
    setScreen('GATE');
  }, []);

  const handleStartGame = useCallback(() => {
    setLastResult(null);
    setGameRunKey((k) => k + 1);
    setScreen('PLAYING');
  }, []);

  const handleFinishGame = useCallback(
    async (result: GameResult) => {
      setLastResult(result);
      setScreen('ENDING');

      if (!authToken) return;
      setSavingScore(true);
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            score: result.score,
            hpRemaining: result.hpRemaining,
            difficulty: selectedDifficulty,
            ending: result.ending,
            eventsCleared: result.eventsCleared,
            maxCombo: result.maxCombo,
          }),
        });
        if (res.status === 401) {
          handleLockOut();
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as { scores?: SavedScore[] };
          if (data.scores) {
            setSavedScores(data.scores);
          }
        }
      } catch {
        // Keep ending screen usable even if network glitches on save
      } finally {
        setSavingScore(false);
      }
    },
    [authToken, handleLockOut, selectedDifficulty]
  );

  if (loadingBundle) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#FFFBF2] text-center">
        <div className="text-5xl animate-bounce mb-4">🥚</div>
        <h1 className="font-display text-2xl font-bold text-[#1F2937]">
          Preparando a missão secreta da Rebeca...
        </h1>
      </main>
    );
  }

  if (!authToken || !bundle || screen === 'GATE') {
    return (
      <>
        {bundleError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#FFE4E6] border-2 border-[#E11D48] text-sm font-semibold text-[#881337]">
            {bundleError}
          </div>
        )}
        <AuthGate onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  const activeDifficulty =
    bundle.difficulties.find((d) => d.id === selectedDifficulty) || bundle.difficulties[1];

  if (screen === 'STORY') {
    return (
      <StoryIntro
        bundle={bundle}
        selectedDifficulty={selectedDifficulty}
        onSelectDifficulty={setSelectedDifficulty}
        onStartGame={handleStartGame}
        savedScores={savedScores}
        muted={muted}
        onToggleMute={handleToggleMute}
        onLockOut={handleLockOut}
      />
    );
  }

  if (screen === 'PLAYING') {
    return (
      <GameArena
        key={gameRunKey}
        bundle={bundle}
        difficulty={activeDifficulty}
        muted={muted}
        onToggleMute={handleToggleMute}
        onExitToStory={() => {
          soundEngine.playPop();
          setScreen('STORY');
        }}
        onFinish={handleFinishGame}
      />
    );
  }

  if (screen === 'ENDING' && lastResult) {
    return (
      <EndingScreen
        bundle={bundle}
        difficulty={activeDifficulty}
        result={lastResult}
        savedScores={savedScores}
        savingScore={savingScore}
        onPlayAgain={handleStartGame}
        onChangeDifficulty={() => setScreen('STORY')}
      />
    );
  }

  return null;
}
