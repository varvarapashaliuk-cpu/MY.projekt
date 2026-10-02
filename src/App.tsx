/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StormSettings } from './types/storm';
import { StormCanvas } from './components/StormCanvas';
import { GameHUD } from './components/GameHUD';
import { MusicPlayerBar } from './components/MusicPlayerBar';
import { ScienceModal } from './components/ScienceModal';
import { useStormGame } from './hooks/useStormGame';
import { stormAudio } from './audio/stormSound';
import { malinMusic } from './audio/malinMusic';

export default function App() {
  const [settings, setSettings] = useState<StormSettings>({
    windSpeed: 45,
    rainIntensity: 0.7,
    soundEnabled: true,
    volume: 0.85,
    timeOfDay: 'midnight',
  });

  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Storm game hook
  const {
    trees,
    score,
    highScore,
    lives,
    combo,
    gameStatus,
    activeWave,
    scorePopups,
    startGame,
    restartGame,
    handlePressTree,
    triggerLightningForTreesRef,
  } = useStormGame();

  // Unlock and resume AudioContext on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      stormAudio.init();
      stormAudio.resume();
      malinMusic.init();
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const handleStartGame = useCallback(() => {
    stormAudio.init();
    stormAudio.resume();
    malinMusic.start();
    setSettings(prev => ({ ...prev, soundEnabled: true }));
    startGame();
  }, [startGame]);

  const handleRestartGame = useCallback(() => {
    stormAudio.init();
    stormAudio.resume();
    malinMusic.start();
    setSettings(prev => ({ ...prev, soundEnabled: true }));
    restartGame();
  }, [restartGame]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      stormAudio.resume();

      // Space / Enter for start/restart
      if (e.code === 'Space' || e.code === 'Enter') {
        if (gameStatus === 'TITLE_MENU') {
          e.preventDefault();
          handleStartGame();
          return;
        } else if (gameStatus === 'GAME_OVER') {
          e.preventDefault();
          handleRestartGame();
          return;
        }
      }

      // Tree Hotkeys: 1, 2, 3, 4 and Q, W, E, R and A, S, D, F
      if (e.key === '1' || e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'q') {
        handlePressTree(0);
      } else if (e.key === '2' || e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'w') {
        handlePressTree(1);
      } else if (e.key === '3' || e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'e') {
        handlePressTree(2);
      } else if (e.key === '4' || e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'r') {
        handlePressTree(3);
      } else if (e.key.toLowerCase() === 'm') {
        setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleStartGame, handleRestartGame, handlePressTree]);

  const toggleSound = useCallback(() => {
    setSettings(prev => {
      const next = !prev.soundEnabled;
      if (next) {
        stormAudio.init();
        stormAudio.resume();
      } else {
        stormAudio.stopAll();
      }
      return { ...prev, soundEnabled: next };
    });
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* Game HUD (Top Bar, Stats & Bottom Tree Touchpads) */}
      <GameHUD
        trees={trees}
        score={score}
        highScore={highScore}
        lives={lives}
        combo={combo}
        activeWave={activeWave}
        gameStatus={gameStatus}
        soundEnabled={settings.soundEnabled}
        onToggleSound={toggleSound}
        onPressTree={handlePressTree}
        onStartGame={handleStartGame}
        onRestartGame={handleRestartGame}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Music Player Bar (Mata – 5 malin) */}
      <MusicPlayerBar isAutoPlay={gameStatus === 'PLAYING'} />

      {/* Main Interactive Stage with 4 Trees */}
      <main className="relative flex-1 w-full h-full pt-14 pb-20">
        <StormCanvas
          settings={settings}
          trees={trees}
          activeWave={activeWave}
          onPressTree={handlePressTree}
          triggerLightningRef={triggerLightningForTreesRef}
          scorePopups={scorePopups}
        />
      </main>

      {/* Rules / Science Info Modal */}
      <ScienceModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
