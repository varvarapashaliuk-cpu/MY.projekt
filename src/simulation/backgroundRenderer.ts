import { TimeOfDay } from '../types/storm';

interface CloudPuff {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
}

interface ForestTree {
  x: number;
  height: number;
  type: 'pine' | 'broadleaf';
  layer: number; // 0 = far, 1 = mid
  swayPhase: number;
}

export class BackgroundRenderer {
  private clouds: CloudPuff[] = [];
  private backgroundTrees: ForestTree[] = [];
  private initialized = false;

  public init(width: number, height: number) {
    this.clouds = [];
    const cloudCount = Math.floor(width / 70) + 12;
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.35) - 40,
        radius: Math.random() * 90 + 70,
        speed: (Math.random() * 0.4 + 0.2),
        alpha: Math.random() * 0.25 + 0.35,
      });
    }

    this.backgroundTrees = [];
    // Distant background pines (Layer 0)
    const farCount = Math.floor(width / 32) + 6;
    for (let i = 0; i < farCount; i++) {
      this.backgroundTrees.push({
        x: (i * 32) + (Math.random() * 14 - 7),
        height: Math.random() * 70 + 90,
        type: 'pine',
        layer: 0,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }

    // Midground trees (Layer 1)
    const midCount = Math.floor(width / 65) + 4;
    for (let i = 0; i < midCount; i++) {
      this.backgroundTrees.push({
        x: (i * 65) + (Math.random() * 24 - 12),
        height: Math.random() * 90 + 140,
        type: Math.random() > 0.4 ? 'pine' : 'broadleaf',
        layer: 1,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }

    this.initialized = true;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    windSpeed: number,
    ambientFlash: number, // 0 to 1
    timeOfDay: TimeOfDay
  ) {
    if (!this.initialized) {
      this.init(width, height);
    }

    const groundY = height * 0.78;

    // 1. Sky Gradient with Lightning Flash
    this.drawSky(ctx, width, height, ambientFlash, timeOfDay);

    // 2. Rolling Storm Clouds
    this.drawClouds(ctx, width, time, windSpeed, ambientFlash);

    // 3. Far misty mountain silhouettes
    this.drawMountains(ctx, width, groundY, ambientFlash);

    // 4. Distant Pine Layer
    this.drawFarForest(ctx, groundY, windSpeed, time, ambientFlash);

    // 5. Forest Floor Base
    this.drawGround(ctx, width, height, groundY, ambientFlash);

    // 6. Midground Swaying Trees
    this.drawMidForest(ctx, groundY, windSpeed, time, ambientFlash);

    return groundY;
  }

  private drawSky(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    flash: number,
    timeOfDay: TimeOfDay
  ) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);

    if (flash > 0.05) {
      // Sky illuminated by lightning flash (violent purple-white bloom)
      const flashColorTop = `rgba(${Math.floor(180 + flash * 75)}, ${Math.floor(200 + flash * 55)}, ${Math.floor(240 + flash * 15)}, 1)`;
      const flashColorMid = `rgba(${Math.floor(90 + flash * 110)}, ${Math.floor(100 + flash * 120)}, ${Math.floor(160 + flash * 90)}, 1)`;
      const flashColorBot = `rgba(${Math.floor(40 + flash * 60)}, ${Math.floor(50 + flash * 60)}, ${Math.floor(80 + flash * 70)}, 1)`;

      grad.addColorStop(0, flashColorTop);
      grad.addColorStop(0.4, flashColorMid);
      grad.addColorStop(1, flashColorBot);
    } else {
      if (timeOfDay === 'twilight') {
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.5, '#141c2c');
        grad.addColorStop(0.85, '#202636');
        grad.addColorStop(1, '#131922');
      } else if (timeOfDay === 'foggy') {
        grad.addColorStop(0, '#0b1219');
        grad.addColorStop(0.5, '#17222d');
        grad.addColorStop(0.85, '#22303c');
        grad.addColorStop(1, '#1b252d');
      } else {
        // Midnight storm
        grad.addColorStop(0, '#030712');
        grad.addColorStop(0.4, '#090f1f');
        grad.addColorStop(0.8, '#0d1527');
        grad.addColorStop(1, '#060a12');
      }
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  private drawClouds(
    ctx: CanvasRenderingContext2D,
    width: number,
    time: number,
    windSpeed: number,
    flash: number
  ) {
    ctx.save();
    const windPush = (windSpeed / 100) * 1.5;

    for (const c of this.clouds) {
      c.x += (c.speed + windPush);
      if (c.x - c.radius > width) c.x = -c.radius;
      if (c.x + c.radius < 0) c.x = width + c.radius;

      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.2, c.x, c.y, c.radius);
      if (flash > 0.05) {
        grad.addColorStop(0, `rgba(220, 225, 245, ${0.45 + flash * 0.45})`);
        grad.addColorStop(0.6, `rgba(130, 145, 185, ${0.35 + flash * 0.35})`);
        grad.addColorStop(1, 'rgba(30, 41, 59, 0)');
      } else {
        grad.addColorStop(0, `rgba(30, 41, 59, ${c.alpha})`);
        grad.addColorStop(0.6, `rgba(15, 23, 42, ${c.alpha * 0.7})`);
        grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMountains(ctx: CanvasRenderingContext2D, width: number, groundY: number, flash: number) {
    ctx.save();
    ctx.fillStyle = flash > 0.05 ? '#24324a' : '#080d17';

    // Distant mountain ridge
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(0, groundY - 140);
    ctx.bezierCurveTo(
      width * 0.25, groundY - 210,
      width * 0.45, groundY - 120,
      width * 0.65, groundY - 190
    );
    ctx.bezierCurveTo(
      width * 0.82, groundY - 240,
      width * 0.95, groundY - 130,
      width, groundY - 150
    );
    ctx.lineTo(width, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawFarForest(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    windSpeed: number,
    time: number,
    flash: number
  ) {
    ctx.save();
    const windForce = (windSpeed / 100);
    ctx.fillStyle = flash > 0.05 ? '#1b2a3c' : '#081017';

    for (const tree of this.backgroundTrees.filter(t => t.layer === 0)) {
      const sway = Math.sin(time * 2.2 + tree.swayPhase) * (tree.height * 0.04) * windForce + (windForce * 12);
      const baseY = groundY - 10;
      const topY = baseY - tree.height;
      const topX = tree.x + sway;

      // Triangular pine silhouette
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(tree.x - 16, baseY);
      ctx.lineTo(tree.x + 16, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawGround(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    groundY: number,
    flash: number
  ) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, groundY - 20, 0, height);
    if (flash > 0.05) {
      grad.addColorStop(0, '#1c2826');
      grad.addColorStop(0.3, '#141e1a');
      grad.addColorStop(1, '#0b110e');
    } else {
      grad.addColorStop(0, '#0f1715');
      grad.addColorStop(0.3, '#0c1311');
      grad.addColorStop(1, '#050807');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, groundY);
    // Subtle natural hill curvature
    ctx.bezierCurveTo(
      width * 0.3, groundY - 15,
      width * 0.7, groundY + 12,
      width, groundY
    );
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Dark forest puddle reflecting sky light
    ctx.fillStyle = flash > 0.05 ? 'rgba(96, 165, 250, 0.45)' : 'rgba(10, 20, 30, 0.7)';
    ctx.beginPath();
    ctx.ellipse(width * 0.28, groundY + 45, width * 0.15, 14, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(width * 0.74, groundY + 55, width * 0.12, 10, 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawMidForest(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    windSpeed: number,
    time: number,
    flash: number
  ) {
    ctx.save();
    const windForce = (windSpeed / 100);

    for (const tree of this.backgroundTrees.filter(t => t.layer === 1)) {
      // Don't overlap with ancient oak in center
      // Ancient oak is centered around width * 0.52
      const sway = Math.sin(time * 2.8 + tree.swayPhase) * (tree.height * 0.06) * windForce + (windForce * 18);
      const baseY = groundY + 15;
      const topY = baseY - tree.height;
      const topX = tree.x + sway;

      if (tree.type === 'pine') {
        ctx.fillStyle = flash > 0.05 ? '#192823' : '#0c1613';
        // Tiered pine branches
        const tiers = 4;
        const tierHeight = tree.height / tiers;
        for (let t = 0; t < tiers; t++) {
          const tProgress = t / tiers;
          const ty = topY + t * tierHeight;
          const tx = tree.x + sway * (1 - tProgress * 0.6);
          const tw = (t + 1) * 11 + 6;

          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - tw, ty + tierHeight * 1.3);
          ctx.lineTo(tx + tw, ty + tierHeight * 1.3);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Broadleaf silhouette
        ctx.fillStyle = flash > 0.05 ? '#17221d' : '#0a1310';
        ctx.strokeStyle = flash > 0.05 ? '#0d1512' : '#060b09';
        ctx.lineWidth = 6;

        // Trunk
        ctx.beginPath();
        ctx.moveTo(tree.x, baseY);
        ctx.quadraticCurveTo(tree.x + sway * 0.4, baseY - tree.height * 0.5, topX, topY + 40);
        ctx.stroke();

        // Canopy oval
        ctx.beginPath();
        ctx.ellipse(topX, topY + 30, 26, 32, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
