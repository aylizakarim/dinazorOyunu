export class NPC {
  constructor(x, y, id, name, title, dinoType = 'rex') {
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.title = title;
    this.dinoType = dinoType; // 'chief', 'carpenter', 'tailor', 'miner'
    this.radius = 24;
    this.bobTimer = Math.random() * 5;
    this.facing = 1;
    this.interactionRadius = 55;
  }

  update(dt, player) {
    this.bobTimer += dt * 3;

    // Face towards player when nearby
    const dx = player.x - this.x;
    if (Math.abs(dx) > 10) {
      this.facing = dx > 0 ? 1 : -1;
    }
  }

  isNear(player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist <= this.interactionRadius;
  }

  getDialog() {
    switch (this.id) {
      case 'chief':
        return {
          title: `${this.name} (${this.title})`,
          greeting: 'Hoş geldin genç dinozor! Vadimize hoş geldin. Yeri, ağaçları ve taşları kazarak altın ve maden toplayabilirsin.',
          advice: 'Köyümüzde bir yer edinmek için öncelikle kendine bir ev inşa etmelisin! Tricera Usta ile konuşursan sana kulübeni yapman için rehberlik eder.',
          actionBtn: 'Görevleri Gör',
          actionType: 'quests',
        };
      case 'carpenter':
        return {
          title: `${this.name} (${this.title})`,
          greeting: 'Selam küçük dostum! Ben bu köyün marangozu ve mimarıyım. Elinde yeterince odun ve taş varsa harika evler inşa edebilirim!',
          advice: 'Aşağıdaki arsayı görüyor musun? Orası senin için ayrıldı. Odun ve taş toplayıp çadırını, ardından ahşap kulübeni ve dev dinozor sarayını kurabilirsin!',
          actionBtn: 'Ev İnşaatını Aç',
          actionType: 'house',
        };
      case 'tailor':
        return {
          title: `${this.name} (${this.title})`,
          greeting: 'Aman Tanrım, ne kadar tatlı bir dinozor! Ama biraz sade kalmışsın tatlım. Modaya ayak uydurmalısın!',
          advice: 'Kazılardan kazandığın altınlarla sana süper şapkalar, pelerinler, smokinler ve renkli görünümler verebilirim. Bir göz atmaya ne dersin?',
          actionBtn: 'Kostüm Mağazası',
          actionType: 'shop',
        };
      case 'miner':
        return {
          title: `${this.name} (${this.title})`,
          greeting: 'Kazma seslerini duydun mu? İşte gerçek bir madencinin müziği! Yerin altında ne hazineler yatıyor bir bilsen.',
          advice: 'Kazma gücünü ve hızını artırırsan en sert altın kayalarını bile saniyeler içinde un ufak edebilirsin. Kazandığın paralarla kendini geliştirmeyi unutma!',
          actionBtn: 'Geliştirmeleri Aç',
          actionType: 'upgrades',
        };
      case 'curator':
        return {
          title: `${this.name} (${this.title})`,
          greeting: 'Harika bir keşif günü değil mi genç araştırmacı! Ben Profesör Pachy, vadinin baş paleontolog ve arkeoloji müzesi müdürüyüm.',
          advice: 'Kazılarda bulduğun antik dinozor kemiklerini müzemize bağışlayarak dev iskeletleri tamamlayabilirsin! Müze doldukça vadimize turist dinozorlar akın eder ve bağış sandığına altın bırakırlar!',
          actionBtn: 'Müzeyi Aç 🏛️',
          actionType: 'museum',
        };
      case 'chef':
        return {
          title: `${this.name} (${this.title})`,
          greeting: 'Aha! Burnuma mis gibi prehistorik lezzet kokuları geliyor! Ben Şef Bronto, vadinin gurme aşçısı ve iksir ustasıyım.',
          advice: 'Ağaçlardan ve kazılardan bulduğun tohumları bostana ek! Topladığın çilek, magma kavunu ve yıldız meyveleriyle sana muazzam koşu hızı, 2 kat kazma gücü ve şans veren nefis çorbalar ve iksirler pişirebilirim!',
          actionBtn: 'Mutfağı Aç 👨‍🍳',
          actionType: 'kitchen',
        };
      default:
        return {
          title: this.name,
          greeting: 'Merhaba dino dostum!',
          advice: 'Bugün kazı yapmak için harika bir gün!',
          actionBtn: 'Tamam',
          actionType: 'none',
        };
    }
  }

  draw(ctx, player) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const bob = Math.sin(this.bobTimer) * 2;
    ctx.translate(0, bob);

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 8 - bob, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.scale(this.facing, 1);

    // Draw specific Dino Villager
    if (this.dinoType === 'chief') {
      this.drawChief(ctx);
    } else if (this.dinoType === 'carpenter') {
      this.drawCarpenter(ctx);
    } else if (this.dinoType === 'tailor') {
      this.drawTailor(ctx);
    } else if (this.dinoType === 'miner') {
      this.drawMiner(ctx);
    } else if (this.dinoType === 'curator') {
      this.drawCurator(ctx);
    } else if (this.dinoType === 'chef') {
      this.drawChef(ctx);
    }

    ctx.restore();

    // Interaction Prompt if player is near
    if (this.isNear(player)) {
      this.drawPrompt(ctx);
    }
  }

  drawPrompt(ctx) {
    ctx.save();
    const promptY = this.y - 48 + Math.sin(this.bobTimer * 2) * 3;

    // Speech bubble background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(this.x - 74, promptY - 14, 148, 26, 8);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Little triangle pointer
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.moveTo(this.x - 5, promptY + 12);
    ctx.lineTo(this.x + 5, promptY + 12);
    ctx.lineTo(this.x, promptY + 18);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💬 [E] Oku  |  🔊 [L] Sesli Dinle', this.x, promptY);

    ctx.restore();
  }

  drawChief(ctx) {
    // Wise Orange/Brown Rex with Chief Golden Medal & Glasses
    ctx.fillStyle = '#b45309';
    // Body
    ctx.beginPath();
    ctx.ellipse(0, -6, 15, 17, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Underbelly
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(5, -4, 8, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-6, -32, 20, 18, 6);
    ctx.fill();

    // White beard / wisdom whiskers
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(8, -16, 5, 0, Math.PI);
    ctx.fill();

    // Eye with spectacles
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(4, -25, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(4, -25, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Chief Gold Necklace
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(4, -13, 8, 0.2, Math.PI * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(4, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCarpenter(ctx) {
    // Blue Triceratops with big frill and wooden hammer
    ctx.fillStyle = '#0284c7';
    // Body
    ctx.beginPath();
    ctx.ellipse(0, -5, 16, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Underbelly
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.ellipse(4, -3, 8, 11, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Triceratops Frill (Large crown shield)
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(-2, -26, 14, -Math.PI * 0.7, Math.PI * 0.2);
    ctx.lineTo(2, -26);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-2, -30, 18, 16, 6);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#f8fafc';
    // Brow horn
    ctx.beginPath();
    ctx.moveTo(8, -30);
    ctx.lineTo(16, -36);
    ctx.lineTo(11, -26);
    ctx.closePath();
    ctx.fill();
    // Nose horn
    ctx.beginPath();
    ctx.moveTo(14, -22);
    ctx.lineTo(21, -24);
    ctx.lineTo(15, -17);
    ctx.closePath();
    ctx.fill();

    // Red Carpenter Bandana
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-2, -18, 14, 4);

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(6, -24, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTailor(ctx) {
    // Magenta Pterodactyl with chic feather crest and tape measure
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.ellipse(0, -6, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head with crest
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.moveTo(-16, -34);
    ctx.lineTo(4, -24);
    ctx.lineTo(14, -20);
    ctx.lineTo(4, -16);
    ctx.closePath();
    ctx.fill();

    // Long Beak
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(10, -22);
    ctx.lineTo(24, -18);
    ctx.lineTo(10, -15);
    ctx.closePath();
    ctx.fill();

    // Eye with chic mascara
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(6, -21, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Yellow tape measure around neck
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(2, -12, 7, 0.1, Math.PI * 0.9);
    ctx.stroke();
  }

  drawMiner(ctx) {
    // Green/Amber Stegosaurus with back plates & Miner Helmet
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(0, -6, 17, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stegosaurus Back Plates
    ctx.fillStyle = '#d97706';
    const plates = [-12, -4, 4, 12];
    plates.forEach(px => {
      ctx.beginPath();
      ctx.moveTo(px - 4, -18);
      ctx.lineTo(px, -27);
      ctx.lineTo(px + 4, -18);
      ctx.closePath();
      ctx.fill();
    });

    // Head
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(4, -26, 14, 14, 5);
    ctx.fill();

    // Yellow Miner Helmet with shining light
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(10, -28, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(1, -28, 18, 3);

    // Helmet Lamp
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(16, -28, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(11, -21, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCurator(ctx) {
    // Profesör Pachy (Paleontologist Pachycephalosaurus)
    // Legs
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-10, 6, 8, 12);
    ctx.fillRect(4, 6, 8, 12);

    // Thick Sturdy Body
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(0, -6, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pale Cream Belly
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.ellipse(4, -2, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-26, 4);
    ctx.lineTo(-14, 10);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(10, -22, 11, 0, Math.PI * 2);
    ctx.fill();

    // Archeologist Pith Helmet Hat
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(10, -25, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-2, -25, 24, 3.5);

    // Round Spectacles / Glasses
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(14, -21, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    // Eye inside glass
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(14, -21, 2, 0, Math.PI * 2);
    ctx.fill();

    // Magnifying Glass in hand
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.lineTo(18, 2);
    ctx.stroke();
    ctx.strokeStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(22, 4, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
    ctx.fill();
  }

  drawChef(ctx) {
    // Şef Bronto (Friendly Long-Necked Chef Dinosaur with Toque Hat & Apron)
    // 1. Legs
    ctx.fillStyle = '#059669';
    ctx.fillRect(-10, 2, 7, 10);
    ctx.fillRect(4, 2, 7, 10);

    // 2. Round Plump Body
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(0, -5, 17, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Chef White Apron
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 17, 4);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red neckerchief
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.lineTo(5, -12);
    ctx.lineTo(0, -7);
    ctx.closePath();
    ctx.fill();

    // 4. Long Elegant Bronto Neck
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(4, -14);
    ctx.quadraticCurveTo(12, -26, 8, -34);
    ctx.lineTo(16, -34);
    ctx.quadraticCurveTo(18, -24, 12, -14);
    ctx.closePath();
    ctx.fill();

    // 5. Friendly Head
    ctx.beginPath();
    ctx.ellipse(12, -35, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(15, -36, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cute Smile
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(16, -33, 3, 0, Math.PI * 0.7);
    ctx.stroke();

    // 6. Tall Puffy Chef's Hat (Toque Blanche)
    ctx.fillStyle = '#ffffff';
    // Hat base band
    ctx.fillRect(5, -42, 14, 4);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(5, -42, 14, 4);

    // Hat puffs
    ctx.beginPath();
    ctx.arc(7, -46, 5, 0, Math.PI * 2);
    ctx.arc(12, -49, 6, 0, Math.PI * 2);
    ctx.arc(17, -46, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 7. Stirring Wooden Ladle in hand
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(20, 4);
    ctx.stroke();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(22, 5, 4, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
