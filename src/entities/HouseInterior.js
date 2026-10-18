import { Particle } from './Particle.js';

export const FURNITURE_RECIPES = [
  {
    id: 'bed_cozy',
    name: 'Rahat Dino Yatağı',
    icon: '🛏️',
    desc: 'Uykunu almanı sağlar! Uyandığında 3 dakika boyunca +%25 Kazma ve Koşu Hızı kazandırır.',
    cost: { wood: 20, coins: 30 },
    tierReq: 1,
  },
  {
    id: 'fireplace_stone',
    name: 'Sıcak Taş Şömine',
    icon: '🔥',
    desc: 'Odanı aydınlatır ve sıcacık yapar. Yanında ısınıp huzur bulabilirsin!',
    cost: { stone: 35, wood: 15 },
    tierReq: 1,
  },
  {
    id: 'dino_rug',
    name: 'Dino Ayakizi Halısı',
    icon: '🧶',
    desc: 'Odanın zeminine serilen yumuşacık tarih öncesi ayakizi halısı.',
    cost: { wood: 15, coins: 40 },
    tierReq: 1,
  },
  {
    id: 'fossil_showcase',
    name: 'Antik Fosil Vitrini',
    icon: '🦴',
    desc: 'Kazılarda bulduğun antik dino kemiklerini sergileyen parıltılı vitrin.',
    cost: { wood: 25, fossils: 3 },
    tierReq: 2,
  },
  {
    id: 'fern_pot',
    name: 'Prehistorik Eğrelti Saksısı',
    icon: '🪴',
    desc: 'Evine taptaze orman havası katan yeşil antik eğrelti otu.',
    cost: { wood: 10, stone: 10 },
    tierReq: 1,
  },
  {
    id: 'crystal_lamp',
    name: 'Işıltılı Kristal Avize',
    icon: '💎',
    desc: 'Tavandan sarkan gökkuşağı kristal aydınlatma.',
    cost: { gems: 4, stone: 20 },
    tierReq: 2,
  },
];

export class HouseInterior {
  constructor(game) {
    this.game = game;

    // Room coordinate space
    this.width = 760;
    this.height = 540;

    // Room boundaries
    this.bounds = {
      left: 60,
      right: 700,
      top: 110,
      bottom: 470,
    };

    // Exit Door Mat
    this.doorMat = {
      x: 380,
      y: 470,
      w: 80,
      h: 24,
    };

    // Crafted furniture list (keys of FURNITURE_RECIPES IDs)
    this.craftedFurniture = new Set(['bed_cozy', 'dino_rug']); // Default cozy starter items

    // Animation timers
    this.flameTimer = 0;
    this.sparkTimer = 0;
  }

  isCrafted(id) {
    return this.craftedFurniture.has(id);
  }

  craft(id, economy, soundManager) {
    const recipe = FURNITURE_RECIPES.find((r) => r.id === id);
    if (!recipe) return false;
    if (this.isCrafted(id)) return false;
    if (!economy.canAfford(recipe.cost)) return false;

    economy.spend(recipe.cost);
    this.craftedFurniture.add(id);

    if (soundManager) soundManager.playUpgrade();
    return true;
  }

  canMoveTo(x, y, radius = 18) {
    // Check if player is exiting through the door
    const isAtDoorway = x >= 340 && x <= 420 && y >= 450 && y <= 500;
    if (isAtDoorway) return true;

    // Perimeter boundary clamp
    if (x - radius < this.bounds.left || x + radius > this.bounds.right) return false;
    if (y - radius < this.bounds.top || y + radius > this.bounds.bottom) return false;

    // Solid furniture collision boxes
    // 1. Storage Chest (Top Left)
    if (x > 115 && x < 205 && y > 155 && y < 235) return false;

    // 2. Bed (Top Right)
    if (x > 535 && x < 665 && y > 130 && y < 235) return false;

    // 3. Crafting Table (Bottom Left)
    if (x > 115 && x < 205 && y > 340 && y < 420) return false;

    // 4. Fireplace (Top Center Wall)
    if (this.hasFireplace() && x > 330 && x < 430 && y > 90 && y < 165) return false;

    // 5. Fossil Showcase (Bottom Right)
    if (this.isCrafted('fossil_showcase') && x > 545 && x < 655 && y > 330 && y < 420) return false;

    return true;
  }

  getMiningTarget() {
    return null; // No mineable wild rocks/trees inside the cozy house!
  }

  hasFireplace() {
    return this.game.world.housePlot.tier >= 2 || this.isCrafted('fireplace_stone');
  }

  update(dt) {
    this.flameTimer += dt * 6;
    this.sparkTimer += dt;

    // Cozy fireplace sparks
    if (this.hasFireplace() && this.sparkTimer > 0.35) {
      this.sparkTimer = 0;
      this.game.particles.push(
        new Particle(380 + (Math.random() - 0.5) * 24, 135, {
          color: Math.random() > 0.4 ? '#f97316' : '#facc15',
          speed: 25 + Math.random() * 20,
          size: 2 + Math.random() * 2.5,
          life: 0.6,
          gravity: -35,
        })
      );
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
        reach: 48,
      },
      {
        id: 'chest',
        name: 'Depolama Sandığı 📦',
        prompt: '[E] Sandığı Aç 📦',
        x: 160,
        y: 195,
        dist: Math.hypot(player.x - 160, player.y - 195),
        reach: 65,
      },
      {
        id: 'bed',
        name: 'Dino Yatağı 🛏️',
        prompt: '[E] Uyu & Dinlen 🛏️',
        x: 600,
        y: 180,
        dist: Math.hypot(player.x - 600, player.y - 180),
        reach: 70,
      },
      {
        id: 'crafting',
        name: 'Mobilya Marangozluğu 🔨',
        prompt: '[E] Mobilya Marangozluğu 🔨',
        x: 160,
        y: 380,
        dist: Math.hypot(player.x - 160, player.y - 380),
        reach: 65,
      },
    ];

    if (this.hasFireplace()) {
      list.push({
        id: 'fireplace',
        name: 'Sıcak Taş Şömine 🔥',
        prompt: '[E] Şöminede Isın 🔥',
        x: 380,
        y: 155,
        dist: Math.hypot(player.x - 380, player.y - 155),
        reach: 65,
      });
    }

    if (this.isCrafted('fossil_showcase')) {
      list.push({
        id: 'fossil',
        name: 'Antik Fosil Vitrini 🦴',
        prompt: '[E] Fosil Vitrini İncele 🦴',
        x: 600,
        y: 375,
        dist: Math.hypot(player.x - 600, player.y - 375),
        reach: 65,
      });
    }

    const near = list.filter((item) => item.dist <= item.reach);
    if (near.length === 0) return null;
    near.sort((a, b) => a.dist - b.dist);
    return near[0];
  }

  interact(player) {
    const target = this.getNearestInteractive(player);
    if (!target) return;

    if (target.id === 'door') {
      this.game.exitHouse();
    } else if (target.id === 'chest') {
      this.game.uiManager.openChestModal();
    } else if (target.id === 'bed') {
      this.sleepInBed();
    } else if (target.id === 'crafting') {
      this.game.uiManager.openFurnitureModal();
    } else if (target.id === 'fireplace') {
      this.warmAtFireplace();
    } else if (target.id === 'fossil') {
      this.inspectFossil();
    }
  }

  sleepInBed() {
    this.game.soundManager.playSleep();

    // Advance time to next morning (08:00)
    if (this.game.timeSystem) {
      this.game.timeSystem.advanceToMorning();
    }

    // Well-Rested Buff: 3 minutes (+25% mining speed & +25% move speed)
    this.game.player.restedBuffTimer = 180;

    // Pet reaction
    if (this.game.petSystem && this.game.petSystem.activePet) {
      this.game.petSystem.activePet.heartTimer = 3.0;
    }

    // Floating text feedback
    this.game.floatingTexts.push({
      x: this.game.player.x,
      y: this.game.player.y - 35,
      text: '✨ Zzz... Harika bir uyku çektin!',
      color: '#facc15',
      size: 15,
      life: 1.4,
      maxLife: 1.4,
      scale: 1,
      update(d) {
        this.y -= 20 * d;
        this.life -= d;
        return this.life > 0;
      },
      draw(ctx) {
        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      },
    });

    this.game.uiManager.showToast(
      '✨ Mışıl mışıl uyudun! Sabah güneşi doğdu ve "İyi Dinlenmiş Dino" bonusu kazandın (+%25 Kazma & Koşu Hızı, 3 dk)!'
    );
    this.game.saveManager.save();
  }

  warmAtFireplace() {
    this.game.soundManager.playFireplaceWarm();
    this.game.player.restedBuffTimer = Math.max(this.game.player.restedBuffTimer, 60);

    for (let i = 0; i < 8; i++) {
      this.game.particles.push(
        new Particle(380 + (Math.random() - 0.5) * 30, 140, {
          color: '#f97316',
          speed: 40 + Math.random() * 25,
          size: 3 + Math.random() * 3,
          life: 0.7,
          gravity: -30,
        })
      );
    }

    this.game.uiManager.showToast('🔥 Çıtırdayan sıcak şömine başında ısındın, içini büyük bir huzur kapladı!');
  }

  inspectFossil() {
    this.game.soundManager.playTone(600, 0.2, 'sine', 0.15, 100);
    const facts = [
      '🦖 "Kral T-Rex Çenesi": Bu fosil parçası tam 68 milyon yıl öncesine ait keskin bir avcı dişi!',
      '🦕 "Dev Brachiosaurus Omuru": Vadide yaşamış en uzun boyunlu dinozorun kemik izi.',
      '🦅 "Pterodaktil Kanat Eklemi": Gökyüzünü fetheden kanatların kadim taşlaşmış izi.',
      '⚡ "Kozmik Göktaşı Çekirdeği": Milyonlarca yıl önce düşmüş göktaşının saf kristal kalıntısı!',
    ];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    this.game.uiManager.showToast(fact);
  }

  draw(ctx, camera) {
    const tier = this.game.world.housePlot.tier;

    ctx.save();

    // 1. Room Floor & Wall Background
    this.drawRoomShell(ctx, tier);

    // 2. Wall Windows (Reflecting real daylight/nighttime!)
    this.drawWindows(ctx, tier);

    // 3. Floor Rug (Center)
    if (this.isCrafted('dino_rug')) {
      this.drawRug(ctx, 380, 290);
    }

    // 4. Welcome Exit Door Mat
    this.drawDoorMat(ctx);

    // 5. Fireplace (Top Wall Center)
    if (this.hasFireplace()) {
      this.drawFireplace(ctx, 380, 120);
    }

    // 6. Furniture items
    // Storage Chest (Top Left)
    this.drawChest(ctx, 160, 195, tier);

    // Cozy Dino Bed (Top Right)
    this.drawBed(ctx, 600, 180, tier);

    // Crafting Workbench (Bottom Left)
    this.drawCraftingBench(ctx, 160, 380);

    // Fossil Showcase (Bottom Right)
    if (this.isCrafted('fossil_showcase')) {
      this.drawFossilShowcase(ctx, 600, 375);
    }

    // Fern Pot
    if (this.isCrafted('fern_pot')) {
      this.drawFernPot(ctx, 250, 140);
    }

    // Crystal Lamp (Ceiling)
    if (this.isCrafted('crystal_lamp')) {
      this.drawCrystalLamp(ctx, 380, 60);
    }

    // 7. Interactive Prompt Indicator
    const target = this.getNearestInteractive(this.game.player);
    if (target) {
      this.drawPrompt(ctx, target);
    }

    ctx.restore();
  }

  drawRoomShell(ctx, tier) {
    // Outer dark backdrop
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.width, this.height);

    // Walls based on tier
    if (tier <= 1) {
      // Tent fabric walls
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(this.bounds.left, 20, this.bounds.right - this.bounds.left, 90);
      // Tent wooden beams
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(this.bounds.left, 20);
      ctx.lineTo(380, 10);
      ctx.lineTo(this.bounds.right, 20);
      ctx.stroke();
    } else if (tier === 2) {
      // Cozy wooden plank wall
      ctx.fillStyle = '#78350f';
      ctx.fillRect(this.bounds.left, 20, this.bounds.right - this.bounds.left, 90);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      for (let y = 35; y < 110; y += 18) {
        ctx.beginPath();
        ctx.moveTo(this.bounds.left, y);
        ctx.lineTo(this.bounds.right, y);
        ctx.stroke();
      }
    } else if (tier === 3) {
      // Castle stone brick wall
      ctx.fillStyle = '#334155';
      ctx.fillRect(this.bounds.left, 20, this.bounds.right - this.bounds.left, 90);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      for (let y = 35; y < 110; y += 22) {
        ctx.beginPath();
        ctx.moveTo(this.bounds.left, y);
        ctx.lineTo(this.bounds.right, y);
        ctx.stroke();
      }
    } else {
      // Palace Marble wall with golden trim
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(this.bounds.left, 20, this.bounds.right - this.bounds.left, 90);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(this.bounds.left, 104, this.bounds.right - this.bounds.left, 6);
    }

    // Floor
    const flLeft = this.bounds.left;
    const flTop = this.bounds.top;
    const flW = this.bounds.right - this.bounds.left;
    const flH = this.bounds.bottom - this.bounds.top;

    if (tier <= 1) {
      // Woven straw mat floor
      ctx.fillStyle = '#b45309';
      ctx.fillRect(flLeft, flTop, flW, flH);
      ctx.fillStyle = '#92400e';
      for (let x = flLeft; x < this.bounds.right; x += 40) {
        ctx.fillRect(x, flTop, 20, flH);
      }
    } else if (tier === 2) {
      // Polished wooden parquet floor
      ctx.fillStyle = '#d97706';
      ctx.fillRect(flLeft, flTop, flW, flH);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      for (let y = flTop; y < this.bounds.bottom; y += 30) {
        ctx.beginPath();
        ctx.moveTo(flLeft, y);
        ctx.lineTo(this.bounds.right, y);
        ctx.stroke();
      }
    } else if (tier === 3) {
      // Large flagstone floor
      ctx.fillStyle = '#475569';
      ctx.fillRect(flLeft, flTop, flW, flH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      for (let x = flLeft; x < this.bounds.right; x += 55) {
        for (let y = flTop; y < this.bounds.bottom; y += 40) {
          ctx.strokeRect(x, y, 55, 40);
        }
      }
    } else {
      // Royal Palace Polished Marble Floor
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(flLeft, flTop, flW, flH);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      for (let x = flLeft; x < this.bounds.right; x += 60) {
        for (let y = flTop; y < this.bounds.bottom; y += 60) {
          ctx.strokeRect(x, y, 60, 60);
        }
      }
    }

    // Room skirting & wall border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(flLeft, flTop, flW, flH);
  }

  drawWindows(ctx, tier) {
    if (tier < 2) return; // Tent has no glass window

    const isNight = this.game.timeSystem && this.game.timeSystem.isNight;
    const skyColor = isNight ? '#0f172a' : '#38bdf8';
    const glassColor = isNight ? 'rgba(30, 41, 59, 0.9)' : 'rgba(254, 240, 138, 0.85)';

    // Left and Right windows on back wall
    const winPositions = [220, 540];

    winPositions.forEach((wx) => {
      // Window frame
      ctx.fillStyle = '#78350f';
      ctx.fillRect(wx - 24, 38, 48, 44);

      // Glass panes
      ctx.fillStyle = skyColor;
      ctx.fillRect(wx - 20, 42, 40, 36);

      // Warm glow / moonlight shine
      ctx.fillStyle = glassColor;
      ctx.fillRect(wx - 20, 42, 40, 36);

      // Window cross
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(wx, 42);
      ctx.lineTo(wx, 78);
      ctx.moveTo(wx - 20, 60);
      ctx.lineTo(wx + 20, 60);
      ctx.stroke();

      // Gentle sunlight/moonlight ray onto floor
      ctx.save();
      ctx.fillStyle = isNight ? 'rgba(148, 163, 184, 0.08)' : 'rgba(254, 240, 138, 0.12)';
      ctx.beginPath();
      ctx.moveTo(wx - 18, 78);
      ctx.lineTo(wx + 18, 78);
      ctx.lineTo(wx + 45, 175);
      ctx.lineTo(wx - 45, 175);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  drawRug(ctx, x, y) {
    ctx.save();
    // Rug border
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(x, y, 110, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner patterned rug
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(x, y, 92, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute Dino Footprint in center of rug
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Toes
    ctx.beginPath();
    ctx.arc(x - 12, y - 16, 6, 0, Math.PI * 2);
    ctx.arc(x, y - 22, 7, 0, Math.PI * 2);
    ctx.arc(x + 12, y - 16, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawDoorMat(ctx) {
    const { x, y, w, h } = this.doorMat;
    // Welcome mat
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚪 ÇIKIŞ', x, y);
  }

  drawFireplace(ctx, x, y) {
    ctx.save();
    // Stone chimney base
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(x - 36, y - 20, 72, 50, 6);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hearth cavity
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x - 22, y - 4, 44, 30, [8, 8, 0, 0]);
    ctx.fill();

    // Fire logs
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 16, y + 20, 32, 5);

    // Dynamic fire flame
    const flameH = 14 + Math.sin(this.flameTimer) * 4;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(x, y + 16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x, y + 16 - flameH * 0.4, 7, 0, Math.PI * 2);
    ctx.fill();

    // Warm radial fire glow onto floor
    const glow = ctx.createRadialGradient(x, y + 20, 5, x, y + 20, 110);
    glow.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
    glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + 20, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawChest(ctx, x, y, tier) {
    ctx.save();

    // Chest shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chest main body
    const bodyColor = tier >= 4 ? '#eab308' : (tier === 3 ? '#475569' : '#854d0e');
    const trimColor = tier >= 4 ? '#fef08a' : (tier === 3 ? '#94a3b8' : '#ca8a04');

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x - 24, y - 16, 48, 30, 6);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chest lid line
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 24, y - 4);
    ctx.lineTo(x + 24, y - 4);
    ctx.stroke();

    // Lock latch
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(x - 5, y - 6, 10, 10, 2);
    ctx.fill();

    // Label on front
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SANDIK', x, y + 8);

    ctx.restore();
  }

  drawBed(ctx, x, y, tier) {
    ctx.save();

    // Bed shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 24, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bed wooden frame
    ctx.fillStyle = tier >= 4 ? '#ca8a04' : (tier === 3 ? '#334155' : '#78350f');
    ctx.beginPath();
    ctx.roundRect(x - 42, y - 26, 84, 52, 8);
    ctx.fill();

    // Mattress / Duvet
    const duvetColor = tier >= 4 ? '#dc2626' : (tier === 3 ? '#0284c7' : '#16a34a');
    ctx.fillStyle = duvetColor;
    ctx.beginPath();
    ctx.roundRect(x - 38, y - 10, 76, 32, 6);
    ctx.fill();

    // Fluffy Dino Pillow
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(x - 32, y - 22, 64, 14, 4);
    ctx.fill();

    // Cozy Leaf / Crown pattern on blanket
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌿', x, y + 12);

    ctx.restore();
  }

  drawCraftingBench(ctx, x, y) {
    ctx.save();

    // Bench shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Table top
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(x - 24, y - 16, 48, 28, 4);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tools on workbench
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔨', x - 6, y - 2);
    ctx.fillText('📐', x + 10, y - 2);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('TEZGAH', x, y + 9);

    ctx.restore();
  }

  drawFossilShowcase(ctx, x, y) {
    ctx.save();

    // Showcase wooden stand
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(x - 22, y - 14, 44, 28, 4);
    ctx.fill();

    // Glass display case
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 18, y - 28, 36, 20, 4);
    ctx.fill();
    ctx.stroke();

    // Ancient glowing amber fossil inside
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x, y - 18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦴', x, y - 14);

    ctx.restore();
  }

  drawFernPot(ctx, x, y) {
    ctx.save();
    // Clay pot
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.lineTo(x + 7, y + 24);
    ctx.lineTo(x - 7, y + 24);
    ctx.closePath();
    ctx.fill();

    // Lush Fern Leaves
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 14, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 8, y, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y, 10, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCrystalLamp(ctx, x, y) {
    ctx.save();
    // Ceiling chain
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Crystal gems cluster
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(x, y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x - 6, y + 14, 5, 0, Math.PI * 2);
    ctx.arc(x + 6, y + 14, 5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle gentle glow
    const g = ctx.createRadialGradient(x, y + 10, 2, x, y + 10, 70);
    g.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
    g.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y + 10, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPrompt(ctx, target) {
    ctx.save();
    const promptX = target.x;
    const promptY = target.y - 34;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(promptX - 70, promptY - 14, 140, 26, 8);
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(target.prompt, promptX, promptY - 1);

    ctx.restore();
  }

  serialize() {
    return Array.from(this.craftedFurniture);
  }

  deserialize(data) {
    if (Array.isArray(data)) {
      this.craftedFurniture = new Set(data);
    }
  }
}
