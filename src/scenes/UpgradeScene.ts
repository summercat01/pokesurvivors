import Phaser from 'phaser';
import {
  UPGRADES, type UpgradeConfig,
  getUpgradeLevel, setUpgradeLevel,
  getTotalGold, setTotalGold,
} from '../data/upgrades';

// ── 카드 그리드 상수 ──
const COLS      = 4;
const CARD_W    = 83;
const CARD_H    = 142;
const GAP_X     = 6;
const GAP_Y     = 6;
const GRID_TOP  = 76;

// 카드 (col, row) → 중심 좌표
function cardCenter(col: number, row: number, gridLeft: number) {
  return {
    x: gridLeft + col * (CARD_W + GAP_X) + CARD_W / 2,
    y: GRID_TOP  + row * (CARD_H + GAP_Y) + CARD_H / 2,
  };
}

export class UpgradeScene extends Phaser.Scene {
  private selectedIdx: number = 0;

  // 선택 하이라이트용 오버레이 (카드 인덱스 → rect)
  private selectionOverlays: Phaser.GameObjects.Rectangle[] = [];

  // 하단 정보 패널 갱신용 오브젝트
  private infoIcon!:    Phaser.GameObjects.Text;
  private infoIconBg!:  Phaser.GameObjects.Rectangle;
  private infoName!:    Phaser.GameObjects.Text;
  private infoLevel!:   Phaser.GameObjects.Text;
  private infoDesc!:    Phaser.GameObjects.Text;
  private infoBonus!:   Phaser.GameObjects.Text;
  private infoDots:     Phaser.GameObjects.Arc[]     = [];
  private buyBtn!:      Phaser.GameObjects.Rectangle;
  private buyBtnInner!: Phaser.GameObjects.Rectangle;
  private buyBtnTxt!:   Phaser.GameObjects.Text;
  private buyBtnSub!:   Phaser.GameObjects.Text;
  private goldDisplay!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create() {
    this.selectedIdx = 0;

    // ── 배경 ──
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x1a3d0a).setOrigin(0, 0);
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a5518, 0.22);
    for (let x = 0; x < W; x += 32) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 32) grid.lineBetween(0, y, W, y);

    this.createHeader();
    this.createCardGrid();
    this.createInfoPanel();
    this.createBackButton();

    // 첫 카드 선택 상태로 초기화
    this.selectCard(0);
    this.cameras.main.fadeIn(220, 24, 16, 40);
  }

  // ── 헤더 ──────────────────────────────────────────────
  private createHeader() {
    const CX = this.scale.width / 2;
    const W  = this.scale.width;
    this.add.rectangle(CX, 38, W - 16, 62, 0x181810);
    this.add.rectangle(CX, 38, W - 20, 58, 0xd8d8c0);
    this.add.rectangle(13, 38, 2, 52, 0xf0f0e0);
    this.add.rectangle(CX, 10, W - 24, 2, 0xf0f0e0);

    this.add.text(CX, 22, '영구 업그레이드', {
      fontSize: '17px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.goldDisplay = this.add.text(CX, 44, `★  ${getTotalGold()} G 보유`, {
      fontSize: '13px', color: '#9a7a10', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
  }

  // ── 카드 그리드 ───────────────────────────────────────
  private createCardGrid() {
    const gridLeft = Math.floor((this.scale.width - (COLS * CARD_W + (COLS - 1) * GAP_X)) / 2);
    UPGRADES.forEach((upg, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const { x: cx, y: cy } = cardCenter(col, row, gridLeft);
      const curLevel = getUpgradeLevel(upg.id);
      const isMaxed  = curLevel >= 5;

      // ─ 카드 배경 (DP 스타일) ─
      this.add.rectangle(cx, cy, CARD_W,     CARD_H,     0x181810); // 외곽
      this.add.rectangle(cx, cy, CARD_W - 2, CARD_H - 2, 0xd8d8c0); // 크림
      // 하이라이트
      this.add.rectangle(cx,          cy - CARD_H / 2 + 2, CARD_W - 8,  2, 0xf0f0e0);
      this.add.rectangle(cx - CARD_W / 2 + 2, cy,          2, CARD_H - 8, 0xf0f0e0);
      // 좌측 타입 컬러 스트라이프
      this.add.rectangle(cx - CARD_W / 2 + 5, cy, 6, CARD_H - 4, upg.color);

      // ─ 아이콘 영역 ─
      const iconY = cy - 22;
      this.add.circle(cx + 4, iconY, 26, upg.color, isMaxed ? 0.5 : 0.85);
      if (isMaxed) {
        this.add.circle(cx + 4, iconY, 22, 0xd4aa30, 0.6);
      }
      this.add.text(cx + 4, iconY, upg.icon, {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      // ─ 카드 이름 ─
      this.add.text(cx + 4, cy + 22, upg.name, {
        fontSize: '11px', color: '#181810', fontStyle: 'bold',
        wordWrap: { width: CARD_W - 14 },
        align: 'center',
      }).setOrigin(0.5, 0);

      // ─ 레벨 닷 (5개) ─
      const dotY  = cy + CARD_H / 2 - 14;
      const dotX0 = cx + 4 - 2 * 12;
      for (let i = 0; i < 5; i++) {
        this.add.circle(dotX0 + i * 12, dotY, 5, i < curLevel ? upg.color : 0xb0b098);
        if (i < curLevel) {
          this.add.circle(dotX0 + i * 12, dotY, 3, 0xffffff, 0.3);
        }
      }

      // ─ 만렙 골드 배지 ─
      if (isMaxed) {
        this.add.text(cx + 4, cy - CARD_H / 2 + 10, '★MAX', {
          fontSize: '9px', color: '#d4aa30', fontStyle: 'bold',
        }).setOrigin(0.5, 0);
      }

      // ─ 선택 오버레이 (처음엔 투명) ─
      const overlay = this.add.rectangle(cx, cy, CARD_W - 2, CARD_H - 2, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      this.selectionOverlays.push(overlay);

      overlay.on('pointerdown', () => this.selectCard(idx));
      overlay.on('pointerover', () => {
        if (this.selectedIdx !== idx) overlay.setFillStyle(0xffffff, 0.08);
      });
      overlay.on('pointerout', () => {
        if (this.selectedIdx !== idx) overlay.setFillStyle(0xffffff, 0);
      });
    });
  }

  // ── 카드 선택 ─────────────────────────────────────────
  private selectCard(idx: number) {
    this.selectedIdx = idx;

    // 모든 오버레이 초기화
    this.selectionOverlays.forEach((ov, i) => {
      ov.setFillStyle(0xffffff, i === idx ? 0.18 : 0);
    });

    this.updateInfoPanel();
  }

  // ── 하단 정보 패널 생성 ───────────────────────────────
  private createInfoPanel() {
    const PANEL_Y  = 390;
    const PANEL_H  = 220;
    const CX       = this.scale.width / 2;
    const W        = this.scale.width;
    const panelCY  = PANEL_Y + PANEL_H / 2;

    // DP 스타일 패널
    this.add.rectangle(CX, panelCY, W - 16, PANEL_H, 0x181810);
    this.add.rectangle(CX, panelCY, W - 20, PANEL_H - 4, 0xd8d8c0);
    this.add.rectangle(13,  panelCY, 2, PANEL_H - 12, 0xf0f0e0);
    this.add.rectangle(CX, PANEL_Y + 3, W - 24, 2, 0xf0f0e0);

    // ─ 아이콘 배경 (좌측) ─
    this.infoIconBg = this.add.rectangle(52, PANEL_Y + 56, 72, 72, 0x888870);
    this.add.rectangle(52, PANEL_Y + 56, 68, 68, 0x181810); // 내부 어두운 테두리용
    this.infoIconBg = this.add.rectangle(52, PANEL_Y + 56, 66, 66, 0x888870);

    this.infoIcon = this.add.text(52, PANEL_Y + 56, '', {
      fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ─ 텍스트 영역 ─
    const TX = 100;
    this.infoName  = this.add.text(TX, PANEL_Y + 12, '', {
      fontSize: '16px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0, 0);

    this.infoLevel = this.add.text(TX, PANEL_Y + 34, '', {
      fontSize: '12px', color: '#484840',
    }).setOrigin(0, 0);

    this.infoDesc  = this.add.text(TX, PANEL_Y + 54, '', {
      fontSize: '12px', color: '#484840',
      wordWrap: { width: this.scale.width - TX - 20 },
    }).setOrigin(0, 0);

    this.infoBonus = this.add.text(TX, PANEL_Y + 74, '', {
      fontSize: '13px', color: '#2266aa', fontStyle: 'bold',
    }).setOrigin(0, 0);

    // ─ 레벨 닷 5개 (패널 하단 좌) ─
    this.infoDots = [];
    for (let i = 0; i < 5; i++) {
      const dot = this.add.circle(TX + i * 16, PANEL_Y + 102, 6, 0xb0b098);
      this.infoDots.push(dot);
    }

    // ─ 구매 버튼 (우측 하단) ─
    const BTN_X = this.scale.width - 70;
    const BTN_Y = PANEL_Y + 92;
    this.add.rectangle(BTN_X, BTN_Y, 100, 56, 0x181810);
    this.buyBtnInner = this.add.rectangle(BTN_X, BTN_Y, 98, 54, 0x3aaa3a)
      .setInteractive({ useHandCursor: true });
    this.add.rectangle(BTN_X, BTN_Y - 26, 92, 2, 0xffffff, 0.2);  // 하이라이트

    this.buyBtnTxt = this.add.text(BTN_X, BTN_Y - 10, '0 G', {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.buyBtnSub = this.add.text(BTN_X, BTN_Y + 10, '구매', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.buyBtnInner.on('pointerover', () => {
      const upg = UPGRADES[this.selectedIdx];
      const lv  = getUpgradeLevel(upg.id);
      if (lv < 5 && getTotalGold() >= upg.costs[lv]) {
        this.buyBtnInner.setFillStyle(0x50cc50);
      }
    });
    this.buyBtnInner.on('pointerout', () => this.updateInfoPanel());
    this.buyBtnInner.on('pointerdown', () => this.purchaseSelected());
  }

  // ── 패널 내용 갱신 ────────────────────────────────────
  private updateInfoPanel() {
    const upg       = UPGRADES[this.selectedIdx];
    const curLevel  = getUpgradeLevel(upg.id);
    const isMaxed   = curLevel >= 5;
    const gold      = getTotalGold();
    const nextCost  = isMaxed ? 0 : upg.costs[curLevel];
    const canAfford = !isMaxed && gold >= nextCost;

    // 골드 표시 갱신
    this.goldDisplay.setText(`★  ${gold} G 보유`);

    // 아이콘 배경 색
    this.infoIconBg.setFillStyle(isMaxed ? 0xd4aa30 : upg.color);
    this.infoIcon.setText(upg.icon);

    // 텍스트
    this.infoName.setText(upg.name);
    this.infoLevel.setText(isMaxed ? 'Lv.5 / 5  ★ MAX' : `Lv.${curLevel} / 5`);
    this.infoDesc.setText(upg.description);

    // 다음 단계 보너스
    if (isMaxed) {
      this.infoBonus.setText(`최대치 달성!  (${upg.labels[4]})`);
    } else if (curLevel > 0) {
      this.infoBonus.setText(`현재 ${upg.labels[curLevel - 1]}  →  다음 ${upg.labels[curLevel]}`);
    } else {
      this.infoBonus.setText(`강화 효과: ${upg.labels[0]}`);
    }

    // 레벨 닷 업데이트
    this.infoDots.forEach((dot, i) => {
      dot.setFillStyle(i < curLevel ? upg.color : 0xb0b098);
    });

    // 구매 버튼 상태
    if (isMaxed) {
      this.buyBtnInner.setFillStyle(0xa89848).disableInteractive();
      this.buyBtnTxt.setText('MAX');
      this.buyBtnSub.setText('★★★');
    } else if (canAfford) {
      this.buyBtnInner.setFillStyle(0x3aaa3a).setInteractive({ useHandCursor: true });
      this.buyBtnTxt.setText(`${nextCost} G`);
      this.buyBtnSub.setText('구매');
    } else {
      this.buyBtnInner.setFillStyle(0x787870).disableInteractive();
      this.buyBtnTxt.setText(`${nextCost} G`);
      this.buyBtnSub.setText('부족');
    }
  }

  // ── 구매 처리 ─────────────────────────────────────────
  private purchaseSelected() {
    const upg      = UPGRADES[this.selectedIdx];
    const curLevel = getUpgradeLevel(upg.id);
    if (curLevel >= 5) return;

    const cost = upg.costs[curLevel];
    const gold = getTotalGold();
    if (gold < cost) return;

    setTotalGold(gold - cost);
    setUpgradeLevel(upg.id, curLevel + 1);

    // 구매 플래시 연출 후 씬 재시작
    this.cameras.main.flash(130, 255, 220, 80);
    this.time.delayedCall(160, () => this.scene.restart());
  }

  // ── 돌아가기 버튼 ─────────────────────────────────────
  private createBackButton() {
    const BTN_Y = this.scale.height - 89;
    const CX    = this.scale.width / 2;

    this.add.rectangle(CX, BTN_Y, 202, 52, 0x181810);
    const bg = this.add.rectangle(CX, BTN_Y, 200, 50, 0xd8d8c0)
      .setInteractive({ useHandCursor: true });

    // 좌측 스트라이프 (파랑 = 타이틀 복귀)
    this.add.rectangle(CX - 100 + 3, BTN_Y, 7, 44, 0x4488cc);
    this.add.text(CX + 4, BTN_Y, '← 타이틀로', {
      fontSize: '16px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0xb8c8e0));
    bg.on('pointerout',  () => bg.setFillStyle(0xd8d8c0));
    bg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 24, 16, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    });
  }
}
