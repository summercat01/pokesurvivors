import Phaser from 'phaser';
import { TOP_H, BOT_H } from '../constants/layout';
import { TYPE_KR } from '../constants/typeLabels';
import type { WeaponConfig } from '../data/weapons';
import { TYPE_COLORS } from '../data/weapons';
import type { PokemonType } from '../types';

export interface HudUpdateData {
  hp: number;
  maxHp: number;
  exp: number;
  expToNext: number;
  gameTime: number;
  level: number;
  gold: number;
  stageId: number;
  waveNumber: number;
  killCount: number;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  darkraiSpawned: boolean;
  playerX: number;
  playerY: number;
  bossX: number;
  bossY: number;
}

export class GameHud {
  // 상단 HUD
  private hpBar!: Phaser.GameObjects.Rectangle;
  private expBar!: Phaser.GameObjects.Rectangle;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  // HUD 오버레이 (gameCam에서 렌더링)
  goldText!: Phaser.GameObjects.Text;
  killText!: Phaser.GameObjects.Text;
  waveText!: Phaser.GameObjects.Text;
  stageText!: Phaser.GameObjects.Text;
  bossArrow!: Phaser.GameObjects.Text;
  private bossHpPanelItems: Phaser.GameObjects.GameObject[] = [];
  private bossHpBar!: Phaser.GameObjects.Rectangle;
  private bossHpBarBg!: Phaser.GameObjects.Rectangle;
  private bossHpNameText!: Phaser.GameObjects.Text;
  private bossHpNumText!: Phaser.GameObjects.Text;
  // 하단 슬롯
  pokemonSlotBgs:    Phaser.GameObjects.Rectangle[] = [];
  pokemonSlotLvs:    Phaser.GameObjects.Text[]      = [];
  pokemonSlotImgs:   Phaser.GameObjects.Image[]     = [];
  pokemonSlotTypes:  Phaser.GameObjects.Rectangle[] = [];
  accessorySlotBgs:   Phaser.GameObjects.Rectangle[] = [];
  accessorySlotLvs:   Phaser.GameObjects.Text[]      = [];
  accessorySlotTypes: Phaser.GameObjects.Rectangle[] = [];
  accessorySlotNames: Phaser.GameObjects.Text[]      = [];

  private hpBarMaxW = 0;
  private expBarMaxW = 0;
  private hpLowPulsing = false;
  private bossHpRatioDisplayed = 1;

  constructor(
    private scene: Phaser.Scene,
    private gameCam: Phaser.Cameras.Scene2D.Camera,
  ) {}

  /** 상단 패널 + 하단 슬롯 생성 (cameras.main 렌더링) */
  createUI() {
    const D = 100;
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;

    // ── 상단 패널 ──
    this.scene.add.rectangle(W / 2, 35, W - 4, 70, 0x181810).setScrollFactor(0).setDepth(D);
    this.scene.add.rectangle(W / 2, 35, W - 8, 66, 0xd8d8c0).setScrollFactor(0).setDepth(D + 1);
    this.scene.add.rectangle(7, 35, 2, 60, 0xf0f0e0).setScrollFactor(0).setDepth(D + 2);
    this.scene.add.rectangle(W / 2, 4, W - 12, 2, 0xf0f0e0).setScrollFactor(0).setDepth(D + 2);

    this.scene.add.text(10, 9, '광휘', {
      fontSize: '14px', color: '#181810', fontStyle: 'bold', padding: { top: 4 },
    }).setScrollFactor(0).setDepth(D + 3);

    this.timerText = this.scene.add.text(W / 2, 9, '00:00', {
      fontSize: '13px', color: '#484840',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D + 3);

    this.levelText = this.scene.add.text(W - 46, 9, 'Lv  1', {
      fontSize: '14px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(D + 3);

    this.scene.add.text(10, 36, 'HP', {
      fontSize: '11px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3);

    const BAR_END  = W - 46;
    const HP_START = 32;
    this.hpBarMaxW = BAR_END - HP_START;
    this.scene.add.rectangle(HP_START + this.hpBarMaxW / 2, 36, this.hpBarMaxW + 2, 11, 0x282018)
      .setScrollFactor(0).setDepth(D + 3);
    this.hpBar = this.scene.add.rectangle(HP_START, 36, this.hpBarMaxW, 8, 0x58c040)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 4);

    const EXP_START = 8;
    this.expBarMaxW = BAR_END - EXP_START;
    this.scene.add.rectangle(EXP_START + this.expBarMaxW / 2, 55, this.expBarMaxW + 2, 7, 0x282018)
      .setScrollFactor(0).setDepth(D + 3);
    this.expBar = this.scene.add.rectangle(EXP_START, 55, 0, 5, 0x3888e8)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 4);

    // ── 하단 패널 ──
    const BOT_TOP = H - BOT_H;
    const BOT_CY  = H - BOT_H / 2;

    this.scene.add.rectangle(W / 2, BOT_CY, W - 4, BOT_H, 0x181810).setScrollFactor(0).setDepth(D);
    this.scene.add.rectangle(W / 2, BOT_CY, W - 8, BOT_H - 4, 0xd8d8c0).setScrollFactor(0).setDepth(D + 1);
    this.scene.add.rectangle(W / 2, BOT_TOP + BOT_H / 2, W - 16, 2, 0x989880).setScrollFactor(0).setDepth(D + 2);

    const SLOT_W   = 52;
    const SLOT_H   = 44;
    const SLOT_GAP = Math.max(2, Math.floor((W - 16 - 6 * SLOT_W) / 5));
    const SLOT_X0  = Math.round((W - (6 * SLOT_W + 5 * SLOT_GAP)) / 2) + SLOT_W / 2;

    const ROW_P_Y = BOT_TOP + 4 + 14 + SLOT_H / 2;
    const ROW_A_Y = ROW_P_Y + SLOT_H / 2 + 8 + 14 + SLOT_H / 2;
    const labelStyle = { fontSize: '11px', color: '#383028', fontStyle: 'bold' as const };

    this.scene.add.text(8, ROW_P_Y - SLOT_H / 2 - 14, '포켓몬', labelStyle).setScrollFactor(0).setDepth(D + 2);
    for (let i = 0; i < 6; i++) {
      const sx = SLOT_X0 + i * (SLOT_W + SLOT_GAP);
      this.scene.add.rectangle(sx, ROW_P_Y, SLOT_W, SLOT_H, 0x181810).setScrollFactor(0).setDepth(D + 2);
      const bg = this.scene.add.rectangle(sx, ROW_P_Y, SLOT_W - 2, SLOT_H - 2, 0x8cb890).setScrollFactor(0).setDepth(D + 3);
      this.pokemonSlotBgs.push(bg);
      const img = this.scene.add.image(sx, ROW_P_Y - 2, 'pokemon_001').setDisplaySize(38, 38).setScrollFactor(0).setDepth(D + 4).setVisible(false);
      this.pokemonSlotImgs.push(img);
      const typeBar = this.scene.add.rectangle(sx, ROW_P_Y + SLOT_H / 2 - 3, SLOT_W - 2, 5, 0x000000, 0).setScrollFactor(0).setDepth(D + 5);
      this.pokemonSlotTypes.push(typeBar);
      const lv = this.scene.add.text(sx + SLOT_W / 2 - 2, ROW_P_Y + SLOT_H / 2 - 1, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 6);
      this.pokemonSlotLvs.push(lv);
    }

    this.scene.add.text(8, ROW_A_Y - SLOT_H / 2 - 14, '장신구', labelStyle).setScrollFactor(0).setDepth(D + 2);
    for (let i = 0; i < 6; i++) {
      const sx = SLOT_X0 + i * (SLOT_W + SLOT_GAP);
      this.scene.add.rectangle(sx, ROW_A_Y, SLOT_W, SLOT_H, 0x181810).setScrollFactor(0).setDepth(D + 2);
      const bg = this.scene.add.rectangle(sx, ROW_A_Y, SLOT_W - 2, SLOT_H - 2, 0x9890c0).setScrollFactor(0).setDepth(D + 3);
      this.accessorySlotBgs.push(bg);
      const accTypeBar = this.scene.add.rectangle(sx, ROW_A_Y + SLOT_H / 2 - 3, SLOT_W - 2, 5, 0x000000, 0).setScrollFactor(0).setDepth(D + 4);
      this.accessorySlotTypes.push(accTypeBar);
      const accTypeName = this.scene.add.text(sx, ROW_A_Y, '', {
        fontSize: '9px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
      this.accessorySlotNames.push(accTypeName);
      const lv = this.scene.add.text(sx + SLOT_W / 2 - 2, ROW_A_Y + SLOT_H / 2 - 1, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 5);
      this.accessorySlotLvs.push(lv);
    }
  }

  /** gameCam.ignore 이후 호출 — gameCam에서만 렌더링되는 오버레이 생성 */
  createHudOverlay() {
    const D = 150;
    const W = this.scene.scale.width;
    const ROW_Y = 79 - TOP_H; // raw = 9

    this.goldText = this.scene.add.text(12, ROW_Y, '★  0 G', {
      fontSize: '12px', color: '#ffd700', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D);

    this.killText = this.scene.add.text(W / 2, ROW_Y, '⚔ 0', {
      fontSize: '12px', color: '#ddaa44', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D);

    this.stageText = this.scene.add.text(Math.round(W * 0.72), ROW_Y, 'STAGE 1', {
      fontSize: '12px', color: '#88ccff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D);

    this.waveText = this.scene.add.text(W - 8, ROW_Y, 'WAVE 0', {
      fontSize: '12px', color: '#aaaaaa', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(D);

    // 보스 HP 패널
    const SCREEN_BOSS_TOP = 96;
    const BOSS_PNL_H      = 44;
    const BT = SCREEN_BOSS_TOP - TOP_H;
    const BC = BT + BOSS_PNL_H / 2;
    const BOSS_BAR_W = W - 48;
    const BOSS_BAR_H = 12;
    const BAR_LEFT   = 24;

    const pnlBg     = this.scene.add.rectangle(W / 2, BC, W, BOSS_PNL_H, 0x0a0a0a, 0.88).setScrollFactor(0).setDepth(D - 1).setVisible(false);
    const pnlBorder = this.scene.add.rectangle(W / 2, BT + BOSS_PNL_H, W, 2, 0xdd2222, 0.6).setScrollFactor(0).setDepth(D).setVisible(false);
    const bossLabel = this.scene.add.text(24, BT + 9, '☠  BOSS', {
      fontSize: '10px', color: '#ff4444', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);

    this.bossHpNameText = this.scene.add.text(24, BT + 9, '', {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);

    this.bossHpNumText = this.scene.add.text(W - 24, BT + 9, '', {
      fontSize: '11px', color: '#ffbbbb', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);

    const barY     = BT + 30;
    const barTrack = this.scene.add.rectangle(BAR_LEFT + BOSS_BAR_W / 2, barY, BOSS_BAR_W + 2, BOSS_BAR_H + 4, 0x1a1a1a).setScrollFactor(0).setDepth(D).setVisible(false);
    this.bossHpBarBg = this.scene.add.rectangle(BAR_LEFT + BOSS_BAR_W / 2, barY, BOSS_BAR_W, BOSS_BAR_H, 0x550000).setScrollFactor(0).setDepth(D + 1).setVisible(false);
    this.bossHpBar   = this.scene.add.rectangle(BAR_LEFT, barY, BOSS_BAR_W, BOSS_BAR_H, 0xee2222).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2).setVisible(false);

    this.bossHpPanelItems = [pnlBg, pnlBorder, bossLabel, barTrack, this.bossHpNameText, this.bossHpNumText, this.bossHpBarBg, this.bossHpBar];

    // 보스 방향 화살표
    this.bossArrow = this.scene.add.text(0, 0, '▲', {
      fontSize: '20px', color: '#ff4444', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(85).setVisible(false);
    this.gameCam.ignore(this.bossArrow);

    // cameras.main은 오버레이 아이템 무시
    this.scene.cameras.main.ignore([
      this.goldText, this.killText, this.stageText, this.waveText,
      pnlBg, pnlBorder, bossLabel, barTrack,
      this.bossHpNameText, this.bossHpNumText, this.bossHpBarBg, this.bossHpBar,
    ]);
  }

  /** 매 프레임 HUD 갱신 */
  update(data: HudUpdateData) {
    const hpRatio = Math.max(0, data.hp / data.maxHp);
    this.hpBar.width = this.hpBarMaxW * hpRatio;

    if      (hpRatio > 0.5) { this.hpBar.setFillStyle(0x58c040); this.stopHpLowPulse(); }
    else if (hpRatio > 0.2) { this.hpBar.setFillStyle(0xd8b000); this.stopHpLowPulse(); }
    else                    { this.hpBar.setFillStyle(0xd01818); this.startHpLowPulse(); }

    this.expBar.width = this.expBarMaxW * (data.exp / data.expToNext);

    const totalSec = Math.floor(data.gameTime / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    this.timerText.setText(`${min}:${sec}`);
    this.levelText.setText(`Lv  ${data.level}`);
    this.goldText.setText(`★  ${data.gold} G`);
    this.stageText.setText(`STAGE ${data.stageId}`);
    this.waveText.setText(`WAVE ${data.waveNumber + 1}`);
    this.killText.setText(`⚔ ${data.killCount}`);

    if (data.bossActive) {
      const ratio = data.bossHp / data.bossMaxHp;
      this.bossHpRatioDisplayed = Phaser.Math.Linear(this.bossHpRatioDisplayed, ratio, 0.12);
      const BOSS_BAR_FULL = this.scene.scale.width - 48;
      this.bossHpBar.width = BOSS_BAR_FULL * this.bossHpRatioDisplayed;
      const barColor = ratio < 0.3 ? 0xff6600 : ratio < 0.6 ? 0xdd8800 : 0xee2222;
      this.bossHpBar.setFillStyle(barColor);
      this.bossHpNameText.setText(data.bossName);
      this.bossHpNumText.setText(
        data.darkraiSpawned
          ? '??? / ???'
          : `${data.bossHp.toLocaleString()} / ${data.bossMaxHp.toLocaleString()}`
      );
      this.bossHpPanelItems.forEach(obj => (obj as any).setVisible(true));
      this.updateBossArrow(data);
    } else {
      this.bossHpPanelItems.forEach(obj => (obj as any).setVisible(false));
      this.bossArrow.setVisible(false);
    }
  }

  /** 슬롯 UI 갱신 */
  updateSlots(
    weapons: WeaponConfig[],
    weaponLevels: number[],
    passives: Map<PokemonType, number>,
  ) {
    this.pokemonSlotBgs.forEach((bg, i) => {
      if (i < weapons.length) {
        bg.setFillStyle(0x38886a);
        this.pokemonSlotLvs[i].setText(`Lv${weaponLevels[i] ?? 1}`);
        const sprKey = `pokemon_${String(weapons[i].pokemonId).padStart(3, '0')}`;
        this.pokemonSlotImgs[i].setTexture(sprKey).setVisible(true);
        this.pokemonSlotTypes[i].setFillStyle(TYPE_COLORS[weapons[i].type] ?? 0x888888, 1);
      } else {
        bg.setFillStyle(0x8cb890);
        this.pokemonSlotLvs[i].setText('');
        this.pokemonSlotImgs[i].setVisible(false);
        this.pokemonSlotTypes[i].setFillStyle(0x000000, 0);
      }
    });

    const passiveEntries = Array.from(passives.entries());
    this.accessorySlotBgs.forEach((bg, i) => {
      if (i < passiveEntries.length) {
        bg.setFillStyle(0x6855cc);
        this.accessorySlotLvs[i].setText(`Lv${passiveEntries[i][1]}`);
        this.accessorySlotTypes[i].setFillStyle(TYPE_COLORS[passiveEntries[i][0]] ?? 0x888888, 1);
        this.accessorySlotNames[i].setText(TYPE_KR[passiveEntries[i][0]] ?? '');
      } else {
        bg.setFillStyle(0x9890c0);
        this.accessorySlotLvs[i].setText('');
        this.accessorySlotTypes[i].setFillStyle(0x000000, 0);
        this.accessorySlotNames[i].setText('');
      }
    });
  }

  /** 보스 패널 즉시 표시/숨김 (updateUI와 별개로 강제 적용) */
  setBossPanelVisible(visible: boolean) {
    this.bossHpPanelItems.forEach(item =>
      (item as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(visible)
    );
    if (!visible) this.bossArrow.setVisible(false);
  }

  /** 보스 HP 비율 리셋 (새 보스 스폰 시) */
  resetBossHpRatio() {
    this.bossHpRatioDisplayed = 1;
  }

  private startHpLowPulse() {
    if (this.hpLowPulsing) return;
    this.hpLowPulsing = true;
    this.scene.tweens.add({ targets: this.hpBar, alpha: 0.35, duration: 350, yoyo: true, repeat: -1, key: 'hp-pulse' });
  }

  private stopHpLowPulse() {
    if (!this.hpLowPulsing) return;
    this.hpLowPulsing = false;
    this.scene.tweens.killTweensOf(this.hpBar);
    this.hpBar.setAlpha(1);
  }

  private updateBossArrow(data: HudUpdateData) {
    const camLeft   = this.gameCam.scrollX;
    const camTop    = this.gameCam.scrollY;
    const camRight  = camLeft + this.gameCam.width;
    const camBottom = camTop  + this.gameCam.height;

    if (data.bossX >= camLeft && data.bossX <= camRight && data.bossY >= camTop && data.bossY <= camBottom) {
      this.bossArrow.setVisible(false);
      return;
    }

    const cx    = this.scene.scale.width  / 2;
    const cy    = this.scene.scale.height / 2;
    const angle = Phaser.Math.Angle.Between(data.playerX, data.playerY, data.bossX, data.bossY);
    const margin = 28;
    const minY = TOP_H + margin;
    const maxY = this.scene.scale.height - BOT_H - margin;
    const minX = margin;
    const maxX = this.scene.scale.width  - margin;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let ax: number, ay: number;
    if (Math.abs(cos) > 1e-6) {
      const tx = cos > 0 ? maxX : minX;
      const t  = (tx - cx) / cos;
      ay = cy + sin * t;
      if (ay >= minY && ay <= maxY) {
        ax = tx; ay = Phaser.Math.Clamp(ay, minY, maxY);
      } else {
        const ty = sin > 0 ? maxY : minY;
        const t2 = (ty - cy) / (sin || 1e-6);
        ax = Phaser.Math.Clamp(cx + cos * t2, minX, maxX);
        ay = ty;
      }
    } else {
      ay = sin > 0 ? maxY : minY;
      ax = Phaser.Math.Clamp(cx, minX, maxX);
    }

    this.bossArrow.setPosition(ax, ay);
    this.bossArrow.setRotation(angle - Math.PI / 2);
    this.bossArrow.setVisible(true);
  }
}
