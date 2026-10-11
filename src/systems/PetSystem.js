import { Pet } from '../entities/Pet.js';
import confetti from 'canvas-confetti';

export class PetSystem {
  constructor(game) {
    this.game = game;
    this.eggs = [];
    this.ownedPets = [];
    this.activePet = null;

    // Give player a starter egg to try immediately!
    this.initStarterEgg();
  }

  initStarterEgg() {
    this.eggs.push({
      id: 'egg_starter_rex',
      type: 'rex',
      name: 'Ateşli Rex Yumurtası',
      desc: 'Sıcak ve enerjik! İçinde minik bir T-Rex kıpırdanıyor.',
      icon: '🥚',
      color: '#f59e0b',
    });
  }

  findEgg(type = 'tricera') {
    const eggDefs = {
      rex: { name: 'Ateşli Rex Yumurtası', desc: 'İçinde cesur bir minik Rex var!', color: '#f59e0b' },
      tricera: { name: 'Mavi Orman Yumurtası', desc: 'İçinde sevimli bir minik Triceratops var!', color: '#38bdf8' },
      ptero: { name: 'Gökkuşağı Gökyüzü Yumurtası', desc: 'İçinde uçan sevimli bir Pterodaktil var!', color: '#f472b6' },
    };
    const def = eggDefs[type] || eggDefs.rex;

    this.eggs.push({
      id: `egg_${Date.now()}`,
      type,
      name: def.name,
      desc: def.desc,
      icon: '🥚',
      color: def.color,
    });

    this.game.uiManager.showToast(`🥚 Tebrikler! "${def.name}" buldun!`);
    this.game.uiManager.updateHUD();
  }

  hatchEgg(index, customName = null) {
    if (index < 0 || index >= this.eggs.length) return false;
    const egg = this.eggs.splice(index, 1)[0];

    const defaultNames = {
      rex: 'Bebek Rexi',
      tricera: 'Bebek Trici',
      ptero: 'Bebek Pteri',
    };

    const petName = customName || defaultNames[egg.type] || 'Bebek Dino';
    const newPet = new Pet(egg.type, petName);
    newPet.x = this.game.player.x + 20;
    newPet.y = this.game.player.y + 10;

    this.ownedPets.push(newPet);
    this.activePet = newPet;

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    this.game.soundManager.playQuestComplete();
    this.game.uiManager.showToast(`🎉 Yumurta çatladı! "${newPet.name}" dünyaya geldi ve peşine katıldı!`);
    this.game.uiManager.updateHUD();
    this.game.saveManager.save();
    return newPet;
  }

  setActivePet(pet) {
    this.activePet = pet;
    if (pet) {
      pet.x = this.game.player.x;
      pet.y = this.game.player.y;
    }
  }

  update(dt) {
    if (this.activePet) {
      this.activePet.update(
        dt,
        this.game.player,
        this.game.world,
        this.game.droppedItems,
        this.game.economy,
        this.game.particles,
        this.game.floatingTexts,
        this.game.soundManager
      );
    }
  }

  draw(ctx) {
    if (this.activePet) {
      this.activePet.draw(ctx);
    }
  }
}
