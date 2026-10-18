export const EXHIBIT_DEFINITIONS = [
  {
    id: 'rex',
    name: 'Kral Tyrannosaurus Rex',
    shortName: 'T-Rex',
    desc: 'Dinozorlar aleminin efsanevi apeks avcısı! Muazzam çenesiyle vadinin en görkemli sergisi.',
    icon: '🦖',
    pedestalX: 200,
    pedestalY: 210,
    color: '#ef4444',
    bones: [
      { id: 'rex_skull', name: 'T-Rex Kafatası', desc: 'Devasa jilet gibi keskin dişlere sahip muazzam kafatası.' },
      { id: 'rex_torso', name: 'T-Rex Göğüs Kafesi', desc: 'Ağır zırh gibi sağlam omurga ve kaburgalar.' },
      { id: 'rex_arms', name: 'T-Rex Ön Pençeleri', desc: 'İki tırnaklı ikonik minik ön kollar.' },
      { id: 'rex_tail', name: 'T-Rex Kuyruk Kemiği', desc: 'Koşarken denge sağlayan uzun ağır kuyruk kemikleri.' },
    ],
  },
  {
    id: 'tricera',
    name: 'Triceratops Prorsus',
    shortName: 'Triceratops',
    desc: 'Üç heybetli boynuzlu ve sağlam kalkan yakalıklı otçul vadi titanı.',
    icon: '🦏',
    pedestalX: 600,
    pedestalY: 210,
    color: '#0ea5e9',
    bones: [
      { id: 'tricera_skull', name: 'Triceratops Boynuzlu Kafatası', desc: 'Üç sivri boynuz ve kemik fırfırlı görkemli kafa.' },
      { id: 'tricera_ribs', name: 'Triceratops Göğüs Kalkanı', desc: 'Geniş gövdeyi koruyan kalın göğüs kemikleri.' },
      { id: 'tricera_legs', name: 'Triceratops Sütun Bacakları', desc: 'Ağır tonlarca gövdeyi taşıyan kalın bacak kemikleri.' },
      { id: 'tricera_tail', name: 'Triceratops Kısa Kuyruğu', desc: 'Sert kaslı dengeli kuyruk kemikleri.' },
    ],
  },
  {
    id: 'stego',
    name: 'Stegosaurus Stenops',
    shortName: 'Stegosaurus',
    desc: 'Sırtındaki ikili plakalar ve kuyruğundaki sivri dikenlerle savunma dehası.',
    icon: '🦕',
    pedestalX: 200,
    pedestalY: 390,
    color: '#10b981',
    bones: [
      { id: 'stego_plates', name: 'Stego Sırt Plakaları', desc: 'Isı düzenleyici ve savunmacı elmas biçimli plakalar.' },
      { id: 'stego_spikes', name: 'Stego Kuyruk Dikenleri', desc: 'Yırtıcıları püskürten 4 ölümcül sivri boynuz (Thagomizer).' },
      { id: 'stego_skull', name: 'Stego Küçük Kafatası', desc: 'Ceviz büyüklüğünde beyin yuvasına sahip narin baş.' },
      { id: 'stego_legs', name: 'Stego Arka Bacakları', desc: 'Önlerden uzun güçlü zırhlı bacak kemikleri.' },
    ],
  },
  {
    id: 'ptero',
    name: 'Pteranodon Longiceps',
    shortName: 'Pterodaktil',
    desc: 'Tarih öncesi gökyüzünün 7 metrelik kanat açıklığına sahip usta planörü.',
    icon: '🦅',
    pedestalX: 600,
    pedestalY: 390,
    color: '#a855f7',
    bones: [
      { id: 'ptero_skull', name: 'Pteranodon Gagalı Kafatası', desc: 'Balık avlamak için sivri gaga ve aerodinamik ibik.' },
      { id: 'ptero_wings', name: 'Pteranodon Kanat Açıklığı', desc: 'Havada süzülmek için hafif, içi boş dev kemikler.' },
      { id: 'ptero_feet', name: 'Pteranodon Tüneme Pençeleri', desc: 'Uçurumlara ve kayalara tutunan kancalı pençeler.' },
    ],
  },
];

export class MuseumSystem {
  constructor(game) {
    this.game = game;

    // Donated bones set (mounted on pedestals)
    this.donatedBones = new Set();

    // Player's uncurated bone inventory: map of boneId -> quantity
    this.playerBones = {};

    // Tourist system & accrued ticket donations
    this.accruedGold = 0;
    this.accrualTimer = 0;
    this.tourists = [];
  }

  getAllBoneDefinitions() {
    const list = [];
    EXHIBIT_DEFINITIONS.forEach((ex) => {
      ex.bones.forEach((b) => {
        list.push({
          ...b,
          speciesId: ex.id,
          speciesName: ex.name,
          speciesIcon: ex.icon,
          color: ex.color,
        });
      });
    });
    return list;
  }

  getBoneDefinition(boneId) {
    for (const ex of EXHIBIT_DEFINITIONS) {
      const found = ex.bones.find((b) => b.id === boneId);
      if (found) {
        return {
          ...found,
          speciesId: ex.id,
          speciesName: ex.name,
          speciesIcon: ex.icon,
          color: ex.color,
        };
      }
    }
    return null;
  }

  isDonated(boneId) {
    return this.donatedBones.has(boneId);
  }

  isSpeciesComplete(speciesId) {
    const ex = EXHIBIT_DEFINITIONS.find((e) => e.id === speciesId);
    if (!ex) return false;
    return ex.bones.every((b) => this.donatedBones.has(b.id));
  }

  getSpeciesProgress(speciesId) {
    const ex = EXHIBIT_DEFINITIONS.find((e) => e.id === speciesId);
    if (!ex) return { donated: 0, total: 0 };
    const donated = ex.bones.filter((b) => this.donatedBones.has(b.id)).length;
    return { donated, total: ex.bones.length };
  }

  getTotalBonesCount() {
    return EXHIBIT_DEFINITIONS.reduce((acc, ex) => acc + ex.bones.length, 0);
  }

  getDonatedCount() {
    return this.donatedBones.size;
  }

  getCompletionPercentage() {
    const total = this.getTotalBonesCount();
    return total > 0 ? Math.round((this.donatedBones.size / total) * 100) : 0;
  }

  addBone(boneId, soundManager = null, floatingTexts = null) {
    this.playerBones[boneId] = (this.playerBones[boneId] || 0) + 1;
    const def = this.getBoneDefinition(boneId);

    if (soundManager) soundManager.playUpgrade();
    if (floatingTexts && this.game.player) {
      floatingTexts.push({
        x: this.game.player.x,
        y: this.game.player.y - 30,
        text: `🦴 ${def ? def.name : 'Nadir Fosil'} Bulundu!`,
        color: '#facc15',
        size: 14,
        life: 1.3,
        maxLife: 1.3,
        scale: 1,
        update(d) {
          this.y -= 25 * d;
          this.life -= d;
          return this.life > 0;
        },
        draw(ctx) {
          ctx.save();
          ctx.font = 'bold 13px sans-serif';
          ctx.fillStyle = this.color;
          ctx.textAlign = 'center';
          ctx.fillText(this.text, this.x, this.y);
          ctx.restore();
        },
      });
    }

    if (this.game.uiManager) {
      this.game.uiManager.showToast(`🦴 Nadir Fosil Bulundu: "${def ? def.name : boneId}"! Profesör Pachy'ye götür!`);
    }
    return true;
  }

  getRandomMissingBone() {
    const all = this.getAllBoneDefinitions();
    const missing = all.filter((b) => !this.donatedBones.has(b.id));
    if (missing.length === 0) {
      // If all donated, return random
      return all[Math.floor(Math.random() * all.length)];
    }
    return missing[Math.floor(Math.random() * missing.length)];
  }

  cleanRawFossils(economy, soundManager) {
    const cost = 5;
    if (economy.fossils < cost) return false;

    economy.fossils -= cost;
    if (economy.onUpdate) economy.onUpdate(economy);

    const bone = this.getRandomMissingBone();
    this.addBone(bone.id, soundManager, this.game.floatingTexts);
    return bone;
  }

  donate(boneId, economy, soundManager) {
    if (!this.playerBones[boneId] || this.playerBones[boneId] <= 0) return false;
    if (this.donatedBones.has(boneId)) return false;

    this.playerBones[boneId]--;
    this.donatedBones.add(boneId);

    // Curator reward: Gold + Museum progress
    const rewardCoins = 150;
    economy.coins += rewardCoins;
    if (economy.onUpdate) economy.onUpdate(economy);

    if (soundManager) soundManager.playQuestComplete();

    const def = this.getBoneDefinition(boneId);
    const isComplete = def ? this.isSpeciesComplete(def.speciesId) : false;

    if (this.game.uiManager) {
      this.game.uiManager.showToast(`🏛️ "${def.name}" sergiye monte edildi! (+${rewardCoins} Altın Bağış Ödülü)`);
      if (isComplete) {
        setTimeout(() => {
          this.game.uiManager.showToast(`👑 TEBRİKLER! ${def.speciesName} İskeleti %100 Tamamlandı! Vadide bayram havası var!`);
        }, 1200);
      }
    }

    return true;
  }

  update(dt, economy) {
    // Generate passive tourist ticket income based on museum completion
    const donatedCount = this.donatedBones.size;
    if (donatedCount > 0) {
      const goldPerSec = Math.max(1, Math.round(donatedCount * 1.5));
      this.accruedGold += dt * goldPerSec;
    }
  }

  collectTicketGold(economy, soundManager) {
    const amount = Math.floor(this.accruedGold);
    if (amount <= 0) return 0;

    this.accruedGold -= amount;
    economy.coins += amount;
    if (economy.onUpdate) economy.onUpdate(economy);

    if (soundManager) soundManager.playCoin();
    return amount;
  }

  serialize() {
    return {
      donatedBones: Array.from(this.donatedBones),
      playerBones: { ...this.playerBones },
      accruedGold: this.accruedGold,
    };
  }

  deserialize(data) {
    if (!data) return;
    if (Array.isArray(data.donatedBones)) {
      this.donatedBones = new Set(data.donatedBones);
    }
    if (data.playerBones && typeof data.playerBones === 'object') {
      this.playerBones = { ...data.playerBones };
    }
    this.accruedGold = Number(data.accruedGold) || 0;
  }
}
