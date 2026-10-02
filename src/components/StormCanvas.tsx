import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StormSettings, GameTree, ActiveWave, LightningBolt, ScorePopup } from '../types/storm';
import { BackgroundRenderer } from '../simulation/backgroundRenderer';
import { TreeRenderer, TreeRenderInfo } from '../simulation/treeRenderer';
import { ParticleSystem } from '../simulation/particles';
import { createLightningBolt, drawLightning } from '../simulation/lightning';
import { stormAudio } from '../audio/stormSound';

interface StormCanvasProps {
  settings: StormSettings;
  trees: GameTree[];
  activeWave: ActiveWave | null;
  onPressTree: (treeId: number) => void;
  triggerLightningRef?: React.MutableRefObject<((treeIds: number[]) => void) | null>;
  scorePopups: ScorePopup[];
}

export const StormCanvas: React.FC<StormCanvasProps> = ({
  settings,
  trees,
  activeWave,
  onPressTree,
  triggerLightningRef,
  scorePopups,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const bgRendererRef = useRef(new BackgroundRenderer());
  const treeRendererRef = useRef(new TreeRenderer());
  const particlesRef = useRef<ParticleSystem | null>(null);

  const boltsRef = useRef<LightningBolt[]>([]);
  const shakeRef = useRef<{ intensity: number; decay: number; x: number; y: number }>({
    intensity: 0,
    decay: 0.9,
    x: 0,
    y: 0,
  });
  const flashRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const timeSecRef = useRef<number>(0);

  const [dimensions, setDimensions] = useState({ width: 1200, height: 750 });

  // Update audio parameters
  useEffect(() => {
    if (settings.soundEnabled) {
      stormAudio.init();
      const hasAnyCharred = trees.some(t => t.state === 'charred' || t.state === 'striking');
      stormAudio.setParameters(
        settings.windSpeed,
        settings.rainIntensity,
        hasAnyCharred,
        settings.volume
      );
    } else {
      stormAudio.stopAll();
    }
  }, [settings.soundEnabled, settings.windSpeed, settings.rainIntensity, trees, settings.volume]);

  // Method to trigger lightning bolts on specific tree IDs
  const strikeTrees = useCallback((targetIds: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const groundY = height * 0.78;

    for (const treeId of targetIds) {
      const tree = trees.find(t => t.id === treeId);
      if (!tree) continue;

      const treeX = (tree.xPercent / 100) * width;
      const treeHeight = Math.min(320, height * 0.44);
      const target = treeRendererRef.current.getTargetPoint(treeX, groundY, treeHeight);

      const startX = treeX + (Math.random() * 160 - 80);
      const startY = 10;

      const bolt = createLightningBolt(startX, startY, target.x, target.y, true, 1.25);
      boltsRef.current.push(bolt);

      // Spawn explosion sparks
      if (particlesRef.current) {
        particlesRef.current.spawnStrikeExplosion(treeId, target.x, target.y + 35, 65);
      }
    }

    // Camera shake & flash
    shakeRef.current.intensity = targetIds.length > 1 ? 28 : 18;
    flashRef.current = targetIds.length > 1 ? 1.0 : 0.85;
  }, [trees]);

  // Expose trigger lightning method
  useEffect(() => {
    if (triggerLightningRef) {
      triggerLightningRef.current = strikeTrees;
    }
  }, [strikeTrees, triggerLightningRef]);

  // Handle water extinguish particle bursts when trees become 'saved'
  const prevTreesRef = useRef(trees);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !particlesRef.current) return;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const groundY = height * 0.78;
    const treeHeight = Math.min(320, height * 0.44);

    trees.forEach((tree, idx) => {
      const prev = prevTreesRef.current[idx];
      if (prev && prev.state !== 'saved' && tree.state === 'saved') {
        const treeX = (tree.xPercent / 100) * width;
        const target = treeRendererRef.current.getTargetPoint(treeX, groundY, treeHeight);
        particlesRef.current?.spawnWaterExtinguish(target.x, target.y + 30);
        particlesRef.current?.clearFireForTree(tree.id);
      }
    });

    prevTreesRef.current = trees;
  }, [trees]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      setDimensions({ width: w, height: h });

      const canvas = canvasRef.current;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      bgRendererRef.current.init(w, h);
      if (!particlesRef.current) {
        particlesRef.current = new ParticleSystem(w, h);
      } else {
        particlesRef.current.initRain(w, h);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main 60 FPS animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = (now: number) => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      let delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (delta > 0.1) delta = 0.1;
      timeSecRef.current += delta;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Camera Shake
      if (shakeRef.current.intensity > 0.1) {
        shakeRef.current.x = (Math.random() * 2 - 1) * shakeRef.current.intensity;
        shakeRef.current.y = (Math.random() * 2 - 1) * shakeRef.current.intensity;
        shakeRef.current.intensity *= Math.pow(shakeRef.current.decay, delta * 60);
      } else {
        shakeRef.current.x = 0;
        shakeRef.current.y = 0;
        shakeRef.current.intensity = 0;
      }

      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // Flash decay
      if (flashRef.current > 0.01) {
        flashRef.current -= delta * 3.4;
        if (flashRef.current < 0) flashRef.current = 0;
      }

      // 1. Draw Background
      const groundY = bgRendererRef.current.draw(
        ctx,
        width,
        height,
        timeSecRef.current,
        settings.windSpeed,
        flashRef.current,
        settings.timeOfDay
      );

      // 2. Calculate Active Wave Timer Progress
      let activeProgress = 0;
      if (activeWave) {
        const elapsed = Date.now() - activeWave.startTime;
        activeProgress = Math.min(1, Math.max(0, elapsed / activeWave.durationMs));
      }

      // 3. Draw All 4 Trees
      const treeHeight = Math.min(320, height * 0.44);
      const treePositionsForParticles: { id: number; x: number; y: number; isCharred: boolean }[] = [];

      for (const tree of trees) {
        const treeX = (tree.xPercent / 100) * width;
        const target = treeRendererRef.current.getTargetPoint(treeX, groundY, treeHeight);

        treePositionsForParticles.push({
          id: tree.id,
          x: target.x,
          y: target.y + 35,
          isCharred: tree.state === 'charred' || tree.state === 'striking',
        });

        const isCurrentlyActive =
          activeWave?.targetTreeIds.includes(tree.id) &&
          !activeWave.savedTreeIds.includes(tree.id);

        const renderInfo: TreeRenderInfo = {
          id: tree.id,
          baseX: treeX,
          baseY: groundY,
          height: treeHeight,
          species: tree.species,
          state: tree.state,
          hotkey: tree.hotkey,
          name: tree.name,
          activeProgress: isCurrentlyActive ? activeProgress : undefined,
        };

        treeRendererRef.current.drawTree(ctx, renderInfo, settings.windSpeed, timeSecRef.current);
      }

      // 4. Update & Draw Particles (Smoke, fire, splashes)
      if (particlesRef.current) {
        particlesRef.current.updateFireAndSmokeForTrees(
          treePositionsForParticles,
          settings.windSpeed,
          settings.rainIntensity
        );
        particlesRef.current.drawFireAndSmoke(ctx);
      }

      // 5. Update & Draw Active Lightning Bolts
      for (let i = boltsRef.current.length - 1; i >= 0; i--) {
        const bolt = boltsRef.current[i];
        bolt.life -= (delta * 60) / bolt.maxLife;

        if (bolt.life <= 0) {
          boltsRef.current.splice(i, 1);
        } else {
          drawLightning(ctx, bolt, 1 - bolt.life);
        }
      }

      // 6. Draw Rain & Splashes
      if (particlesRef.current) {
        particlesRef.current.updateRain(
          width,
          height,
          settings.windSpeed,
          settings.rainIntensity,
          groundY
        );
        particlesRef.current.drawRain(
          ctx,
          width,
          height,
          settings.rainIntensity,
          settings.windSpeed
        );
      }

      // 7. Fullscreen flash overlay
      if (flashRef.current > 0.05) {
        ctx.fillStyle = `rgba(240, 245, 255, ${flashRef.current * 0.45})`;
        ctx.fillRect(-50, -50, width + 100, height + 100);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [settings, trees, activeWave]);

  // Click & Touch handler directly on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const groundY = height * 0.78;
    const treeHeight = Math.min(320, height * 0.44);

    // Find which tree was clicked
    let closestTreeId = -1;
    let minDistance = 99999;

    for (const tree of trees) {
      const treeX = (tree.xPercent / 100) * width;
      const target = treeRendererRef.current.getTargetPoint(treeX, groundY, treeHeight);
      const centerY = target.y + treeHeight * 0.5;

      // Hitbox around tree
      const dx = Math.abs(clickX - treeX);
      const dy = Math.abs(clickY - centerY);

      if (dx < width * 0.12 && dy < treeHeight * 0.7) {
        const dist = Math.hypot(clickX - treeX, clickY - centerY);
        if (dist < minDistance) {
          minDistance = dist;
          closestTreeId = tree.id;
        }
      }
    }

    if (closestTreeId !== -1) {
      onPressTree(closestTreeId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] overflow-hidden select-none bg-slate-950 cursor-pointer"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block w-full h-full"
      />

      {/* Atmospheric Vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent" />

      {/* Floating Animated Score Popups */}
      {scorePopups.map((popup) => (
        <div
          key={popup.id}
          style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-bold px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md animate-in zoom-in-75 slide-in-from-bottom-4 duration-300 ${
            popup.isDouble
              ? 'text-amber-300 bg-amber-950/90 border border-amber-400 text-sm sm:text-base shadow-[0_0_25px_rgba(251,191,36,0.6)]'
              : 'text-emerald-300 bg-emerald-950/90 border border-emerald-400 text-xs sm:text-sm shadow-[0_0_15px_rgba(16,185,129,0.5)]'
          }`}
        >
          {popup.text}
        </div>
      ))}
    </div>
  );
};
