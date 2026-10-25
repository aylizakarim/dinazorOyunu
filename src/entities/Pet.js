import { Particle, FloatingText } from './Particle.js';

export class Pet {
  constructor(type = 'rex', name = 'Bebek Rexi') {
    this.type = type; // 'rex', 'tricera', 'ptero'
    this.name = name;
    this.x = 1100;
    this.y = 900;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;

    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;

    // Movement & Animation
    this.speed = 210;
    this.facing = 1;
    this.moving = false;
    this.walkCycle = 0;
    this.hopTimer = 0;
    this.targetItem = null;
    this.attackCooldown = 0;
    this.heartTimer = 0;
  }

  getMiningPower() {
    return 4 + (this.level - 1) * 3;
  }

  addXp(amount, floatingTexts, soundManager) {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;
      this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.5);
      this.speed += 10;
      soundManager.playUpgrade();
      floatingTexts.push(
        new FloatingText(this.x, this.y - 20, `🐾 ${this.name} SEVİYE ${this.level}!`, '#f472b6', 16, true)
      );
    }
  }

  update(dt, player, world, droppedItems, economy, particles, floatingTexts, soundManager) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.heartTimer = Math.max(0, this.heartTimer - dt);

    // AI DECISION 1: Is there a dropped item to fetch?
    let target = null;
    let closestDist = 220; // pet detection range

    for (const item of droppedItems) {
      const d = Math.hypot(item.x - this.x, item.y - this.y);
      if (d < closestDist) {
        target = item;
        closestDist = d;
      }
    }

    // AI DECISION 2: If player is mining something nearby, help mine it!
    const playerTarget = world.getMiningTarget(player);
    const shouldHelpMine = !target && playerTarget && player.isSwinging;

    let targetX = player.x - player.facing * 32;
    let targetY = player.y + 6;

    if (target) {
      targetX = target.x;
      targetY = target.y;
    } else if (shouldHelpMine) {
      targetX = playerTarget.x + (player.facing > 0 ? 30 : -30);
      targetY = playerTarget.y;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    // Stop distance
    const stopDist = target ? 12 : (shouldHelpMine ? 20 : 28);

    if (dist > stopDist) {
      this.moving = true;
      const moveSpeed = target ? this.speed * 1.25 : this.speed;
      this.vx = (dx / dist) * moveSpeed;
      this.vy = (dy / dist) * moveSpeed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (Math.abs(dx) > 2) {
        this.facing = dx > 0 ? 1 : -1;
      }

      this.walkCycle += dt * 14;
    } else {
      this.moving = false;
      this.vx = 0;
      this.vy = 0;
      this.walkCycle = 0;

      // If arrived at dropped item, pick it up!
      if (target && dist <= 18) {
        if (target.type.startsWith('seed_') && player.game && player.game.farmingSystem) {
          player.game.farmingSystem.addSeed(target.type, target.amount);
          soundManager.playTone(520, 0.1, 'sine', 0.08, 100);
        } else if (target.type.startsWith('crop_') && player.game && player.game.farmingSystem) {
          player.game.farmingSystem.addCrop(target.type, target.amount);
          soundManager.playItemPickup('fossil');
        } else if (target.type === 'egg' && player.game && player.game.petSystem) {
          const eggTypes = ['rex', 'tricera', 'ptero'];
          const randomType = eggTypes[Math.floor(Math.random() * eggTypes.length)];
          player.game.petSystem.findEgg(randomType);
          soundManager.playUpgrade();
        } else if (target.type === 'rare_bone' && player.game && player.game.museumSystem) {
          const randomBone = player.game.museumSystem.getRandomMissingBone();
          player.game.museumSystem.addBone(randomBone.id, soundManager, floatingTexts);
        } else {
          economy.add(target.type, target.amount);
          soundManager.playItemPickup(target.type);
        }
        this.addXp(15, floatingTexts, soundManager);

        // Remove item from pool
        const idx = droppedItems.indexOf(target);
        if (idx !== -1) droppedItems.splice(idx, 1);

        // Heart particle
        particles.push(
          new Particle(this.x, this.y - 12, {
            color: '#ec4899',
            speed: 40,
            size: 4,
            shape: 'star',
            life: 0.6,
          })
        );
      }

      // If arrived at mining target, hit it!
      if (shouldHelpMine && dist <= 28 && this.attackCooldown <= 0) {
        this.attackCooldown = 0.45;
        const destroyed = playerTarget.takeDamage(
          this.getMiningPower(),
          player,
          particles,
          floatingTexts,
          droppedItems,
          soundManager
        );
        this.addXp(25, floatingTexts, soundManager);
        this.hopTimer = 0.2;
      }
    }

    if (this.hopTimer > 0) this.hopTimer -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const hop = this.moving ? Math.abs(Math.sin(this.walkCycle)) * 4 : (this.hopTimer > 0 ? 6 : 0);
    ctx.translate(0, -hop);

    // Baby shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 5 + hop, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.scale(this.facing, 1);

    if (this.type === 'tricera') {
      this.drawBabyTricera(ctx);
    } else if (this.type === 'ptero') {
      this.drawBabyPtero(ctx);
    } else {
      this.drawBabyRex(ctx);
    }

    ctx.restore();

    // Name tag and Level above head
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(this.x - 30, this.y - 28, 60, 15, 5);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.name} [Sv.${this.level}]`, this.x, this.y - 20);
    ctx.restore();
  }

  drawBabyRex(ctx) {
    // Cute Tiny Orange/Gold T-Rex
    // Tail
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(-12, -2, -14, 2);
    ctx.quadraticCurveTo(-8, 6, -3, 3);
    ctx.fill();

    // Body
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(2, 1, 4, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tiny feet
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-4, 6, 3, 4);
    ctx.fillRect(1, 6, 3, 4);

    // Cute oversized Baby Head
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-2, -16, 13, 11, 4);
    ctx.fill();

    // Huge Shiny Baby Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -11, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(5, -11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5.5, -12, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Rosy cheeks
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(2, -8, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBabyTricera(ctx) {
    // Cute Baby Blue Triceratops
    // Body
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, 1, 9, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Frill
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, -9, 8, -Math.PI * 0.7, Math.PI * 0.2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(0, -14, 11, 10, 4);
    ctx.fill();

    // Tiny white horns
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(5, -14);
    ctx.lineTo(9, -18);
    ctx.lineTo(7, -12);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-4, 6, 4, 4);
    ctx.fillRect(2, 6, 4, 4);

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(5, -10, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBabyPtero(ctx) {
    // Cute Pink Flying Pterodactyl (flaps wings!)
    const flap = Math.sin(this.walkCycle * 2) * 5;

    // Body
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0, -2, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(-12, -10 + flap);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.lineTo(12, -10 + flap);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Head & Crest
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.moveTo(-6, -17);
    ctx.lineTo(3, -12);
    ctx.lineTo(10, -9);
    ctx.lineTo(2, -7);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(4, -11, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
