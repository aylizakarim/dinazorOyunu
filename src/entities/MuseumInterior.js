import { EXHIBIT_DEFINITIONS } from '../systems/MuseumSystem.js';
import { Particle } from './Particle.js';

export class MuseumInterior {
  constructor(game) {
    this.game = game;

    // Room boundaries
    this.width = 800;
    this.height = 560;

    this.bounds = {
      left: 70,
      right: 730,
      top: 120,
      bottom: 490,
    };

    // Exit Doors
    this.doorMat = {
      x: 400,
      y: 495,
      w: 88,
      h: 24,
    };

    // Paleontology Research Desk (Top Center)
    this.curatorDesk = {
      x: 400,
      y: 155,
      w: 80,
      h: 40,
    };

    // Tourist Ticket Box (Top Right)
    this.ticketBox = {
      x: 700,
      y: 155,
      w: 36,
      h: 36,
    };

    // Animated Tourists inside museum
    this.tourists = [
      { x: 280, y: 260, targetX: 320, targetY: 270, timer: 0, flashTimer: 2, name: 'Turist Rexi', hatColor: '#f43f5e' },
      { x: 520, y: 280, targetX: 490, targetY: 290, timer: 1, flashTimer: 4, name: 'Turist Ptero', hatColor: '#38bdf8' },
      { x: 340, y: 410, targetX: 290, targetY: 420, timer: 2, flashTimer: 3, name: 'Turist Stego', hatColor: '#eab308' },
    ];

    this.flashAnimTimer = 0;
  }

  canMoveTo(x, y, radius = 18) {
    // Check if player is exiting through the door
    const isAtDoorway = x >= 350 && x <= 450 && y >= 470 && y <= 520;
    if (isAtDoorway) return true;

    // Boundary clamp
    if (x - radius < this.bounds.left || x + radius > this.bounds.right) return false;
    if (y - radius < this.bounds.top || y + radius > this.bounds.bottom) return false;

    // Solid Pedestals collision boxes
    // 1. T-Rex Pedestal (Top Left: 200, 210)
    if (x > 140 && x < 260 && y > 160 && y < 245) return false;

    // 2. Triceratops Pedestal (Top Right: 600, 210)
    if (x > 540 && x < 660 && y > 160 && y < 245) return false;

    // 3. Stegosaurus Pedestal (Bottom Left: 200, 390)
    if (x > 140 && x < 260 && y > 340 && y < 425) return false;

    // 4. Pterodactyl Pedestal (Bottom Right: 600, 390)
    if (x > 540 && x < 660 && y > 340 && y < 425) return false;

    // 5. Curator Desk (Top Center: 400, 155)
    if (x > 350 && x < 450 && y > 120 && y < 180) return false;

    return true;
  }

  getMiningTarget() {
    return null; // Museum is protected!
  }

  update(dt) {
    // Update tourist ambient stroll & camera flashes
    const touristCount = Math.min(this.tourists.length, Math.max(1, Math.round(this.game.museumSystem.getCompletionPercentage() / 25) + 1));

    for (let i = 0; i < touristCount; i++) {
      const tour = this.tourists[i];
      tour.timer += dt;

      // Random slow wandering near pedestals
      if (tour.timer > 3.5) {
        tour.timer = 0;
        tour.targetX = Math.max(120, Math.min(680, tour.x + (Math.random() - 0.5) * 80));
        tour.targetY = Math.max(180, Math.min(450, tour.y + (Math.random() - 0.5) * 60));
      }

      const dx = tour.targetX - tour.x;
      const dy = tour.targetY - tour.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        tour.x += (dx / dist) * 35 * dt;
        tour.y += (dy / dist) * 35 * dt;
      }

      // Camera flash timer
      tour.flashTimer -= dt;
      if (tour.flashTimer <= 0) {
        tour.flashTimer = 4 + Math.random() * 5;
        // Flash sound & particle
        this.game.soundManager.playTone(880, 0.05, 'triangle', 0.08, 120);
        this.game.particles.push(
          new Particle(tour.x, tour.y - 18, {
            color: '#ffffff',
            speed: 50,
            size: 8,
            life: 0.35,
            gravity: -10,
          })
        );
      }
    }
  }

  getNearestInteractive(player) {
    const list = [
      {
        id: 'door',
        name: 'Köye Çık 🚪',
        prompt: '[E] Köye Çık 🚪',
        x: this.doorMat.x,
        y: this.doorMat.y,
        dist: Math.hypot(player.x - this.doorMat.x, player.y - this.doorMat.y),
        reach: 50,
      },
      {
        id: 'curator',
        name: 'Profesör Pachy',
        prompt: '💬 [E] Profesör Pachy | 🔊 [L] Dinle',
        x: this.curatorDesk.x,
        y: this.curatorDesk.y + 20,
        dist: Math.hypot(player.x - this.curatorDesk.x, player.y - (this.curatorDesk.y + 20)),
        reach: 70,
      },
      {
        id: 'ticketBox',
        name: 'Bilet & Bağış Sandığı',
        prompt: `[E] Bilet Gelirini Topla (🪙 +${Math.floor(this.game.museumSystem.accruedGold)})`,
        x: this.ticketBox.x,
        y: this.ticketBox.y,
        dist: Math.hypot(player.x - this.ticketBox.x, player.y - this.ticketBox.y),
        reach: 65,
      },
    ];

    // Add 4 exhibit pedestals
    EXHIBIT_DEFINITIONS.forEach((ex) => {
      const prog = this.game.museumSystem.getSpeciesProgress(ex.id);
      list.push({
        id: `pedestal_${ex.id}`,
        speciesId: ex.id,
        name: ex.name,
        prompt: `[E] ${ex.shortName} Sergisi (${prog.donated}/${prog.total}) 🏛️`,
        x: ex.pedestalX,
        y: ex.pedestalY + 30,
        dist: Math.hypot(player.x - ex.pedestalX, player.y - (ex.pedestalY + 30)),
        reach: 70,
      });
    });

    const near = list.filter((item) => item.dist <= item.reach);
    if (near.length === 0) return null;
    near.sort((a, b) => a.dist - b.dist);
    return near[0];
  }

  interact(player, speakAloud = false) {
    const target = this.getNearestInteractive(player);
    if (!target) return;

    if (target.id === 'door') {
      this.game.exitMuseum();
    } else if (target.id === 'curator') {
      // Find curator NPC in world and open dialog
      const curatorNPC = this.game.world.npcs.find((n) => n.id === 'curator');
      if (curatorNPC) {
        this.game.uiManager.openDialog(curatorNPC, speakAloud);
      }
    } else if (target.id === 'ticketBox') {
      const collected = this.game.museumSystem.collectTicketGold(this.game.economy, this.game.soundManager);
      if (collected > 0) {
        this.game.uiManager.showToast(`🪙 Turist bilet ve bağış kutusundan +${collected} Altın topladın!`);
        this.game.saveManager.save();
      } else {
        this.game.uiManager.showToast('ℹ️ Bağış sandığında henüz yeni gelir birikmedi. Turistler müzeyi gezdikçe altın birikir!');
      }
    } else if (target.speciesId) {
      this.game.uiManager.openMuseumModal(target.speciesId);
    }
  }

  draw(ctx, camera) {
    ctx.save();

    // 1. Grand Marble Hall & Architectural Shell
    this.drawHallShell(ctx);

    // 2. Red Velvet Carpet Runners
    this.drawCarpets(ctx);

    // 3. Exit Double Doorway
    this.drawDoors(ctx);

    // 4. Curator Paleontology Desk & Profesör Pachy
    this.drawCuratorDesk(ctx);

    // 5. Tourist Ticket & Donation Box
    this.drawTicketBox(ctx);

    // 6. 4 Exhibition Pedestals & Assembled Skeletons
    EXHIBIT_DEFINITIONS.forEach((ex) => {
      this.drawPedestal(ctx, ex);
    });

    // 7. Strolling Tourist NPCs
    this.drawTourists(ctx);

    // 8. Interaction Prompt
    const target = this.getNearestInteractive(this.game.player);
    if (target) {
      this.drawPrompt(ctx, target);
    }

    ctx.restore();
  }

  drawHallShell(ctx) {
    // Dark outer frame
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.width, this.height);

    const flLeft = this.bounds.left;
    const flTop = this.bounds.top;
    const flW = this.bounds.right - this.bounds.left;
    const flH = this.bounds.bottom - this.bounds.top;

    // Back wall: Classical Stone with gold frieze
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(flLeft, 30, flW, 90);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(flLeft, 114, flW, 6);

    // Classical Marble Columns on back wall
    const colXs = [flLeft + 25, 290, 510, this.bounds.right - 25];
    colXs.forEach((cx) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 10, 30, 20, 90);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(cx - 14, 26, 28, 8);
      ctx.fillRect(cx - 14, 112, 28, 8);
    });

    // Museum Grand Banner in Center
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.roundRect(320, 40, 160, 48, 6);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏛️ DİNOZOR MÜZESİ', 400, 60);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#fef08a';
    const pct = this.game.museumSystem.getCompletionPercentage();
    ctx.fillText(`Koleksiyon: %${pct} Tamamlandı`, 400, 76);

    // Marble tiled floor with checkered pattern
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(flLeft, flTop, flW, flH);

    ctx.fillStyle = '#f1f5f9';
    for (let x = flLeft; x < this.bounds.right; x += 44) {
      for (let y = flTop; y < this.bounds.bottom; y += 44) {
        if ((Math.round(x / 44) + Math.round(y / 44)) % 2 === 0) {
          ctx.fillRect(x, y, 44, 44);
        }
      }
    }

    // Outer border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(flLeft, flTop, flW, flH);
  }

  drawCarpets(ctx) {
    // Red velvet runners connecting entrance to pedestals
    ctx.fillStyle = '#b91c1c';
    // Center vertical runner
    ctx.fillRect(376, this.bounds.top, 48, this.bounds.bottom - this.bounds.top);
    // Horizontal cross runner
    ctx.fillRect(this.bounds.left + 50, 290, this.bounds.right - this.bounds.left - 100, 40);

    // Golden fringe
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(376, this.bounds.top, 48, this.bounds.bottom - this.bounds.top);
    ctx.strokeRect(this.bounds.left + 50, 290, this.bounds.right - this.bounds.left - 100, 40);
  }

  drawDoors(ctx) {
    const { x, y, w, h } = this.doorMat;
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚪 KÖYE DÖNÜŞ', x, y);
  }

  drawCuratorDesk(ctx) {
    const { x, y, w, h } = this.curatorDesk;

    // Wooden desk
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Microscope & Books
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔬', x - 18, y - 2);
    ctx.fillText('📜', x + 18, y - 2);

    // Curator Dino NPC standing behind desk
    this.drawCuratorDino(ctx, x, y - 24);
  }

  drawCuratorDino(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Dino body
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // White belly
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eye & Eyeglasses
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Golden Spectacles / Glasses
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(6, -4, 6, 0, Math.PI * 2);
    ctx.moveTo(0, -4);
    ctx.lineTo(12, -4);
    ctx.stroke();

    // Archeologist Pith Helmet Hat
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, -14, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-16, -14, 32, 4);

    ctx.restore();
  }

  drawTicketBox(ctx) {
    const { x, y } = this.ticketBox;
    const gold = Math.floor(this.game.museumSystem.accruedGold);

    // Golden Box shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold Chest
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(x - 16, y - 14, 32, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Slot
    ctx.fillStyle = '#713f12';
    ctx.fillRect(x - 8, y - 10, 16, 3);

    // Floating gold label
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🪙 ${gold}`, x, y + 26);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('BAĞIŞ KUTUSU', x, y - 18);
  }

  drawPedestal(ctx, ex) {
    const { pedestalX: px, pedestalY: py, id } = ex;
    const prog = this.game.museumSystem.getSpeciesProgress(id);
    const isComplete = this.game.museumSystem.isSpeciesComplete(id);

    ctx.save();

    // Spotlight beam from ceiling onto pedestal
    const spot = ctx.createRadialGradient(px, py - 30, 10, px, py - 30, 95);
    spot.addColorStop(0, isComplete ? 'rgba(250, 204, 21, 0.22)' : 'rgba(255, 255, 255, 0.12)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(px, py - 30, 95, 0, Math.PI * 2);
    ctx.fill();

    // Pedestal base (Stone plinth)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(px - 56, py - 6, 112, 34, 6);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Golden Plaque
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(px - 44, py + 12, 88, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${ex.shortName}: %${Math.round((prog.donated / prog.total) * 100)}`, px, py + 23);

    // Draw the Dinosaur Bone Skeleton on top of pedestal!
    this.drawSkeletonArtwork(ctx, px, py - 36, id);

    // Velvet Stanchion Ropes on corners
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px - 62, py + 4);
    ctx.quadraticCurveTo(px, py + 16, px + 62, py + 4);
    ctx.stroke();

    // Brass stanchion posts
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px - 64, py - 12, 4, 18);
    ctx.fillRect(px + 60, py - 12, 4, 18);
    ctx.beginPath();
    ctx.arc(px - 62, py - 12, 3.5, 0, Math.PI * 2);
    ctx.arc(px + 62, py - 12, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSkeletonArtwork(ctx, x, y, speciesId) {
    const isDonated = (boneId) => this.game.museumSystem.isDonated(boneId);

    ctx.save();
    ctx.translate(x, y);

    const boneColor = (id) => (isDonated(id) ? '#f8f5e6' : 'rgba(148, 163, 184, 0.28)');
    const strokeColor = (id) => (isDonated(id) ? '#ca8a04' : 'rgba(100, 116, 139, 0.35)');

    if (speciesId === 'rex') {
      // 1. T-Rex Torso (Spine & Ribs)
      const cTorso = boneColor('rex_torso');
      ctx.fillStyle = cTorso;
      ctx.strokeStyle = strokeColor('rex_torso');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rib lines
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(-10, 8);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 9);
      ctx.moveTo(10, -6);
      ctx.lineTo(10, 8);
      ctx.stroke();

      // 2. T-Rex Skull
      const cSkull = boneColor('rex_skull');
      ctx.fillStyle = cSkull;
      ctx.strokeStyle = strokeColor('rex_skull');
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(34, -12);
      ctx.lineTo(38, -2);
      ctx.lineTo(24, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Eye socket
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(26, -6, 3, 0, Math.PI * 2);
      ctx.fill();

      // 3. T-Rex Arms
      const cArms = boneColor('rex_arms');
      ctx.strokeStyle = strokeColor('rex_arms');
      ctx.fillStyle = cArms;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.lineTo(20, 10);
      ctx.lineTo(24, 9);
      ctx.stroke();

      // 4. T-Rex Tail & Legs
      const cTail = boneColor('rex_tail');
      ctx.strokeStyle = strokeColor('rex_tail');
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, -2);
      ctx.quadraticCurveTo(-34, -4, -42, 6);
      ctx.stroke();
      // Leg bone
      ctx.beginPath();
      ctx.moveTo(-4, 10);
      ctx.lineTo(-6, 26);
      ctx.lineTo(2, 28);
      ctx.stroke();
    } else if (speciesId === 'tricera') {
      // 1. Triceratops Ribs
      ctx.fillStyle = boneColor('tricera_ribs');
      ctx.strokeStyle = strokeColor('tricera_ribs');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-4, 2, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Triceratops Skull & Horns
      ctx.fillStyle = boneColor('tricera_skull');
      ctx.strokeStyle = strokeColor('tricera_skull');
      ctx.beginPath();
      // Frill
      ctx.arc(20, -6, 14, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(34, 4);
      ctx.lineTo(20, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Horns
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(26, -10);
      ctx.lineTo(38, -20);
      ctx.moveTo(22, -12);
      ctx.lineTo(32, -22);
      ctx.stroke();

      // 3. Triceratops Legs
      ctx.strokeStyle = strokeColor('tricera_legs');
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, 12);
      ctx.lineTo(-18, 26);
      ctx.moveTo(10, 12);
      ctx.lineTo(10, 26);
      ctx.stroke();

      // 4. Triceratops Tail
      ctx.strokeStyle = strokeColor('tricera_tail');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(-38, 8);
      ctx.stroke();
    } else if (speciesId === 'stego') {
      // 1. Stego Skull
      ctx.fillStyle = boneColor('stego_skull');
      ctx.strokeStyle = strokeColor('stego_skull');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(30, 6, 8, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Stego Legs & Body
      ctx.strokeStyle = strokeColor('stego_legs');
      ctx.fillStyle = boneColor('stego_legs');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 4, 22, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Legs
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, 12);
      ctx.lineTo(-14, 26);
      ctx.moveTo(12, 12);
      ctx.lineTo(14, 26);
      ctx.stroke();

      // 3. Stego Plates
      ctx.fillStyle = boneColor('stego_plates');
      ctx.strokeStyle = strokeColor('stego_plates');
      ctx.lineWidth = 1.5;
      const plateXs = [-16, -6, 6, 16];
      plateXs.forEach((px) => {
        ctx.beginPath();
        ctx.moveTo(px - 4, -8);
        ctx.lineTo(px, -22);
        ctx.lineTo(px + 4, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // 4. Stego Spikes (Thagomizer)
      ctx.strokeStyle = strokeColor('stego_spikes');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-20, 2);
      ctx.lineTo(-36, -2);
      ctx.stroke();
      // 4 Spikes
      ctx.beginPath();
      ctx.moveTo(-32, -1);
      ctx.lineTo(-38, -10);
      ctx.moveTo(-34, -2);
      ctx.lineTo(-42, -6);
      ctx.moveTo(-34, 1);
      ctx.lineTo(-42, 6);
      ctx.stroke();
    } else if (speciesId === 'ptero') {
      // 1. Ptero Skull & Beak
      ctx.fillStyle = boneColor('ptero_skull');
      ctx.strokeStyle = strokeColor('ptero_skull');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, -4);
      ctx.lineTo(0, 6);
      ctx.lineTo(-14, -8); // crest
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. Ptero Wings (Broad bones)
      ctx.strokeStyle = strokeColor('ptero_wings');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(-32, -18);
      ctx.lineTo(-44, -4);
      ctx.moveTo(0, 2);
      ctx.lineTo(32, -18);
      ctx.lineTo(44, -4);
      ctx.stroke();

      // 3. Ptero Feet
      ctx.strokeStyle = strokeColor('ptero_feet');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 6);
      ctx.lineTo(-8, 20);
      ctx.moveTo(4, 6);
      ctx.lineTo(8, 20);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawTourists(ctx) {
    const touristCount = Math.min(this.tourists.length, Math.max(1, Math.round(this.game.museumSystem.getCompletionPercentage() / 25) + 1));

    for (let i = 0; i < touristCount; i++) {
      const tour = this.tourists[i];
      ctx.save();
      ctx.translate(tour.x, tour.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute tourist dino body
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Tourist Sun Hat
      ctx.fillStyle = tour.hatColor;
      ctx.beginPath();
      ctx.ellipse(0, -10, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-6, -16, 12, 7);

      // Camera strap around neck
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -4, 8, 0, Math.PI);
      ctx.stroke();

      // Little camera
      ctx.fillStyle = '#334155';
      ctx.fillRect(-5, 2, 10, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawPrompt(ctx, target) {
    ctx.save();
    const promptX = target.x;
    const promptY = target.y - 38;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(promptX - 85, promptY - 14, 170, 28, 8);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(target.prompt, promptX, promptY);

    ctx.restore();
  }
}
