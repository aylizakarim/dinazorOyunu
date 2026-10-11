export class ShopSystem {
  constructor(player, economy) {
    this.player = player;
    this.economy = economy;

    this.unlockedSkins = ['green'];
    this.unlockedHats = ['none'];
    this.unlockedOutfits = ['none'];
  }

  getItems() {
    return {
      skins: [
        { id: 'green', name: 'Yeşil Klasik Rex', desc: 'Sevimli doğa dostu orjinal dinozor.', cost: { coins: 0 }, preview: '#4ade80' },
        { id: 'blue', name: 'Okyanus Mavisi', desc: 'Derin denizlerin serinliği.', cost: { coins: 150 }, preview: '#38bdf8' },
        { id: 'red', name: 'Lav Ejderhası', desc: 'Ateşli ve güçlü magma rengi.', cost: { coins: 350 }, preview: '#f87171' },
        { id: 'purple', name: 'Galaksi Moru', desc: 'Gizemli uzay tozu ışıltısı.', cost: { coins: 650 }, preview: '#c084fc' },
        { id: 'pink', name: 'Pamuk Şeker', desc: 'Tatlı ve neşeli sakura pembesi.', cost: { coins: 850 }, preview: '#f472b6' },
        { id: 'gold', name: 'Efsanevi Altın', desc: 'Göz kamaştırıcı saf altın parıltısı.', cost: { coins: 2000, gems: 10 }, preview: '#facc15' },
      ],
      hats: [
        { id: 'none', name: 'Şapkasız', desc: 'Doğal dino kafası.', cost: { coins: 0 }, icon: '🦖' },
        { id: 'cowboy', name: 'Vahşi Kovboy', desc: 'Tozlu yolların cesur dinozoru.', cost: { coins: 120 }, icon: '🤠' },
        { id: 'chef', name: 'Usta Aşçı', desc: 'En lezzetli dino meyvelerini pişirir.', cost: { coins: 200 }, icon: '👨‍🍳' },
        { id: 'miner', name: 'Madenci Bareti', desc: 'Karanlık madenleri aydınlatan feneri vardır.', cost: { coins: 380 }, icon: '⛑️' },
        { id: 'party', name: 'Parti Şapkası', desc: 'Köyde her gün bir kutlama!', cost: { coins: 280 }, icon: '🎉' },
        { id: 'pirate', name: 'Korsan Kaptanı', desc: 'Kayıp hazinelerin peşindeki kaptan.', cost: { coins: 550 }, icon: '🏴‍☠️' },
        { id: 'crown', name: 'Kraliyet Tacı', desc: 'Dino Vadisi\'nin gerçek hükümdarı.', cost: { coins: 1800, gems: 15 }, icon: '👑' },
      ],
      outfits: [
        { id: 'none', name: 'Sade', desc: 'Ekstra giysi yok.', cost: { coins: 0 }, icon: '👕' },
        { id: 'cape', name: 'Süper Kahraman Pelerini', desc: 'Koşarken rüzgarda dalgalanan kırmızı pelerin.', cost: { coins: 300 }, icon: '🦸' },
        { id: 'tuxedo', name: 'Şık Smokin & Papyon', desc: 'Köy toplantılarının en centilmen dinosu.', cost: { coins: 450 }, icon: '🤵' },
        { id: 'backpack', name: 'Kaşif Çantası', desc: 'Tüm madenleri taşımak için harika çanta.', cost: { coins: 320 }, icon: '🎒' },
        { id: 'armor', name: 'Şövalye Zırhı', desc: 'Gümüş çelikten yapılmış sağlam koruma.', cost: { coins: 900, gems: 8 }, icon: '🛡️' },
      ],
    };
  }

  isUnlocked(category, id) {
    if (id === 'none' || id === 'green') return true;
    if (category === 'skins') return this.unlockedSkins.includes(id);
    if (category === 'hats') return this.unlockedHats.includes(id);
    if (category === 'outfits') return this.unlockedOutfits.includes(id);
    return false;
  }

  isEquipped(category, id) {
    if (category === 'skins') return this.player.skin === id;
    if (category === 'hats') return this.player.hat === id;
    if (category === 'outfits') return this.player.outfit === id;
    return false;
  }

  buyOrEquip(category, item, soundManager) {
    if (this.isUnlocked(category, item.id)) {
      // Already unlocked, equip it!
      this.equip(category, item.id);
      soundManager.playUpgrade();
      return { success: true, action: 'equip' };
    }

    // Try to purchase
    if (!this.economy.spend(item.cost)) {
      return { success: false, reason: 'insufficient_funds' };
    }

    if (category === 'skins') this.unlockedSkins.push(item.id);
    if (category === 'hats') this.unlockedHats.push(item.id);
    if (category === 'outfits') this.unlockedOutfits.push(item.id);

    this.equip(category, item.id);
    soundManager.playBuyCostume();
    return { success: true, action: 'buy' };
  }

  equip(category, id) {
    if (category === 'skins') this.player.skin = id;
    if (category === 'hats') this.player.hat = id;
    if (category === 'outfits') this.player.outfit = id;
  }
}
