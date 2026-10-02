import React from 'react';
import {
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Heart,
  Flame,
  HelpCircle,
  Play,
} from 'lucide-react';
import { GameTree, ActiveWave, GameStatus } from '../types/storm';

interface GameHUDProps {
  trees: GameTree[];
  score: number;
  highScore: number;
  lives: number;
  combo: number;
  activeWave: ActiveWave | null;
  gameStatus: GameStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPressTree: (treeId: number) => void;
  onStartGame: () => void;
  onRestartGame: () => void;
  onOpenRules: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  trees,
  score,
  highScore,
  lives,
  combo,
  activeWave,
  gameStatus,
  soundEnabled,
  onToggleSound,
  onPressTree,
  onStartGame,
  onRestartGame,
  onOpenRules,
}) => {
  return (
    <>
      {/* Top Bar according to 3-Zone Contract */}
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        {/* Zone 1: Single text brand wordmark */}
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          <span className="font-display text-base sm:text-lg font-bold tracking-wider text-white">
            GROM W LESIE
          </span>
        </div>

        {/* Zone 2: Clean HUD stats */}
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold hidden sm:inline">
              Punkty
            </span>
            <span className="font-mono text-lg sm:text-2xl font-bold text-amber-400 tabular-nums">
              {score}
            </span>
          </div>

          {/* High Score */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-amber-500/80" />
            <span className="font-mono font-semibold text-slate-300 tabular-nums">
              Rekord: {highScore}
            </span>
          </div>

          {/* Combo */}
          {combo > 1 && (
            <div className="flex items-center gap-1 text-xs font-bold text-cyan-300 animate-in zoom-in-75">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span>x{combo}</span>
            </div>
          )}

          {/* Lives */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-all ${
                  i < lives
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : 'text-slate-700 fill-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Zone 3: Sound toggle & Rules */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenRules}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zasady gry i punktacja"
            aria-label="Zasady"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={soundEnabled ? 'Wycisz dźwięk' : 'Włącz realistyczny dźwięk burzy'}
            aria-label="Dźwięk"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {gameStatus === 'PLAYING' && (
            <button
              onClick={onRestartGame}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Od Nowa</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Alert for Double Strike Wave */}
      {activeWave?.type === 'double' && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.4)] backdrop-blur-md text-amber-300 text-xs sm:text-sm font-bold tracking-wide">
            <Zap className="w-4 h-4 animate-bounce fill-amber-400" />
            <span>PODWÓJNE WYŁADOWANIE! RATUJ OBA DRZEWA DLA +6 PUNKTÓW!</span>
          </div>
        </div>
      )}

      {/* Bottom Tree Action Deck (Responsive touchpads matching the 4 trees) */}
      <footer className="fixed bottom-4 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto grid grid-cols-4 gap-2 sm:gap-4 max-w-4xl w-full p-2 bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl">
          {trees.map((tree) => {
            const isTarget = activeWave?.targetTreeIds.includes(tree.id);
            const isSaved = activeWave?.savedTreeIds.includes(tree.id);
            const isCharred = tree.state === 'charred';

            let btnStyle = 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800/90';

            if (isTarget && !isSaved) {
              btnStyle =
                'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.7)] animate-pulse scale-[1.02] font-black';
            } else if (isSaved) {
              btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold';
            } else if (isCharred) {
              btnStyle = 'bg-rose-950/40 border-rose-900/60 text-rose-300/80';
            }

            return (
              <button
                key={tree.id}
                onClick={() => onPressTree(tree.id)}
                className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer ${btnStyle}`}
              >
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs sm:text-sm font-bold opacity-90">
                    [{tree.hotkey}]
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold truncate max-w-[70px] sm:max-w-none">
                    {tree.name}
                  </span>
                </div>

                <span className="text-[10px] mt-0.5 uppercase tracking-wider font-bold">
                  {isTarget && !isSaved ? (
                    <span className="flex items-center gap-1 text-slate-950 font-black animate-bounce">
                      <Zap className="w-3 h-3 fill-slate-950" /> RATUJ!
                    </span>
                  ) : isSaved ? (
                    'OCALONE'
                  ) : isCharred ? (
                    'ROZŁUPANE'
                  ) : (
                    'ZDROWY'
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* Title Screen Overlay */}
      {gameStatus === 'TITLE_MENU' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-4 shadow-lg shadow-amber-400/10">
              <Zap className="w-8 h-8 fill-amber-400/20" />
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide mb-2">
              BURZA W LESIE
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Chroń pradawny las przed niszczycielską siłą piorunów!
            </p>

            {/* Rules Cards */}
            <div className="space-y-3 mb-6 text-left text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-bold font-mono text-xs">
                  +2 PKT
                </span>
                <div>
                  <strong className="text-slate-200">Pojedyncze uderzenie:</strong>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Gdy piorun trafi w 1 drzewo, wciśnij je nim upłynie czas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/30 border border-amber-500/40">
                <span className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-black font-mono text-xs">
                  +6 PKT
                </span>
                <div>
                  <strong className="text-amber-300">Podwójne wyładowanie:</strong>
                  <p className="text-amber-200/80 text-xs mt-0.5">
                    Gdy piorun uderzy od razu w 2 drzewa, musisz zdążyć wcisnąć OBA!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-400">
                <span>Sterowanie: Kliknij drzewo lub klawisze [1] [2] [3] [4]</span>
                <span>3 Serca</span>
              </div>
            </div>

            <button
              onClick={onStartGame}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-amber-500/20 text-sm tracking-wider uppercase cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Rozpocznij Grę [Spacja]</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {gameStatus === 'GAME_OVER' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
              <Flame className="w-8 h-8 text-rose-400" />
            </div>

            <h2 className="font-display text-2xl font-bold text-white tracking-wide mb-1">
              Koniec Gry
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Nawałnica okazała się zbyt potężna dla lasu!
            </p>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Twój Wynik</span>
                <span className="font-mono text-3xl font-bold text-amber-400 tabular-nums">
                  {score}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Twój Rekord</span>
                <span className="font-mono text-3xl font-bold text-slate-200 tabular-nums">
                  {highScore}
                </span>
              </div>
            </div>

            <button
              onClick={onRestartGame}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-amber-500/20 text-sm tracking-wider uppercase cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Zagraj Ponownie [Spacja]</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
