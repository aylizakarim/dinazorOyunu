import { Pet } from '../entities/Pet.js';

export class SaveManager {
  constructor(
    player,
    economy,
    upgrades,
    shop,
    housePlot,
    quests,
    timeSystem,
    petSystem,
    storageSystem = null,
    houseInterior = null,
    museumSystem = null,
    farmingSystem = null
  ) {
    this.player = player;
    this.economy = economy;
    this.upgrades = upgrades;
    this.shop = shop;
    this.housePlot = housePlot;
    this.quests = quests;
    this.timeSystem = timeSystem;
    this.petSystem = petSystem;
    this.storageSystem = storageSystem;
    this.houseInterior = houseInterior;
    this.museumSystem = museumSystem;
    this.farmingSystem = farmingSystem;

    this.saveKey = 'dino_adventure_game_save_v1';
    this.autoSaveTimer = 0;
  }

  getSaveData() {
    return {
      version: 1,
      savedAt: Date.now(),
      player: {
        x: this.player.x,
        y: this.player.y,
        skin: this.player.skin,
        hat: this.player.hat,
        outfit: this.player.outfit,
        tool: this.player.tool,
        restedBuffTimer: this.player.restedBuffTimer || 0,
        buffs: this.player.buffs || null,
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
      storage: this.storageSystem ? this.storageSystem.serialize() : null,
      interior: this.houseInterior ? this.houseInterior.serialize() : null,
      museum: this.museumSystem ? this.museumSystem.serialize() : null,
      farming: this.farmingSystem ? this.farmingSystem.serialize() : null,
      quests: {
        completedQuestIds: this.quests.completedQuestIds,
        stats: this.quests.stats,
      },
      time: this.timeSystem
        ? {
            currentTime: this.timeSystem.currentTime,
            dayCount: this.timeSystem.dayCount,
          }
        : null,
      pets: this.petSystem
        ? {
            eggs: this.petSystem.eggs,
            ownedPets: this.petSystem.ownedPets.map((p) => ({
              type: p.type,
              name: p.name,
              level: p.level,
              xp: p.xp,
              xpToNextLevel: p.xpToNextLevel,
            })),
            activePetName: this.petSystem.activePet ? this.petSystem.activePet.name : null,
          }
        : null,
    };
  }

  save() {
    try {
      const data = this.getSaveData();
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Failed to save game state:', e);
      return false;
    }
  }

  applyLoadedData(data) {
    if (!data) return false;

    if (data.player) {
      this.player.x = data.player.x || this.player.x;
      this.player.y = data.player.y || this.player.y;
      this.player.skin = data.player.skin || 'green';
      this.player.hat = data.player.hat || 'none';
      this.player.outfit = data.player.outfit || 'none';
      this.player.tool = data.player.tool || 'pickaxe_wood';
      this.player.restedBuffTimer = data.player.restedBuffTimer || 0;
      if (data.player.buffs && this.player.buffs) {
        this.player.buffs = { ...this.player.buffs, ...data.player.buffs };
      }
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

    if (data.storage && this.storageSystem) {
      this.storageSystem.deserialize(data.storage);
    }

    if (data.interior && this.houseInterior) {
      this.houseInterior.deserialize(data.interior);
    }

    if (data.museum && this.museumSystem) {
      this.museumSystem.deserialize(data.museum);
    }

    if (data.farming && this.farmingSystem) {
      this.farmingSystem.deserialize(data.farming);
    }

    if (data.quests) {
      this.quests.completedQuestIds = data.quests.completedQuestIds || [];
      this.quests.stats = { ...this.quests.stats, ...data.quests.stats };
    }

    if (data.time && this.timeSystem) {
      this.timeSystem.currentTime = data.time.currentTime || 8.0;
      this.timeSystem.dayCount = data.time.dayCount || 1;
    }

    if (data.pets && this.petSystem) {
      if (Array.isArray(data.pets.eggs)) {
        this.petSystem.eggs = data.pets.eggs;
      }
      if (Array.isArray(data.pets.ownedPets) && data.pets.ownedPets.length > 0) {
        this.petSystem.ownedPets = data.pets.ownedPets.map((pData) => {
          const pet = new Pet(pData.type, pData.name);
          pet.level = pData.level || 1;
          pet.xp = pData.xp || 0;
          pet.xpToNextLevel = pData.xpToNextLevel || 100;
          pet.speed = 210 + (pet.level - 1) * 10;
          return pet;
        });
        const foundActive = this.petSystem.ownedPets.find(
          (p) => p.name === data.pets.activePetName
        );
        this.petSystem.activePet = foundActive || this.petSystem.ownedPets[0];
      }
    }

    return true;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return this.applyLoadedData(data);
    } catch (e) {
      console.warn('Failed to load game state:', e);
      return false;
    }
  }

  exportSaveToFile() {
    const data = this.getSaveData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dino_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  importSaveFromFile(file, onComplete) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const success = this.applyLoadedData(data);
        if (success) {
          this.save();
          if (onComplete) onComplete(true, 'Kayıt başarıyla yüklendi!');
        } else {
          if (onComplete) onComplete(false, 'Geçersiz kayıt dosyası formatı!');
        }
      } catch (err) {
        if (onComplete) onComplete(false, 'Kayıt dosyası okunurken hata oluştu!');
      }
    };
    reader.readAsText(file);
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
