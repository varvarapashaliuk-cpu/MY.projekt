import { TreeSpecies, TreeState } from '../types/storm';

export interface TreeRenderInfo {
  id: number;
  baseX: number;
  baseY: number;
  height: number;
  species: TreeSpecies;
  state: TreeState;
  hotkey: string;
  name: string;
  activeProgress?: number; // 0 (start of strike) to 1 (timeout)
}

export class TreeRenderer {
  // Precomputed foliage clusters for trees to avoid GC churn
  private oakClusters: { offsetX: number; offsetY: number; radius: number; color: string }[] = [];
  private birchClusters: { offsetX: number; offsetY: number; radius: number; color: string }[] = [];
  private pineClusters: { offsetX: number; offsetY: number; radius: number; color: string }[] = [];

  constructor() {
    this.initFoliage();
  }

  private initFoliage() {
    // Oak: Broad rounded clusters
    const oakColors = ['#1e3a2b', '#162e22', '#2d5a40', '#244e37'];
    this.oakClusters = [
      { offsetX: 0, offsetY: -260, radius: 46, color: oakColors[0] },
      { offsetX: -35, offsetY: -240, radius: 42, color: oakColors[1] },
      { offsetX: 35, offsetY: -245, radius: 40, color: oakColors[2] },
      { offsetX: -70, offsetY: -200, radius: 38, color: oakColors[3] },
      { offsetX: 65, offsetY: -195, radius: 36, color: oakColors[0] },
      { offsetX: -25, offsetY: -170, radius: 38, color: oakColors[2] },
      { offsetX: 25, offsetY: -165, radius: 36, color: oakColors[1] },
    ];

    // Birch: Delicate drooping lighter foliage
    const birchColors = ['#2e5939', '#3b6e47', '#254a2e', '#457d54'];
    this.birchClusters = [
      { offsetX: 0, offsetY: -270, radius: 28, color: birchColors[0] },
      { offsetX: -25, offsetY: -245, radius: 26, color: birchColors[1] },
      { offsetX: 22, offsetY: -250, radius: 25, color: birchColors[2] },
      { offsetX: -35, offsetY: -210, radius: 24, color: birchColors[3] },
      { offsetX: 30, offsetY: -215, radius: 23, color: birchColors[0] },
      { offsetX: -18, offsetY: -180, radius: 22, color: birchColors[1] },
      { offsetX: 20, offsetY: -175, radius: 20, color: birchColors[2] },
    ];

    // Pine: High clusters
    const pineColors = ['#132b20', '#1c3e2e', '#163326', '#0f241a'];
    this.pineClusters = [
      { offsetX: 0, offsetY: -285, radius: 38, color: pineColors[0] },
      { offsetX: -40, offsetY: -275, radius: 32, color: pineColors[1] },
      { offsetX: 40, offsetY: -270, radius: 34, color: pineColors[2] },
      { offsetX: -20, offsetY: -250, radius: 30, color: pineColors[3] },
      { offsetX: 25, offsetY: -245, radius: 28, color: pineColors[0] },
    ];
  }

  public getTargetPoint(baseX: number, baseY: number, treeHeight: number): { x: number; y: number } {
    return {
      x: baseX,
      y: baseY - treeHeight + 15,
    };
  }

  public drawTree(
    ctx: CanvasRenderingContext2D,
    info: TreeRenderInfo,
    windSpeed: number,
    time: number
  ) {
    const { baseX, baseY, height, species, state, hotkey, name, activeProgress } = info;
    ctx.save();

    const windForce = windSpeed / 100;
    const sway = Math.sin(time * 2.4 + info.id * 1.5) * 6 * windForce + windForce * 16;
    const crownX = baseX + sway;
    const crownY = baseY - height;

    // Draw species specific tree
    switch (species) {
      case 'oak':
        this.drawOak(ctx, baseX, baseY, crownX, crownY, state, windForce, time);
        break;
      case 'birch':
        this.drawBirch(ctx, baseX, baseY, crownX, crownY, state, windForce, time);
        break;
      case 'spruce':
        this.drawSpruce(ctx, baseX, baseY, crownX, crownY, height, state, windForce, time);
        break;
      case 'pine':
        this.drawPine(ctx, baseX, baseY, crownX, crownY, state, windForce, time);
        break;
    }

    // Active reaction target ring & prompt if striking!
    if (state === 'striking' && activeProgress !== undefined) {
      this.drawReactionTimer(ctx, crownX, crownY - 30, activeProgress, hotkey, name);
    }

    // Saved visual feedback
    if (state === 'saved') {
      this.drawSavedAura(ctx, crownX, crownY - 20, time);
    }

    ctx.restore();
  }

  private drawOak(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    crownX: number,
    crownY: number,
    state: TreeState,
    windForce: number,
    time: number
  ) {
    // Massive rugged trunk
    ctx.beginPath();
    ctx.moveTo(baseX - 22, baseY);
    ctx.quadraticCurveTo(baseX - 16, baseY - (baseY - crownY) * 0.5, crownX - 12, crownY + 30);
    ctx.lineTo(crownX + 12, crownY + 30);
    ctx.quadraticCurveTo(baseX + 16, baseY - (baseY - crownY) * 0.5, baseX + 22, baseY);
    ctx.closePath();
    ctx.fillStyle = state === 'charred' ? '#14100d' : '#2a1e17';
    ctx.fill();

    // Oak boughs
    ctx.lineCap = 'round';
    ctx.strokeStyle = state === 'charred' ? '#0f0c0a' : '#241a14';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY + 45);
    ctx.quadraticCurveTo(crownX - 45, crownY + 15, crownX - 70, crownY - 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(crownX, crownY + 40);
    ctx.quadraticCurveTo(crownX + 45, crownY + 15, crownX + 65, crownY - 10);
    ctx.stroke();

    // Oak foliage
    for (const c of this.oakClusters) {
      const swayOff = Math.sin(time * 3 + c.offsetX * 0.1) * 6 * windForce + windForce * 15;
      ctx.fillStyle = state === 'charred' ? '#1c1815' : c.color;
      ctx.beginPath();
      ctx.arc(crownX + c.offsetX + swayOff, crownY + c.offsetY + 300, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state === 'charred' || state === 'striking') {
      this.drawTrunkFissure(ctx, baseX, baseY, crownX, crownY, state, time);
    }
  }

  private drawBirch(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    crownX: number,
    crownY: number,
    state: TreeState,
    windForce: number,
    time: number
  ) {
    // Slender silvery-white trunk with charcoal marks
    ctx.beginPath();
    ctx.moveTo(baseX - 8, baseY);
    ctx.quadraticCurveTo(baseX - 5, baseY - (baseY - crownY) * 0.5, crownX - 5, crownY + 20);
    ctx.lineTo(crownX + 5, crownY + 20);
    ctx.quadraticCurveTo(baseX + 5, baseY - (baseY - crownY) * 0.5, baseX + 8, baseY);
    ctx.closePath();
    ctx.fillStyle = state === 'charred' ? '#262422' : '#d8dad6';
    ctx.fill();

    // Horizontal dark birch notches
    if (state !== 'charred') {
      ctx.fillStyle = '#222222';
      for (let i = 1; i <= 6; i++) {
        const yN = baseY - i * 32;
        const xN = baseX + (crownX - baseX) * (1 - i / 7);
        ctx.fillRect(xN - 6, yN, 12, 2.5);
      }
    }

    // Slender drooping branches
    ctx.strokeStyle = state === 'charred' ? '#141210' : '#332b24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY + 35);
    ctx.quadraticCurveTo(crownX - 35, crownY + 40, crownX - 45, crownY + 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(crownX, crownY + 30);
    ctx.quadraticCurveTo(crownX + 35, crownY + 35, crownX + 45, crownY + 75);
    ctx.stroke();

    // Foliage
    for (const c of this.birchClusters) {
      const swayOff = Math.sin(time * 3.2 + c.offsetX * 0.1) * 7 * windForce + windForce * 18;
      ctx.fillStyle = state === 'charred' ? '#1c1815' : c.color;
      ctx.beginPath();
      ctx.arc(crownX + c.offsetX + swayOff, crownY + c.offsetY + 300, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state === 'charred' || state === 'striking') {
      this.drawTrunkFissure(ctx, baseX, baseY, crownX, crownY, state, time);
    }
  }

  private drawSpruce(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    crownX: number,
    crownY: number,
    height: number,
    state: TreeState,
    windForce: number,
    time: number
  ) {
    // Straight spruce trunk
    ctx.beginPath();
    ctx.moveTo(baseX - 10, baseY);
    ctx.lineTo(crownX - 4, crownY + 25);
    ctx.lineTo(crownX + 4, crownY + 25);
    ctx.lineTo(baseX + 10, baseY);
    ctx.closePath();
    ctx.fillStyle = state === 'charred' ? '#151210' : '#2b1c15';
    ctx.fill();

    // Tiered triangular evergreen tiers
    const tiers = 5;
    const tierH = (height * 0.8) / tiers;
    for (let t = 0; t < tiers; t++) {
      const progress = t / tiers;
      const ty = crownY + 20 + t * tierH;
      const tx = crownX + (baseX - crownX) * (progress * 0.6);
      const tw = (t + 1) * 16 + 12;
      const swayOff = (1 - progress) * (Math.sin(time * 2.8 + t) * 4 * windForce + windForce * 12);

      ctx.fillStyle = state === 'charred' ? '#141b17' : (t % 2 === 0 ? '#1b3b2b' : '#143022');
      ctx.beginPath();
      ctx.moveTo(tx + swayOff, ty - tierH * 0.4);
      ctx.lineTo(tx - tw + swayOff * 0.8, ty + tierH * 0.9);
      ctx.lineTo(tx + tw + swayOff * 0.8, ty + tierH * 0.9);
      ctx.closePath();
      ctx.fill();
    }

    if (state === 'charred' || state === 'striking') {
      this.drawTrunkFissure(ctx, baseX, baseY, crownX, crownY, state, time);
    }
  }

  private drawPine(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    crownX: number,
    crownY: number,
    state: TreeState,
    windForce: number,
    time: number
  ) {
    // Tall bare amber-brown pine trunk curving upward
    ctx.beginPath();
    ctx.moveTo(baseX - 12, baseY);
    ctx.quadraticCurveTo(baseX + 4, baseY - (baseY - crownY) * 0.5, crownX - 6, crownY + 30);
    ctx.lineTo(crownX + 6, crownY + 30);
    ctx.quadraticCurveTo(baseX + 16, baseY - (baseY - crownY) * 0.5, baseX + 12, baseY);
    ctx.closePath();
    ctx.fillStyle = state === 'charred' ? '#191310' : '#452c1e';
    ctx.fill();

    // High umbrella pine canopy
    for (const c of this.pineClusters) {
      const swayOff = Math.sin(time * 2.6 + c.offsetX * 0.1) * 8 * windForce + windForce * 16;
      ctx.fillStyle = state === 'charred' ? '#181b19' : c.color;
      ctx.beginPath();
      ctx.arc(crownX + c.offsetX + swayOff, crownY + c.offsetY + 300, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state === 'charred' || state === 'striking') {
      this.drawTrunkFissure(ctx, baseX, baseY, crownX, crownY, state, time);
    }
  }

  private drawTrunkFissure(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    crownX: number,
    crownY: number,
    state: TreeState,
    time: number
  ) {
    ctx.save();
    const isStriking = state === 'striking';
    const emberPulse = 0.7 + Math.sin(time * 8) * 0.3;

    ctx.strokeStyle = isStriking ? '#ffffff' : `rgba(239, 68, 68, ${emberPulse})`;
    ctx.shadowBlur = isStriking ? 25 : 12;
    ctx.shadowColor = isStriking ? '#60a5fa' : '#f97316';
    ctx.lineWidth = isStriking ? 3.5 : 2;

    ctx.beginPath();
    ctx.moveTo(crownX, crownY + 40);
    ctx.lineTo(crownX - 3, crownY + 90);
    ctx.lineTo(crownX + 4, crownY + 140);
    ctx.lineTo(baseX, baseY - 20);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Glowing reaction timer reticle above active tree
   */
  private drawReactionTimer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    progress: number, // 0 to 1 (1 = time expired)
    hotkey: string,
    name: string
  ) {
    ctx.save();
    const radius = 22;
    const remaining = Math.max(0, 1 - progress);

    // Glowing alert background
    ctx.shadowBlur = 18;
    ctx.shadowColor = remaining > 0.3 ? '#f59e0b' : '#ef4444';

    // Timer circle background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Circular countdown arc
    ctx.lineWidth = 4;
    ctx.strokeStyle = remaining > 0.3 ? '#fbbf24' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * remaining), false);
    ctx.stroke();

    // Center Hotkey prompt
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[${hotkey}]`, x, y);

    // Tree name prompt tag below
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('RATUJ!', x, y + 34);

    ctx.restore();
  }

  /**
   * Success aura when tree is saved
   */
  private drawSavedAura(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    ctx.save();
    const pulse = Math.sin(time * 10) * 0.2 + 0.8;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#10b981';
    ctx.strokeStyle = `rgba(52, 211, 153, ${pulse * 0.8})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 25 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OCALONE!', x, y - 10);
    ctx.restore();
  }
}
