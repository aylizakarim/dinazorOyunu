export class QuestSystem {
  constructor(economy, housePlot, player) {
    this.economy = economy;
    this.housePlot = housePlot;
    this.player = player;

    this.stats = {
      objectsMined: 0,
      spokeWithRex: false,
      costumesBought: 0,
      upgradesDone: 0,
    };

    this.completedQuestIds = [];
    this.initQuests();
  }

  initQuests() {
    this.quests = [
      {
        id: 'q_mine_3',
        title: 'İlk Kazı Macerası',
        desc: 'Doğadaki ağaçları veya taşları kazarak toplam 3 nesne parçala.',
        reward: { coins: 80, wood: 15, stone: 10 },
        checkProgress: () => ({ current: this.stats.objectsMined, target: 3 }),
        isReady: () => this.stats.objectsMined >= 3,
      },
      {
        id: 'q_meet_chief',
        title: 'Muhtar Rex\'i Ziyaret Et',
        desc: 'Köy meydanındaki bilge Muhtar Rex ile konuşup tavsiye al.',
        reward: { coins: 100 },
        checkProgress: () => ({ current: this.stats.spokeWithRex ? 1 : 0, target: 1 }),
        isReady: () => this.stats.spokeWithRex,
      },
      {
        id: 'q_gather_wood',
        title: 'Odun Deposu',
        desc: 'Ağaçları keserek envanterinde en az 25 odun biriktir.',
        reward: { coins: 120, stone: 15 },
        checkProgress: () => ({ current: Math.min(25, this.economy.wood), target: 25 }),
        isReady: () => this.economy.wood >= 25,
      },
      {
        id: 'q_build_tent',
        title: 'Köyde Bir Yuva: Kamp Çadırı',
        desc: 'Ev arsasında Tier 1 Sevimli Kamp Çadırını kur.',
        reward: { coins: 200, stone: 20, gems: 2 },
        checkProgress: () => ({ current: this.housePlot.tier >= 1 ? 1 : 0, target: 1 }),
        isReady: () => this.housePlot.tier >= 1,
      },
      {
        id: 'q_first_upgrade',
        title: 'Daha Güçlü Bir Dinozor',
        desc: 'Karakter Geliştirmeleri menüsünden en az 2 geliştirme yap.',
        reward: { coins: 150, wood: 20 },
        checkProgress: () => ({ current: Math.min(2, this.stats.upgradesDone), target: 2 }),
        isReady: () => this.stats.upgradesDone >= 2,
      },
      {
        id: 'q_wear_hat',
        title: 'Tarz Sahibi Dino',
        desc: 'Kostüm Mağazasından yeni bir şapka, kostüm veya renk kuşan.',
        reward: { coins: 180, gems: 3 },
        checkProgress: () => ({
          current: (this.player.hat !== 'none' || this.player.outfit !== 'none' || this.player.skin !== 'green') ? 1 : 0,
          target: 1,
        }),
        isReady: () => (this.player.hat !== 'none' || this.player.outfit !== 'none' || this.player.skin !== 'green'),
      },
      {
        id: 'q_build_cottage',
        title: 'Gerçek Bir Köylü: Ahşap Kulübe',
        desc: 'Evini Tier 2 Ahşap Dino Kulübesine yükselt!',
        reward: { coins: 500, gems: 5 },
        checkProgress: () => ({ current: this.housePlot.tier >= 2 ? 1 : 0, target: 1 }),
        isReady: () => this.housePlot.tier >= 2,
      },
      {
        id: 'q_build_palace',
        title: 'Dino Vadisi\'nin Hükümdarı!',
        desc: 'Tier 4 Efsanevi Dino Sarayını tamamla!',
        reward: { coins: 3000, gems: 50 },
        checkProgress: () => ({ current: this.housePlot.tier >= 4 ? 1 : 0, target: 1 }),
        isReady: () => this.housePlot.tier >= 4,
      },
    ];
  }

  claimReward(questId, soundManager) {
    const q = this.quests.find(item => item.id === questId);
    if (!q) return false;
    if (this.completedQuestIds.includes(questId)) return false;
    if (!q.isReady()) return false;

    this.completedQuestIds.push(questId);
    if (q.reward.coins) this.economy.add('coin', q.reward.coins);
    if (q.reward.wood) this.economy.add('wood', q.reward.wood);
    if (q.reward.stone) this.economy.add('stone', q.reward.stone);
    if (q.reward.gems) this.economy.add('gem', q.reward.gems);

    soundManager.playQuestComplete();
    return true;
  }
}
