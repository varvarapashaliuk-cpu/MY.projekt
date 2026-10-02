import { Raindrop, SplashParticle, FireParticle, GroundRipple } from '../types/storm';

export class ParticleSystem {
  public raindrops: Raindrop[] = [];
  public splashes: SplashParticle[] = [];
  public fireParticles: FireParticle[] = [];
  public groundRipples: GroundRipple[] = [];

  private maxRaindrops = 1400;

  constructor(width: number, height: number) {
    this.initRain(width, height);
  }

  public initRain(width: number, height: number) {
    this.raindrops = [];
    const count = Math.min(this.maxRaindrops, Math.floor((width * height) / 1000));
    for (let i = 0; i < count; i++) {
      this.raindrops.push({
        x: Math.random() * (width + 400) - 200,
        y: Math.random() * height,
        length: Math.random() * 25 + 15,
        speed: Math.random() * 18 + 22,
        alpha: Math.random() * 0.35 + 0.15,
        thickness: Math.random() * 1.2 + 0.6,
      });
    }
  }

  public updateRain(
    width: number,
    height: number,
    windSpeed: number,
    intensity: number,
    groundY: number
  ) {
    const windShift = (windSpeed / 100) * 16;
    const activeDrops = Math.floor(this.raindrops.length * Math.max(0.08, intensity));

    for (let i = 0; i < activeDrops; i++) {
      const drop = this.raindrops[i];
      drop.y += drop.speed * (0.8 + intensity * 0.4);
      drop.x += windShift;

      // Hit ground
      if (drop.y >= groundY - Math.random() * 40) {
        if (Math.random() < 0.25 * intensity && this.splashes.length < 150) {
          this.spawnSplash(drop.x, groundY + (Math.random() * 30 - 15), windShift);
        }
        if (Math.random() < 0.08 * intensity && this.groundRipples.length < 60) {
          this.groundRipples.push({
            x: drop.x,
            y: groundY + (Math.random() * 40 - 10),
            radius: 2,
            maxRadius: Math.random() * 14 + 6,
            alpha: 0.4,
          });
        }

        drop.y = -drop.length - Math.random() * 50;
        drop.x = Math.random() * (width + 600) - 300;
      }

      if (drop.x < -300) drop.x = width + 200;
      if (drop.x > width + 300) drop.x = -200;
    }

    // Update splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.45;
      sp.life++;
      if (sp.life >= sp.maxLife) {
        this.splashes.splice(i, 1);
      }
    }

    // Update ripples
    for (let i = this.groundRipples.length - 1; i >= 0; i--) {
      const rip = this.groundRipples[i];
      rip.radius += 0.6;
      rip.alpha = (1 - rip.radius / rip.maxRadius) * 0.35;
      if (rip.radius >= rip.maxRadius || rip.alpha <= 0.01) {
        this.groundRipples.splice(i, 1);
      }
    }
  }

  public spawnSplash(x: number, y: number, windShift: number) {
    const splashCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < splashCount; i++) {
      this.splashes.push({
        x,
        y,
        vx: (Math.random() * 4 - 2) + windShift * 0.2,
        vy: -(Math.random() * 3.5 + 1.2),
        life: 0,
        maxLife: Math.floor(Math.random() * 12 + 8),
        size: Math.random() * 1.5 + 0.8,
        color: 'rgba(219, 234, 254, 0.45)',
      });
    }
  }

  public spawnWaterExtinguish(treeX: number, treeY: number) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.splashes.push({
        x: treeX + (Math.random() * 20 - 10),
        y: treeY + (Math.random() * 40 - 20),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 0,
        maxLife: Math.floor(Math.random() * 20 + 15),
        size: Math.random() * 2.5 + 1.2,
        color: 'rgba(56, 189, 248, 0.7)',
      });
    }
  }

  /**
   * Spawn sparks and embers when tree is struck
   */
  public spawnStrikeExplosion(treeId: number, treeX: number, treeY: number, count: number = 70) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      this.fireParticles.push({
        treeId,
        x: treeX + (Math.random() * 30 - 15),
        y: treeY + (Math.random() * 60 - 30),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        life: 0,
        maxLife: Math.floor(Math.random() * 40 + 25),
        size: Math.random() * 3.5 + 1.5,
        color: Math.random() > 0.3 ? '#fbbf24' : '#ef4444',
        isSmoke: false,
      });
    }
  }

  /**
   * Continuous fire, smoke and steam update around damaged trees
   */
  public updateFireAndSmokeForTrees(
    trees: { id: number; x: number; y: number; isCharred: boolean }[],
    windSpeed: number,
    rainIntensity: number
  ) {
    const windPush = (windSpeed / 100) * 1.8;

    for (const tree of trees) {
      if (!tree.isCharred) continue;

      if (Math.random() < 0.5 && this.fireParticles.length < 240) {
        const heightOffset = Math.random() * 100 - 30;
        this.fireParticles.push({
          treeId: tree.id,
          x: tree.x + (Math.random() * 24 - 12),
          y: tree.y + heightOffset,
          vx: (Math.random() * 1.5 - 0.75) + windPush,
          vy: -(Math.random() * 2.2 + 0.8),
          life: 0,
          maxLife: Math.floor(Math.random() * 35 + 20),
          size: Math.random() * 3 + 1,
          color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
          isSmoke: false,
        });
      }

      if (Math.random() < 0.35 && this.fireParticles.length < 240) {
        const heightOffset = Math.random() * 90 - 20;
        const isSteam = rainIntensity > 0.3;
        this.fireParticles.push({
          treeId: tree.id,
          x: tree.x + (Math.random() * 20 - 10),
          y: tree.y + heightOffset,
          vx: (Math.random() * 0.8 - 0.4) + windPush * 1.4,
          vy: -(Math.random() * 1.5 + 0.6),
          life: 0,
          maxLife: Math.floor(Math.random() * 55 + 35),
          size: Math.random() * 7 + 4,
          color: isSteam ? 'rgba(226, 232, 240, 0.25)' : 'rgba(51, 65, 85, 0.4)',
          isSmoke: true,
        });
      }
    }

    // Update active fire & smoke particles
    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const p = this.fireParticles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.isSmoke) {
        p.size += 0.35;
        p.vx *= 0.98;
      } else {
        p.vy += 0.04;
      }

      p.life++;
      if (p.life >= p.maxLife) {
        this.fireParticles.splice(i, 1);
      }
    }
  }

  public clearFireForTree(treeId: number) {
    this.fireParticles = this.fireParticles.filter(p => p.treeId !== treeId);
  }

  public clearAllFire() {
    this.fireParticles = [];
  }

  public drawRain(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number, windSpeed: number) {
    if (intensity <= 0.01) return;

    ctx.save();
    ctx.lineCap = 'round';
    const angleRad = Math.atan2(25, (windSpeed / 100) * 16);
    const activeCount = Math.floor(this.raindrops.length * Math.max(0.1, intensity));

    ctx.strokeStyle = `rgba(186, 230, 253, ${0.45 * intensity})`;
    ctx.beginPath();

    for (let i = 0; i < activeCount; i++) {
      const drop = this.raindrops[i];
      const dx = Math.cos(angleRad) * drop.length;
      const dy = Math.sin(angleRad) * drop.length;

      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + dx, drop.y + dy);
    }
    ctx.lineWidth = 1.2;
    ctx.stroke();

    for (const sp of this.splashes) {
      const alpha = (1 - sp.life / sp.maxLife) * 0.7;
      ctx.fillStyle = sp.color.replace('0.45', alpha.toString());
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineWidth = 1;
    for (const rip of this.groundRipples) {
      ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius * 1.8, rip.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  public drawFireAndSmoke(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.fireParticles) {
      const progress = p.life / p.maxLife;
      const alpha = Math.sin((1 - progress) * Math.PI * 0.8);

      if (p.isSmoke) {
        ctx.fillStyle = p.color.replace(')', `, ${alpha * 0.35})`).replace('rgba', 'rgba').replace(', 0.4', '');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
