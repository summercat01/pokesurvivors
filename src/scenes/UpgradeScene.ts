import Phaser from 'phaser';
import {
  UPGRADES,
  getUpgradeLevel, setUpgradeLevel,
  getTotalGold, setTotalGold,
} from '../data/upgrades';
import { getCurrentUser } from '../lib/auth';
import { pushLocalToCloud } from '../lib/userDB';

export class UpgradeScene extends Phaser.Scene {
  private selectedIdx = 0;
  private selectionGfx: Phaser.GameObjects.Graphics[] = [];
  private cardMeta: { cx: number; cy: number; w: number; h: number; color: number }[] = [];

  private infoIconBg!: Phaser.GameObjects.Rectangle;
  private infoIcon!:   Phaser.GameObjects.Text;
  private infoName!:   Phaser.GameObjects.Text;
  private infoLevel!:  Phaser.GameObjects.Text;
  private infoDesc!:   Phaser.GameObjects.Text;
  private infoBonus!:  Phaser.GameObjects.Text;
  private infoDots:    Phaser.GameObjects.Arc[] = [];
  private buyBtn!:     Phaser.GameObjects.Rectangle;
  private buyTxt!:     Phaser.GameObjects.Text;
  private buySub!:     Phaser.GameObjects.Text;
  private goldTxt!:    Phaser.GameObjects.Text;

  constructor() { super({ key: 'UpgradeScene' }); }

  create(data?: { selectedIdx?: number }) {
    this.selectedIdx  = 0;
    this.selectionGfx = [];
    this.cardMeta     = [];
    this.infoDots     = [];

    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0x0d1a2e).setOrigin(0, 0);
    const bg = this.add.graphics();
    bg.lineStyle(1, 0x1a3050, 0.3);
    for (let x = 0; x < W; x += 40) bg.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) bg.lineBetween(0, y, W, y);

    // ── 헤더 ──
    this.add.text(CX, 22, '영구 업그레이드', {
      fontSize: '20px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 4, padding: { top: 4 },
    }).setOrigin(0.5);

    this.goldTxt = this.add.text(CX, 50, `💰 ${getTotalGold().toLocaleString()} G`, {
      fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.graphics().lineStyle(1, 0x2a4a70, 1).lineBetween(10, 66, W - 10, 66);

    // ── 레이아웃 상수 ──
    const GRID_TOP  = 72;
    const PANEL_Y   = Math.round(H * 0.585);
    const COLS      = 2;
    const GAP       = 6;
    const CARD_W    = Math.floor((W - 16 - GAP) / COLS);
    const CARD_H    = 82;
    const GRID_L    = 8;
    const ROWS      = Math.ceil(UPGRADES.length / COLS);
    const totalH    = ROWS * (CARD_H + GAP) - GAP;

    // ── 스크롤 마스크 ──
    const viewH    = PANEL_Y - GRID_TOP - 4;
    const maxScroll = Math.max(0, totalH - viewH);
    const maskGfx  = this.add.graphics();
    maskGfx.fillRect(0, GRID_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGfx);

    const container = this.add.container(0, GRID_TOP);
    container.setMask(mask);

    // ── 카드 그리드 ──
    UPGRADES.forEach((upg, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx  = GRID_L + col * (CARD_W + GAP) + CARD_W / 2;
      const cy  = row * (CARD_H + GAP) + CARD_H / 2;
      const lv     = getUpgradeLevel(upg.id);
      const maxLv  = upg.maxLevel ?? 5;
      const maxed  = lv >= maxLv;

      this.cardMeta.push({ cx, cy, w: CARD_W, h: CARD_H, color: upg.color });

      // 그림자
      const shadow = this.add.rectangle(cx + 2, cy + 3, CARD_W, CARD_H, 0x000000, 0.35);
      // 카드 배경
      const cardBg = this.add.rectangle(cx, cy, CARD_W, CARD_H, maxed ? 0x141420 : 0x111827);
      // 좌측 색상 스트라이프
      const stripe = this.add.rectangle(cx - CARD_W / 2 + 4, cy, 6, CARD_H, upg.color, maxed ? 0.3 : 0.85);

      // 아이콘 (작은 사각형)
      const ICX = cx - CARD_W / 2 + 24;
      const ICY = cy;
      const iconBg = this.add.rectangle(ICX, ICY, 32, 32, upg.color, maxed ? 0.12 : 0.2);
      const iconTxt = this.add.text(ICX, ICY, upg.icon, {
        fontSize: '16px', color: maxed ? '#555544' : '#ffffff',
      }).setOrigin(0.5);

      // 이름
      const TX = cx - CARD_W / 2 + 48;
      const nameTxt = this.add.text(TX, cy - 22, upg.name, {
        fontSize: '12px', color: maxed ? '#555544' : '#ddeeff', fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 레벨
      const lvTxt = this.add.text(cx + CARD_W / 2 - 6, cy - 22, maxed ? 'MAX' : `${lv}/${maxLv}`, {
        fontSize: '10px', color: maxed ? '#c4a020' : '#5588aa',
      }).setOrigin(1, 0.5);

      // 레벨 닷
      const dots: Phaser.GameObjects.Arc[] = [];
      for (let i = 0; i < maxLv; i++) {
        dots.push(this.add.circle(TX + i * 10, cy, 3.5, i < lv ? upg.color : 0x253545));
      }

      // 효과 미리보기
      const preview = maxed ? upg.labels[maxLv - 1] : `→ ${upg.labels[lv] ?? upg.labels[maxLv - 1]}`;
      const previewTxt = this.add.text(TX, cy + 20, preview, {
        fontSize: '10px', color: maxed ? '#444433' : '#4488bb',
      }).setOrigin(0, 0.5);

      // 선택 오버레이 Graphics
      const gfx = this.add.graphics();
      this.selectionGfx.push(gfx);

      // 히트 영역
      const hit = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.selectCard(idx));
      hit.on('pointerover', () => {
        if (this.selectedIdx !== idx) {
          gfx.clear();
          gfx.lineStyle(1, upg.color, 0.4);
          gfx.strokeRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H);
        }
      });
      hit.on('pointerout', () => {
        if (this.selectedIdx !== idx) gfx.clear();
      });

      container.add([shadow, cardBg, stripe, iconBg, iconTxt, nameTxt, lvTxt, ...dots, previewTxt, gfx, hit]);
    });

    // ── 스크롤 입력 ──
    let lastY = 0, isDragging = false, scrollY = 0, hasDragged = false;
    const DRAG_THRESHOLD = 6;

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const worldY = ptr.y;
      if (worldY < GRID_TOP || worldY > PANEL_Y) return;
      lastY = worldY; isDragging = true; hasDragged = false;
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const dy = ptr.y - lastY; lastY = ptr.y;
      if (Math.abs(dy) > DRAG_THRESHOLD || hasDragged) {
        hasDragged = true;
        scrollY = Phaser.Math.Clamp(scrollY - dy, 0, maxScroll);
        container.y = GRID_TOP - scrollY;
      }
    });
    this.input.on('pointerup',  () => { isDragging = false; });
    this.input.on('pointerout', () => { isDragging = false; });
    this.events.once('shutdown', () => this.input.removeAllListeners());

    // ── 패널 구분선 ──
    this.add.graphics().lineStyle(1, 0x2a4a70, 0.8).lineBetween(10, PANEL_Y, W - 10, PANEL_Y);

    // ── 정보 패널 ──
    this.createInfoPanel(W, H, CX, PANEL_Y);

    // ── 뒤로 버튼 ──
    this.createBackButton(W, H, CX);

    this.selectCard(data?.selectedIdx ?? 0);
    this.cameras.main.fadeIn(220, 0, 0, 0);
  }

  // ────────────────────────────────────────────────────
  private createInfoPanel(W: number, H: number, CX: number, PANEL_Y: number) {
    const P     = PANEL_Y + 6;
    const ICX   = 36;
    const ICY   = P + 36;
    const TX    = 70;
    const BUY_CY = H - 96;

    this.add.rectangle(CX, (PANEL_Y + H - 50) / 2, W - 16, H - 50 - PANEL_Y, 0x0d1525);

    this.infoIconBg = this.add.rectangle(ICX, ICY, 48, 48, 0x888888);
    this.infoIcon   = this.add.text(ICX, ICY, '', { fontSize: '22px' }).setOrigin(0.5);

    this.infoName  = this.add.text(TX, P + 8, '', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0, 0);
    this.infoLevel = this.add.text(TX, P + 28, '', {
      fontSize: '11px', color: '#6688aa',
    }).setOrigin(0, 0);
    this.infoDesc  = this.add.text(TX, P + 46, '', {
      fontSize: '11px', color: '#7799bb',
      wordWrap: { width: W - TX - 14 },
    }).setOrigin(0, 0);
    this.infoBonus = this.add.text(TX, P + 64, '', {
      fontSize: '12px', color: '#44aaff', fontStyle: 'bold',
    }).setOrigin(0, 0);

    for (let i = 0; i < 5; i++) {
      this.infoDots.push(this.add.circle(TX + i * 14, P + 88, 5, 0x253545));
    }

    this.buyBtn = this.add.rectangle(CX, BUY_CY, W - 40, 48, 0x1a4422)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x44aa66);
    this.buyTxt = this.add.text(CX, BUY_CY - 7, '', {
      fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.buySub = this.add.text(CX, BUY_CY + 11, '', {
      fontSize: '10px', color: '#88ccaa',
    }).setOrigin(0.5);

    this.buyBtn.on('pointerover', () => {
      const upg = UPGRADES[this.selectedIdx];
      const lv  = getUpgradeLevel(upg.id);
      if (lv < (upg.maxLevel ?? 5) && getTotalGold() >= upg.costs[lv]) this.buyBtn.setFillStyle(0x236630);
    });
    this.buyBtn.on('pointerout',  () => this.updateInfoPanel());
    this.buyBtn.on('pointerdown', () => { this.buyBtn.setFillStyle(0x0f3318); this.purchaseSelected(); });
  }

  // ────────────────────────────────────────────────────
  private selectCard(idx: number) {
    this.selectedIdx = idx;
    this.selectionGfx.forEach((gfx, i) => {
      gfx.clear();
      if (i !== idx) return;
      const { cx, cy, w, h, color } = this.cardMeta[i];
      gfx.lineStyle(2, color, 1.0);
      gfx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      gfx.lineStyle(1, color, 0.22);
      gfx.strokeRect(cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h - 4);
    });
    this.updateInfoPanel();
  }

  // ────────────────────────────────────────────────────
  private updateInfoPanel() {
    const upg      = UPGRADES[this.selectedIdx];
    const lv       = getUpgradeLevel(upg.id);
    const maxLv    = upg.maxLevel ?? 5;
    const maxed    = lv >= maxLv;
    const gold     = getTotalGold();
    const nextCost = maxed ? 0 : upg.costs[lv];
    const can      = !maxed && gold >= nextCost;

    this.goldTxt.setText(`💰 ${gold.toLocaleString()} G`);
    this.infoIconBg.setFillStyle(maxed ? 0xb89010 : upg.color);
    this.infoIcon.setText(upg.icon);
    this.infoName.setText(upg.name);
    this.infoLevel.setText(maxed ? `Lv.${maxLv} / ${maxLv}  ✦ MAX` : `Lv.${lv} / ${maxLv}`);
    this.infoDesc.setText(upg.description);

    if (maxed) {
      this.infoBonus.setText(`✦ 최대치 달성  (${upg.labels[maxLv - 1]})`).setColor('#f0c040');
    } else if (lv > 0) {
      this.infoBonus.setText(`현재 ${upg.labels[lv - 1]}  →  다음 ${upg.labels[lv]}`).setColor('#44aaff');
    } else {
      this.infoBonus.setText(`강화 효과: ${upg.labels[0]}`).setColor('#44aaff');
    }

    this.infoDots.forEach((dot, i) =>
      dot.setFillStyle(i < lv ? upg.color : i < maxLv ? 0x253545 : 0x151d28));

    if (maxed) {
      this.buyBtn.setFillStyle(0x1a1a10).disableInteractive().setStrokeStyle(1, 0x3a3a20);
      this.buyTxt.setText('✦ MAX').setColor('#c4a020');
      this.buySub.setText('이미 최고 레벨입니다').setColor('#666644');
    } else if (can) {
      this.buyBtn.setFillStyle(0x1a4422).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x44aa66);
      this.buyTxt.setText(`구매  ${nextCost.toLocaleString()} G`).setColor('#ffffff');
      this.buySub.setText(`보유 ${gold.toLocaleString()} G`).setColor('#88ccaa');
    } else {
      this.buyBtn.setFillStyle(0x151e2a).disableInteractive().setStrokeStyle(1, 0x2a3a50);
      this.buyTxt.setText(`${nextCost.toLocaleString()} G 필요`).setColor('#556677');
      this.buySub.setText(`${(nextCost - gold).toLocaleString()} G 부족`).setColor('#445566');
    }
  }

  // ────────────────────────────────────────────────────
  private purchaseSelected() {
    const upg = UPGRADES[this.selectedIdx];
    const lv  = getUpgradeLevel(upg.id);
    if (lv >= (upg.maxLevel ?? 5)) return;
    const cost = upg.costs[lv];
    const gold = getTotalGold();
    if (gold < cost) return;

    setTotalGold(gold - cost);
    setUpgradeLevel(upg.id, lv + 1);

    const user = getCurrentUser();
    if (user) pushLocalToCloud(user.id).catch(() => {});

    this.cameras.main.flash(120, 80, 200, 255, false);
    this.time.delayedCall(160, () => this.scene.restart({ selectedIdx: this.selectedIdx }));
  }

  // ────────────────────────────────────────────────────
  private createBackButton(W: number, H: number, CX: number) {
    const BTN_Y = H - 28;
    const bg  = this.add.rectangle(CX, BTN_Y, W - 16, 40, 0x0d1525)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x2a4060);
    const txt = this.add.text(CX, BTN_Y, '← 타이틀로', {
      fontSize: '14px', color: '#7799bb', fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => { bg.setFillStyle(0x162035); txt.setColor('#aabbdd'); });
    bg.on('pointerout',  () => { bg.setFillStyle(0x0d1525); txt.setColor('#7799bb'); });
    bg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });
  }
}
