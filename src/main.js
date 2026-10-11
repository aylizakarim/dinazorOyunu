import { soundManager } from './audio/soundManager.js';
import { Player } from './entities/Player.js';
import { World } from './world/World.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { UpgradeSystem } from './systems/UpgradeSystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { SaveManager } from './systems/SaveManager.js';
import { TimeSystem } from './systems/TimeSystem.js';
import { UIManager } from './ui/UIManager.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isPaused = false;

    // Entities and Systems
    this.soundManager = soundManager;
    this.player = new Player(1100, 880); // Spawn near village center fountain
    this.world = new World();
    this.economy = new EconomySystem();
    this.upgrades = new UpgradeSystem(this.player, this.economy);
    this.shop = new ShopSystem(this.player, this.economy);
    this.quests = new QuestSystem(this.economy, this.world.housePlot, this.player);
    this.timeSystem = new TimeSystem(this);
    this.saveManager = new SaveManager(
      this.player,
      this.economy,
      this.upgrades,
      this.shop,
      this.world.housePlot,
      this.quests,
      this.timeSystem
    );
    this.uiManager = new UIManager(this);

    // Particle & Entity pools
    this.particles = [];
    this.droppedItems = [];
    this.floatingTexts = [];

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      target: this.player,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Input state
    this.input = {
      keys: {},
      mouse: { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false },
      touchDir: null,
    };

    this.lastTime = performance.now();

    // Hook economy update to UI
    this.economy.onUpdate = () => {
      this.uiManager.updateHUD();
    };

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindInputs();
    this.saveManager.load();
    this.uiManager.init();

    // Setup initial welcoming floating tip
    setTimeout(() => {
      this.uiManager.showToast('🦖 Dinozor Vadisine Hoş Geldin! Ağaç ve taşları kazarak altın ve maden topla!');
    }, 400);

    // Start game loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.camera.width = window.innerWidth;
    this.camera.height = window.innerHeight;
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;

      // Ensure audio context on any keypress
      this.soundManager.ensureContext();

      if (e.code === 'KeyE') {
        this.triggerInteract(false);
      } else if (e.code === 'KeyL') {
        this.triggerInteract(true);
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.triggerMine();
      } else if (e.code === 'Escape') {
        this.uiManager.closeAllModals();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    // Mouse Controls
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.input.mouse.x = e.clientX - rect.left;
      this.input.mouse.y = e.clientY - rect.top;
      this.input.mouse.worldX = this.input.mouse.x + this.camera.x;
      this.input.mouse.worldY = this.input.mouse.y + this.camera.y;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.input.targetPos = { x: this.input.mouse.worldX, y: this.input.mouse.worldY };
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.soundManager.ensureContext();
      if (e.button === 0) {
        this.input.mouse.isDown = true;
        this.triggerMineAt(this.input.mouse.worldX, this.input.mouse.worldY);
      } else if (e.button === 2) {
        this.input.targetPos = { x: this.input.mouse.worldX, y: this.input.mouse.worldY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.input.mouse.isDown = false;
    });

    // Touch controls for mobile/tablets
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;

    this.canvas.addEventListener('touchstart', (e) => {
      this.soundManager.ensureContext();
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTouching = true;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!isTouching || e.touches.length === 0) return;
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - touchStartX;
      const dy = curY - touchStartY;
      const dist = Math.hypot(dx, dy);

      if (dist > 15) {
        this.input.touchDir = { x: dx / dist, y: dy / dist };
      }
    }, { passive: false });

    const endTouch = () => {
      isTouching = false;
      this.input.touchDir = null;
    };
    this.canvas.addEventListener('touchend', endTouch);
    this.canvas.addEventListener('touchcancel', endTouch);
  }

  triggerInteract(speakAloud = false) {
    // If dialog modal is already open and L is pressed, toggle TTS
    if (this.uiManager.activeModal === 'modal-dialog' && speakAloud) {
      document.getElementById('dialog-tts-btn')?.click();
      return;
    }

    // Check nearest NPC
    for (const npc of this.world.npcs) {
      if (npc.isNear(this.player)) {
        this.uiManager.openDialog(npc, speakAloud);
        return;
      }
    }

    // Check House Plot (only on E key, not L)
    if (!speakAloud && this.world.housePlot && this.world.housePlot.isNear(this.player)) {
      this.uiManager.openHouseModal();
    }
  }

  triggerMine() {
    if (!this.player.startSwing()) return;

    // Find target in front of player
    const target = this.world.getMiningTarget(this.player);
    if (target) {
      const destroyed = target.takeDamage(
        this.player.miningPower,
        this.player,
        this.particles,
        this.floatingTexts,
        this.droppedItems,
        this.soundManager
      );

      if (destroyed) {
        this.quests.stats.objectsMined++;
        this.uiManager.updateHUD();
      }
    } else {
      // Just a swing in empty air
      this.soundManager.playTone(200, 0.08, 'sine', 0.06, -50);
    }
  }

  triggerMineAt(worldX, worldY) {
    // Check if clicked directly on an NPC
    for (const npc of this.world.npcs) {
      const distToNpc = Math.hypot(worldX - npc.x, worldY - npc.y);
      if (distToNpc < npc.radius + 15) {
        const playerDist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
        if (playerDist < 90) {
          this.uiManager.openDialog(npc);
          return;
        }
      }
    }

    // Check if clicked directly on a resource object
    for (const res of this.world.resources) {
      if (!res.isDead) {
        const dist = Math.hypot(worldX - res.x, worldY - res.y);
        if (dist < res.radius + 15) {
          const playerDist = Math.hypot(this.player.x - res.x, this.player.y - res.y);
          if (playerDist < 85) {
            // Face target
            this.player.facing = res.x >= this.player.x ? 1 : -1;
            if (this.player.startSwing()) {
              const destroyed = res.takeDamage(
                this.player.miningPower,
                this.player,
                this.particles,
                this.floatingTexts,
                this.droppedItems,
                this.soundManager
              );
              if (destroyed) {
                this.quests.stats.objectsMined++;
                this.uiManager.updateHUD();
              }
            }
            return;
          }
        }
      }
    }

    // If clicked on open ground without immediate resource, walk there!
    const target = this.world.getMiningTarget(this.player);
    if (!target) {
      this.input.targetPos = { x: worldX, y: worldY };
    } else {
      this.triggerMine();
    }
  }

  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }

    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // Continuous mining when Space or Mouse is held
    if (this.input.keys['Space'] || (this.input.mouse.isDown && !this.input.targetPos)) {
      if (this.player.swingCooldown <= 0) {
        this.triggerMine();
      }
    }

    // 1. Update Player
    this.player.update(dt, this.input, this.world, this.particles, this.soundManager);

    // 2. Update World (resources, npcs, house plot)
    this.world.update(dt, this.player, this.economy, this.floatingTexts);

    // 3. Update Dropped Items (physics & magnet collection)
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      const alive = item.update(dt, this.player, (collected) => {
        this.economy.add(collected.type, collected.amount);
        this.soundManager.playItemPickup(collected.type);

        const typeLabels = {
          coin: `+${collected.amount} Altın 🪙`,
          wood: `+${collected.amount} Odun 🪵`,
          stone: `+${collected.amount} Taş 🪨`,
          gem: `+${collected.amount} Mücevher 💎`,
          fossil: `+${collected.amount} Fosil 🦴`,
        };
        const colors = {
          coin: '#facc15',
          wood: '#d97706',
          stone: '#cbd5e1',
          gem: '#f43f5e',
          fossil: '#e2e8f0',
        };

        this.floatingTexts.push({
          x: this.player.x + (Math.random() - 0.5) * 20,
          y: this.player.y - 25,
          text: typeLabels[collected.type] || `+${collected.amount}`,
          color: colors[collected.type] || '#fff',
          size: 14,
          life: 0.9,
          maxLife: 0.9,
          scale: 1,
          update(d) {
            this.y -= 30 * d;
            this.life -= d;
            return this.life > 0;
          },
          draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.life / 0.35);
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
          },
        });
      });

      if (!alive) {
        this.droppedItems.splice(i, 1);
      }
    }

    // 4. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(dt)) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      if (!this.floatingTexts[i].update(dt)) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 6. Smooth Camera follow
    const targetCamX = this.player.x - this.camera.width / 2;
    const targetCamY = this.player.y - this.camera.height / 2;

    this.camera.x += (targetCamX - this.camera.x) * (dt * 8);
    this.camera.y += (targetCamY - this.camera.y) * (dt * 8);

    // Clamp camera within map bounds
    this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width - this.camera.width));
    this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height - this.camera.height));

    // 7. Update Day/Night Time System
    this.timeSystem.update(dt);

    // 8. Update Auto-Save
    this.saveManager.update(dt);

    // 8. Update Radar Pointer text
    const distToVillage = Math.round(
      Math.hypot(this.player.x - 1100, this.player.y - 800) / 10
    );
    const radarEl = document.getElementById('village-pointer');
    if (radarEl) {
      if (distToVillage < 35) {
        radarEl.innerHTML = '🏘️ Dino Köyündesin';
        radarEl.style.borderColor = '#22c55e';
      } else {
        radarEl.innerHTML = `🧭 Dino Köyü: ${distToVillage}m`;
        radarEl.style.borderColor = '#facc15';
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.camera.width, this.camera.height);

    this.ctx.save();
    this.ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 1. Draw World terrain & paths
    this.world.draw(this.ctx, this.camera);

    // 2. Draw Target Reticle on targeted mineable resource
    const targetRes = this.world.getMiningTarget(this.player);
    if (targetRes) {
      this.ctx.save();
      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 4]);
      this.ctx.beginPath();
      this.ctx.arc(targetRes.x, targetRes.y - 6, targetRes.radius + 6, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Draw Dropped Items
    this.droppedItems.forEach(item => item.draw(this.ctx));

    // 4. Draw Living Entities (Y-sorted for proper 2D perspective overlap!)
    const entities = [
      this.player,
      ...this.world.npcs,
      ...this.world.resources,
    ];
    entities.sort((a, b) => a.y - b.y);

    entities.forEach(ent => {
      if (ent === this.player) {
        this.player.draw(this.ctx);
      } else if (ent instanceof Player) {
        ent.draw(this.ctx);
      } else if (ent.draw) {
        ent.draw(this.ctx, this.player);
      }
    });

    // 5. Draw Particles
    this.particles.forEach(p => p.draw(this.ctx));

    // 6. Draw Day/Night Ambient Darkness and Lights
    this.timeSystem.drawLighting(this.ctx, this.camera);

    // 7. Draw Floating Texts on top of lighting
    this.floatingTexts.forEach(ft => ft.draw(this.ctx));

    this.ctx.restore();
  }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
