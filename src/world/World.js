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
      new NPC(1240, 690, 'curator', 'Profesör Pachy', 'Baş Arkeolog & Paleontolog', 'curator'),
      new NPC(920, 680, 'chef', 'Şef Bronto', 'Baş Aşçı & Gurme', 'chef'),
    ];

    // 2. Create Player's House Plot in the Village
    this.housePlot = new HousePlot(960, 920);

    // 3. Museum Plot in North-East Village Plaza
    this.museumPlot = { x: 1250, y: 560, width: 140, height: 100 };

    // 4. Chef Kitchen Station in North-West Village Plaza
    this.kitchenPlot = { x: 945, y: 668, width: 44, height: 38 };

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

    // Museum building collision (at 1250, 560, width 140, height 90)
    if (x > 1245 && x < 1395 && y > 555 && y < 645) {
      return false;
    }

    // Chef kitchen cauldron collision (at 945, 668, width 44, height 38)
    if (x > 940 && x < 990 && y > 665 && y < 706) {
      return false;
    }

    return true;
  }

  isNearMuseum(player) {
    if (!this.museumPlot) return false;
    const dist = Math.hypot(player.x - (this.museumPlot.x + 70), player.y - (this.museumPlot.y + 90));
    return dist < 65;
  }

  isNearKitchen(player) {
    if (!this.kitchenPlot) return false;
    const dist = Math.hypot(player.x - (this.kitchenPlot.x + 22), player.y - (this.kitchenPlot.y + 19));
    return dist < 55;
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

  draw(ctx, camera, farmingSystem = null) {
    // 1. Draw Ground Biomes
    this.drawTerrain(ctx);

    // 2. Draw Village Paths & Fountain
    this.drawVillage(ctx);

    // 3. Draw Farm Garden Plots (Dino Bostanı)
    if (farmingSystem) {
      farmingSystem.draw(ctx, camera);
    }

    // 4. Draw Chef Kitchen Cauldron Station
    this.drawKitchen(ctx, camera.target);

    // 5. Draw Decorations (Grass, flowers)
    this.drawDecorations(ctx);

    // 6. Draw House Plot
    if (this.housePlot) {
      this.housePlot.draw(ctx, camera.target);
    }

    // 7. Draw Museum Building
    this.drawMuseum(ctx, camera.target);
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

  drawMuseum(ctx, player) {
    const { x, y, width, height } = this.museumPlot;
    const cx = x + width / 2;

    ctx.save();

    // Shadow & Grass Foundation
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, y + height - 8, width * 0.55, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Classical Marble Building Walls
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(x, y + 24, width, height - 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4 Classical Pillars
    const colSpacing = width / 5;
    for (let i = 1; i <= 4; i++) {
      const colX = x + i * colSpacing;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(colX - 6, y + 28, 12, height - 42);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(colX - 8, y + 25, 16, 5);
      ctx.fillRect(colX - 8, y + height - 16, 16, 5);
    }

    // Triangular Pediment / Roof
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 26);
    ctx.lineTo(cx, y - 10);
    ctx.lineTo(x + width + 8, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Golden Dino Bone Emblem inside pediment
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦴', cx, y + 14);

    // Grand Arched Double Doors
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(cx, y + 54, 16, Math.PI, 0);
    ctx.rect(cx - 16, y + 54, 32, 38);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red Carpet Steps
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 14, y + 84, 28, 16);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 14, y + 84, 28, 16);

    // Signboard
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(cx - 48, y + 28, 96, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏛️ ARKEOLOJİ MÜZESİ', cx, y + 40);

    ctx.restore();

    // Prompt if player is near museum entrance
    if (this.isNearMuseum(player)) {
      ctx.save();
      const promptX = cx;
      const promptY = y - 22;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(promptX - 75, promptY - 14, 150, 26, 8);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏛️ [E] Arkeoloji Müzesine Gir', promptX, promptY);
      ctx.restore();
    }
  }

  drawKitchen(ctx, player) {
    if (!this.kitchenPlot) return;
    const { x, y, width, height } = this.kitchenPlot;
    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, y + height - 2, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone Hearth Foundation
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(x, y + 14, width, height - 14, 6);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hot coals glow
    const coalGrad = ctx.createRadialGradient(cx, y + height - 8, 2, cx, y + height - 8, 18);
    coalGrad.addColorStop(0, '#f97316');
    coalGrad.addColorStop(0.5, '#ea580c');
    coalGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = coalGrad;
    ctx.beginPath();
    ctx.ellipse(cx, y + height - 7, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Giant Copper Cauldron
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.ellipse(cx, y + 16, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cauldron Rim
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(cx, y + 10, 17, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Boiling stew inside
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(cx, y + 10, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stew bubbles
    const bubbleBob = Math.sin(Date.now() * 0.008);
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(cx - 5 + bubbleBob * 2, y + 9, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 4 - bubbleBob * 2, y + 11, 2, 0, Math.PI * 2);
    ctx.fill();

    // Rising Steam
    const steamTime = Date.now() * 0.003;
    ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
    ctx.beginPath();
    ctx.arc(cx - 4 + Math.sin(steamTime) * 4, y - 2, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 3 + Math.cos(steamTime) * 4, y - 8, 4.5, 0, Math.PI * 2);
    ctx.arc(cx - 1 + Math.sin(steamTime * 1.5) * 5, y - 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Small spice table next to cauldron
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 18, y + 16, 15, 18);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 18, y + 16, 15, 18);

    // Spice jars on table
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 16, y + 11, 4, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x - 10, y + 11, 4, 6);

    // Wooden sign
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - 1, y - 28, 2, 16);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(cx - 46, y - 36, 92, 16, 3);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👨‍🍳 ŞEFİN MUTFAĞI', cx, y - 25);

    ctx.restore();

    // Prompt if player is near kitchen
    if (this.isNearKitchen(player)) {
      ctx.save();
      const promptX = cx;
      const promptY = y - 48;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(promptX - 70, promptY - 12, 140, 24, 6);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍲 [E] Aşçılık & Mutfak', promptX, promptY);
      ctx.restore();
    }
  }
}
