import confetti from 'canvas-confetti';
import { HousePlot } from '../entities/HousePlot.js';
import { FURNITURE_RECIPES } from '../entities/HouseInterior.js';
import { ttsManager } from '../audio/ttsManager.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.activeModal = null;
    this.currentShopTab = 'skins';
  }

  init() {
    this.bindHudButtons();
    this.updateHUD();
  }

  bindHudButtons() {
    // Top HUD
    document.getElementById('btn-shop')?.addEventListener('click', () => this.openShopModal());
    document.getElementById('btn-upgrades')?.addEventListener('click', () => this.openUpgradesModal());
    document.getElementById('btn-quests')?.addEventListener('click', () => this.openQuestsModal());
    document.getElementById('btn-house')?.addEventListener('click', () => this.openHouseModal());
    document.getElementById('btn-pet')?.addEventListener('click', () => this.openPetModal());
    document.getElementById('btn-backup')?.addEventListener('click', () => this.openBackupModal());
    document.getElementById('btn-sound')?.addEventListener('click', () => this.toggleSound());
    document.getElementById('btn-help')?.addEventListener('click', () => this.openHelpModal());

    // Backup actions
    document.getElementById('btn-export-save')?.addEventListener('click', () => {
      this.game.saveManager.exportSaveToFile();
      this.showToast('💾 dino_save.json başarıyla indirildi!');
    });

    document.getElementById('btn-import-save')?.addEventListener('click', () => {
      document.getElementById('input-import-save')?.click();
    });

    document.getElementById('input-import-save')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this.game.saveManager.importSaveFromFile(file, (success, msg) => {
          if (success) {
            this.showToast(`✅ ${msg}`);
            this.updateHUD();
            this.closeAllModals();
          } else {
            this.showToast(`❌ ${msg}`);
          }
        });
      }
    });

    // Radar pointer click to walk to village
    document.getElementById('village-pointer')?.addEventListener('click', () => {
      if (this.game.currentScene === 'interior') {
        this.game.exitHouse();
      } else {
        this.game.player.x = 1100;
        this.game.player.y = 880;
        this.showToast('📍 Köy Meydanına Işınlandın!');
      }
    });

    // Modal Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeAllModals();
      });
    });

    // Mobile swing button
    document.getElementById('btn-mobile-swing')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.triggerMine();
    });
    document.getElementById('btn-mobile-swing')?.addEventListener('click', () => {
      this.game.triggerMine();
    });

    // Mobile interact button
    document.getElementById('btn-mobile-interact')?.addEventListener('click', () => {
      this.game.triggerInteract();
    });
  }

  toggleSound() {
    const isEnabled = this.game.soundManager.toggleSound();
    const btn = document.getElementById('btn-sound');
    if (btn) {
      btn.innerHTML = isEnabled ? '🎵 Ses: Açık' : '🔇 Ses: Kapalı';
      btn.style.opacity = isEnabled ? '1' : '0.6';
    }
    this.showToast(isEnabled ? 'Müzik ve Sesler Açıldı 🎵' : 'Sesler Kapatıldı 🔇');
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  updateHUD() {
    const eco = this.game.economy;
    document.getElementById('val-coins').textContent = eco.coins.toLocaleString();
    document.getElementById('val-wood').textContent = eco.wood.toLocaleString();
    document.getElementById('val-stone').textContent = eco.stone.toLocaleString();
    document.getElementById('val-gems').textContent = eco.gems.toLocaleString();
    document.getElementById('val-fossils').textContent = eco.fossils.toLocaleString();

    // Time & Day update
    if (this.game.timeSystem) {
      const timeInfo = this.game.timeSystem.getTimeFormatted();
      const timeIcon = document.getElementById('time-icon');
      const timeVal = document.getElementById('val-time');
      const dayVal = document.getElementById('val-day');
      if (timeIcon) timeIcon.textContent = timeInfo.icon;
      if (timeVal) timeVal.textContent = timeInfo.text;
      if (dayVal) dayVal.textContent = `Gün ${timeInfo.day}`;
    }

    // Check ready quests for badge
    const readyCount = this.game.quests.quests.filter(
      q => q.isReady() && !this.game.quests.completedQuestIds.includes(q.id)
    ).length;

    const questBadge = document.getElementById('badge-quests');
    if (questBadge) {
      if (readyCount > 0) {
        questBadge.style.display = 'block';
        questBadge.textContent = readyCount;
      } else {
        questBadge.style.display = 'none';
      }
    }

    // Check unhatched eggs for pet badge
    if (this.game.petSystem) {
      const petBadge = document.getElementById('badge-pet');
      if (petBadge) {
        const eggCount = this.game.petSystem.eggs.length;
        if (eggCount > 0) {
          petBadge.style.display = 'block';
          petBadge.textContent = eggCount;
        } else {
          petBadge.style.display = 'none';
        }
      }
    }

    // Well-rested buff display
    const buffEl = document.getElementById('hud-buff');
    const buffTimerEl = document.getElementById('buff-timer');
    if (buffEl && this.game.player) {
      if (this.game.player.restedBuffTimer > 0) {
        buffEl.style.display = 'block';
        if (buffTimerEl) buffTimerEl.textContent = Math.ceil(this.game.player.restedBuffTimer);
      } else {
        buffEl.style.display = 'none';
      }
    }
  }

  closeAllModals() {
    ttsManager.stop();
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    this.activeModal = null;
    this.game.isPaused = false;
  }

  openModal(modalId) {
    this.closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      this.activeModal = modalId;
      this.game.isPaused = true;
    }
  }

  // --- SHOP MODAL ---
  openShopModal(defaultTab = 'skins') {
    this.currentShopTab = defaultTab;
    this.renderShop();
    this.openModal('modal-shop');
  }

  renderShop() {
    const shop = this.game.shop;
    const items = shop.getItems();
    const container = document.getElementById('shop-items-container');
    if (!container) return;

    // Tabs
    const tabsContainer = document.getElementById('shop-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = `
        <button class="tab-btn ${this.currentShopTab === 'skins' ? 'active' : ''}" data-tab="skins">🎨 Dino Renkleri</button>
        <button class="tab-btn ${this.currentShopTab === 'hats' ? 'active' : ''}" data-tab="hats">👒 Şapkalar</button>
        <button class="tab-btn ${this.currentShopTab === 'outfits' ? 'active' : ''}" data-tab="outfits">👔 Kostümler</button>
      `;

      tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.currentShopTab = btn.getAttribute('data-tab');
          this.renderShop();
        });
      });
    }

    const currentItems = items[this.currentShopTab] || [];
    container.innerHTML = '';

    currentItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      const isUnlocked = shop.isUnlocked(this.currentShopTab, item.id);
      const isEquipped = shop.isEquipped(this.currentShopTab, item.id);
      const canAfford = this.game.economy.canAfford(item.cost);

      let iconHtml = '';
      if (this.currentShopTab === 'skins') {
        iconHtml = `<div style="width:28px;height:28px;border-radius:50%;background:${item.preview};border:2px solid #fff"></div>`;
      } else {
        iconHtml = `<span>${item.icon || '✨'}</span>`;
      }

      let costHtml = '';
      if (isUnlocked) {
        costHtml = `<span style="color:#22c55e;font-size:12px">Sahipsin ✅</span>`;
      } else {
        const parts = [];
        if (item.cost.coins) parts.push(`🪙 ${item.cost.coins}`);
        if (item.cost.gems) parts.push(`💎 ${item.cost.gems}`);
        costHtml = `<div class="cost-tag">${parts.join(' ') || 'Ücretsiz'}</div>`;
      }

      let btnText = 'Satın Al';
      let btnClass = 'btn-action';
      let btnDisabled = false;

      if (isEquipped) {
        btnText = 'Kuşanıldı ✨';
        btnClass += ' btn-equipped';
        btnDisabled = true;
      } else if (isUnlocked) {
        btnText = 'Giy / Kuşan';
      } else if (!canAfford) {
        btnDisabled = true;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon">${iconHtml}</div>
          <div class="card-info">
            <h4>${item.name}</h4>
            <p>${item.desc}</p>
          </div>
        </div>
        <div class="card-bottom">
          ${costHtml}
          <button class="${btnClass}" ${btnDisabled ? 'disabled' : ''}>${btnText}</button>
        </div>
      `;

      card.querySelector('button').addEventListener('click', () => {
        const res = shop.buyOrEquip(this.currentShopTab, item, this.game.soundManager);
        if (res.success) {
          if (res.action === 'buy') {
            this.showToast(`🎉 "${item.name}" satın alındı ve giyildi!`);
            this.game.quests.stats.costumesBought++;
          } else {
            this.showToast(`✨ "${item.name}" giyildi!`);
          }
          this.updateHUD();
          this.renderShop();
          this.game.saveManager.save();
        } else {
          this.showToast('❌ Yeterli altın veya madenin yok!');
        }
      });

      container.appendChild(card);
    });
  }

  // --- UPGRADES MODAL ---
  openUpgradesModal() {
    this.renderUpgrades();
    this.openModal('modal-upgrades');
  }

  renderUpgrades() {
    const upgrades = this.game.upgrades;
    const defs = upgrades.getUpgradeDefinitions();
    const container = document.getElementById('upgrades-container');
    if (!container) return;

    container.innerHTML = '';

    defs.forEach(def => {
      const curLvl = upgrades.levels[def.id];
      const maxLvl = upgrades.maxLevels[def.id];
      const isMax = curLvl >= maxLvl;
      const cost = def.getCost();
      const canAfford = !isMax && this.game.economy.canAfford(cost);

      const card = document.createElement('div');
      card.className = 'upgrade-card';

      let costHtml = '';
      if (isMax) {
        costHtml = '<span style="color:#22c55e;font-size:13px;font-weight:700">MAKSİMUM SEVİYE 🏆</span>';
      } else {
        const parts = [];
        if (cost.coins) parts.push(`🪙 ${cost.coins}`);
        if (cost.wood) parts.push(`🪵 ${cost.wood}`);
        if (cost.stone) parts.push(`🪨 ${cost.stone}`);
        if (cost.gems) parts.push(`💎 ${cost.gems}`);
        costHtml = `<div class="cost-tag">${parts.join(' ')}</div>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon">${def.icon}</div>
          <div class="card-info" style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <h4>${def.name}</h4>
              <span style="font-size:12px;color:var(--accent-gold);font-weight:700">Sv. ${curLvl}/${maxLvl}</span>
            </div>
            <p>${def.desc}</p>
            <div style="margin-top:6px;font-size:12px;color:#38bdf8;font-weight:600">
              Şu an: ${def.currentVal()} ${!isMax ? `➔ <span style="color:#4ade80">${def.nextVal()}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="card-bottom">
          ${costHtml}
          <button class="btn-action" ${(!canAfford || isMax) ? 'disabled' : ''}>
            ${isMax ? 'Maksimum' : 'Geliştir'}
          </button>
        </div>
      `;

      card.querySelector('button').addEventListener('click', () => {
        if (upgrades.upgrade(def.id, this.game.soundManager)) {
          this.game.quests.stats.upgradesDone++;
          this.showToast(`⚡ ${def.name} Seviye ${upgrades.levels[def.id]}'ye yükseltildi!`);
          this.updateHUD();
          this.renderUpgrades();
          this.game.saveManager.save();
        } else {
          this.showToast('❌ Yeterli kaynak yok!');
        }
      });

      container.appendChild(card);
    });
  }

  // --- HOUSE MODAL ---
  openHouseModal() {
    this.renderHouse();
    this.openModal('modal-house');
  }

  renderHouse() {
    const house = this.game.world.housePlot;
    const infoList = HousePlot.getTIER_INFO();
    const currentTierInfo = infoList[house.tier];
    const nextTierInfo = house.tier < 4 ? infoList[house.tier + 1] : null;

    const previewEl = document.getElementById('house-current-info');
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="house-tier-badge">Aşama ${house.tier}: ${currentTierInfo.name}</div>
        <p style="font-size:14px;color:#f8fafc;margin-bottom:8px">${currentTierInfo.desc}</p>
        <p style="font-size:13px;color:#4ade80;font-weight:700">Aktif Bonus: ${currentTierInfo.bonus}</p>
      `;
    }

    const upgradeBox = document.getElementById('house-upgrade-box');
    if (upgradeBox) {
      if (!nextTierInfo) {
        upgradeBox.innerHTML = `
          <div style="text-align:center;padding:16px;background:rgba(30,41,59,0.7);border-radius:12px;border:2px solid #facc15">
            <h3 style="color:#facc15;font-size:18px">👑 Tebrikler Dino Hükümdarı!</h3>
            <p style="font-size:14px;color:#94a3b8;margin-top:6px">Efsanevi Dino Sarayı inşa edildi. Vadideki tüm dinozorlar seninle gurur duyuyor!</p>
          </div>
        `;
      } else {
        const canAfford = house.canUpgrade(this.game.economy);
        const costParts = [];
        if (nextTierInfo.cost.coins) costParts.push(`🪙 ${nextTierInfo.cost.coins} Altın`);
        if (nextTierInfo.cost.wood) costParts.push(`🪵 ${nextTierInfo.cost.wood} Odun`);
        if (nextTierInfo.cost.stone) costParts.push(`🪨 ${nextTierInfo.cost.stone} Taş`);
        if (nextTierInfo.cost.gems) costParts.push(`💎 ${nextTierInfo.cost.gems} Mücevher`);

        upgradeBox.innerHTML = `
          <div style="background:rgba(30,41,59,0.7);border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,0.1)">
            <h4 style="color:#facc15;font-size:16px">Sonraki Aşama: ${nextTierInfo.name}</h4>
            <p style="font-size:13px;color:#94a3b8;margin:6px 0">${nextTierInfo.desc}</p>
            <div style="font-size:13px;color:#38bdf8;font-weight:700;margin-bottom:12px">
              Kazanılacak Bonus: ${nextTierInfo.bonus}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,0.1);padding-top:12px">
              <div style="font-size:13px;font-weight:700;color:#fde047">
                Gereksinim: ${costParts.join(' • ')}
              </div>
              <button id="btn-build-house" class="btn-action" ${!canAfford ? 'disabled' : ''}>
                İnşa Et / Yükselt 🔨
              </button>
            </div>
          </div>
        `;

        document.getElementById('btn-build-house')?.addEventListener('click', () => {
          if (house.upgrade(this.game.economy, this.game.soundManager)) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
            this.showToast(`🏡 Evin "${nextTierInfo.name}" olarak yükseltildi! Harika görünüyor!`);
            this.updateHUD();
            this.renderHouse();
            this.game.saveManager.save();
          } else {
            this.showToast('❌ Ev inşaatı için yeterli malzemen yok!');
          }
        });
      }
    }

    // House Interior Enter Button Box
    const enterBox = document.getElementById('house-enter-box');
    if (enterBox) {
      if (house.tier >= 1) {
        enterBox.innerHTML = `
          <button id="btn-enter-interior" class="btn-action" style="width:100%;background:#059669;padding:12px 16px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px">
            <span>🏡</span> Evin İçine Gir (Oturma & Yatak Odası)
          </button>
        `;
        document.getElementById('btn-enter-interior')?.addEventListener('click', () => {
          this.closeAllModals();
          this.game.enterHouse();
        });
      } else {
        enterBox.innerHTML = `
          <div style="background:rgba(234,179,8,0.1);border:1px dashed #eab308;padding:10px 14px;border-radius:10px;text-align:center;font-size:13px;color:#fde047">
            ⛺ Evinin içine girebilmek için önce ilk çadırını inşa etmelisin!
          </div>
        `;
      }
    }
  }

  // --- STORAGE CHEST MODAL ---
  openChestModal() {
    this.renderChest();
    this.openModal('modal-chest');
  }

  renderChest() {
    const container = document.getElementById('chest-items-container');
    if (!container || !this.game.storageSystem) return;

    container.innerHTML = '';

    const resTypes = [
      { key: 'coins', name: 'Altın Para', icon: '🪙', color: '#facc15' },
      { key: 'wood', name: 'Odun', icon: '🪵', color: '#d97706' },
      { key: 'stone', name: 'Taş', icon: '🪨', color: '#94a3b8' },
      { key: 'gems', name: 'Mücevher', icon: '💎', color: '#f43f5e' },
      { key: 'fossils', name: 'Fosil', icon: '🦴', color: '#e2e8f0' },
    ];

    resTypes.forEach((res) => {
      const invCount = this.game.economy[res.key] !== undefined ? this.game.economy[res.key] : (res.key === 'coins' ? this.game.economy.coins : 0);
      const chestCount = this.game.storageSystem.get(res.key);

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.padding = '10px 14px';
      row.style.background = 'rgba(30, 41, 59, 0.7)';
      row.style.borderRadius = '12px';
      row.style.border = '1px solid rgba(255, 255, 255, 0.1)';

      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;min-width:140px">
          <span style="font-size:22px">${res.icon}</span>
          <div>
            <div style="font-weight:700;color:${res.color};font-size:14px">${res.name}</div>
            <div style="font-size:12px;color:#94a3b8">
              Çanta: <strong style="color:#fff">${invCount}</strong> | Sandık: <strong style="color:#4ade80">${chestCount}</strong>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
          <button class="btn-action btn-dep-10" style="padding:6px 10px;font-size:12px;background:#0284c7" ${invCount < 1 ? 'disabled' : ''}>+10 Koy</button>
          <button class="btn-action btn-dep-all" style="padding:6px 10px;font-size:12px;background:#0369a1" ${invCount < 1 ? 'disabled' : ''}>Tümü</button>
          <button class="btn-action btn-with-10" style="padding:6px 10px;font-size:12px;background:#d97706" ${chestCount < 1 ? 'disabled' : ''}>-10 Al</button>
          <button class="btn-action btn-with-all" style="padding:6px 10px;font-size:12px;background:#b45309" ${chestCount < 1 ? 'disabled' : ''}>Tümü</button>
        </div>
      `;

      row.querySelector('.btn-dep-10').addEventListener('click', () => {
        this.game.storageSystem.deposit(res.key, 10, this.game.economy, this.game.soundManager);
        this.updateHUD();
        this.renderChest();
        this.game.saveManager.save();
      });

      row.querySelector('.btn-dep-all').addEventListener('click', () => {
        this.game.storageSystem.depositAll(res.key, this.game.economy, this.game.soundManager);
        this.updateHUD();
        this.renderChest();
        this.game.saveManager.save();
      });

      row.querySelector('.btn-with-10').addEventListener('click', () => {
        this.game.storageSystem.withdraw(res.key, 10, this.game.economy, this.game.soundManager);
        this.updateHUD();
        this.renderChest();
        this.game.saveManager.save();
      });

      row.querySelector('.btn-with-all').addEventListener('click', () => {
        this.game.storageSystem.withdrawAll(res.key, this.game.economy, this.game.soundManager);
        this.updateHUD();
        this.renderChest();
        this.game.saveManager.save();
      });

      container.appendChild(row);
    });
  }

  // --- FURNITURE CRAFTING MODAL ---
  openFurnitureModal() {
    this.renderFurniture();
    this.openModal('modal-furniture');
  }

  renderFurniture() {
    const container = document.getElementById('furniture-items-container');
    if (!container || !this.game.houseInterior) return;

    container.innerHTML = '';

    FURNITURE_RECIPES.forEach((rec) => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      const isCrafted = this.game.houseInterior.isCrafted(rec.id);
      const canAfford = this.game.economy.canAfford(rec.cost);
      const tierMet = this.game.world.housePlot.tier >= rec.tierReq;

      const costParts = [];
      if (rec.cost.coins) costParts.push(`🪙 ${rec.cost.coins}`);
      if (rec.cost.wood) costParts.push(`🪵 ${rec.cost.wood}`);
      if (rec.cost.stone) costParts.push(`🪨 ${rec.cost.stone}`);
      if (rec.cost.gems) costParts.push(`💎 ${rec.cost.gems}`);
      if (rec.cost.fossils) costParts.push(`🦴 ${rec.cost.fossils}`);

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon" style="font-size:32px">${rec.icon}</div>
          <div class="card-info">
            <h4 style="color:#facc15">${rec.name}</h4>
            <p>${rec.desc}</p>
          </div>
        </div>
        <div class="card-bottom">
          <div style="font-size:12px;font-weight:700;color:#fde047">
            ${isCrafted ? '<span style="color:#22c55e">YERLEŞTİRİLDİ ✅</span>' : (!tierMet ? `<span style="color:#f87171">Aşama ${rec.tierReq} Ev Gerekir</span>` : costParts.join(' • '))}
          </div>
          <button class="btn-action btn-craft-furniture" ${isCrafted || !canAfford || !tierMet ? 'disabled' : ''}>
            ${isCrafted ? 'Mevcut' : 'Üret & Yerleştir 🔨'}
          </button>
        </div>
      `;

      card.querySelector('.btn-craft-furniture')?.addEventListener('click', () => {
        if (this.game.houseInterior.craft(rec.id, this.game.economy, this.game.soundManager)) {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 }
          });
          this.showToast(`✨ "${rec.name}" başarıyla üretildi ve evine yerleştirildi!`);
          this.updateHUD();
          this.renderFurniture();
          this.game.saveManager.save();
        } else {
          this.showToast('❌ Malzemeler veya ev seviyesi yetersiz!');
        }
      });

      container.appendChild(card);
    });
  }

  // --- BACKUP SAVE MODAL ---
  openBackupModal() {
    this.openModal('modal-backup');
  }

  // --- QUESTS MODAL ---
  openQuestsModal() {
    this.renderQuests();
    this.openModal('modal-quests');
  }

  renderQuests() {
    const quests = this.game.quests;
    const container = document.getElementById('quests-container');
    if (!container) return;

    container.innerHTML = '';

    quests.quests.forEach(q => {
      const isCompleted = quests.completedQuestIds.includes(q.id);
      const isReady = q.isReady();
      const progress = q.checkProgress();

      const card = document.createElement('div');
      card.className = 'quest-card';

      let statusBadge = '';
      let btnHtml = '';

      if (isCompleted) {
        statusBadge = '<span style="color:#22c55e;font-size:12px;font-weight:800">TAMAMLANDI ✅</span>';
        btnHtml = `<button class="btn-action" disabled>Alındı</button>`;
      } else if (isReady) {
        statusBadge = '<span style="color:#facc15;font-size:12px;font-weight:800">ÖDÜL HAZIR! 🎁</span>';
        btnHtml = `<button class="btn-action btn-claim-quest" data-id="${q.id}">Ödülü Al!</button>`;
      } else {
        const pct = Math.min(100, Math.round((progress.current / progress.target) * 100));
        statusBadge = `
          <div style="width:90px;height:7px;background:#334155;border-radius:4px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:#38bdf8"></div>
          </div>
          <span style="font-size:11px;color:#94a3b8">${progress.current}/${progress.target}</span>
        `;
        btnHtml = `<button class="btn-action" disabled>Devam Ediyor</button>`;
      }

      const rewardParts = [];
      if (q.reward.coins) rewardParts.push(`🪙 ${q.reward.coins}`);
      if (q.reward.wood) rewardParts.push(`🪵 ${q.reward.wood}`);
      if (q.reward.stone) rewardParts.push(`🪨 ${q.reward.stone}`);
      if (q.reward.gems) rewardParts.push(`💎 ${q.reward.gems}`);

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon">📜</div>
          <div class="card-info" style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <h4>${q.title}</h4>
              <div style="display:flex;align-items:center;gap:6px">${statusBadge}</div>
            </div>
            <p>${q.desc}</p>
          </div>
        </div>
        <div class="card-bottom">
          <div class="cost-tag" style="color:#fde047">Ödül: ${rewardParts.join(' ')}</div>
          ${btnHtml}
        </div>
      `;

      card.querySelector('.btn-claim-quest')?.addEventListener('click', () => {
        if (quests.claimReward(q.id, this.game.soundManager)) {
          confetti({ particleCount: 50, spread: 60 });
          this.showToast(`🎁 "${q.title}" görevi ödülü alındı!`);
          this.updateHUD();
          this.renderQuests();
          this.game.saveManager.save();
        }
      });

      container.appendChild(card);
    });
  }

  // --- NPC DIALOG MODAL ---
  openDialog(npc, speakAloud = false) {
    const dialog = npc.getDialog();
    const modal = document.getElementById('modal-dialog');
    if (!modal) return;

    this.game.soundManager.playNpcTalk();

    if (npc.id === 'chief') {
      this.game.quests.stats.spokeWithRex = true;
    }

    const titleEl = document.getElementById('dialog-npc-title');
    const avatarEl = document.getElementById('dialog-npc-avatar');
    const greetingEl = document.getElementById('dialog-speech-text');
    const adviceEl = document.getElementById('dialog-advice-text');
    const actionBtn = document.getElementById('dialog-action-btn');
    const ttsBtn = document.getElementById('dialog-tts-btn');

    if (titleEl) titleEl.textContent = dialog.title;
    if (avatarEl) {
      if (npc.dinoType === 'chief') avatarEl.textContent = '🦖';
      else if (npc.dinoType === 'carpenter') avatarEl.textContent = '🔨';
      else if (npc.dinoType === 'tailor') avatarEl.textContent = '🪡';
      else avatarEl.textContent = '⛏️';
    }

    if (greetingEl) greetingEl.textContent = dialog.greeting;
    if (adviceEl) adviceEl.textContent = dialog.advice;

    const fullSpeechText = `${dialog.greeting} ${dialog.advice}`;

    if (ttsBtn) {
      ttsBtn.innerHTML = '🔊 Sesli Dinle [L]';
      ttsBtn.style.background = '#8b5cf6';

      ttsBtn.onclick = () => {
        if (ttsManager.isSpeaking) {
          ttsManager.stop();
        } else {
          ttsManager.speak(fullSpeechText, npc.dinoType);
        }
      };
    }

    ttsManager.onStatusChange = (isSpeaking) => {
      if (ttsBtn) {
        ttsBtn.innerHTML = isSpeaking ? '⏹️ Konuşmayı Durdur [L]' : '🔊 Sesli Dinle [L]';
        ttsBtn.style.background = isSpeaking ? '#ef4444' : '#8b5cf6';
      }
    };

    if (speakAloud) {
      setTimeout(() => {
        ttsManager.speak(fullSpeechText, npc.dinoType);
      }, 120);
    }

    if (actionBtn) {
      actionBtn.textContent = dialog.actionBtn;
      actionBtn.onclick = () => {
        this.closeAllModals();
        if (dialog.actionType === 'shop') this.openShopModal();
        else if (dialog.actionType === 'upgrades') this.openUpgradesModal();
        else if (dialog.actionType === 'house') this.openHouseModal();
        else if (dialog.actionType === 'quests') this.openQuestsModal();
      };
    }

    this.openModal('modal-dialog');
  }

  // --- HELP MODAL ---
  openHelpModal() {
    this.openModal('modal-help');
  }

  // --- PET MODAL ---
  openPetModal(defaultTab = 'active') {
    this.currentPetTab = defaultTab;
    this.renderPet();
    this.openModal('modal-pet');
  }

  renderPet() {
    const petSystem = this.game.petSystem;
    if (!petSystem) return;

    const tabsContainer = document.getElementById('pet-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = `
        <button class="tab-btn ${this.currentPetTab === 'active' ? 'active' : ''}" data-tab="active">🐾 Aktif Yoldaşım</button>
        <button class="tab-btn ${this.currentPetTab === 'incubator' ? 'active' : ''}" data-tab="incubator">🥚 Kuluçka & Yumurtalar (${petSystem.eggs.length})</button>
      `;

      tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.currentPetTab = btn.getAttribute('data-tab');
          this.renderPet();
        });
      });
    }

    const container = document.getElementById('pet-content-container');
    if (!container) return;

    container.innerHTML = '';

    if (this.currentPetTab === 'active') {
      const activePet = petSystem.activePet;
      if (!activePet) {
        container.innerHTML = `
          <div style="text-align:center;padding:30px;background:rgba(30,41,59,0.7);border-radius:14px">
            <div style="font-size:42px;margin-bottom:12px">🥚</div>
            <h4 style="font-size:16px;color:#facc15">Henüz Aktif Bir Dinozor Yoldaşın Yok!</h4>
            <p style="font-size:13px;color:#94a3b8;margin-top:6px">Kuluçka sekmesine gidip bir dinozor yumurtası çatlatabilirsin.</p>
            <button id="btn-goto-incubator" class="btn-action" style="margin-top:16px">Kuluçka Yuvasına Git 🥚</button>
          </div>
        `;
        document.getElementById('btn-goto-incubator')?.addEventListener('click', () => {
          this.currentPetTab = 'incubator';
          this.renderPet();
        });
        return;
      }

      const xpPct = Math.min(100, Math.round((activePet.xp / activePet.xpToNextLevel) * 100));
      const petAvatar = activePet.type === 'rex' ? '🦖' : (activePet.type === 'tricera' ? '🦕' : '🦅');

      const card = document.createElement('div');
      card.innerHTML = `
        <div style="background:rgba(30,41,59,0.8);border-radius:16px;padding:20px;border:1.5px solid #ec4899;display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;align-items:center;gap:18px">
            <div style="width:72px;height:72px;border-radius:20px;background:#1e293b;border:2px solid #ec4899;display:flex;justify-content:center;align-items:center;font-size:40px">
              ${petAvatar}
            </div>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <h3 style="font-size:18px;color:#f8fafc">${activePet.name}</h3>
                <span style="font-size:13px;font-weight:800;color:#f472b6;background:rgba(244,114,182,0.15);padding:3px 10px;border-radius:99px">Seviye ${activePet.level}</span>
              </div>
              <p style="font-size:12px;color:#94a3b8;margin-top:4px">Sadık yavru dinozor dostun peşinden ayrılmaz.</p>
              
              <!-- XP Bar -->
              <div style="margin-top:10px">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#cbd5e1;margin-bottom:4px">
                  <span>Deneyim (XP)</span>
                  <span>${activePet.xp} / ${activePet.xpToNextLevel} XP</span>
                </div>
                <div style="width:100%;height:8px;background:#334155;border-radius:99px;overflow:hidden">
                  <div style="width:${xpPct}%;height:100%;background:linear-gradient(90deg, #ec4899, #f472b6)"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pet Stats & Perks -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:rgba(15,23,42,0.6);padding:12px;border-radius:12px">
            <div>
              <span style="font-size:11px;color:#94a3b8">Yardımcı Vuruş Gücü:</span>
              <p style="font-size:14px;font-weight:700;color:#facc15">⚔️ +${activePet.getMiningPower()} Hasar</p>
            </div>
            <div>
              <span style="font-size:11px;color:#94a3b8">Koşu / Toplama Hızı:</span>
              <p style="font-size:14px;font-weight:700;color:#38bdf8">⚡ ${activePet.speed} Hız</p>
            </div>
          </div>

          <!-- Passive Abilities -->
          <div style="background:rgba(15,23,42,0.4);border-radius:12px;padding:12px;font-size:12px;line-height:1.5;color:#e2e8f0;display:flex;flex-direction:column;gap:6px">
            <div>🧲 <strong>Otomatik Toplayıcı:</strong> Yerdeki altın, odun ve taşları senin yerine koşup toplar!</div>
            <div>⛏️ <strong>Madenci Desteği:</strong> Sen kazarken yanına gelip hedefe ekstra hasar vurur!</div>
          </div>
        </div>
      `;
      container.appendChild(card);

      // If multiple owned pets, allow switching
      if (petSystem.ownedPets.length > 1) {
        const switchList = document.createElement('div');
        switchList.style.marginTop = '14px';
        switchList.innerHTML = `<h4 style="font-size:14px;color:#facc15;margin-bottom:10px">Diğer Dinozor Yoldaşların:</h4>`;
        const listGrid = document.createElement('div');
        listGrid.className = 'item-grid';

        petSystem.ownedPets.forEach(p => {
          if (p === activePet) return;
          const otherCard = document.createElement('div');
          otherCard.className = 'shop-card';
          otherCard.innerHTML = `
            <div class="card-top">
              <div class="card-icon">${p.type === 'rex' ? '🦖' : (p.type === 'tricera' ? '🦕' : '🦅')}</div>
              <div class="card-info">
                <h4>${p.name}</h4>
                <p>Seviye ${p.level} • ${p.speed} Hız</p>
              </div>
            </div>
            <div class="card-bottom">
              <span></span>
              <button class="btn-action">Yanına Al 🐾</button>
            </div>
          `;
          otherCard.querySelector('button').addEventListener('click', () => {
            petSystem.setActivePet(p);
            this.showToast(`🐾 "${p.name}" yanına çağrıldı!`);
            this.renderPet();
            this.game.saveManager.save();
          });
          listGrid.appendChild(otherCard);
        });
        switchList.appendChild(listGrid);
        container.appendChild(switchList);
      }
    } else {
      // INCUBATOR TAB
      if (petSystem.eggs.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:30px;background:rgba(30,41,59,0.7);border-radius:14px">
            <div style="font-size:42px;margin-bottom:12px">🪹</div>
            <h4 style="font-size:16px;color:#facc15">Kuluçka Yuvası Şu An Boş!</h4>
            <p style="font-size:13px;color:#94a3b8;margin-top:6px;line-height:1.5">
              Doğadaki ulu ağaçları, altın/elmas kayalarını, fosil çukurlarını veya gece göktaşlarını kazarak yeni dinozor yumurtaları bulabilirsin!
            </p>
          </div>
        `;
        return;
      }

      const eggGrid = document.createElement('div');
      eggGrid.className = 'item-grid';

      petSystem.eggs.forEach((egg, idx) => {
        const eggCard = document.createElement('div');
        eggCard.className = 'shop-card';
        eggCard.style.borderColor = egg.color || '#facc15';

        eggCard.innerHTML = `
          <div class="card-top">
            <div class="card-icon" style="font-size:32px">🥚</div>
            <div class="card-info">
              <h4 style="color:${egg.color || '#fff'}">${egg.name}</h4>
              <p>${egg.desc}</p>
            </div>
          </div>
          <div class="card-bottom">
            <span style="font-size:12px;color:#4ade80;font-weight:700">Kuluçkaya Hazır ✨</span>
            <button class="btn-action" style="background:#ec4899">Çatlat 🐣</button>
          </div>
        `;

        eggCard.querySelector('button').addEventListener('click', () => {
          const newPet = petSystem.hatchEgg(idx);
          if (newPet) {
            this.currentPetTab = 'active';
            this.renderPet();
          }
        });

        eggGrid.appendChild(eggCard);
      });

      container.appendChild(eggGrid);
    }
  }
}
