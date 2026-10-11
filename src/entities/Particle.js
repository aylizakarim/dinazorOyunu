export class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * (options.speed || 150);
    this.vy = ((Math.random() - 0.8) * (options.speed || 150));
    this.gravity = options.gravity !== undefined ? options.gravity : 280;
    this.color = options.color || '#ffcc00';
    this.size = options.size || (3 + Math.random() * 4);
    this.alpha = 1;
    this.life = options.life || 0.6;
    this.maxLife = this.life;
    this.shape = options.shape || 'circle'; // 'circle', 'square', 'star', 'spark'
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 10;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
    this.rotation += this.rotSpeed * dt;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'square') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else if (this.shape === 'star') {
      // 4-point sparkle star
      ctx.beginPath();
      const s = this.size * 1.5;
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class FloatingText {
  constructor(x, y, text, color = '#ffd700', size = 16, isCrit = false) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.isCrit = isCrit;
    this.life = 1.1;
    this.maxLife = 1.1;
    this.vy = isCrit ? -65 : -45;
    this.vx = (Math.random() - 0.5) * 20;
    this.scale = isCrit ? 1.4 : 1.0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.isCrit && this.scale > 1.0) {
      this.scale = Math.max(1.0, this.scale - dt * 2);
    }
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.min(1, this.life / (this.maxLife * 0.4));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(this.size * this.scale)}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(this.text, this.x + 1.5, this.y + 1.5);

    // Main text
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);

    ctx.restore();
  }
}
