export class SaveManager {
  constructor(player, economy, upgrades, shop, housePlot, quests, timeSystem) {
    this.player = player;
    this.economy = economy;
    this.upgrades = upgrades;
    this.shop = shop;
    this.housePlot = housePlot;
    this.quests = quests;
    this.timeSystem = timeSystem;

    this.saveKey = 'dino_adventure_game_save_v1';
    this.autoSaveTimer = 0;
  }

  save() {
    try {
      const data = {
        version: 1,
        savedAt: Date.now(),
        player: {
          x: this.player.x,
          y: this.player.y,
          skin: this.player.skin,
          hat: this.player.hat,
          outfit: this.player.outfit,
          tool: this.player.tool,
        },
        economy: {
          coins: this.economy.coins,
          wood: this.economy.wood,
          stone: this.economy.stone,
          gems: this.economy.gems,
          fossils: this.economy.fossils,
        },
        upgrades: {
          levels: this.upgrades.levels,
        },
        shop: {
          unlockedSkins: this.shop.unlockedSkins,
          unlockedHats: this.shop.unlockedHats,
          unlockedOutfits: this.shop.unlockedOutfits,
        },
        house: {
          tier: this.housePlot.tier,
        },
        quests: {
          completedQuestIds: this.quests.completedQuestIds,
          stats: this.quests.stats,
        },
        time: this.timeSystem ? {
          currentTime: this.timeSystem.currentTime,
          dayCount: this.timeSystem.dayCount,
        } : null,
      };

      localStorage.setItem(this.saveKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Failed to save game state:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return false;
      const data = JSON.parse(raw);

      if (data.player) {
        this.player.x = data.player.x || this.player.x;
        this.player.y = data.player.y || this.player.y;
        this.player.skin = data.player.skin || 'green';
        this.player.hat = data.player.hat || 'none';
        this.player.outfit = data.player.outfit || 'none';
        this.player.tool = data.player.tool || 'pickaxe_wood';
      }

      if (data.economy) {
        this.economy.coins = data.economy.coins || 0;
        this.economy.wood = data.economy.wood || 0;
        this.economy.stone = data.economy.stone || 0;
        this.economy.gems = data.economy.gems || 0;
        this.economy.fossils = data.economy.fossils || 0;
      }

      if (data.upgrades && data.upgrades.levels) {
        this.upgrades.levels = { ...this.upgrades.levels, ...data.upgrades.levels };
        this.upgrades.applyAllStats();
      }

      if (data.shop) {
        this.shop.unlockedSkins = data.shop.unlockedSkins || ['green'];
        this.shop.unlockedHats = data.shop.unlockedHats || ['none'];
        this.shop.unlockedOutfits = data.shop.unlockedOutfits || ['none'];
      }

      if (data.house && data.house.tier !== undefined) {
        this.housePlot.tier = data.house.tier;
      }

      if (data.quests) {
        this.quests.completedQuestIds = data.quests.completedQuestIds || [];
        this.quests.stats = { ...this.quests.stats, ...data.quests.stats };
      }

      if (data.time && this.timeSystem) {
        this.timeSystem.currentTime = data.time.currentTime || 8.0;
        this.timeSystem.dayCount = data.time.dayCount || 1;
      }

      return true;
    } catch (e) {
      console.warn('Failed to load game state:', e);
      return false;
    }
  }

  reset() {
    localStorage.removeItem(this.saveKey);
    window.location.reload();
  }

  update(dt) {
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 10.0) {
      this.autoSaveTimer = 0;
      this.save();
    }
  }
}
