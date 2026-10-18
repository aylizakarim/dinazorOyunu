export class EconomySystem {
  constructor() {
    this.coins = 0;
    this.wood = 0;
    this.stone = 0;
    this.gems = 0;
    this.fossils = 0;

    this.onUpdate = null;
  }

  add(type, amount = 1) {
    if (type === 'coin') this.coins += amount;
    else if (type === 'wood') this.wood += amount;
    else if (type === 'stone') this.stone += amount;
    else if (type === 'gem') this.gems += amount;
    else if (type === 'fossil') this.fossils += amount;

    if (this.onUpdate) this.onUpdate(this);
  }

  canAfford(cost = {}) {
    if (cost.coins && this.coins < cost.coins) return false;
    if (cost.wood && this.wood < cost.wood) return false;
    if (cost.stone && this.stone < cost.stone) return false;
    if (cost.gems && this.gems < cost.gems) return false;
    if (cost.fossils && this.fossils < cost.fossils) return false;
    return true;
  }

  spend(cost = {}) {
    if (!this.canAfford(cost)) return false;
    if (cost.coins) this.coins -= cost.coins;
    if (cost.wood) this.wood -= cost.wood;
    if (cost.stone) this.stone -= cost.stone;
    if (cost.gems) this.gems -= cost.gems;
    if (cost.fossils) this.fossils -= cost.fossils;

    if (this.onUpdate) this.onUpdate(this);
    return true;
  }

  spendResource(type, amount = 1) {
    if (amount <= 0) return 0;
    const prop = type === 'coin' || type === 'coins' ? 'coins' : type;
    if (this[prop] === undefined) return 0;
    const actual = Math.min(amount, this[prop]);
    this[prop] -= actual;
    if (this.onUpdate) this.onUpdate(this);
    return actual;
  }
}

