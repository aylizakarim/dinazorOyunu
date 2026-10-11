import { ResourceObject } from '../entities/ResourceObject.js';

export class TimeSystem {
  constructor(game) {
    this.game = game;
    this.dayDuration = 180; // 180 seconds = 24 in-game hours (3 minutes per day)
    this.currentTime = 8.0; // Start at 08:00 morning
    this.dayCount = 1;
    this.meteorTriggeredTonight = false;

    // Active falling meteor animations
    this.fallingMeteors = [];
  }

  update(dt) {
    // Progress in-game time (24 hours per dayDuration)
    const hoursPerSec = 24 / this.dayDuration;
    this.currentTime += dt * hoursPerSec;

    if (this.currentTime >= 24) {
      this.currentTime -= 24;
      this.dayCount++;
      this.meteorTriggeredTonight = false;
      this.game.uiManager.showToast(`🌅 Gün ${this.dayCount} Başladı! Günaydın!`);
    }

    // Check for Night Meteor Shower Event (Between 22:00 and 03:00)
    const isNight = this.currentTime >= 21.5 || this.currentTime <= 4.5;
    if (isNight && !this.meteorTriggeredTonight) {
      // 70% chance of meteor falling during night
      if (Math.random() < 0.008) {
        this.triggerMeteorShower();
      }
    }

    // Update active falling meteor projectiles
    for (let i = this.fallingMeteors.length - 1; i >= 0; i--) {
      const met = this.fallingMeteors[i];
      met.progress += dt / met.duration;

      // Spawn fiery smoke and sparkles along path
      if (Math.random() > 0.2) {
        const curX = met.startX + (met.targetX - met.startX) * met.progress;
        const curY = met.startY + (met.targetY - met.startY) * met.progress;
        this.game.particles.push({
          x: curX + (Math.random() - 0.5) * 16,
          y: curY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 40,
          vy: -30 - Math.random() * 50,
          color: Math.random() > 0.4 ? '#f59e0b' : '#ec4899',
          size: 4 + Math.random() * 5,
          alpha: 1,
          life: 0.5,
          maxLife: 0.5,
          shape: 'star',
          update(d) {
            this.x += this.vx * d;
            this.y += this.vy * d;
            this.life -= d;
            this.alpha = Math.max(0, this.life / this.maxLife);
            return this.life > 0;
          },
          draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          },
        });
      }

      if (met.progress >= 1.0) {
        this.impactMeteor(met);
        this.fallingMeteors.splice(i, 1);
      }
    }
  }

  triggerMeteorShower() {
    this.meteorTriggeredTonight = true;

    // Pick landing spot outside village plaza in wild zones
    let targetX, targetY;
    if (Math.random() > 0.5) {
      // Emerald Forest (West)
      targetX = 150 + Math.random() * 450;
      targetY = 200 + Math.random() * 1200;
    } else {
      // Mining Quarry / Desert (East or South)
      targetX = 1450 + Math.random() * 500;
      targetY = 200 + Math.random() * 1300;
    }

    const startX = targetX - 400;
    const startY = targetY - 650;

    this.fallingMeteors.push({
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      duration: 1.8,
    });

    this.game.soundManager.playTone(600, 0.6, 'sawtooth', 0.12, -400);
    this.game.uiManager.showToast('☄️ DİKKAT: Gökyüzünden parıldayan bir Göktaşı düşüyor!');
  }

  impactMeteor(met) {
    // Sound of impact
    this.game.soundManager.playTone(120, 0.8, 'sawtooth', 0.35, -90);
    setTimeout(() => {
      this.game.soundManager.playTone(450, 0.4, 'triangle', 0.2, 200);
    }, 100);

    // Giant burst of cosmic particles
    for (let i = 0; i < 40; i++) {
      const colors = ['#f43f5e', '#a855f7', '#38bdf8', '#facc15', '#ffffff'];
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 260;
      this.game.particles.push({
        x: met.targetX,
        y: met.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 6,
        alpha: 1,
        life: 1.2,
        maxLife: 1.2,
        shape: 'star',
        update(d) {
          this.x += this.vx * d;
          this.y += this.vy * d;
          this.vy += 80 * d;
          this.life -= d;
          this.alpha = Math.max(0, this.life / this.maxLife);
          return this.life > 0;
        },
        draw(ctx) {
          ctx.save();
          ctx.globalAlpha = this.alpha;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        },
      });
    }

    // Spawn Meteor Resource Node
    const meteorNode = new ResourceObject(met.targetX, met.targetY, 'rock_meteor');
    this.game.world.resources.push(meteorNode);
    this.game.uiManager.showToast('🌟 Kozmik Göktaşı yere indi! Koşup madenini kaz!');
  }

  getDarknessLevel() {
    const t = this.currentTime;
    // 08:00 - 18:00: Day (0.0)
    if (t >= 8.0 && t <= 17.5) return 0;

    // 17.5 - 21.0: Dusk (transitions 0.0 -> 0.8)
    if (t > 17.5 && t <= 21.0) {
      return ((t - 17.5) / 3.5) * 0.80;
    }

    // 21.0 - 05.0: Night (0.80)
    if (t > 21.0 || t < 5.0) {
      return 0.80;
    }

    // 05.0 - 08.0: Dawn (transitions 0.80 -> 0.0)
    if (t >= 5.0 && t < 8.0) {
      return (1 - (t - 5.0) / 3.0) * 0.80;
    }

    return 0;
  }

  getTimeFormatted() {
    const hours = Math.floor(this.currentTime);
    const minutes = Math.floor((this.currentTime - hours) * 60);
    const padH = String(hours).padStart(2, '0');
    const padM = String(minutes).padStart(2, '0');

    let icon = '☀️';
    if (this.currentTime >= 20.5 || this.currentTime < 5.5) icon = '🌙';
    else if (this.currentTime >= 17.5) icon = '🌅';
    else if (this.currentTime >= 5.5 && this.currentTime < 8.0) icon = '🌄';

    return {
      text: `${padH}:${padM}`,
      icon,
      day: this.dayCount,
      isNight: this.currentTime >= 20.5 || this.currentTime < 5.5,
    };
  }

  drawLighting(ctx, camera) {
    const darkness = this.getDarknessLevel();
    if (darkness <= 0.02) {
      // Draw falling meteors even in daytime if any
      this.drawFallingMeteors(ctx);
      return;
    }

    // Render darkness layer onto canvas with smooth lighting cutouts
    ctx.save();

    // Semi-transparent night veil
    ctx.fillStyle = `rgba(10, 15, 35, ${darkness})`;
    ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

    // Warm cutouts for active lights using blend mode 'screen' or bright radial highlights
    // 1. Village lanterns
    const lanterns = [
      { x: 780, y: 630 },
      { x: 1420, y: 630 },
      { x: 780, y: 1170 },
      { x: 1420, y: 1170 },
    ];

    lanterns.forEach(lamp => {
      this.drawLightGlow(ctx, lamp.x, lamp.y, 80, 'rgba(253, 224, 71, 0.45)');
    });

    // 2. Village Fountain gentle starlight glow
    this.drawLightGlow(ctx, 1100, 800, 70, 'rgba(56, 189, 248, 0.35)');

    // 3. Campfire / House lights
    if (this.game.world.housePlot && this.game.world.housePlot.tier >= 1) {
      const hx = this.game.world.housePlot.x + this.game.world.housePlot.width / 2;
      const hy = this.game.world.housePlot.y + this.game.world.housePlot.height / 2;
      this.drawLightGlow(ctx, hx, hy, 100, 'rgba(249, 115, 22, 0.55)');
    }

    // 4. Player light aura
    const hasMinerHat = this.game.player.hat === 'miner';
    const playerRadius = hasMinerHat ? 160 : 70;
    const playerColor = hasMinerHat ? 'rgba(254, 240, 138, 0.65)' : 'rgba(255, 255, 255, 0.28)';
    this.drawLightGlow(ctx, this.game.player.x, this.game.player.y - 10, playerRadius, playerColor);

    // 5. Active Meteor rocks glow in the dark
    for (const res of this.game.world.resources) {
      if (!res.isDead && res.type === 'rock_meteor') {
        const pulse = 90 + Math.sin(Date.now() * 0.006) * 15;
        this.drawLightGlow(ctx, res.x, res.y - 10, pulse, 'rgba(236, 72, 153, 0.6)');
      }
    }

    ctx.restore();

    // Draw active falling meteor streaks
    this.drawFallingMeteors(ctx);
  }

  drawLightGlow(ctx, x, y, radius, color) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Soft warm tint on top
    ctx.globalCompositeOperation = 'lighter';
    const tintGrad = ctx.createRadialGradient(x, y, 2, x, y, radius * 0.85);
    tintGrad.addColorStop(0, color);
    tintGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tintGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFallingMeteors(ctx) {
    this.fallingMeteors.forEach(met => {
      const curX = met.startX + (met.targetX - met.startX) * met.progress;
      const curY = met.startY + (met.targetY - met.startY) * met.progress;

      ctx.save();
      // Glowing Meteor core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(curX, curY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Fire trail
      const trailGrad = ctx.createLinearGradient(curX, curY, curX - 60, curY - 90);
      trailGrad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
      trailGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
      trailGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');

      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(curX + 8, curY - 6);
      ctx.lineTo(curX - 70, curY - 110);
      ctx.lineTo(curX - 6, curY + 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }
}
