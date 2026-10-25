import confetti from 'canvas-confetti';

export const SEED_DEFINITIONS = {
  seed_berry: {
    id: 'seed_berry',
    name: 'Prehistorik Çilek Tohumu',
    cropId: 'crop_berry',
    cropName: 'Prehistorik Çilek',
    icon: '🍓',
    color: '#ef4444',
    growthDuration: 22, // 22 seconds
    desc: 'Hızlı büyüyen lezzetli ve sulu antik kırmızı çilekler.',
  },
  seed_melon: {
    id: 'seed_melon',
    name: 'Magma Kavunu Tohumu',
    cropId: 'crop_melon',
    cropName: 'Magma Kavunu',
    icon: '🍈',
    color: '#f59e0b',
    growthDuration: 38, // 38 seconds
    desc: 'Toprağın altındaki lav enerjisini çeken mineral zengini kavun.',
  },
  seed_star: {
    id: 'seed_star',
    name: 'Parlayan Yıldız Kökü Tohumu',
    cropId: 'crop_star',
    cropName: 'Yıldız Meyvesi',
    icon: '⭐',
    color: '#38bdf8',
    growthDuration: 55, // 55 seconds
    desc: 'Geceleri parıldayan ve şans getiren kozmik kök meyvesi.',
  },
  seed_golden: {
    id: 'seed_golden',
    name: 'Altın Dino Meyvesi Tohumu',
    cropId: 'crop_golden',
    cropName: 'Altın Dino Meyvesi',
    icon: '🍍',
    color: '#facc15',
    growthDuration: 75, // 75 seconds
    desc: 'Efsanevi krallık meyvesi! Yetiştirmesi sabır ister ama gücü muazzamdır.',
  },
};

export const RECIPES = [
  {
    id: 'speed_syrup',
    name: '🍓 Prehistorik Çilekli Hız Şurubu',
    desc: '2 dakika boyunca koşu hızını +%50 artırır ve ayakların ardında rüzgar esintisi bırakır.',
    buffKey: 'speed',
    duration: 120,
    icon: '⚡',
    cost: { crop_berry: 2, wood: 1 },
    effectDesc: '+%50 Koşu Hızı (120 sn)',
  },
  {
    id: 'miner_stew',
    name: '🍲 Mega Madenci Güveci',
    desc: '2 dakika boyunca kazma hasarını 2 katına çıkarır ve kayalardan ekstra maden düşürme şansı sağlar.',
    buffKey: 'miner',
    duration: 120,
    icon: '⛏️',
    cost: { crop_melon: 2, stone: 2 },
    effectDesc: '2x Kazma Gücü & Ekstra Maden (120 sn)',
  },
  {
    id: 'lucky_star_elixir',
    name: '⭐ Parlayan Yıldız Eliksiri',
    desc: '3 dakika boyunca etrafını aydınlatan yıldız ışıltısı verir, +3 Şans ve nadir fosil/kemik çıkma şansını katlar.',
    buffKey: 'lucky',
    duration: 180,
    icon: '🌟',
    cost: { crop_star: 2, gems: 1 },
    effectDesc: '+3 Şans & Gece Parıltısı & Fosil Katlayıcı (180 sn)',
  },
  {
    id: 'royal_feast',
    name: '👑 Efsanevi Dino Krallık Ziyafeti',
    desc: '3 dakika boyunca hem +%50 Hız, hem 2x Kazma Hasarı, hem de her saniye +2 Altın pasif gelir bahşeder!',
    buffKey: 'royal',
    duration: 180,
    icon: '👑',
    cost: { crop_golden: 1, crop_melon: 1, crop_berry: 2, coins: 15 },
    effectDesc: '1.5x Hız + 2x Kazma + Pasif 2 Altın/sn (180 sn)',
  },
];

export class FarmingSystem {
  constructor(game) {
    this.game = game;

    // Seeds inventory: type -> count
    this.seeds = {
      seed_berry: 2, // starter gift
      seed_melon: 1,
      seed_star: 0,
      seed_golden: 0,
    };

    // Crops inventory: type -> count
    this.crops = {
      crop_berry: 0,
      crop_melon: 0,
      crop_star: 0,
      crop_golden: 0,
    };

    // 6 Farm soil beds placed in village garden
    // Village garden base coordinates: x: 745, y: 940
    this.plots = [];
    const plotCols = 3;
    const plotRows = 2;
    const plotW = 46;
    const plotH = 34;
    const spacingX = 14;
    const spacingY = 16;
    const startX = 750;
    const startY = 948;

    let index = 0;
    for (let r = 0; r < plotRows; r++) {
      for (let c = 0; c < plotCols; c++) {
        this.plots.push({
          id: index++,
          x: startX + c * (plotW + spacingX),
          y: startY + r * (plotH + spacingY),
          width: plotW,
          height: plotH,
          state: 'empty', // 'empty', 'planted', 'sprout', 'growing', 'ready'
          seedType: null,
          growthTimer: 0,
          growthDuration: 30,
          isWatered: false,
          waterTimer: 0,
        });
      }
    }

    // Garden fence bounds
    this.gardenBounds = {
      x: 736,
      y: 932,
      w: 194,
      h: 116,
    };
  }

  addSeed(type, count = 1) {
    if (this.seeds[type] !== undefined) {
      this.seeds[type] += count;
    } else {
      this.seeds[type] = count;
    }
  }

  addCrop(type, count = 1) {
    if (this.crops[type] !== undefined) {
      this.crops[type] += count;
    } else {
      this.crops[type] = count;
    }
  }

  plant(plotId, seedType) {
    const plot = this.plots.find((p) => p.id === plotId);
    if (!plot || plot.state !== 'empty') return false;

    if (!this.seeds[seedType] || this.seeds[seedType] <= 0) return false;

    const def = SEED_DEFINITIONS[seedType];
    if (!def) return false;

    this.seeds[seedType]--;
    plot.state = 'planted';
    plot.seedType = seedType;
    plot.growthTimer = 0;
    plot.growthDuration = def.growthDuration;
    plot.isWatered = true; // Auto-water when freshly planted!

    if (this.game.soundManager) {
      this.game.soundManager.playTone(480, 0.1, 'sine', 0.08, 120);
    }
    return true;
  }

  water(plotId) {
    const plot = this.plots.find((p) => p.id === plotId);
    if (!plot || plot.state === 'empty' || plot.state === 'ready') return false;

    plot.isWatered = true;
    if (this.game.soundManager) {
      this.game.soundManager.playTone(600, 0.12, 'sine', 0.09, -80);
    }
    return true;
  }

  waterAll() {
    let count = 0;
    this.plots.forEach((p) => {
      if (p.state !== 'empty' && p.state !== 'ready' && !p.isWatered) {
        p.isWatered = true;
        count++;
      }
    });
    if (count > 0 && this.game.soundManager) {
      this.game.soundManager.playTone(600, 0.16, 'sine', 0.1, -100);
    }
    return count;
  }

  harvest(plotId) {
    const plot = this.plots.find((p) => p.id === plotId);
    if (!plot || plot.state !== 'ready' || !plot.seedType) return false;

    const def = SEED_DEFINITIONS[plot.seedType];
    if (!def) return false;

    const cropId = def.cropId;
    const harvestCount = Math.floor(1 + Math.random() * (1 + this.game.player.luck * 0.25));

    this.addCrop(cropId, harvestCount);

    // Floating text
    this.game.floatingTexts.push({
      x: plot.x + plot.width / 2,
      y: plot.y - 10,
      text: `+${harvestCount} ${def.cropName} ${def.icon}`,
      color: def.color,
      life: 1.2,
      maxLife: 1.2,
      update(dt) {
        this.y -= 25 * dt;
        this.life -= dt;
        return this.life > 0;
      },
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life / 0.3);
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      },
    });

    // Reset plot
    plot.state = 'empty';
    plot.seedType = null;
    plot.growthTimer = 0;
    plot.isWatered = false;

    if (this.game.soundManager) {
      this.game.soundManager.playItemPickup('fossil');
    }
    return true;
  }

  harvestAll() {
    let count = 0;
    this.plots.forEach((p) => {
      if (p.state === 'ready') {
        if (this.harvest(p.id)) count++;
      }
    });
    return count;
  }

  canAffordRecipe(recipe) {
    const eco = this.game.economy;
    for (const [key, req] of Object.entries(recipe.cost)) {
      if (key.startsWith('crop_')) {
        if ((this.crops[key] || 0) < req) return false;
      } else {
        if ((eco[key] || 0) < req) return false;
      }
    }
    return true;
  }

  cookRecipe(recipeId) {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe || !this.canAffordRecipe(recipe)) return false;

    // Deduct ingredients
    const eco = this.game.economy;
    for (const [key, req] of Object.entries(recipe.cost)) {
      if (key.startsWith('crop_')) {
        this.crops[key] -= req;
      } else {
        eco[key] -= req;
      }
    }

    // Apply buff to player
    this.game.player.applyBuff(recipe.buffKey, recipe.duration);

    // Visual celebration & sound
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    if (this.game.soundManager) {
      this.game.soundManager.playUpgrade();
    }

    this.game.uiManager.showToast(`✨ ${recipe.name} pişirildi ve içildi!`);
    this.game.uiManager.updateHUD();
    return true;
  }

  getNearestPlot(player) {
    let nearest = null;
    let minDist = 48;

    this.plots.forEach((p) => {
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const dist = Math.hypot(player.x - cx, player.y - cy);
      if (dist < minDist) {
        nearest = p;
        minDist = dist;
      }
    });

    return nearest;
  }

  isNearGarden(player) {
    const gb = this.gardenBounds;
    const cx = gb.x + gb.w / 2;
    const cy = gb.y + gb.h / 2;
    return Math.hypot(player.x - cx, player.y - cy) < 110;
  }

  update(dt) {
    // Grow crops
    this.plots.forEach((plot) => {
      if (plot.state === 'empty' || plot.state === 'ready') return;

      // Water boosts growth x2, dry still grows at normal rate
      const growthMultiplier = plot.isWatered ? 2.0 : 1.0;
      plot.growthTimer += dt * growthMultiplier;

      const progress = plot.growthTimer / plot.growthDuration;
      if (progress >= 1.0) {
        plot.state = 'ready';
      } else if (progress >= 0.55) {
        plot.state = 'growing';
      } else if (progress >= 0.15) {
        plot.state = 'sprout';
      } else {
        plot.state = 'planted';
      }
    });
  }

  draw(ctx, camera) {
    const gb = this.gardenBounds;

    ctx.save();

    // 1. Garden plot ground soil area
    ctx.fillStyle = '#3f2e18';
    ctx.beginPath();
    ctx.roundRect(gb.x, gb.y, gb.w, gb.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#5a3d1b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Wooden border fence
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 3;
    ctx.strokeRect(gb.x - 2, gb.y - 2, gb.w + 4, gb.h + 4);

    // Fence post markers
    const fencePosts = [
      { x: gb.x, y: gb.y },
      { x: gb.x + gb.w, y: gb.y },
      { x: gb.x, y: gb.y + gb.h },
      { x: gb.x + gb.w, y: gb.y + gb.h },
      { x: gb.x + gb.w / 2, y: gb.y },
      { x: gb.x + gb.w / 2, y: gb.y + gb.h },
    ];
    fencePosts.forEach((fp) => {
      ctx.fillStyle = '#a16207';
      ctx.fillRect(fp.x - 4, fp.y - 4, 8, 8);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(fp.x - 2, fp.y - 2, 4, 4);
    });

    // Garden wooden sign
    const signX = gb.x + gb.w / 2;
    const signY = gb.y - 12;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(signX - 2, signY + 6, 4, 8);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(signX - 44, signY - 6, 88, 15, 3);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍓 DİNO BOSTANI', signX, signY + 5);

    // 2. Individual soil beds
    this.plots.forEach((p) => {
      // Bed furrow shadow
      ctx.fillStyle = p.isWatered ? '#1c1309' : '#2b1b0c';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 6);
      ctx.fill();

      ctx.strokeStyle = p.isWatered ? '#0284c7' : '#713f12';
      ctx.lineWidth = p.isWatered ? 1.5 : 1;
      ctx.stroke();

      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;

      // Draw crop based on state
      if (p.state === 'empty') {
        // Tilled soil lines
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x + 6, cy - 4);
        ctx.lineTo(p.x + p.width - 6, cy - 4);
        ctx.moveTo(p.x + 6, cy + 4);
        ctx.lineTo(p.x + p.width - 6, cy + 4);
        ctx.stroke();
      } else if (p.state === 'planted') {
        // Tiny seed mound
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(cx, cy - 1, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.state === 'sprout') {
        // Little green sprout
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 5);
        ctx.lineTo(cx, cy - 4);
        ctx.stroke();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy - 4, 4, 2, -Math.PI / 6, 0, Math.PI * 2);
        ctx.ellipse(cx + 4, cy - 4, 4, 2, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.state === 'growing') {
        // Bushy green plant
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(cx - 5, cy, 7, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy, 7, 0, Math.PI * 2);
        ctx.arc(cx, cy - 5, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(cx, cy - 3, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.state === 'ready') {
        // Fully grown plant with ripe bobbing fruit
        const bob = Math.sin(Date.now() * 0.005 + p.id) * 2;

        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(cx - 6, cy + 2, 8, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy + 2, 8, 0, Math.PI * 2);
        ctx.arc(cx, cy - 4, 9, 0, Math.PI * 2);
        ctx.fill();

        const def = SEED_DEFINITIONS[p.seedType];
        const fruitColor = def ? def.color : '#ef4444';

        // Draw ripe fruit
        ctx.save();
        ctx.translate(cx, cy - 4 + bob);

        // Golden glow
        ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = fruitColor;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Tiny highlight gleam
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    });

    ctx.restore();

    // Interaction prompt if near garden
    const nearPlot = this.getNearestPlot(camera.target);
    if (nearPlot) {
      ctx.save();
      const px = nearPlot.x + nearPlot.width / 2;
      const py = nearPlot.y - 14;

      let promptText = '🌱 [E] Bostan Menüsü';
      if (nearPlot.state === 'ready') {
        promptText = '🍓 [E] Hasat Et!';
      } else if (nearPlot.state !== 'empty' && !nearPlot.isWatered) {
        promptText = '💧 [E] Sula';
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(px - 60, py - 10, 120, 20, 6);
      ctx.fill();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(promptText, px, py);
      ctx.restore();
    }
  }

  serialize() {
    return {
      seeds: this.seeds,
      crops: this.crops,
      plots: this.plots.map((p) => ({
        id: p.id,
        state: p.state,
        seedType: p.seedType,
        growthTimer: p.growthTimer,
        growthDuration: p.growthDuration,
        isWatered: p.isWatered,
      })),
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.seeds) this.seeds = { ...this.seeds, ...data.seeds };
    if (data.crops) this.crops = { ...this.crops, ...data.crops };
    if (Array.isArray(data.plots)) {
      data.plots.forEach((dp) => {
        const plot = this.plots.find((p) => p.id === dp.id);
        if (plot) {
          plot.state = dp.state || 'empty';
          plot.seedType = dp.seedType || null;
          plot.growthTimer = dp.growthTimer || 0;
          plot.growthDuration = dp.growthDuration || 30;
          plot.isWatered = dp.isWatered || false;
        }
      });
    }
  }
}
