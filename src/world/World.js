import { ResourceObject } from '../entities/ResourceObject.js';
import { NPC } from '../entities/NPC.js';
import { HousePlot } from '../entities/HousePlot.js';

export class World {
  constructor() {
    this.width = 2200;
    this.height = 1800;

    // Village center bounds
    this.villageRect = { x: 700, y: 550, w: 800, h: 700 };

    this.resources = [];
    this.npcs = [];
    this.housePlot = null;
    this.decorations = [];

    this.initWorld();
  }

  initWorld() {
    // 1. Create NPCs in the Village
    this.npcs = [
      new NPC(1100, 680, 'chief', 'Muhtar Rex', 'Köy Muhtarı', 'chief'),
      new NPC(880, 850, 'carpenter', 'Tricera Usta', 'Baş Marangoz', 'carpenter'),
      new NPC(1320, 850, 'tailor', 'Ptero Terzi', 'Moda Tasarımcısı', 'tailor'),
      new NPC(1260, 1100, 'miner', 'Stego Madenci', 'Jeolog', 'miner'),
    ];

    // 2. Create Player's House Plot in the Village
    this.housePlot = new HousePlot(960, 920);

    // 3. Generate Resources across biomes
    this.generateResources();

    // 4. Generate Decorative flora / paths / tiles
    this.generateDecorations();
  }

  generateResources() {
    this.resources = [];

    // --- BIOME 1: Emerald Forest (West / Left) ---
    // Dense Oak & Pine Trees
    for (let i = 0; i < 35; i++) {
      const x = 80 + Math.random() * 580;
      const y = 80 + Math.random() * 1640;
      const type = Math.random() > 0.4 ? 'tree_oak' : 'tree_pine';
      this.resources.push(new ResourceObject(x, y, type));
    }

    // --- BIOME 2: Mining Quarry (East / Right) ---
    // Granite, Iron, Gold, and Gem rocks
    for (let i = 0; i < 35; i++) {
      const x = 1540 + Math.random() * 580;
      const y = 80 + Math.random() * 1640;
      const rand = Math.random();
      let type = 'rock_stone';
      if (rand < 0.25) type = 'rock_stone';
      else if (rand < 0.6) type = 'rock_iron';
      else if (rand < 0.88) type = 'rock_gold';
      else type = 'rock_gem';

      this.resources.push(new ResourceObject(x, y, type));
    }

    // --- BIOME 3: Fossil Desert / Excavation Grounds (South / Bottom) ---
    // Dig spots & crystal trees
    for (let i = 0; i < 24; i++) {
      const x = 600 + Math.random() * 1000;
      const y = 1320 + Math.random() * 400;
      const type = Math.random() > 0.35 ? 'dig_spot' : 'tree_crystal';
      this.resources.push(new ResourceObject(x, y, type));
    }

    // --- BIOME 4: North Wild Meadows (North / Top) ---
    // Scattered mixed resources
    for (let i = 0; i < 20; i++) {
      const x = 650 + Math.random() * 900;
      const y = 80 + Math.random() * 420;
      const type = Math.random() > 0.5 ? 'tree_pine' : 'rock_stone';
      this.resources.push(new ResourceObject(x, y, type));
    }
  }

  generateDecorations() {
    this.decorations = [];

    // Grass patches, flowers, small stones
    for (let i = 0; i < 250; i++) {
      this.decorations.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        type: Math.floor(Math.random() * 4), // 0: flower red, 1: flower yellow, 2: flower blue, 3: grass tuft
        size: 3 + Math.random() * 4,
      });
    }
  }

  canMoveTo(x, y, radius = 16) {
    // Map borders
    if (x - radius < 30 || x + radius > this.width - 30) return false;
    if (y - radius < 30 || y + radius > this.height - 30) return false;

    // Check collision with living solid resources (trees/rocks)
    for (const res of this.resources) {
      if (!res.isDead && res.category !== 'dig') {
        const dx = x - res.x;
        const dy = y - (res.y - 4);
        const dist = Math.hypot(dx, dy);
        if (dist < radius + res.radius * 0.7) {
          return false;
        }
      }
    }

    // Village fountain collision (at center: 1100, 800)
    const fDist = Math.hypot(x - 1100, y - 800);
    if (fDist < radius + 28) return false;

    return true;
  }

  getMiningTarget(player) {
    // Find closest alive mineable resource in front of or near player
    let closest = null;
    let closestDist = 65; // interaction reach

    for (const res of this.resources) {
      if (!res.isDead) {
        const dx = res.x - player.x;
        const dy = res.y - player.y;
        const dist = Math.hypot(dx, dy);

        // Check if player is facing somewhat towards it or very close
        const isFacing = (player.facing > 0 && dx >= -10) || (player.facing < 0 && dx <= 10);

        if (dist < closestDist && (isFacing || dist < 35)) {
          closest = res;
          closestDist = dist;
        }
      }
    }

    return closest;
  }

  update(dt, player, economy, floatingTexts) {
    // Update resources
    this.resources.forEach(r => r.update(dt));

    // Update NPCs
    this.npcs.forEach(npc => npc.update(dt, player));

    // Update House Plot
    if (this.housePlot) {
      this.housePlot.update(dt, economy, floatingTexts);
    }
  }

  draw(ctx, camera) {
    // 1. Draw Ground Biomes
    this.drawTerrain(ctx);

    // 2. Draw Village Paths & Fountain
    this.drawVillage(ctx);

    // 3. Draw Decorations (Grass, flowers)
    this.drawDecorations(ctx);

    // 4. Draw House Plot
    if (this.housePlot) {
      this.housePlot.draw(ctx, camera.target);
    }
  }

  drawTerrain(ctx) {
    // Base Lush Grass (Emerald Forest & General)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle grass tile grid lines
    ctx.fillStyle = '#16a34a';
    for (let gx = 0; gx < this.width; gx += 80) {
      for (let gy = 0; gy < this.height; gy += 80) {
        if ((gx / 80 + gy / 80) % 2 === 0) {
          ctx.fillRect(gx, gy, 80, 80);
        }
      }
    }

    // Mining Quarry Ground (East) - Slate / Rocky tint
    const quarryGrad = ctx.createLinearGradient(1450, 0, 1650, 0);
    quarryGrad.addColorStop(0, 'rgba(71, 85, 105, 0)');
    quarryGrad.addColorStop(1, 'rgba(71, 85, 105, 0.7)');
    ctx.fillStyle = quarryGrad;
    ctx.fillRect(1450, 0, this.width - 1450, this.height);

    // Fossil Desert Ground (South) - Sand / Warm tint
    const desertGrad = ctx.createLinearGradient(0, 1250, 0, 1450);
    desertGrad.addColorStop(0, 'rgba(217, 119, 6, 0)');
    desertGrad.addColorStop(1, 'rgba(217, 119, 6, 0.55)');
    ctx.fillStyle = desertGrad;
    ctx.fillRect(0, 1250, this.width, this.height - 1250);

    // Border mountain & trees frame
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 40;
    ctx.strokeRect(20, 20, this.width - 40, this.height - 40);
  }

  drawVillage(ctx) {
    const vr = this.villageRect;

    // Cobblestone Village Plaza
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.beginPath();
    ctx.roundRect(vr.x, vr.y, vr.w, vr.h, 24);
    ctx.fill();

    // Cobblestone connecting paths
    ctx.fillStyle = '#cbd5e1';
    // Center horizontal path
    ctx.fillRect(vr.x + 40, 780, vr.w - 80, 40);
    // Center vertical path
    ctx.fillRect(1080, vr.y + 40, 40, vr.h - 80);

    // Town Square Fountain (Center at 1100, 800)
    const fx = 1100;
    const fy = 800;

    // Outer stone rim
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(fx, fy, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Clear blue water
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(fx, fy, 26, 0, Math.PI * 2);
    ctx.fill();

    // Center fountain spout
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(fx, fy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Water ripple
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fx, fy, 16 + Math.sin(Date.now() * 0.005) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Village Street Lanterns
    const lanternCoords = [
      { x: vr.x + 80, y: vr.y + 80 },
      { x: vr.x + vr.w - 80, y: vr.y + 80 },
      { x: vr.x + 80, y: vr.y + vr.h - 80 },
      { x: vr.x + vr.w - 80, y: vr.y + vr.h - 80 },
    ];

    lanternCoords.forEach(pos => {
      // Glow
      const lampGrad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, 50);
      lampGrad.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
      lampGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = lampGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
      ctx.fill();

      // Post
      ctx.fillStyle = '#334155';
      ctx.fillRect(pos.x - 2, pos.y - 14, 4, 18);
      // Lantern
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - 14, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawDecorations(ctx) {
    this.decorations.forEach(dec => {
      ctx.save();
      ctx.translate(dec.x, dec.y);

      if (dec.type === 0) {
        // Red Flower
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, dec.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, dec.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 1) {
        // Yellow Flower
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, dec.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, dec.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 2) {
        // Blue Flower
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, dec.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, dec.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Grass Tuft
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-3, -6);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -8);
        ctx.moveTo(0, 0);
        ctx.lineTo(3, -5);
        ctx.stroke();
      }

      ctx.restore();
    });
  }
}
