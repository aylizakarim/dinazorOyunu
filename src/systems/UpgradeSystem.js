export class UpgradeSystem {
  constructor(player, economy) {
    this.player = player;
    this.economy = economy;

    this.levels = {
      miningPower: 1,
      miningSpeed: 1,
      moveSpeed: 1,
      luck: 1,
      magnet: 1,
      toolTier: 1,
    };

    this.maxLevels = {
      miningPower: 15,
      miningSpeed: 10,
      moveSpeed: 8,
      luck: 10,
      magnet: 8,
      toolTier: 5,
    };
  }

  getUpgradeDefinitions() {
    return [
      {
        id: 'miningPower',
        name: 'Kazma Gücü',
        icon: '⛏️',
        desc: 'Vuruş başına verdiğin hasarı artırır. Taşları ve ağaçları çok daha hızlı parçalarsın.',
        currentVal: () => `${this.player.miningPower} Hasar`,
        nextVal: () => `+6 Hasar`,
        getCost: () => ({
          coins: Math.round(35 * Math.pow(1.55, this.levels.miningPower - 1)),
          stone: Math.round(5 * this.levels.miningPower),
        }),
      },
      {
        id: 'miningSpeed',
        name: 'Kazma Hızı',
        icon: '⚡',
        desc: 'Vuruşlar arasındaki bekleme süresini azaltır, seri kazı yaparsın.',
        currentVal: () => `${(1 / this.player.miningSpeed).toFixed(1)} vuruş/sn`,
        nextVal: () => `+0.3 vuruş/sn`,
        getCost: () => ({
          coins: Math.round(50 * Math.pow(1.6, this.levels.miningSpeed - 1)),
          wood: Math.round(10 * this.levels.miningSpeed),
        }),
      },
      {
        id: 'moveSpeed',
        name: 'Koşu Hızı',
        icon: '👟',
        desc: 'Dinozorunun dünyada daha çevik ve hızlı koşmasını sağlar.',
        currentVal: () => `${Math.round(this.player.baseSpeed)} Hız`,
        nextVal: () => `+18 Hız`,
        getCost: () => ({
          coins: Math.round(45 * Math.pow(1.65, this.levels.moveSpeed - 1)),
          wood: Math.round(8 * this.levels.moveSpeed),
        }),
      },
      {
        id: 'luck',
        name: 'Bereket & Şans',
        icon: '🍀',
        desc: 'Kazılarda daha fazla altın, nadir mücevher düşme ve kritik vuruş şansını artırır.',
        currentVal: () => `Seviye ${this.levels.luck} (%${this.levels.luck * 5} Kritik)`,
        nextVal: () => `+%5 Kritik & Ekstra Altın`,
        getCost: () => ({
          coins: Math.round(80 * Math.pow(1.7, this.levels.luck - 1)),
          gems: this.levels.luck > 2 ? Math.round(this.levels.luck * 0.7) : 0,
        }),
      },
      {
        id: 'magnet',
        name: 'Altın Mıknatısı',
        icon: '🧲',
        desc: 'Düşen altın ve madenleri çok daha uzak mesafelerden otomatik olarak kendine çeker.',
        currentVal: () => `${Math.round(this.player.magnetRadius)} px Menzil`,
        nextVal: () => `+30 px Menzil`,
        getCost: () => ({
          coins: Math.round(60 * Math.pow(1.6, this.levels.magnet - 1)),
          stone: Math.round(12 * this.levels.magnet),
        }),
      },
      {
        id: 'toolTier',
        name: 'Kazma Kademesi',
        icon: '🛠️',
        desc: 'Kazmanı tahtadan taşa, demire, altına ve elmasa dönüştürür. Büyük güç artışı verir!',
        currentVal: () => this.getToolName(this.levels.toolTier),
        nextVal: () => this.getToolName(this.levels.toolTier + 1),
        getCost: () => {
          const tier = this.levels.toolTier;
          if (tier === 1) return { coins: 150, stone: 30 };
          if (tier === 2) return { coins: 400, stone: 80, wood: 40 };
          if (tier === 3) return { coins: 1000, stone: 150, gems: 5 };
          if (tier === 4) return { coins: 2500, stone: 300, gems: 20 };
          return { coins: 999999 };
        },
      },
    ];
  }

  getToolName(tier) {
    switch (tier) {
      case 1: return 'Tahta Kazma';
      case 2: return 'Taş Kazma';
      case 3: return 'Demir Kazma';
      case 4: return 'Altın Kazma';
      case 5: return 'Elmas Kazma';
      default: return 'Efsanevi Kazma';
    }
  }

  getToolCode(tier) {
    switch (tier) {
      case 1: return 'pickaxe_wood';
      case 2: return 'pickaxe_stone';
      case 3: return 'pickaxe_iron';
      case 4: return 'pickaxe_gold';
      case 5: return 'pickaxe_diamond';
      default: return 'pickaxe_diamond';
    }
  }

  applyAllStats() {
    this.player.miningPower = 12 + (this.levels.miningPower - 1) * 6 + (this.levels.toolTier - 1) * 10;
    this.player.miningSpeed = Math.max(0.12, 0.32 - (this.levels.miningSpeed - 1) * 0.02);
    this.player.baseSpeed = 180 + (this.levels.moveSpeed - 1) * 18;
    this.player.luck = this.levels.luck;
    this.player.magnetRadius = 80 + (this.levels.magnet - 1) * 30;
    this.player.tool = this.getToolCode(this.levels.toolTier);
  }

  upgrade(upgradeId, soundManager) {
    const def = this.getUpgradeDefinitions().find(d => d.id === upgradeId);
    if (!def) return false;

    if (this.levels[upgradeId] >= this.maxLevels[upgradeId]) return false;

    const cost = def.getCost();
    if (!this.economy.spend(cost)) return false;

    this.levels[upgradeId]++;
    this.applyAllStats();
    soundManager.playUpgrade();
    return true;
  }
}
