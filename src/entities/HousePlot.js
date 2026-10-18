export class HousePlot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 140;
    this.height = 110;
    this.tier = 0; // 0 = empty plot, 1 = tent, 2 = cottage, 3 = manor, 4 = palace
    this.passiveTimer = 0;
    this.smokeTimer = 0;
  }

  static getTIER_INFO() {
    return [
      {
        tier: 0,
        name: 'Boş Arsa',
        desc: 'Köyde sana ayrılmış arsa. Hemen ilk çadırını kurup yerleş!',
        cost: { coins: 0, wood: 0, stone: 0, gems: 0 },
        bonus: 'Henüz ev yok.',
        passiveCoinPerSec: 0,
      },
      {
        tier: 1,
        name: 'Sevimli Kamp Çadırı & Ateş',
        desc: 'Sıcak bir kamp ateşi ve rahat bir dino çadırı.',
        cost: { coins: 60, wood: 25, stone: 15, gems: 0 },
        bonus: '+%10 Koşu Hızı & Pasif +1 Altın/sn',
        passiveCoinPerSec: 1,
      },
      {
        tier: 2,
        name: 'Ahşap Dino Kulübesi',
        desc: 'Tütsü tüten bacası ve çiçekli bahçesiyle sağlam bir ahşap yuva.',
        cost: { coins: 300, wood: 80, stone: 50, gems: 2 },
        bonus: '+%20 Kazma Gücü & Pasif +3 Altın/sn',
        passiveCoinPerSec: 3,
      },
      {
        tier: 3,
        name: 'Taş Dino Malikânesi',
        desc: 'Görkemli taş duvarlar, dino heykelleri ve kristal aydınlatmalar.',
        cost: { coins: 900, wood: 200, stone: 140, gems: 10 },
        bonus: '+%35 Kazma Gücü, +2 Şans & Pasif +8 Altın/sn',
        passiveCoinPerSec: 8,
      },
      {
        tier: 4,
        name: 'Efsanevi Dino Sarayı',
        desc: 'Tüm Dino Vadisi\'nin en muhteşem krallık sarayı! Tüm köy seni selamlar.',
        cost: { coins: 2500, wood: 450, stone: 350, gems: 30 },
        bonus: '2x Kazma Gücü & Pasif +20 Altın/sn & Dino Kralı Tacı',
        passiveCoinPerSec: 20,
      },
    ];
  }

  isNear(player) {
    const dist = Math.hypot(player.x - (this.x + this.width / 2), player.y - (this.y + this.height / 2));
    return dist < 85;
  }

  update(dt, economy, floatingTexts) {
    this.smokeTimer += dt * 3;

    // Passive gold generation from house
    const info = HousePlot.getTIER_INFO()[this.tier];
    if (info && info.passiveCoinPerSec > 0) {
      this.passiveTimer += dt;
      if (this.passiveTimer >= 1.0) {
        this.passiveTimer = 0;
        economy.coins += info.passiveCoinPerSec;
        // Floating coin effect occasionally
        if (Math.random() < 0.25) {
          floatingTexts.push({
            x: this.x + this.width / 2 + (Math.random() - 0.5) * 40,
            y: this.y + 10,
            text: `+${info.passiveCoinPerSec} Kira Geliri 🪙`,
            color: '#facc15',
            size: 13,
            life: 1.0,
            maxLife: 1.0,
            scale: 1,
            update(d) {
              this.y -= 25 * d;
              this.life -= d;
              return this.life > 0;
            },
            draw(ctx) {
              ctx.save();
              ctx.globalAlpha = Math.min(1, this.life / 0.4);
              ctx.font = 'bold 12px sans-serif';
              ctx.fillStyle = this.color;
              ctx.textAlign = 'center';
              ctx.fillText(this.text, this.x, this.y);
              ctx.restore();
            },
          });
        }
      }
    }
  }

  canUpgrade(economy) {
    if (this.tier >= 4) return false;
    const nextInfo = HousePlot.getTIER_INFO()[this.tier + 1];
    return (
      economy.coins >= nextInfo.cost.coins &&
      economy.wood >= nextInfo.cost.wood &&
      economy.stone >= nextInfo.cost.stone &&
      economy.gems >= nextInfo.cost.gems
    );
  }

  upgrade(economy, soundManager) {
    if (!this.canUpgrade(economy)) return false;
    const nextInfo = HousePlot.getTIER_INFO()[this.tier + 1];
    economy.coins -= nextInfo.cost.coins;
    economy.wood -= nextInfo.cost.wood;
    economy.stone -= nextInfo.cost.stone;
    economy.gems -= nextInfo.cost.gems;

    this.tier++;
    soundManager.playUpgrade();
    return true;
  }

  draw(ctx, player) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Plot perimeter fence & grass foundation
    ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 8);
    ctx.fill();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);
    ctx.setLineDash([]);

    // Draw house based on tier
    switch (this.tier) {
      case 0:
        this.drawTier0(ctx);
        break;
      case 1:
        this.drawTier1(ctx);
        break;
      case 2:
        this.drawTier2(ctx);
        break;
      case 3:
        this.drawTier3(ctx);
        break;
      case 4:
        this.drawTier4(ctx);
        break;
    }

    ctx.restore();

    // Interaction prompt
    if (this.isNear(player)) {
      this.drawPrompt(ctx);
    }
  }

  drawPrompt(ctx) {
    ctx.save();
    const promptX = this.x + this.width / 2;
    const promptY = this.y - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(promptX - 65, promptY - 14, 130, 26, 8);
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = this.tier >= 1 ? '🏡 [E] Evin İçine Gir' : '🔨 [E] Çadır İnşa Et';
    ctx.fillText(label, promptX, promptY - 1);

    ctx.restore();
  }

  drawTier0(ctx) {
    // Wooden sign
    ctx.fillStyle = '#78350f';
    ctx.fillRect(this.width / 2 - 4, 30, 8, 40);

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 45, 20, 90, 32, 6);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DİNOZOR ARSASI', this.width / 2, 34);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('İnşaat İçin [E] Bas', this.width / 2, 46);
  }

  drawTier1(ctx) {
    // Camp tent + fire
    const cx = this.width / 2;

    // Tent
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(cx - 38, 75);
    ctx.lineTo(cx - 5, 20);
    ctx.lineTo(cx + 28, 75);
    ctx.closePath();
    ctx.fill();

    // Tent flap opening
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(cx - 5, 20);
    ctx.lineTo(cx - 10, 75);
    ctx.lineTo(cx + 5, 75);
    ctx.closePath();
    ctx.fill();

    // Campfire
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 50, 68, 16, 4);
    ctx.fillRect(cx - 44, 64, 4, 12);

    // Flames
    const flameH = 12 + Math.sin(this.smokeTimer * 2) * 4;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(cx - 42, 64, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx - 42, 64 - flameH * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sleeping dino bed mat
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.roundRect(cx + 36, 55, 24, 16, 4);
    ctx.fill();
  }

  drawTier2(ctx) {
    // Cute Wooden Cottage
    const cx = this.width / 2;

    // Chimney
    ctx.fillStyle = '#78716c';
    ctx.fillRect(cx + 25, 12, 10, 24);
    // Smoke
    const smokeY = 10 - (this.smokeTimer % 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(cx + 30, smokeY, 4, 0, Math.PI * 2);
    ctx.arc(cx + 33, smokeY - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cottage Walls
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(cx - 42, 34, 84, 52, 6);
    ctx.fill();

    // Wood panel lines
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 42, 48);
    ctx.lineTo(cx + 42, 48);
    ctx.moveTo(cx - 42, 62);
    ctx.lineTo(cx + 42, 62);
    ctx.moveTo(cx - 42, 74);
    ctx.lineTo(cx + 42, 74);
    ctx.stroke();

    // Red Gable Roof
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(cx - 52, 36);
    ctx.lineTo(cx, 8);
    ctx.lineTo(cx + 52, 36);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(cx - 10, 54, 20, 32, [4, 4, 0, 0]);
    ctx.fill();
    // Doorknob
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx + 5, 70, 2, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Windows
    ctx.fillStyle = '#fde047';
    ctx.fillRect(cx - 34, 48, 14, 14);
    ctx.fillRect(cx + 20, 48, 14, 14);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 34, 48, 14, 14);
    ctx.strokeRect(cx + 20, 48, 14, 14);
  }

  drawTier3(ctx) {
    // Stone Dino Manor
    const cx = this.width / 2;

    // Stone base structure
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(cx - 50, 30, 100, 60, 6);
    ctx.fill();

    // Castle battlement roof
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(cx - 58, 30);
    ctx.lineTo(cx, 6);
    ctx.lineTo(cx + 58, 30);
    ctx.closePath();
    ctx.fill();

    // Towers on sides
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 56, 20, 14, 70);
    ctx.fillRect(cx + 42, 20, 14, 70);

    // Tower flags
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(cx - 49, 10);
    ctx.lineTo(cx - 38, 15);
    ctx.lineTo(cx - 49, 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 49, 10);
    ctx.lineTo(cx + 60, 15);
    ctx.lineTo(cx + 49, 20);
    ctx.closePath();
    ctx.fill();

    // Grand Arched Doorway
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, 58, 12, Math.PI, 0);
    ctx.rect(cx - 12, 58, 24, 32);
    ctx.fill();

    // Golden Dino Emblem above door
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, 40, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTier4(ctx) {
    // Mythic Dino Palace
    const cx = this.width / 2;

    // Golden Marble Walls
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(cx - 56, 26, 112, 68, 8);
    ctx.fill();

    // Gold Trim & Pillars
    ctx.fillStyle = '#eab308';
    ctx.fillRect(cx - 52, 26, 8, 68);
    ctx.fillRect(cx + 44, 26, 8, 68);
    ctx.fillRect(cx - 20, 26, 6, 68);
    ctx.fillRect(cx + 14, 26, 6, 68);

    // Grand Golden Crystal Dome
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(cx, 26, 32, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(cx, 26, 24, Math.PI, 0);
    ctx.fill();

    // Spire with Glowing Gem
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 2);
    ctx.lineTo(cx, -12);
    ctx.stroke();

    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(cx, -14, 6, 0, Math.PI * 2);
    ctx.fill();

    // Royal Red Carpet Doorway
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 10, 56, 20, 38);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, 56, 10, Math.PI, 0);
    ctx.fill();
  }
}
