import { Particle } from './Particle.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;

    // Base attributes
    this.baseSpeed = 180;
    this.miningPower = 12;
    this.miningSpeed = 0.32; // seconds between swings
    this.luck = 1;
    this.magnetRadius = 80;

    // Movement & Animation state
    this.facing = 1; // 1 = right, -1 = left
    this.moving = false;
    this.walkCycle = 0;
    this.tailAngle = 0;
    this.blinkTimer = 2 + Math.random() * 3;
    this.isBlinking = false;

    // Swing / Digging state
    this.isSwinging = false;
    this.swingTimer = 0;
    this.swingDuration = 0.22;
    this.swingCooldown = 0;

    // Customization / Costumes
    this.skin = 'green'; // 'green', 'blue', 'red', 'purple', 'gold', 'pink'
    this.hat = 'none'; // 'none', 'cowboy', 'chef', 'miner', 'party', 'pirate', 'crown'
    this.outfit = 'none'; // 'none', 'cape', 'tuxedo', 'backpack', 'armor'
    this.tool = 'pickaxe_wood'; // 'pickaxe_wood', 'pickaxe_stone', 'pickaxe_iron', 'pickaxe_gold', 'pickaxe_diamond'

    // Footstep particle timer
    this.stepParticleTimer = 0;
    this.audioFootstepTimer = 0;
  }

  getSpeed() {
    return this.baseSpeed;
  }

  update(dt, input, world, particles, soundManager) {
    // Cooldown timers
    if (this.swingCooldown > 0) this.swingCooldown -= dt;
    if (this.swingTimer > 0) {
      this.swingTimer -= dt;
      if (this.swingTimer <= 0) {
        this.isSwinging = false;
      }
    }

    // Blinking logic
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = !this.isBlinking;
      this.blinkTimer = this.isBlinking ? 0.15 : (2.5 + Math.random() * 3);
    }

    // Movement input calculation
    let dx = 0;
    let dy = 0;

    if (input.keys['KeyW'] || input.keys['ArrowUp']) { dy -= 1; input.targetPos = null; }
    if (input.keys['KeyS'] || input.keys['ArrowDown']) { dy += 1; input.targetPos = null; }
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) { dx -= 1; input.targetPos = null; }
    if (input.keys['KeyD'] || input.keys['ArrowRight']) { dx += 1; input.targetPos = null; }

    // Click/Tap to move destination
    if (dx === 0 && dy === 0 && input.targetPos) {
      const tdx = input.targetPos.x - this.x;
      const tdy = input.targetPos.y - this.y;
      const dist = Math.hypot(tdx, tdy);
      if (dist > 14) {
        dx = tdx / dist;
        dy = tdy / dist;
      } else {
        input.targetPos = null;
      }
    }

    // Touch joystick or mouse move support
    if (input.touchDir) {
      dx = input.touchDir.x;
      dy = input.touchDir.y;
      input.targetPos = null;
    }

    const len = Math.hypot(dx, dy);
    this.moving = len > 0.05;

    if (this.moving) {
      const speed = this.getSpeed();
      const normX = dx / len;
      const normY = dy / len;

      this.vx = normX * speed;
      this.vy = normY * speed;

      if (dx > 0.1) this.facing = 1;
      else if (dx < -0.1) this.facing = -1;

      this.walkCycle += dt * 12;
      this.tailAngle = Math.sin(this.walkCycle * 0.8) * 0.35;

      // Dust particles while running
      this.stepParticleTimer += dt;
      if (this.stepParticleTimer > 0.14) {
        this.stepParticleTimer = 0;
        particles.push(
          new Particle(this.x - this.facing * 10, this.y + 4, {
            color: '#a8a29e',
            speed: 30,
            size: 3 + Math.random() * 3,
            life: 0.35,
            gravity: -20,
          })
        );
      }

      // Audio footstep
      this.audioFootstepTimer += dt;
      if (this.audioFootstepTimer > 0.28) {
        this.audioFootstepTimer = 0;
        soundManager.playFootstep();
      }
    } else {
      this.vx = 0;
      this.vy = 0;
      this.walkCycle = 0;
      this.tailAngle = Math.sin(Date.now() * 0.003) * 0.15;
    }

    // Apply movement with world collision boundaries
    const newX = this.x + this.vx * dt;
    const newY = this.y + this.vy * dt;

    if (world.canMoveTo(newX, this.y, this.radius)) {
      this.x = newX;
    }
    if (world.canMoveTo(this.x, newY, this.radius)) {
      this.y = newY;
    }
  }

  startSwing() {
    if (this.swingCooldown <= 0) {
      this.isSwinging = true;
      this.swingTimer = this.swingDuration;
      this.swingCooldown = this.miningSpeed;
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Minor bounce when walking
    const bounceY = this.moving ? Math.abs(Math.sin(this.walkCycle)) * 3 : 0;
    ctx.translate(0, -bounceY);

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 6 + bounceY, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Miner light glow if wearing miner hat
    if (this.hat === 'miner') {
      ctx.save();
      const grad = ctx.createRadialGradient(
        this.facing * 12, -26, 5,
        this.facing * 50, -20, 80
      );
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.facing * 12, -26, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Facing flip
    ctx.scale(this.facing, 1);

    // 1. Cape outfit (drawn in back)
    if (this.outfit === 'cape') {
      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      const capeFlutter = this.moving ? Math.sin(this.walkCycle) * 6 : 0;
      ctx.moveTo(-4, -12);
      ctx.lineTo(-24 + capeFlutter, 2);
      ctx.lineTo(-18 + capeFlutter, 8);
      ctx.lineTo(-2, -6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Dinosaur Tail
    this.drawTail(ctx);

    // 3. Dinosaur Feet (Cute little legs)
    this.drawFeet(ctx);

    // 4. Dinosaur Body
    this.drawBody(ctx);

    // 5. Outfit on top of body (Tuxedo / Armor / Backpack)
    this.drawOutfit(ctx);

    // 6. Dinosaur Head & Face
    this.drawHead(ctx);

    // 7. Hat
    this.drawHat(ctx);

    // 8. Hands & Pickaxe
    this.drawToolAndArms(ctx);

    ctx.restore();
  }

  getSkinColors() {
    switch (this.skin) {
      case 'blue':
        return { main: '#38bdf8', belly: '#bae6fd', spines: '#0284c7' };
      case 'red':
        return { main: '#f87171', belly: '#fecaca', spines: '#b91c1c' };
      case 'purple':
        return { main: '#c084fc', belly: '#f3e8ff', spines: '#7e22ce' };
      case 'gold':
        return { main: '#facc15', belly: '#fef08a', spines: '#ea580c' };
      case 'pink':
        return { main: '#f472b6', belly: '#fce7f3', spines: '#db2777' };
      case 'green':
      default:
        return { main: '#4ade80', belly: '#bbf7d0', spines: '#15803d' };
    }
  }

  drawTail(ctx) {
    const colors = this.getSkinColors();
    ctx.save();
    ctx.translate(-10, -6);
    ctx.rotate(this.tailAngle);

    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, -2, -22, 4);
    ctx.quadraticCurveTo(-12, 10, 0, 8);
    ctx.closePath();
    ctx.fill();

    // Spines on tail
    ctx.fillStyle = colors.spines;
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-6, -1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawFeet(ctx) {
    const colors = this.getSkinColors();
    const legOffset1 = this.moving ? Math.sin(this.walkCycle) * 5 : 0;
    const legOffset2 = this.moving ? -Math.sin(this.walkCycle) * 5 : 0;

    // Back leg
    ctx.fillStyle = colors.spines;
    ctx.beginPath();
    ctx.roundRect(-7 + legOffset2, 2, 7, 7, 3);
    ctx.fill();

    // Front leg
    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.roundRect(2 + legOffset1, 3, 8, 7, 3);
    ctx.fill();

    // Tiny toe claws
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8 + legOffset1, 8, 2, 2);
    ctx.fillRect(5 + legOffset1, 8, 2, 2);
  }

  drawBody(ctx) {
    const colors = this.getSkinColors();

    // Spines along back
    ctx.fillStyle = colors.spines;
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.lineTo(-12, -21);
    ctx.lineTo(-4, -10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-8, -9);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fill();

    // Main pear-shaped body
    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.ellipse(0, -7, 13, 15, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Underbelly
    ctx.fillStyle = colors.belly;
    ctx.beginPath();
    ctx.ellipse(4, -5, 7, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOutfit(ctx) {
    if (this.outfit === 'tuxedo') {
      // Fancy tux
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-4, -16, 12, 16, 3);
      ctx.fill();

      // White shirt V
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(4, -9);
      ctx.lineTo(8, -16);
      ctx.closePath();
      ctx.fill();

      // Red bow tie
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(4, -15, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.outfit === 'backpack') {
      // Leather traveler backpack
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.roundRect(-12, -14, 7, 12, 2);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.strokeRect(-12, -14, 7, 12);
    } else if (this.outfit === 'armor') {
      // Knight chestplate
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(-5, -16, 14, 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Golden gem in center
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(2, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHead(ctx) {
    const colors = this.getSkinColors();

    ctx.save();
    ctx.translate(6, -23);

    // Head base
    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.roundRect(-7, -9, 17, 16, 6);
    ctx.fill();

    // Cute snout bump
    ctx.beginPath();
    ctx.roundRect(4, -4, 9, 10, 4);
    ctx.fill();

    // Nostril
    ctx.fillStyle = colors.spines;
    ctx.beginPath();
    ctx.arc(10, -1, 1, 0, Math.PI * 2);
    ctx.fill();

    // Cute smiling mouth
    ctx.strokeStyle = colors.spines;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(6, 4, 3, 0.2, Math.PI * 0.85);
    ctx.stroke();

    // Big shiny eye
    if (this.isBlinking) {
      // Closed eye line
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-1, -2);
      ctx.lineTo(4, -2);
      ctx.stroke();
    } else {
      // Big cartoon eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(3.5, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Catchlight shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4.5, -3, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute blush on cheek
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.ellipse(1, 3, 3, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawHat(ctx) {
    if (this.hat === 'none') return;

    ctx.save();
    ctx.translate(8, -32);

    switch (this.hat) {
      case 'cowboy':
        ctx.fillStyle = '#92400e';
        // Brim
        ctx.beginPath();
        ctx.ellipse(0, 2, 14, 4, 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Crown
        ctx.beginPath();
        ctx.roundRect(-6, -8, 12, 10, [4, 4, 0, 0]);
        ctx.fill();
        // Band
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-6, 0, 12, 2);
        break;

      case 'chef':
        ctx.fillStyle = '#ffffff';
        // Base band
        ctx.fillRect(-6, -1, 13, 4);
        // Puffy top
        ctx.beginPath();
        ctx.arc(-3, -7, 6, 0, Math.PI * 2);
        ctx.arc(4, -7, 6, 0, Math.PI * 2);
        ctx.arc(0, -11, 7, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'miner':
        // Yellow safety helmet
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-11, -1, 22, 3);
        // Headlamp
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(8, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'party':
        // Striped party cone
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(-5, 1);
        ctx.lineTo(0, -16);
        ctx.lineTo(5, 1);
        ctx.closePath();
        ctx.fill();
        // Pom pom
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, -17, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'pirate':
        // Black tricorn/bicorn
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(-12, 1);
        ctx.quadraticCurveTo(0, -12, 12, 1);
        ctx.quadraticCurveTo(0, -5, -12, 1);
        ctx.fill();
        // Skull mark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -3, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'crown':
        // Golden royal crown
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.lineTo(-9, -8);
        ctx.lineTo(-4, -4);
        ctx.lineTo(0, -11);
        ctx.lineTo(4, -4);
        ctx.lineTo(9, -8);
        ctx.lineTo(7, 2);
        ctx.closePath();
        ctx.fill();
        // Red jewels on tips
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -11, 1.8, 0, Math.PI * 2);
        ctx.arc(-9, -8, 1.5, 0, Math.PI * 2);
        ctx.arc(9, -8, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  drawToolAndArms(ctx) {
    const colors = this.getSkinColors();

    ctx.save();
    ctx.translate(6, -8);

    // Pickaxe swing rotation
    let toolAngle = 0.2;
    if (this.isSwinging) {
      const progress = 1 - (this.swingTimer / this.swingDuration); // 0 to 1
      // Quick slam down and return
      toolAngle = -0.8 + Math.sin(progress * Math.PI) * 1.9;
    }

    ctx.rotate(toolAngle);

    // Arm holding tool
    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.roundRect(-2, -3, 8, 6, 2.5);
    ctx.fill();

    // Pickaxe Tool
    this.drawPickaxe(ctx);

    ctx.restore();
  }

  drawPickaxe(ctx) {
    ctx.save();
    ctx.translate(6, -2);
    ctx.rotate(-0.3);

    // Handle (Wooden stick)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -16, 3, 22);

    // Pickaxe head color depending on tool tier
    let headColor = '#94a3b8'; // default stone/iron
    let edgeColor = '#cbd5e1';
    if (this.tool === 'pickaxe_wood') {
      headColor = '#b45309';
      edgeColor = '#f59e0b';
    } else if (this.tool === 'pickaxe_gold') {
      headColor = '#eab308';
      edgeColor = '#fef08a';
    } else if (this.tool === 'pickaxe_diamond') {
      headColor = '#06b6d4';
      edgeColor = '#67e8f9';
    }

    // Curved Pickaxe Head
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.moveTo(1.5, -12);
    ctx.quadraticCurveTo(10, -13, 14, -6);
    ctx.quadraticCurveTo(6, -11, 1.5, -10);
    ctx.quadraticCurveTo(-3, -11, -11, -6);
    ctx.quadraticCurveTo(-7, -13, 1.5, -12);
    ctx.fill();

    // Shiny tip
    ctx.fillStyle = edgeColor;
    ctx.beginPath();
    ctx.arc(13.5, -6.5, 1.5, 0, Math.PI * 2);
    ctx.arc(-10.5, -6.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
