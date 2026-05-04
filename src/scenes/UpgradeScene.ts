import Phaser from 'phaser';
import {
  UPGRADES,
  getUpgradeLevel, setUpgradeLevel,
  getTotalGold, setTotalGold,
} from '../data/upgrades';
import { getCurrentUser } from '../lib/auth';
import { pushLocalToCloud } from '../lib/userDB';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';
import { ScrollablePanel } from '../ui/ScrollablePanel';
import { SceneHelper } from '../utils/SceneHelper';

export class UpgradeScene extends Phaser.Scene {
  private selectedIdx = 0;
  private selectionGfx: Phaser.GameObjects.Graphics[] = [];
  private cardMeta: { cx: number; cy: number; w: number; h: number; color: number }[] = [];

  private infoIconBg!: Phaser.GameObjects.Rectangle;
  private infoIcon!:   Phaser.GameObjects.Text;
  private infoName!:   Phaser.GameObjects.Text;
  private infoLevel!:  Phaser.GameObjects.Text;
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

    // ── 배경 + 헤더 ──
    PokeUI.gridBackground(this);
    PokeUI.sceneHeader(this, '영구 업그레이드');

    this.goldTxt = this.add.text(CX, 48, `💰 ${getTotalGold().toLocaleString()} G`, {
      fontFamily: POKE_FONT, fontSize: '11px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5);

    PokeUI.divider(this, 10, 68, W - 10);

    // ── 레이아웃 상수 ──
    const GRID_TOP  = 72;
    const BACK_BTN_H = 40;
    const BUY_BTN_H  = 44;
    const INFO_H     = 90;
    const BOTTOM_H   = INFO_H + BUY_BTN_H + BACK_BTN_H + 16;
    const PANEL_Y    = H - BOTTOM_H;
    const COLS      = 2;
    const GAP       = 6;
    const CARD_W    = Math.floor((W - 16 - GAP) / COLS);
    const CARD_H    = 68;
    const GRID_L    = 8;
    const ROWS      = Math.ceil(UPGRADES.length / COLS);
    const totalH    = ROWS * (CARD_H + GAP) - GAP;

    // ── 스크롤 영역 ──
    const scrollPanel = new ScrollablePanel(this, {
      top: GRID_TOP, bottom: PANEL_Y - 4,
      scrollDirection: 'positive',
    });
    scrollPanel.setContentHeight(totalH);
    const container = scrollPanel.container;

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

      // 포켓몬 스타일 카드
      const cardBgColor = maxed ? 0xfff8d0 : PokePalette.panelBg;
      const shadow = this.add.rectangle(cx + 3, cy + 4, CARD_W, CARD_H, 0x000000, 0.2);
      const cardBorder = this.add.rectangle(cx, cy, CARD_W, CARD_H, PokePalette.panelBorder);
      const cardBg = this.add.rectangle(cx, cy, CARD_W - 6, CARD_H - 6, cardBgColor);
      // 좌측 색상 스트라이프
      const sg = this.add.graphics();
      sg.fillStyle(upg.color, maxed ? 0.3 : 1);
      sg.fillRect(cx - CARD_W / 2 + 3, cy - CARD_H / 2 + 3, 8, CARD_H - 6);

      // 아이콘
      const ICX = cx - CARD_W / 2 + 24;
      const ICY = cy;
      const iconBg = this.add.rectangle(ICX, ICY, 32, 32, upg.color, maxed ? 0.15 : 0.25);
      const iconOutline = this.add.graphics().lineStyle(1, upg.color, maxed ? 0.3 : 0.7).strokeRect(ICX - 16, ICY - 16, 32, 32);
      const iconTxt = this.add.text(ICX, ICY, upg.icon, {
        fontSize: '16px', color: maxed ? '#b0a060' : PokePalette.textDark,
      }).setOrigin(0.5);

      // 이름
      const TX = cx - CARD_W / 2 + 48;
      const nameTxt = this.add.text(TX, cy - 22, upg.name, {
        fontFamily: POKE_FONT, fontSize: '10px', color: maxed ? '#8a6000' : PokePalette.textDark, fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 레벨
      const lvTxt = this.add.text(cx + CARD_W / 2 - 6, cy - 22, maxed ? 'MAX' : `${lv}/${maxLv}`, {
        fontFamily: POKE_FONT, fontSize: '9px', color: maxed ? PokePalette.textGold : '#2255aa',
      }).setOrigin(1, 0.5);

      // 레벨 닷
      const dots: Phaser.GameObjects.Arc[] = [];
      for (let i = 0; i < maxLv; i++) {
        dots.push(this.add.circle(TX + i * 10, cy, 3.5, i < lv ? upg.color : PokePalette.panelShadow));
      }

      // 효과 미리보기
      const preview = maxed ? upg.labels[maxLv - 1] : `→ ${upg.labels[lv] ?? upg.labels[maxLv - 1]}`;
      const previewTxt = this.add.text(TX, cy + 20, preview, {
        fontFamily: POKE_FONT, fontSize: '8px', color: maxed ? PokePalette.textGold : '#2255aa',
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
          gfx.fillStyle(0x3050a0, 0.08);
          gfx.fillRect(cx - CARD_W / 2 + 3, cy - CARD_H / 2 + 3, CARD_W - 6, CARD_H - 6);
        }
      });
      hit.on('pointerout', () => {
        if (this.selectedIdx !== idx) gfx.clear();
      });

      container.add([shadow, cardBorder, cardBg, sg, iconBg, iconOutline, iconTxt, nameTxt, lvTxt, ...dots, previewTxt, gfx, hit]);
    });

    // ── 하단 고정 영역 ──
    this.createBottomSection(W, H, CX, PANEL_Y, INFO_H, BUY_BTN_H, BACK_BTN_H);

    this.selectCard(data?.selectedIdx ?? 0);
    this.cameras.main.fadeIn(220, 0, 0, 0);
  }

  // ────────────────────────────────────────────────────
  private createBottomSection(
    W: number, H: number, CX: number,
    PANEL_Y: number, INFO_H: number, BUY_BTN_H: number, BACK_BTN_H: number,
  ) {
    // 배경 패널 (전체 하단 영역)
    const totalH = H - PANEL_Y;
    PokeUI.panel(this, CX, PANEL_Y + totalH / 2, W - 4, totalH, PokePalette.panelBg);

    // 구분선
    this.add.graphics().lineStyle(2, PokePalette.panelBorder, 0.4)
      .lineBetween(10, PANEL_Y, W - 10, PANEL_Y);

    // ── 정보 스트립 ──
    const P   = PANEL_Y + 6;
    const ICX = 30;
    const ICY = P + INFO_H / 2 - 4;
    const TX  = 62;

    this.infoIconBg = this.add.rectangle(ICX, ICY, 44, 44, PokePalette.panelBorder);
    this.infoIcon   = this.add.text(ICX, ICY, '', { fontSize: '20px' }).setOrigin(0.5);

    this.infoName  = this.add.text(TX, P + 6, '', {
      fontFamily: POKE_FONT, fontSize: '12px', color: PokePalette.textDark, fontStyle: 'bold',
    }).setOrigin(0, 0);
    this.infoLevel = this.add.text(TX, P + 24, '', {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#2255aa',
    }).setOrigin(0, 0);
    this.infoBonus = this.add.text(TX, P + 42, '', {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#2255aa', fontStyle: 'bold',
      wordWrap: { width: W - TX - 10 },
    }).setOrigin(0, 0);

    for (let i = 0; i < 5; i++) {
      this.infoDots.push(this.add.circle(TX + i * 13, P + 64, 4.5, PokePalette.panelShadow));
    }

    // ── 구매 버튼 ──
    const BUY_Y = PANEL_Y + INFO_H + 4 + BUY_BTN_H / 2;
    this.buyBtn = this.add.rectangle(CX, BUY_Y, W - 20, BUY_BTN_H, PokePalette.btnPrimary)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder)
      .strokeRect(CX - (W - 20) / 2, BUY_Y - BUY_BTN_H / 2, W - 20, BUY_BTN_H);
    this.buyTxt = this.add.text(CX, BUY_Y - 7, '', {
      fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textWhite, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.buySub = this.add.text(CX, BUY_Y + 9, '', {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#aaccff',
    }).setOrigin(0.5);

    this.buyBtn.on('pointerover', () => {
      const upg = UPGRADES[this.selectedIdx];
      const lv  = getUpgradeLevel(upg.id);
      if (lv < (upg.maxLevel ?? 5) && getTotalGold() >= upg.costs[lv]) this.buyBtn.setFillStyle(0x3366cc);
    });
    this.buyBtn.on('pointerout',  () => this.updateInfoPanel());
    this.buyBtn.on('pointerdown', () => { this.buyBtn.setFillStyle(PokePalette.btnPressed); this.purchaseSelected(); });

    // ── 뒤로 버튼 ──
    const BACK_Y = H - BACK_BTN_H / 2 - 4;
    PokeUI.navButton(this, CX, BACK_Y, W - 20, BACK_BTN_H, '← 타이틀로',
      () => SceneHelper.transitionTo(this, 'TitleScene'));
  }

  // ────────────────────────────────────────────────────
  private selectCard(idx: number) {
    this.selectedIdx = idx;
    this.selectionGfx.forEach((gfx, i) => {
      gfx.clear();
      if (i !== idx) return;
      const { cx, cy, w, h, color } = this.cardMeta[i];
      gfx.fillStyle(0x3050a0, 0.14);
      gfx.fillRect(cx - w / 2 + 3, cy - h / 2 + 3, w - 6, h - 6);
      gfx.lineStyle(2, PokePalette.headerBg, 1.0);
      gfx.strokeRect(cx - w / 2, cy - h / 2, w, h);
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
    this.infoIconBg.setFillStyle(maxed ? 0xd4a820 : upg.color);
    this.infoIcon.setText(upg.icon);
    this.infoName.setText(upg.name);
    this.infoLevel.setText(maxed ? `Lv.${maxLv} / ${maxLv}  ✦ MAX` : `Lv.${lv} / ${maxLv}`);

    if (maxed) {
      this.infoBonus.setText(`✦ 최대치 달성  (${upg.labels[maxLv - 1]})`).setColor('#c08000');
    } else if (lv > 0) {
      this.infoBonus.setText(`현재 ${upg.labels[lv - 1]}  →  다음 ${upg.labels[lv]}`).setColor('#2255aa');
    } else {
      this.infoBonus.setText(`강화 효과: ${upg.labels[0]}`).setColor('#2255aa');
    }

    this.infoDots.forEach((dot, i) =>
      dot.setFillStyle(i < lv ? upg.color : i < maxLv ? PokePalette.panelShadow : 0xd0d0c0));

    if (maxed) {
      this.buyBtn.setFillStyle(0xf0d060).disableInteractive();
      this.buyTxt.setText('✦ MAX').setColor(PokePalette.textGold);
      this.buySub.setText('이미 최고 레벨입니다').setColor('#8a6000');
    } else if (can) {
      this.buyBtn.setFillStyle(PokePalette.btnPrimary).setInteractive({ useHandCursor: true });
      this.buyTxt.setText(`구매  ${nextCost.toLocaleString()} G`).setColor(PokePalette.textWhite);
      this.buySub.setText(`보유 ${gold.toLocaleString()} G`).setColor('#aaccff');
    } else {
      this.buyBtn.setFillStyle(PokePalette.panelShadow).disableInteractive();
      this.buyTxt.setText(`${nextCost.toLocaleString()} G 필요`).setColor(PokePalette.textGray);
      this.buySub.setText(`${(nextCost - gold).toLocaleString()} G 부족`).setColor('#888870');
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

}
