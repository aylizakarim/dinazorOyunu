export class DroppedItem {
  constructor(x, y, type = 'coin', amount = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.amount = amount;
    
    // Physics
    const angle = Math.random() * Math.PI * 2;
    const force = 60 + Math.random() * 80;
    this.vx = Math.cos(angle) * force;
    this.vy = Math.sin(angle) * force - 40;
    this.z = 0;
    this.vz = 80 + Math.random() * 60;
    this.gravity = 350;
    this.groundY = y;
    this.bounces = 0;
    this.maxBounces = 2;
    this.isSettled = false;

    // Visuals
    this.bobTimer = Math.random() * 10;
    this.rotation = Math.random() * Math.PI;
    this.rotSpeed = (Math.random() - 0.5) * 5;
    this.radius = 12;
    this.life = 120; // 2 minutes before despawn
  }

  update(dt, player, onCollect) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.bobTimer += dt * 4;

    // Magnetic attraction to player
    const dx = player.x - this.x;
    const dy = (player.y - 10) - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < player.magnetRadius) {
      // Accelerate rapidly towards player
      const speed = Math.max(260, (player.magnetRadius / Math.max(10, dist)) * 220);
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;

      // Collection radius
      if (dist < 26) {
        onCollect(this);
        return false;
      }
    } else {
      // Normal bouncing physics if not yet settled
      if (!this.isSettled) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= Math.pow(0.1, dt);
        this.vy *= Math.pow(0.1, dt);

        this.z += this.vz * dt;
        this.vz -= this.gravity * dt;

        if (this.z <= 0) {
          this.z = 0;
          this.bounces++;
          if (this.bounces >= this.maxBounces) {
            this.isSettled = true;
            this.vx = 0;
            this.vy = 0;
            this.vz = 0;
          } else {
            this.vz = -this.vz * 0.45;
          }
        }
      }
    }

    return true;
  }

  draw(ctx) {
    const drawY = this.y - this.z + (this.isSettled ? Math.sin(this.bobTimer) * 3 : 0);

    ctx.save();
    ctx.translate(this.x, drawY);

    // Shadow on the ground
    const shadowScale = Math.max(0.3, 1 - (this.z / 60));
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, this.z + 10, 8 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw item based on type
    if (this.type === 'coin') {
      // Golden coin with gleam
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d48b00';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = '#fff085';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Coin sign / paw
      ctx.fillStyle = '#9e6200';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 1);
    } else if (this.type === 'wood') {
      // Wood Log
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.roundRect(-8, -5, 16, 10, 3);
      ctx.fill();
      ctx.strokeStyle = '#5c3a1e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tree ring end
      ctx.fillStyle = '#d2a679';
      ctx.beginPath();
      ctx.ellipse(7, 0, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'stone') {
      // Stone chunk
      ctx.fillStyle = '#8a929a';
      ctx.beginPath();
      ctx.moveTo(-7, -4);
      ctx.lineTo(2, -8);
      ctx.lineTo(8, -2);
      ctx.lineTo(6, 6);
      ctx.lineTo(-4, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5a626a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Highlight
      ctx.fillStyle = '#b8c0c8';
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(1, -6);
      ctx.lineTo(4, -2);
      ctx.fill();
    } else if (this.type === 'gem') {
      // Sparkling Ruby / Diamond
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, -3);
      ctx.lineTo(5, 7);
      ctx.lineTo(-5, 7);
      ctx.lineTo(-8, -3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b30059';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Facet highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(4, -2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-4, -2);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'fossil') {
      // Ancient Dino Bone
      ctx.fillStyle = '#f8f5e6';
      ctx.strokeStyle = '#c8beaa';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      // Bone shape
      ctx.roundRect(-7, -3, 14, 6, 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-7, -4, 3, 0, Math.PI * 2);
      ctx.arc(-7, 4, 3, 0, Math.PI * 2);
      ctx.arc(7, -4, 3, 0, Math.PI * 2);
      ctx.arc(7, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'egg') {
      // Dinosaur Egg
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cute colorful spots on egg
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(-2, -3, 2, 0, Math.PI * 2);
      ctx.arc(3, 2, 2.5, 0, Math.PI * 2);
      ctx.arc(-1, 5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'rare_bone') {
      // Ancient Rare Fossil Bone with golden glow
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(-8, -4, 16, 8, 3);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-8, -4, 3.5, 0, Math.PI * 2);
      ctx.arc(-8, 4, 3.5, 0, Math.PI * 2);
      ctx.arc(8, -4, 3.5, 0, Math.PI * 2);
      ctx.arc(8, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.type.startsWith('seed_')) {
      // Seed Pouch / Pack
      const seedColor = this.type === 'seed_berry' ? '#ef4444' : (this.type === 'seed_melon' ? '#f59e0b' : (this.type === 'seed_star' ? '#38bdf8' : '#facc15'));
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-7, -8, 14, 16, 3);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Seed tag color
      ctx.fillStyle = seedColor;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Leaf sprout on top of pouch
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(0, -9, 3, 2, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'crop_berry') {
      // Prehistoric Strawberry
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-9, 4, -8, -5, 0, -4);
      ctx.bezierCurveTo(8, -5, 9, 4, 0, 8);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Yellow seeds on strawberry
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-3, -1, 1.5, 1.5);
      ctx.fillRect(2, -1, 1.5, 1.5);
      ctx.fillRect(-1, 3, 1.5, 1.5);

      // Green cap leaves
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(0, -7);
      ctx.lineTo(5, -4);
      ctx.lineTo(0, -3);
      ctx.fill();
    } else if (this.type === 'crop_melon') {
      // Magma Melon
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Lava stripes
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 8, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      // Stalk
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-1, -11, 2, 4);
    } else if (this.type === 'crop_star') {
      // Luminous Star Fruit
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', 0, 0);
    } else if (this.type === 'crop_golden') {
      // Golden Dragon Fruit
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(0, 2, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Crown spiky leaves
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo(0, -12);
      ctx.lineTo(4, -6);
      ctx.fill();
    }

    ctx.restore();
  }
}
