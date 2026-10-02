import { useState, useRef, useEffect, useCallback } from 'react';
import { GameTree, GameStatus, ActiveWave, ScorePopup } from '../types/storm';
import { stormAudio } from '../audio/stormSound';

const INITIAL_TREES: GameTree[] = [
  { id: 0, name: 'Stary Dąb', species: 'oak', xPercent: 18, state: 'healthy', hotkey: '1' },
  { id: 1, name: 'Smukła Brzoza', species: 'birch', xPercent: 40, state: 'healthy', hotkey: '2' },
  { id: 2, name: 'Wyniosły Świerk', species: 'spruce', xPercent: 62, state: 'healthy', hotkey: '3' },
  { id: 3, name: 'Pradawna Sosna', species: 'pine', xPercent: 84, state: 'healthy', hotkey: '4' },
];

export interface StormGameHook {
  trees: GameTree[];
  score: number;
  highScore: number;
  lives: number;
  combo: number;
  gameStatus: GameStatus;
  activeWave: ActiveWave | null;
  scorePopups: ScorePopup[];
  startGame: () => void;
  restartGame: () => void;
  handlePressTree: (treeId: number) => void;
  clearPopups: () => void;
  triggerLightningForTreesRef: React.MutableRefObject<((treeIds: number[]) => void) | null>;
}

export function useStormGame(): StormGameHook {
  const [trees, setTrees] = useState<GameTree[]>(INITIAL_TREES);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('grom_las_high_score');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState<number>(3);
  const [combo, setCombo] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE_MENU');
  const [activeWave, setActiveWave] = useState<ActiveWave | null>(null);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);

  // External trigger for canvas rendering
  const triggerLightningForTreesRef = useRef<((treeIds: number[]) => void) | null>(null);

  // Timeouts ref
  const waveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextWaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
      if (nextWaveTimerRef.current) clearTimeout(nextWaveTimerRef.current);
    };
  }, []);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('grom_las_high_score', score.toString());
      } catch {
        // Ignore storage errors
      }
    }
  }, [score, highScore]);

  // Spawn next strike wave
  const scheduleNextWave = useCallback((delayMs: number = 1400) => {
    if (nextWaveTimerRef.current) clearTimeout(nextWaveTimerRef.current);

    nextWaveTimerRef.current = setTimeout(() => {
      // Pick whether single or double strike
      // 35% chance for double strike, 65% for single
      const isDouble = Math.random() < 0.38;

      let targetIds: number[] = [];
      if (isDouble) {
        // Pick 2 distinct trees
        const allIds = [0, 1, 2, 3];
        allIds.sort(() => Math.random() - 0.5);
        targetIds = [allIds[0], allIds[1]];
      } else {
        // Pick 1 tree
        targetIds = [Math.floor(Math.random() * 4)];
      }

      // Calculate reaction window: decreases slightly with score (from 2200ms down to 1400ms)
      const baseDuration = isDouble ? 2400 : 2000;
      const speedUp = Math.min(600, score * 15);
      const durationMs = Math.max(1300, baseDuration - speedUp);
      const startTime = Date.now();
      const expiresAt = startTime + durationMs;

      // Update tree states to striking
      setTrees(prev =>
        prev.map(t =>
          targetIds.includes(t.id) ? { ...t, state: 'striking' } : { ...t, state: t.state === 'saved' ? 'healthy' : t.state }
        )
      );

      // Trigger lightning visuals on canvas
      if (triggerLightningForTreesRef.current) {
        triggerLightningForTreesRef.current(targetIds);
      }

      // Play lightning audio with wood crack & plasma explosion
      stormAudio.init();
      stormAudio.resume();
      stormAudio.playLightningStrike(true, isDouble);

      const newWave: ActiveWave = {
        type: isDouble ? 'double' : 'single',
        targetTreeIds: targetIds,
        savedTreeIds: [],
        startTime,
        durationMs,
        expiresAt,
      };

      setActiveWave(newWave);

      // Timeout when reaction window expires
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
      waveTimerRef.current = setTimeout(() => {
        handleWaveTimeout(newWave);
      }, durationMs);
    }, delayMs);
  }, [score]);

  // Handle timeout (player failed to save all struck trees in time)
  const handleWaveTimeout = useCallback((wave: ActiveWave) => {
    // Determine missed trees
    const missedTreeIds = wave.targetTreeIds.filter(id => !wave.savedTreeIds.includes(id));

    if (missedTreeIds.length > 0) {
      // Missed!
      stormAudio.playMiss();
      setCombo(0);

      // Mark missed trees as charred
      setTrees(prev =>
        prev.map(t =>
          missedTreeIds.includes(t.id)
            ? { ...t, state: 'charred' }
            : t.state === 'saved'
            ? { ...t, state: 'healthy' }
            : t
        )
      );

      // Decrement lives
      setLives(prevLives => {
        const nextLives = prevLives - 1;
        if (nextLives <= 0) {
          // Game Over!
          setGameStatus('GAME_OVER');
          setActiveWave(null);
          return 0;
        } else {
          // Continue game after delay
          scheduleNextWave(1800);
          return nextLives;
        }
      });
    } else {
      // All were saved in time
      scheduleNextWave(1200);
    }

    setActiveWave(null);
  }, [scheduleNextWave]);

  // Handle pressing / clicking a tree
  const handlePressTree = useCallback((treeId: number) => {
    if (gameStatus !== 'PLAYING' || !activeWave) return;

    // Check if this tree is one of the active targets and not yet saved
    if (activeWave.targetTreeIds.includes(treeId) && !activeWave.savedTreeIds.includes(treeId)) {
      const updatedSaved = [...activeWave.savedTreeIds, treeId];

      // Mark this specific tree as saved
      setTrees(prev =>
        prev.map(t => (t.id === treeId ? { ...t, state: 'saved' } : t))
      );

      const targetTree = trees.find(t => t.id === treeId);
      const xPos = targetTree ? targetTree.xPercent : 50;

      // Check if this was a single strike OR the completion of a double strike
      if (activeWave.type === 'single') {
        // Player saved the single tree!
        if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
        stormAudio.playSuccessSingle();

        // +2 PUNKTY
        setScore(prev => prev + 2);
        setCombo(prev => prev + 1);

        // Add floating popup
        setScorePopups(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            x: xPos,
            y: 40,
            text: '+2 PKT',
            points: 2,
            isDouble: false,
            alpha: 1.0,
          },
        ]);

        setActiveWave(null);
        scheduleNextWave(1300);
      } else if (activeWave.type === 'double') {
        if (updatedSaved.length === 2) {
          // Both trees saved! +6 PUNKTY
          if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
          stormAudio.playSuccessDouble();

          setScore(prev => prev + 6);
          setCombo(prev => prev + 1);

          // Add floating popup
          setScorePopups(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              x: 50, // center
              y: 35,
              text: '+6 PKT! PODWÓJNE WYŁADOWANIE!',
              points: 6,
              isDouble: true,
              alpha: 1.0,
            },
          ]);

          setActiveWave(null);
          scheduleNextWave(1500);
        } else {
          // Saved 1 of 2 trees so far, waiting for the second one!
          stormAudio.playSuccessSingle();
          setActiveWave({
            ...activeWave,
            savedTreeIds: updatedSaved,
          });

          // Small popup on first saved tree
          setScorePopups(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              x: xPos,
              y: 45,
              text: '1/2 OCALONE!',
              points: 0,
              isDouble: false,
              alpha: 1.0,
            },
          ]);
        }
      }
    }
  }, [gameStatus, activeWave, trees, scheduleNextWave]);

  const startGame = useCallback(() => {
    stormAudio.init();
    stormAudio.resume();
    setScore(0);
    setLives(3);
    setCombo(0);
    setTrees(INITIAL_TREES);
    setScorePopups([]);
    setGameStatus('PLAYING');
    scheduleNextWave(1200);
  }, [scheduleNextWave]);

  const restartGame = useCallback(() => {
    if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    if (nextWaveTimerRef.current) clearTimeout(nextWaveTimerRef.current);
    startGame();
  }, [startGame]);

  const clearPopups = useCallback(() => {
    setScorePopups([]);
  }, []);

  return {
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
    clearPopups,
    triggerLightningForTreesRef,
  };
}
