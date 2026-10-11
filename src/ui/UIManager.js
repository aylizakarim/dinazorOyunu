import confetti from 'canvas-confetti';
import { HousePlot } from '../entities/HousePlot.js';
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
    document.getElementById('btn-sound')?.addEventListener('click', () => this.toggleSound());
    document.getElementById('btn-help')?.addEventListener('click', () => this.openHelpModal());

    // Radar pointer click to walk to village
    document.getElementById('village-pointer')?.addEventListener('click', () => {
      this.game.player.x = 1100;
      this.game.player.y = 880;
      this.showToast('📍 Köy Meydanına Işınlandın!');
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
}
