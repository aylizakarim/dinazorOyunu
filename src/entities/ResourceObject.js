import { DroppedItem } from './DroppedItem.js';
import { Particle, FloatingText } from './Particle.js';

export class ResourceObject {
  constructor(x, y, type = 'tree_oak') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.initTypeProperties();

    this.hp = this.maxHp;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.flashTimer = 0;
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnDuration = 25; // seconds to regrow
    this.scale = 1;
    this.growthProgress = 1; // 0 to 1
  }

  initTypeProperties() {
    // defaults
    this.category = 'tree'; // 'tree', 'rock', 'dig'
    this.radius = 24;
    this.height = 48;
    this.maxHp = 30;

    switch (this.type) {
      case 'tree_oak':
        this.category = 'tree';
        this.name = 'Meşe Ağacı';
        this.maxHp = 35;
        this.radius = 22;
        this.height = 54;
        break;
      case 'tree_pine':
        this.category = 'tree';
        this.name = 'Çam Ağacı';
        this.maxHp = 45;
        this.radius = 20;
        this.height = 60;
        break;
      case 'tree_crystal':
        this.category = 'tree';
        this.name = 'Kristal Ağaç';
        this.maxHp = 80;
        this.radius = 24;
        this.height = 58;
        break;
      case 'rock_stone':
        this.category = 'rock';
        this.name = 'Granit Kaya';
        this.maxHp = 40;
        this.radius = 22;
        this.height = 36;
        break;
      case 'rock_iron':
        this.category = 'rock';
        this.name = 'Demir Cevheri';
        this.maxHp = 60;
        this.radius = 24;
        this.height = 38;
        break;
      case 'rock_gold':
        this.category = 'rock';
        this.name = 'Altın Cevheri';
        this.maxHp = 90;
        this.radius = 26;
        this.height = 42;
        break;
      case 'rock_gem':
        this.category = 'rock';
        this.name = 'Elmas Jeodu';
        this.maxHp = 130;
        this.radius = 26;
        this.height = 42;
        break;
      case 'rock_meteor':
        this.category = 'rock';
        this.name = 'Kozmik Göktaşı';
        this.maxHp = 120;
        this.radius = 28;
        this.height = 44;
        break;
      case 'dig_spot':
        this.category = 'dig';
        this.name = 'Gizemli Kazı Yeri';
        this.maxHp = 25;
        this.radius = 20;
        this.height = 20;
        break;
    }
  }

  takeDamage(amount, player, particles, floatingTexts, droppedItems, soundManager) {
    if (this.isDead) return false;

    // Critical hit chance based on player luck
    const isCrit = Math.random() < (player.luck * 0.05);
    const finalDamage = isCrit ? Math.round(amount * 1.8) : amount;

    this.hp -= finalDamage;
    this.shakeTimer = 0.22;
    this.flashTimer = 0.12;

    // Spawn floating damage text
    floatingTexts.push(
      new FloatingText(
        this.x,
        this.y - this.height * 0.7,
        isCrit ? `💥-${finalDamage} KRİTİK!` : `-${finalDamage}`,
        isCrit ? '#ff3366' : '#ffffff',
        isCrit ? 18 : 14,
        isCrit
      )
    );

    // Audio and particles
    if (this.category === 'tree') {
      soundManager.playHitTree();
      this.spawnWoodParticles(particles);
    } else if (this.category === 'rock') {
      soundManager.playHitRock();
      this.spawnRockParticles(particles);
    } else {
      soundManager.playHitDig();
      this.spawnDigParticles(particles);
    }

    // Small chance of mini coin drop on intermediate hits
    if (Math.random() < 0.35 + player.luck * 0.05) {
      const dropCount = Math.floor(1 + Math.random() * (1 + player.luck * 0.3));
      droppedItems.push(new DroppedItem(this.x, this.y, 'coin', dropCount));
    }

    // Check destroyed
    if (this.hp <= 0) {
      this.destroy(player, particles, floatingTexts, droppedItems, soundManager);
      return true;
    }
    return false;
  }

  spawnWoodParticles(particles) {
    const colors = ['#8b5a2b', '#a06535', '#4d7c0f', '#84cc16'];
    for (let i = 0; i < 7; i++) {
      particles.push(
        new Particle(this.x, this.y - this.height * 0.5, {
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 130,
          size: 4 + Math.random() * 3,
          shape: Math.random() > 0.4 ? 'square' : 'circle',
          gravity: 240,
        })
      );
    }
  }

  spawnRockParticles(particles) {
    const colors = this.type.includes('gold')
      ? ['#ffb703', '#fb8500', '#8a929a']
      : (this.type.includes('gem') ? ['#ff007f', '#7b2cbf', '#8a929a'] : ['#8a929a', '#b8c0c8', '#5a626a']);
    for (let i = 0; i < 8; i++) {
      particles.push(
        new Particle(this.x, this.y - this.height * 0.4, {
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 150,
          size: 3 + Math.random() * 4,
          shape: 'square',
          gravity: 280,
        })
      );
    }
  }

  spawnDigParticles(particles) {
    const colors = ['#8d6e63', '#a1887f', '#ffb703', '#ffd54f'];
    for (let i = 0; i < 8; i++) {
      particles.push(
        new Particle(this.x, this.y - 10, {
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 120,
          size: 4 + Math.random() * 3,
          shape: 'circle',
          gravity: 220,
        })
      );
    }
  }

  destroy(player, particles, floatingTexts, droppedItems, soundManager) {
    this.isDead = true;
    this.hp = 0;
    this.respawnTimer = this.respawnDuration + Math.random() * 10;
    this.growthProgress = 0;
    soundManager.playDestroy();

    // Big burst of particles
    const burstCount = 18;
    for (let i = 0; i < burstCount; i++) {
      const colors = this.category === 'tree' ? ['#84cc16', '#a06535', '#ffcc00'] : ['#b8c0c8', '#ffb703', '#ff007f'];
      particles.push(
        new Particle(this.x, this.y - this.height * 0.5, {
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 220,
          size: 5 + Math.random() * 4,
          shape: Math.random() > 0.5 ? 'star' : 'circle',
          gravity: 300,
          life: 0.9,
        })
      );
    }

    // Determine drops
    const drops = this.calculateDrops(player);
    drops.forEach(d => {
      for (let i = 0; i < d.count; i++) {
        droppedItems.push(new DroppedItem(this.x, this.y, d.type, d.amountPerItem || 1));
      }
    });

    floatingTexts.push(
      new FloatingText(this.x, this.y - this.height, 'TAMAMLANDI!', '#22c55e', 18, true)
    );
  }

  calculateDrops(player) {
    const luckBonus = 1 + player.luck * 0.15;
    const drops = [];

    switch (this.type) {
      case 'tree_oak':
        drops.push({ type: 'wood', count: Math.round((3 + Math.floor(Math.random() * 3)) * luckBonus) });
        drops.push({ type: 'coin', count: Math.round((4 + Math.floor(Math.random() * 4)) * luckBonus) });
        break;
      case 'tree_pine':
        drops.push({ type: 'wood', count: Math.round((5 + Math.floor(Math.random() * 4)) * luckBonus) });
        drops.push({ type: 'coin', count: Math.round((8 + Math.floor(Math.random() * 6)) * luckBonus) });
        break;
      case 'tree_crystal':
        drops.push({ type: 'wood', count: Math.round(8 * luckBonus) });
        drops.push({ type: 'coin', count: Math.round((20 + Math.floor(Math.random() * 15)) * luckBonus) });
        drops.push({ type: 'gem', count: Math.round(2 + Math.floor(Math.random() * 2)) });
        if (Math.random() < 0.25) drops.push({ type: 'egg', count: 1 });
        break;
      case 'rock_stone':
        drops.push({ type: 'stone', count: Math.round((3 + Math.floor(Math.random() * 3)) * luckBonus) });
        drops.push({ type: 'coin', count: Math.round((5 + Math.floor(Math.random() * 5)) * luckBonus) });
        break;
      case 'rock_iron':
        drops.push({ type: 'stone', count: Math.round((6 + Math.floor(Math.random() * 4)) * luckBonus) });
        drops.push({ type: 'coin', count: Math.round((12 + Math.floor(Math.random() * 8)) * luckBonus) });
        if (Math.random() < 0.3) drops.push({ type: 'gem', count: 1 });
        break;
      case 'rock_gold':
        drops.push({ type: 'stone', count: Math.round(4 * luckBonus) });
        drops.push({ type: 'coin', count: Math.round((25 + Math.floor(Math.random() * 15)) * luckBonus) });
        if (Math.random() < 0.6) drops.push({ type: 'gem', count: 1 + Math.floor(Math.random() * 2) });
        if (Math.random() < 0.2) drops.push({ type: 'egg', count: 1 });
        break;
      case 'rock_gem':
        drops.push({ type: 'stone', count: Math.round(5 * luckBonus) });
        drops.push({ type: 'coin', count: Math.round(40 * luckBonus) });
        drops.push({ type: 'gem', count: Math.round(3 + Math.floor(Math.random() * 3)) });
        if (Math.random() < 0.3) drops.push({ type: 'egg', count: 1 });
        break;
      case 'rock_meteor':
        drops.push({ type: 'coin', count: Math.round((80 + Math.floor(Math.random() * 40)) * luckBonus) });
        drops.push({ type: 'gem', count: Math.round((6 + Math.floor(Math.random() * 6)) * luckBonus) });
        drops.push({ type: 'fossil', count: 2 });
        if (Math.random() < 0.45) drops.push({ type: 'egg', count: 1 });
        // 50% chance to drop a rare prehistoric museum fossil bone
        if (Math.random() < 0.5 + player.luck * 0.05) drops.push({ type: 'rare_bone', count: 1 });
        break;
      case 'dig_spot':
        drops.push({ type: 'coin', count: Math.round((15 + Math.floor(Math.random() * 15)) * luckBonus) });
        drops.push({ type: 'fossil', count: 1 });
        if (Math.random() < 0.4) drops.push({ type: 'gem', count: 1 });
        if (Math.random() < 0.25) drops.push({ type: 'egg', count: 1 });
        // 40% chance to drop a rare prehistoric museum fossil bone
        if (Math.random() < 0.4 + player.luck * 0.05) drops.push({ type: 'rare_bone', count: 1 });
        break;
    }

    return drops;
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.shakeOffsetX = (Math.random() - 0.5) * 8;
      this.shakeOffsetY = (Math.random() - 0.5) * 8;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    if (this.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        // Regrow
        this.isDead = false;
        this.hp = this.maxHp;
        this.growthProgress = 0;
      }
    } else if (this.growthProgress < 1) {
      this.growthProgress = Math.min(1, this.growthProgress + dt * 2.5);
    }
  }

  draw(ctx) {
    if (this.isDead) {
      // Draw stump / debris if destroyed
      this.drawStumpOrDebris(ctx);
      return;
    }

    ctx.save();
    ctx.translate(this.x + this.shakeOffsetX, this.y + this.shakeOffsetY);

    const currentScale = 0.3 + 0.7 * this.growthProgress;
    ctx.scale(currentScale, currentScale);

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 6, this.radius * 1.1, this.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // White flash filter when hit
    if (this.flashTimer > 0) {
      ctx.filter = 'brightness(2.2)';
    }

    if (this.category === 'tree') {
      this.drawTree(ctx);
    } else if (this.category === 'rock') {
      this.drawRock(ctx);
    } else if (this.category === 'dig') {
      this.drawDigSpot(ctx);
    }

    ctx.restore();

    // Draw Health Bar if damaged and alive
    if (!this.isDead && this.hp < this.maxHp) {
      this.drawHealthBar(ctx);
    }
  }

  drawTree(ctx) {
    if (this.type === 'tree_oak') {
      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-7, -24, 14, 28, 4);
      ctx.fill();

      // Tree Foliage (Cute rounded cloud layers)
      ctx.fillStyle = '#15803d'; // dark green back
      ctx.beginPath();
      ctx.arc(0, -36, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e'; // bright green main
      ctx.beginPath();
      ctx.arc(-10, -40, 18, 0, Math.PI * 2);
      ctx.arc(10, -38, 17, 0, Math.PI * 2);
      ctx.arc(0, -50, 19, 0, Math.PI * 2);
      ctx.fill();

      // Cute golden/red apple fruits
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-8, -48, 3.5, 0, Math.PI * 2);
      ctx.arc(11, -44, 3.5, 0, Math.PI * 2);
      ctx.arc(2, -32, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'tree_pine') {
      // Trunk
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(-6, -20, 12, 24);

      // Pine foliage (3 stacked triangular tiers)
      const tiers = [
        { y: -18, w: 26, h: 20, col: '#166534' },
        { y: -32, w: 22, h: 18, col: '#15803d' },
        { y: -46, w: 16, h: 16, col: '#22c55e' },
      ];
      tiers.forEach(t => {
        ctx.fillStyle = t.col;
        ctx.beginPath();
        ctx.moveTo(0, t.y - t.h);
        ctx.lineTo(t.w, t.y);
        ctx.lineTo(-t.w, t.y);
        ctx.closePath();
        ctx.fill();
      });
    } else if (this.type === 'tree_crystal') {
      // Crystal tree with shimmering trunk and jewel canopy
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(-6, -24, 12, 28);

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, -38, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(-8, -42, 17, 0, Math.PI * 2);
      ctx.arc(8, -40, 16, 0, Math.PI * 2);
      ctx.fill();

      // Gems hanging
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -52, 4.5, 0, Math.PI * 2);
      ctx.arc(-11, -34, 4, 0, Math.PI * 2);
      ctx.arc(10, -34, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawRock(ctx) {
    let mainColor = '#64748b';
    let highlightColor = '#94a3b8';
    let oreColor = null;

    if (this.type === 'rock_iron') {
      mainColor = '#57534e';
      highlightColor = '#78716c';
      oreColor = '#d97706';
    } else if (this.type === 'rock_gold') {
      mainColor = '#475569';
      highlightColor = '#64748b';
      oreColor = '#facc15';
    } else if (this.type === 'rock_gem') {
      mainColor = '#334155';
      highlightColor = '#475569';
      oreColor = '#ec4899';
    } else if (this.type === 'rock_meteor') {
      mainColor = '#3b0764';
      highlightColor = '#7e22ce';
      oreColor = '#38bdf8';

      // Pulsing cosmic aura
      const pulse = 24 + Math.sin(Date.now() * 0.006) * 5;
      ctx.fillStyle = 'rgba(192, 132, 252, 0.28)';
      ctx.beginPath();
      ctx.arc(0, -10, pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rock main body
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-15, -16);
    ctx.lineTo(-4, -28);
    ctx.lineTo(12, -26);
    ctx.lineTo(20, -12);
    ctx.lineTo(17, 4);
    ctx.lineTo(-2, 6);
    ctx.closePath();
    ctx.fill();

    // Highlight facet
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.moveTo(-4, -28);
    ctx.lineTo(12, -26);
    ctx.lineTo(5, -14);
    ctx.lineTo(-10, -15);
    ctx.closePath();
    ctx.fill();

    // Ore gems visible on surface
    if (oreColor) {
      ctx.fillStyle = oreColor;
      ctx.beginPath();
      ctx.arc(-6, -8, 4.5, 0, Math.PI * 2);
      ctx.arc(8, -16, 5, 0, Math.PI * 2);
      ctx.arc(6, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDigSpot(ctx) {
    // Dirt mound with glowing crack and sparkling gold/fossil peek
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, -3, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crack
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(4, -3);
    ctx.lineTo(8, 2);
    ctx.stroke();

    // Gold sparkle hint
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(1, -2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStumpOrDebris(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.category === 'tree') {
      // Tree stump
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(0, 2, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Tiny rubble
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-5, 2, 4, 0, Math.PI * 2);
      ctx.arc(4, 3, 3, 0, Math.PI * 2);
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHealthBar(ctx) {
    const barW = 34;
    const barH = 5;
    const barX = this.x - barW / 2;
    const barY = this.y - this.height - 10;
    const pct = Math.max(0, this.hp / this.maxHp);

    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // HP Fill
    ctx.fillStyle = pct > 0.5 ? '#22c55e' : (pct > 0.25 ? '#eab308' : '#ef4444');
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.restore();
  }
}
