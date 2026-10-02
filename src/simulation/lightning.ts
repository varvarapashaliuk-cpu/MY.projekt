import { LightningBolt } from '../types/storm';

interface Point {
  x: number;
  y: number;
}

/**
 * Procedural Fractal Lightning Bolt Generator using recursive midpoint displacement
 */
export function createLightningBolt(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  isTreeStrike: boolean = false,
  intensity: number = 1.0
): LightningBolt {
  const segments: { x1: number; y1: number; x2: number; y2: number; width: number; alpha: number }[] = [];
  const branches: { x1: number; y1: number; x2: number; y2: number; width: number; alpha: number }[] = [];

  // Generate main trunk path
  const mainPoints = generateDisplacedPath(
    { x: startX, y: startY },
    { x: targetX, y: targetY },
    isTreeStrike ? 65 : 45,
    6
  );

  // Convert points to segments
  for (let i = 0; i < mainPoints.length - 1; i++) {
    const p1 = mainPoints[i];
    const p2 = mainPoints[i + 1];
    const progress = i / mainPoints.length;
    // Taper width slightly towards ground, but keep it thick for dramatic return stroke
    const width = (isTreeStrike ? 5.5 : 4.0) * (1 - progress * 0.3) * intensity;
    segments.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      width: Math.max(1.8, width),
      alpha: 1.0,
    });

    // Randomly spawn branches along the upper/mid portion
    if (i > 2 && i < mainPoints.length - 3 && Math.random() < 0.4) {
      const branchAngle = (Math.random() - 0.5) * 0.9 + (p2.x > p1.x ? 0.3 : -0.3);
      const branchLength = (Math.random() * 90 + 50) * intensity;
      const endX = p1.x + Math.sin(branchAngle) * branchLength;
      const endY = p1.y + Math.cos(branchAngle) * branchLength * 0.9;

      const branchPoints = generateDisplacedPath(p1, { x: endX, y: endY }, 25, 4);
      for (let j = 0; j < branchPoints.length - 1; j++) {
        const bp1 = branchPoints[j];
        const bp2 = branchPoints[j + 1];
        const bProgress = j / branchPoints.length;
        branches.push({
          x1: bp1.x,
          y1: bp1.y,
          x2: bp2.x,
          y2: bp2.y,
          width: Math.max(0.8, (2.2 * (1 - bProgress)) * intensity),
          alpha: (1 - bProgress * 0.5),
        });
      }
    }
  }

  // If striking the tree, generate grounding discharge arcs crawling down trunk & roots
  if (isTreeStrike) {
    const rootArcCount = 3;
    for (let r = 0; r < rootArcCount; r++) {
      const spread = (r - 1) * 35;
      const arcPoints = generateDisplacedPath(
        { x: targetX, y: targetY },
        { x: targetX + spread + (Math.random() * 20 - 10), y: targetY + 90 + Math.random() * 40 },
        15,
        3
      );
      for (let j = 0; j < arcPoints.length - 1; j++) {
        branches.push({
          x1: arcPoints[j].x,
          y1: arcPoints[j].y,
          x2: arcPoints[j + 1].x,
          y2: arcPoints[j + 1].y,
          width: Math.max(1, 2.5 * (1 - j / arcPoints.length)),
          alpha: 0.9,
        });
      }
    }
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    startX,
    startY,
    targetX,
    targetY,
    segments,
    branches,
    life: 1.0,
    maxLife: isTreeStrike ? 38 : 24, // frames of visible persistence
    intensity,
    isTreeStrike,
    pulses: isTreeStrike ? 4 : 2,
  };
}

/**
 * Recursive midpoint displacement path generator
 */
function generateDisplacedPath(start: Point, end: Point, maxDisplacement: number, depth: number): Point[] {
  let points: Point[] = [start, end];

  for (let d = 0; d < depth; d++) {
    const newPoints: Point[] = [];
    const currentDisplacement = maxDisplacement / Math.pow(1.8, d);

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Midpoint
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Perpendicular vector
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const normalX = -dy / len;
      const normalY = dx / len;

      const offset = (Math.random() - 0.5) * 2 * currentDisplacement;

      newPoints.push(p1);
      newPoints.push({
        x: midX + normalX * offset,
        y: midY + normalY * offset * 0.4, // less vertical jitter to maintain downward velocity
      });
    }
    newPoints.push(points[points.length - 1]);
    points = newPoints;
  }

  return points;
}

/**
 * Render procedural lightning bolt with multiple aura passes and multi-stroke flicker
 */
export function drawLightning(
  ctx: CanvasRenderingContext2D,
  bolt: LightningBolt,
  timeProgress: number // 0 to 1
) {
  // Multi-stroke flicker simulation: oscillates brightness quickly
  const flickerFreq = bolt.pulses * 12;
  const flicker = Math.sin(timeProgress * Math.PI * flickerFreq);
  const flashAlpha = Math.max(0.2, (1 - timeProgress)) * (0.6 + 0.4 * Math.abs(flicker));

  ctx.save();

  // Pass 1: Outer glow / atmospheric plasma bloom
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.shadowColor = bolt.isTreeStrike ? '#60a5fa' : '#a855f7';
  ctx.shadowBlur = bolt.isTreeStrike ? 30 : 20;

  // Draw branches (secondary forks)
  ctx.strokeStyle = `rgba(165, 180, 252, ${0.45 * flashAlpha})`;
  for (const b of bolt.branches) {
    ctx.lineWidth = b.width * (bolt.isTreeStrike ? 1.4 : 1.0);
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
  }

  // Draw main trunk outer aura
  ctx.strokeStyle = `rgba(191, 219, 254, ${0.7 * flashAlpha})`;
  for (const seg of bolt.segments) {
    ctx.lineWidth = seg.width * 2.2;
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  }

  // Pass 2: High intensity pure white core channel
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * flashAlpha})`;

  for (const seg of bolt.segments) {
    ctx.lineWidth = Math.max(1.2, seg.width * 0.9);
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  }

  // Pass 3: Impact point explosion circle if striking tree
  if (bolt.isTreeStrike) {
    const impactGlowRadius = (45 + Math.random() * 25) * (1 - timeProgress * 0.6);
    const grad = ctx.createRadialGradient(
      bolt.targetX, bolt.targetY, 4,
      bolt.targetX, bolt.targetY, impactGlowRadius
    );
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * flashAlpha})`);
    grad.addColorStop(0.3, `rgba(147, 197, 253, ${0.7 * flashAlpha})`);
    grad.addColorStop(0.7, `rgba(59, 130, 246, ${0.3 * flashAlpha})`);
    grad.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bolt.targetX, bolt.targetY, impactGlowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
