import Phaser from 'phaser';
import type { GameScene } from './GameScene';
import { ALL_WEAPONS, TYPE_COLORS, MAX_WEAPON_SLOTS } from '../data/weapons';

export class DevScene extends Phaser.Scene {
  private panelItems: (Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void })[] = [];
  private weaponBtns: { bg: Phaser.GameObjects.Rectangle; txt: Phaser.GameObjects.Text; pokemonId: number }[] = [];
  private isPanelOpen = false;
  private toggleTxt!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DevScene' });
  }

  create() {
    const W    = this.scale.width;
    const H    = this.scale.height;
    const BOT  = H - 132;       // bottom of game area = 712
    const D    = 190;

    // ── 토글 버튼 (항상 표시) ──
    const TX = W - 28;
    const TY = BOT - 18;
    const toggleBg = this.add.rectangle(TX, TY, 46, 20, 0xaa0000, 0.92)
      .setDepth(D).setInteractive({ useHandCursor: true });
    this.toggleTxt = this.add.text(TX, TY, 'DEV ▼', {
      fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 1);

    toggleBg.on('pointerover', () => toggleBg.setFillStyle(0xcc2222, 0.95));
    toggleBg.on('pointerout',  () => toggleBg.setFillStyle(0xaa0000, 0.92));
    toggleBg.on('pointerdown', () => this.togglePanel());

    // ── 패널 ──
    const PANEL_W = 188;
    const ROWS    = Math.ceil(ALL_WEAPONS.length / 2);
    const PANEL_H = 98 + ROWS * 22 + 8;      // 헤더+액션2줄 + 무기그리드 + 여백
    const PX      = W - PANEL_W / 2 - 3;
    const PY      = TY - 14 - PANEL_H / 2;   // 토글 버튼 위에 붙여서
    const PL      = PX - PANEL_W / 2 + 6;    // 왼쪽 패딩

    const add = <T extends Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => T }>(obj: T): T => {
      obj.setVisible(false);
      this.panelItems.push(obj);
      return obj;
    };

    // 패널 배경
    add(this.add.rectangle(PX, PY, PANEL_W, PANEL_H, 0x0a0a14, 0.93)
      .setDepth(D).setStrokeStyle(1, 0x555566) as any);

    // 헤더
    add(this.add.text(PX, PY - PANEL_H / 2 + 11, '⚒  DEV MODE', {
      fontSize: '11px', color: '#ff8888', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(D + 1) as any);
    add(this.add.rectangle(PX, PY - PANEL_H / 2 + 23, PANEL_W - 8, 1, 0x444466)
      .setDepth(D + 1) as any);

    // ── 액션 버튼 3개 ──
    const ACT_Y   = PY - PANEL_H / 2 + 38;
    const BTN_W   = (PANEL_W - 12) / 3;

    const makeBtn = (x: number, label: string, color: number, action: () => void) => {
      const bg = add(this.add.rectangle(x, ACT_Y, BTN_W - 3, 22, color, 0.85)
        .setDepth(D + 1).setInteractive({ useHandCursor: true }) as any);
      const txt = add(this.add.text(x, ACT_Y, label, {
        fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(D + 2) as any);
      (bg as Phaser.GameObjects.Rectangle)
        .on('pointerover', () => (bg as Phaser.GameObjects.Rectangle).setFillStyle(color, 1))
        .on('pointerout',  () => (bg as Phaser.GameObjects.Rectangle).setFillStyle(color, 0.85))
        .on('pointerdown', action);
      return { bg, txt };
    };

    makeBtn(PL + BTN_W * 0.5,       '⏱ +1분',  0x225599, () => this.game_().devAddTime());
    makeBtn(PL + BTN_W * 1.5 + 1.5, '❤ 풀피',  0x337733, () => this.game_().devHealPlayer());
    makeBtn(PL + BTN_W * 2.5 + 3,   '⬆ LvUP', 0x775522, () => this.game_().devLevelUp());

    // 무적 토글 버튼 (두 번째 줄)
    const ACT_Y2  = ACT_Y + 26;
    const { bg: godBg, txt: godTxt } = makeBtn(
      PL + BTN_W,
      '🛡 무적 OFF',
      0x554422,
      () => {
        const on = this.game_().devToggleGodMode();
        (godTxt as unknown as Phaser.GameObjects.Text).setText(on ? '🛡 무적 ON' : '🛡 무적 OFF');
        (godBg  as unknown as Phaser.GameObjects.Rectangle).setFillStyle(on ? 0xaa6600 : 0x554422, 0.85);
      }
    );
    // 버튼을 두 번째 줄 위치로 이동
    (godBg  as unknown as Phaser.GameObjects.Rectangle).setY(ACT_Y2);
    (godTxt as unknown as Phaser.GameObjects.Text).setY(ACT_Y2);

    // ── 무기 추가 섹션 ──
    const WH_Y = ACT_Y2 + 18;
    add(this.add.text(PX, WH_Y, '── 무기 추가 ──', {
      fontSize: '10px', color: '#888899',
    }).setOrigin(0.5).setDepth(D + 1) as any);

    const COL_W     = (PANEL_W - 8) / 2;
    const WPN_Y0    = WH_Y + 13;
    const WPN_ROW_H = 22;

    this.weaponBtns = [];
    ALL_WEAPONS.forEach((weapon, i) => {
      const col  = i % 2;
      const row  = Math.floor(i / 2);
      const bx   = PL + col * COL_W + COL_W / 2;
      const by   = WPN_Y0 + row * WPN_ROW_H;
      const col_ = TYPE_COLORS[weapon.type] ?? 0x334455;

      const bg = add(this.add.rectangle(bx, by, COL_W - 3, WPN_ROW_H - 3, col_, 0.75)
        .setDepth(D + 1).setInteractive({ useHandCursor: true }) as any) as unknown as Phaser.GameObjects.Rectangle;
      const txt = add(this.add.text(bx, by, weapon.name, {
        fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(D + 2) as any) as unknown as Phaser.GameObjects.Text;

      bg.on('pointerdown', () => {
        this.game_().devAddWeapon(weapon.pokemonId);
        this.refreshWeaponBtns();
      });

      this.weaponBtns.push({ bg, txt, pokemonId: weapon.pokemonId });
    });
  }

  private game_(): GameScene {
    return this.scene.get('GameScene') as GameScene;
  }

  private togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
    this.toggleTxt.setText(this.isPanelOpen ? 'DEV ▲' : 'DEV ▼');
    this.panelItems.forEach(item => item.setVisible(this.isPanelOpen));
    if (this.isPanelOpen) this.refreshWeaponBtns();
  }

  private refreshWeaponBtns() {
    const game = this.game_();
    const equippedIds = new Set(game.weapons.map(w => w.pokemonId));
    const full = game.weapons.length >= MAX_WEAPON_SLOTS;

    this.weaponBtns.forEach(({ bg, txt, pokemonId }) => {
      const disabled = equippedIds.has(pokemonId) || full;
      bg.setAlpha(disabled ? 0.25 : 0.8);
      txt.setAlpha(disabled ? 0.35 : 1.0);
    });
  }
}
