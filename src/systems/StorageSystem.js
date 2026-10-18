export class StorageSystem {
  constructor() {
    this.stored = {
      coins: 0,
      wood: 0,
      stone: 0,
      gems: 0,
      fossils: 0,
    };
  }

  get(type) {
    return this.stored[type] || 0;
  }

  deposit(type, amount, economy, soundManager) {
    if (amount <= 0) return 0;
    const currentVal = economy[type] !== undefined ? economy[type] : (type === 'coins' ? economy.coins : 0);
    const toDeposit = Math.min(amount, currentVal);
    if (toDeposit <= 0) return 0;

    economy.spendResource(type, toDeposit);
    this.stored[type] = (this.stored[type] || 0) + toDeposit;

    if (soundManager) soundManager.playChest();
    return toDeposit;
  }

  withdraw(type, amount, economy, soundManager) {
    if (amount <= 0) return 0;
    const available = this.stored[type] || 0;
    const toWithdraw = Math.min(amount, available);
    if (toWithdraw <= 0) return 0;

    this.stored[type] -= toWithdraw;
    economy.add(type === 'coins' ? 'coin' : type, toWithdraw);

    if (soundManager) soundManager.playChest();
    return toWithdraw;
  }

  depositAll(type, economy, soundManager) {
    const currentVal = economy[type] !== undefined ? economy[type] : (type === 'coins' ? economy.coins : 0);
    return this.deposit(type, currentVal, economy, soundManager);
  }

  withdrawAll(type, economy, soundManager) {
    const available = this.stored[type] || 0;
    return this.withdraw(type, available, economy, soundManager);
  }

  getTotalItems() {
    return (
      (this.stored.coins || 0) +
      (this.stored.wood || 0) +
      (this.stored.stone || 0) +
      (this.stored.gems || 0) +
      (this.stored.fossils || 0)
    );
  }

  serialize() {
    return { ...this.stored };
  }

  deserialize(data) {
    if (!data) return;
    this.stored.coins = Number(data.coins) || 0;
    this.stored.wood = Number(data.wood) || 0;
    this.stored.stone = Number(data.stone) || 0;
    this.stored.gems = Number(data.gems) || 0;
    this.stored.fossils = Number(data.fossils) || 0;
  }
}
