import Phaser from 'phaser';
import { TOP_H, BOT_H } from '../constants/layout';
import type { WeaponConfig } from '../data/weapons';
import { TYPE_COLORS, getUpgradedWeapon } from '../data/weapons';
import type { PokemonType, PlayerStats } from '../types';

export interface PauseCallbacks {
  onResume: () => void;
  onQuit: () => void;
  onViewMatchup: () => void;
  onShowWeaponPopup: (idx: number) => void;
  getWeapon: (idx: number) => WeaponConfig | undefined;
  getWeaponLevel: (idx: number) => number;
}

export class PauseOverlay {
  private overlayItems: Phaser.GameObjects.GameObject[] = [];
  private pokeSlotBgs:   Phaser.GameObjects.Rectangle[] = [];
  private pokeSlotImgs:  Phaser.GameObjects.Image[]     = [];
  private pokeSlotTypes: Phaser.GameObjects.Rectangle[] = [];
  private pokeSlotLvs:   Phaser.GameObjects.Text[]      = [];
  private dpsNameTexts:  Phaser.GameObjects.Text[]      = [];
  private dpsDmgTexts:   Phaser.GameObjects.Text[]      = [];
  private statValueFns:  Array<{ text: Phaser.GameObjects.Text; fn: () => string }> = [];
  private weaponPopupItems: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private scene: Phaser.Scene,
    private gameCam: Phaser.Cameras.Scene2D.Camera,
    private callbacks: PauseCallbacks,
  ) {}

  create(onPauseBtn: () => void) {
    const D   = 200;
    const W   = this.scene.scale.width;
    const H   = this.scene.scale.height;
    const CX  = W / 2;
    const CY  = TOP_H + (H - TOP_H - BOT_H) / 2 - 30;

    // ── 일시정지 버튼 ──
    const PBX = W - 23, PBY = 35, PBW = 34, PBH = 28;
    const pauseBtnBorder  = this.scene.add.rectangle(PBX, PBY, PBW + 4, PBH + 4, 0x181810).setScrollFactor(0).setDepth(D + 3);
    const pauseBtn        = this.scene.add.rectangle(PBX, PBY, PBW, PBH, 0x2255bb).setScrollFactor(0).setDepth(D + 4).setInteractive({ useHandCursor: true });
    const pauseHighlight  = this.scene.add.rectangle(PBX, PBY - PBH / 2 + 2, PBW - 4, 2, 0xaabbff, 0.7).setScrollFactor(0).setDepth(D + 5);
    const pauseIcon       = this.scene.add.text(PBX, PBY + 1, '⏸', { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 5);
    this.gameCam.ignore([pauseBtnBorder, pauseBtn, pauseHighlight, pauseIcon]);

    pauseBtn.on('pointerover',  () => pauseBtn.setFillStyle(0x3366cc));
    pauseBtn.on('pointerout',   () => pauseBtn.setFillStyle(0x2255bb));
    pauseBtn.on('pointerdown',  () => { pauseBtn.setFillStyle(0x1144aa); onPauseBtn(); });
    pauseBtn.on('pointerup',    () => pauseBtn.setFillStyle(0x3366cc));

    // ── 오버레이 패널 ──
    this.overlayItems = [];
    const addOverlay = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      (obj as any).setScrollFactor(0).setDepth(D + 2).setVisible(false);
      this.overlayItems.push(obj);
      return obj;
    };

    const PW  = W - 24;
    const PH  = Math.min(560, H - TOP_H - BOT_H - 20);
    const PL  = CX - PW / 2;
    const PT  = CY - PH / 2;

    addOverlay(this.scene.add.rectangle(CX, this.scene.scale.height / 2, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.75).setInteractive());
    addOverlay(this.scene.add.rectangle(CX, CY, PW, PH, 0x181820));
    addOverlay(this.scene.add.rectangle(CX, CY, PW - 4, PH - 4, 0x23233a));

    const HEADER_Y = PT + 32;
    addOverlay(this.scene.add.text(CX, HEADER_Y, '⏸  일시정지', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4, padding: { top: 6 },
    }).setOrigin(0.5));
    addOverlay(this.scene.add.rectangle(CX, PT + 54, PW - 20, 1, 0x555570));

    // ── 스탯 격자 ──
    const GRID_TOP = PT + 64;
    const CELL_H   = 52;
    const CELL_W   = (PW - 20) / 2;
    const COL_L    = PL + 10;
    const COL_R    = CX + 1;

    addOverlay(this.scene.add.graphics().lineStyle(1, 0x444466).strokeRect(COL_L, GRID_TOP, PW - 20, CELL_H * 4));
    addOverlay(this.scene.add.graphics().lineStyle(1, 0x444466).lineBetween(CX, GRID_TOP, CX, GRID_TOP + CELL_H * 4));
    for (let r = 1; r < 4; r++) {
      addOverlay(this.scene.add.graphics().lineStyle(1, 0x444466).lineBetween(COL_L, GRID_TOP + r * CELL_H, COL_L + PW - 20, GRID_TOP + r * CELL_H));
    }

    // 스탯 셀 (fn은 show()에서 player stats를 받아서 설정)
    const cellDefs: Array<[number, number, string]> = [
      [0, 0, 'HP'], [0, 1, '공격력'],
      [1, 0, '방어'], [1, 1, '이동속도'],
      [2, 0, '치명타확률'], [2, 1, '회피율'],
      [3, 0, '쿨다운 감소'], [3, 1, '투사체 수'],
    ];

    cellDefs.forEach(([row, col, label]) => {
      const cellX  = col === 0 ? COL_L : COL_R;
      const cellY  = GRID_TOP + row * CELL_H;
      const cellCX = cellX + CELL_W / 2;

      const lbl = this.scene.add.text(cellCX, cellY + 12, label, { fontSize: '11px', color: '#8888aa' })
        .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      this.overlayItems.push(lbl);

      const val = this.scene.add.text(cellCX, cellY + 34, '-', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      this.overlayItems.push(val);
      this.statValueFns.push({ text: val, fn: () => '-' });
    });

    // ── 포켓몬 슬롯 ──
    const POKE_TOP    = GRID_TOP + CELL_H * 4 + 14;
    const POKE_SLOT_W = 50;
    const POKE_SLOT_H = 54;
    const POKE_GAP    = Math.floor((PW - 20 - 6 * POKE_SLOT_W) / 5);
    const POKE_X0     = COL_L + POKE_SLOT_W / 2;

    addOverlay(this.scene.add.text(COL_L, POKE_TOP + 12, '장착 포켓몬', { fontSize: '11px', color: '#8888aa' }).setOrigin(0, 0.5));
    addOverlay(this.scene.add.graphics().lineStyle(1, 0x444466).lineBetween(COL_L, POKE_TOP + 22, COL_L + PW - 20, POKE_TOP + 22));

    for (let i = 0; i < 6; i++) {
      const sx = POKE_X0 + i * (POKE_SLOT_W + POKE_GAP);
      const sy = POKE_TOP + 28 + POKE_SLOT_H / 2;

      addOverlay(this.scene.add.rectangle(sx, sy, POKE_SLOT_W, POKE_SLOT_H, 0x181810));

      const slotBg = this.scene.add.rectangle(sx, sy, POKE_SLOT_W - 2, POKE_SLOT_H - 2, 0x2a3040)
        .setScrollFactor(0).setDepth(D + 3).setVisible(false).setInteractive({ useHandCursor: true });
      const capturedIdx = i;
      slotBg.on('pointerdown', () => { if (this.callbacks.getWeapon(capturedIdx)) { slotBg.setFillStyle(0x1a2a40); this.callbacks.onShowWeaponPopup(capturedIdx); } });
      slotBg.on('pointerup',   () => { if (this.callbacks.getWeapon(capturedIdx)) slotBg.setFillStyle(0x3a4a60); });
      slotBg.on('pointerover', () => { if (this.callbacks.getWeapon(capturedIdx)) slotBg.setFillStyle(0x3a4a60); });
      slotBg.on('pointerout',  () => slotBg.setFillStyle(this.callbacks.getWeapon(capturedIdx) ? 0x2a3a50 : 0x2a3040));
      this.pokeSlotBgs.push(slotBg);
      this.overlayItems.push(slotBg);

      const img = this.scene.add.image(sx, sy - 4, 'pokemon_001').setDisplaySize(36, 36).setScrollFactor(0).setDepth(D + 4).setVisible(false);
      this.pokeSlotImgs.push(img);
      this.overlayItems.push(img);

      const typeBar = this.scene.add.rectangle(sx, sy + POKE_SLOT_H / 2 - 3, POKE_SLOT_W - 2, 4, 0x000000, 0).setScrollFactor(0).setDepth(D + 5).setVisible(false);
      this.pokeSlotTypes.push(typeBar);
      this.overlayItems.push(typeBar);

      const lv = this.scene.add.text(sx + POKE_SLOT_W / 2 - 2, sy + POKE_SLOT_H / 2 - 2, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 5).setVisible(false);
      this.pokeSlotLvs.push(lv);
      this.overlayItems.push(lv);
    }

    // ── DPS 섹션 ──
    const DMG_TOP    = POKE_TOP + 28 + POKE_SLOT_H + 12;
    const RIGHT_END_X = COL_L + PW - 20;

    addOverlay(this.scene.add.text(COL_L, DMG_TOP + 10, '무기 DPS', { fontSize: '11px', color: '#8888aa' }).setOrigin(0, 0.5));
    addOverlay(this.scene.add.graphics().lineStyle(1, 0x444466).lineBetween(COL_L, DMG_TOP + 20, COL_L + PW - 20, DMG_TOP + 20));
    addOverlay(this.scene.add.graphics().lineStyle(1, 0x444466).lineBetween(CX, DMG_TOP + 20, CX, DMG_TOP + 20 + 3 * 22 + 4));

    for (let i = 0; i < 6; i++) {
      const col   = i < 3 ? 0 : 1;
      const row   = i % 3;
      const ry    = DMG_TOP + 32 + row * 22;
      const nameX = col === 0 ? COL_L  : CX + 4;
      const dpsX  = col === 0 ? CX - 4 : RIGHT_END_X;

      const nameTxt = this.scene.add.text(nameX, ry, '', { fontSize: '12px', color: '#aaaacc' })
        .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      this.dpsNameTexts.push(nameTxt);
      this.overlayItems.push(nameTxt);

      const dpsTxt = this.scene.add.text(dpsX, ry, '', { fontSize: '12px', color: '#eeeeff', fontStyle: 'bold' })
        .setOrigin(1, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      this.dpsDmgTexts.push(dpsTxt);
      this.overlayItems.push(dpsTxt);
    }

    // ── 버튼 ──
    const BTN_TOP  = DMG_TOP + 30 + 3 * 20 + 8;
    const BTN_H2   = 40;
    const BTN_GAP  = 8;
    const BTN_W2   = (PW - 20 - BTN_GAP) / 2;
    const BTN_Y    = BTN_TOP + BTN_H2 / 2;
    const resumeX  = COL_L + BTN_W2 / 2;
    const titleX   = COL_L + BTN_W2 + BTN_GAP + BTN_W2 / 2;

    const resumeBg = this.scene.add.rectangle(resumeX, BTN_Y, BTN_W2, BTN_H2, 0xeeeee0)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false).setInteractive({ useHandCursor: true });
    this.overlayItems.push(resumeBg);
    const resumeTxt = this.scene.add.text(resumeX, BTN_Y, '▶  계속하기', {
      fontSize: '16px', color: '#181810', fontStyle: 'bold', padding: { top: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
    this.overlayItems.push(resumeTxt);

    resumeBg.on('pointerover',  () => { resumeBg.setFillStyle(0xd8d8c8); resumeTxt.setStyle({ color: '#003399', fontSize: '16px', fontStyle: 'bold' }); });
    resumeBg.on('pointerout',   () => { resumeBg.setFillStyle(0xeeeee0); resumeTxt.setStyle({ color: '#181810', fontSize: '16px', fontStyle: 'bold' }); });
    resumeBg.on('pointerdown',  () => { resumeBg.setFillStyle(0xbbbbaa); this.callbacks.onResume(); });
    resumeBg.on('pointerup',    () => resumeBg.setFillStyle(0xd8d8c8));

    const titleBg = this.scene.add.rectangle(titleX, BTN_Y, BTN_W2, BTN_H2, 0xeeeee0)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false).setInteractive({ useHandCursor: true });
    this.overlayItems.push(titleBg);
    const titleTxt = this.scene.add.text(titleX, BTN_Y, '⌂  메인으로', {
      fontSize: '16px', color: '#181810', fontStyle: 'bold', padding: { top: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
    this.overlayItems.push(titleTxt);

    titleBg.on('pointerover',  () => { titleBg.setFillStyle(0xd8d8c8); titleTxt.setStyle({ color: '#003399', fontSize: '16px', fontStyle: 'bold' }); });
    titleBg.on('pointerout',   () => { titleBg.setFillStyle(0xeeeee0); titleTxt.setStyle({ color: '#181810', fontSize: '16px', fontStyle: 'bold' }); });
    titleBg.on('pointerdown',  () => { titleBg.setFillStyle(0xbbbbaa); this.callbacks.onQuit(); });
    titleBg.on('pointerup',    () => titleBg.setFillStyle(0xd8d8c8));

    // 상성표 버튼
    const matchupBtnY = BTN_Y + BTN_H2 / 2 + BTN_GAP + 18;
    const matchupBg = this.scene.add.rectangle(CX, matchupBtnY, PW - 20, 36, 0x1a3355)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false).setInteractive({ useHandCursor: true });
    this.overlayItems.push(matchupBg);
    addOverlay(this.scene.add.graphics().lineStyle(1, 0x3366aa, 0.7).strokeRect(CX - (PW - 20) / 2, matchupBtnY - 18, PW - 20, 36));
    const matchupTxt = this.scene.add.text(CX, matchupBtnY, '⚡ 상성표 보기', {
      fontSize: '14px', color: '#88ccff', fontStyle: 'bold', padding: { top: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
    this.overlayItems.push(matchupTxt);

    matchupBg.on('pointerover', () => { matchupBg.setFillStyle(0x224466); matchupTxt.setColor('#bbddff'); });
    matchupBg.on('pointerout',  () => { matchupBg.setFillStyle(0x1a3355); matchupTxt.setColor('#88ccff'); });
    matchupBg.on('pointerdown', () => {
      this.overlayItems.forEach(obj => (obj as any).setVisible(false));
      this.callbacks.onViewMatchup();
    });

    this.gameCam.ignore(this.overlayItems);
  }

  /** 일시정지 오버레이 표시 (슬롯/DPS 갱신 포함) */
  show(
    weapons: WeaponConfig[],
    weaponLevels: number[],
    passives: Map<PokemonType, number>,
    stats: PlayerStats,
  ) {
    this.overlayItems.forEach(obj => (obj as any).setVisible(true));

    // 스탯 값 fn 세팅
    const statGetters: Array<() => string> = [
      () => `${stats.hp} / ${stats.maxHp}`,
      () => `${stats.attackPower}`,
      () => `${stats.defense}`,
      () => `${stats.moveSpeed}`,
      () => `${Math.round(stats.critChance * 100)}%`,
      () => `${Math.round(stats.evasion * 100)}%`,
      () => `-${Math.round(stats.cooldownReduction * 100)}%`,
      () => `${stats.projectileCount}`,
    ];
    this.statValueFns.forEach(({ text, fn: _oldFn }, i) => {
      const newFn = statGetters[i] ?? (() => '-');
      this.statValueFns[i].fn = newFn;
      text.setText(newFn());
    });

    // 포켓몬 슬롯 갱신
    for (let i = 0; i < 6; i++) {
      const w = weapons[i];
      if (w) {
        const sprKey = `pokemon_${String(w.pokemonId).padStart(3, '0')}`;
        this.pokeSlotBgs[i]?.setFillStyle(0x2a3a50);
        if (this.scene.textures.exists(sprKey)) this.pokeSlotImgs[i]?.setTexture(sprKey).setVisible(true);
        else this.pokeSlotImgs[i]?.setVisible(false);
        this.pokeSlotTypes[i]?.setFillStyle(TYPE_COLORS[w.type] ?? 0x888888, 1);
        this.pokeSlotLvs[i]?.setText(`Lv${weaponLevels[i] ?? 1}`);
      } else {
        this.pokeSlotBgs[i]?.setFillStyle(0x2a3040);
        this.pokeSlotImgs[i]?.setVisible(false);
        this.pokeSlotTypes[i]?.setFillStyle(0x000000, 0);
        this.pokeSlotLvs[i]?.setText('');
      }
    }

    // DPS 갱신
    for (let i = 0; i < 6; i++) {
      const w = weapons[i];
      if (w) {
        const lv  = weaponLevels[i] ?? 1;
        const upg = getUpgradedWeapon(w, lv);
        const cnt = upg.projectileCount ?? 1;
        const dps = Math.round(upg.damage * cnt / (upg.cooldown / 1000));
        this.dpsNameTexts[i]?.setText(w.name);
        this.dpsDmgTexts[i]?.setText(`${dps}`);
      } else {
        this.dpsNameTexts[i]?.setText('');
        this.dpsDmgTexts[i]?.setText('');
      }
    }
  }

  hide() {
    this.overlayItems.forEach(obj => (obj as any).setVisible(false));
  }

  /** 무기 정보 팝업 */
  showWeaponPopup(slotIdx: number, weapon: WeaponConfig, weaponLevel: number) {
    this.closeWeaponPopup();

    const W  = this.scene.scale.width;
    const H  = this.scene.scale.height;
    const PW = W - 40;
    const PH = 220;
    const CX = W / 2;
    const CY = H / 2 - 20;
    const D  = 300;

    const behavior = weapon.behavior ?? 'projectile';
    const behaviorLabel: Record<string, string> = {
      projectile: '투사체', melee: '근접', beam: '빔',
      orbit: '궤도', zone: '장판', lightning: '번개',
      homing: '유도탄', explosion: '폭발', rotating_beam: '회전빔',
      falling: '낙하', nova: '충격파', boomerang: '부메랑',
      scatter: '산탄', trap: '트랩',
    };
    const typeColor = TYPE_COLORS[weapon.type] ?? 0x888888;
    const typeHex   = `#${typeColor.toString(16).padStart(6, '0')}`;

    const push = (...items: Phaser.GameObjects.GameObject[]) => items.forEach(i => this.weaponPopupItems.push(i));

    const overlay = this.scene.add.rectangle(CX, CY, W, H, 0x000000, 0.55).setScrollFactor(0).setDepth(D).setInteractive();
    overlay.on('pointerdown', () => this.closeWeaponPopup());
    push(overlay);

    push(this.scene.add.rectangle(CX, CY, PW + 6, PH + 6, typeColor, 0.4).setScrollFactor(0).setDepth(D + 1));
    push(this.scene.add.rectangle(CX, CY, PW, PH, 0x111827).setScrollFactor(0).setDepth(D + 2));

    const sprKey = `pokemon_${String(weapon.pokemonId).padStart(3, '0')}`;
    const LEFT   = CX - PW / 2 + 16;
    if (this.scene.textures.exists(sprKey)) {
      push(this.scene.add.image(LEFT + 28, CY - 40, sprKey).setDisplaySize(56, 56).setScrollFactor(0).setDepth(D + 3));
    }

    const TX = LEFT + 64;
    push(this.scene.add.text(TX, CY - 68, `${weapon.name}`, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3, padding: { top: 4 } }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));
    push(this.scene.add.text(TX, CY - 46, `Lv.${weaponLevel}`, { fontSize: '13px', color: '#aaddff', fontStyle: 'bold' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));
    push(this.scene.add.text(TX, CY - 28, `  ${weapon.type.toUpperCase()}  `, { fontSize: '11px', color: '#ffffff', fontStyle: 'bold', backgroundColor: typeHex, padding: { x: 4, y: 3 } }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));
    push(this.scene.add.text(TX + 80, CY - 28, `  ${behaviorLabel[behavior]}  `, { fontSize: '11px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#334455', padding: { x: 4, y: 3 } }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));
    push(this.scene.add.graphics().lineStyle(1, typeColor, 0.5).lineBetween(LEFT, CY - 10, CX + PW / 2 - 16, CY - 10).setScrollFactor(0).setDepth(D + 3));
    push(this.scene.add.text(LEFT, CY + 4, weapon.description ?? '', { fontSize: '13px', color: '#ccddcc', lineSpacing: 6, wordWrap: { width: PW - 32 } }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));

    const statParts = [`공격력 ${weapon.damage}`, `쿨다운 ${(weapon.cooldown / 1000).toFixed(1)}s`];
    switch (behavior) {
      case 'melee':         statParts.push(`범위 ${weapon.meleeRange ?? 120}`); break;
      case 'beam':          statParts.push(`길이 ${weapon.beamLength ?? 270}`); break;
      case 'orbit':         statParts.push(`구체 ×${weapon.orbitCount ?? 1}`); break;
      case 'zone':          statParts.push(`반경 ${weapon.zoneRadius ?? 180}`); break;
      case 'lightning':     statParts.push(`체인 ${weapon.lightningChainCount ?? 3}회${(weapon.explosionRadius ?? 0) > 0 ? ` / 스플래시 ${weapon.explosionRadius}` : ''}`); break;
      case 'explosion':     statParts.push(`폭발 반경 ${weapon.explosionRadius ?? 90}`); break;
      case 'rotating_beam': statParts.push(`회전속도 ${((weapon.rotateSpeed ?? 1.8) * 60).toFixed(0)}°/s`); break;
      case 'nova':          statParts.push(`충격 범위 ${weapon.meleeRange ?? 170}`); break;
      case 'boomerang':     statParts.push(`사거리 ${weapon.meleeRange ?? 200}`); break;
      case 'scatter':       statParts.push(`산탄 ×${weapon.projectileCount ?? 8}`); break;
      case 'trap':          statParts.push(`트랩 ×${weapon.fallingCount ?? 2}`); break;
      case 'falling':       statParts.push(`낙하 ×${weapon.fallingCount ?? 3}`); break;
      case 'homing':        statParts.push(`관통 ${weapon.pierce ?? 1}회`); break;
      default:              statParts.push(`투사체 ×${weapon.projectileCount}`); break;
    }
    push(this.scene.add.text(LEFT, CY + 68, statParts.join('  /  '), { fontSize: '12px', color: '#88aacc' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));
    push(this.scene.add.text(CX, CY + PH / 2 - 14, '탭하면 닫힙니다', { fontSize: '11px', color: '#555566' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D + 3));
  }

  closeWeaponPopup() {
    this.weaponPopupItems.forEach(item => item.destroy());
    this.weaponPopupItems = [];
  }

  getOverlayItems() { return this.overlayItems; }

  /** 재사용 시 배열 초기화 */
  reset() {
    this.overlayItems    = [];
    this.pokeSlotBgs     = [];
    this.pokeSlotImgs    = [];
    this.pokeSlotTypes   = [];
    this.pokeSlotLvs     = [];
    this.dpsNameTexts    = [];
    this.dpsDmgTexts     = [];
    this.statValueFns    = [];
    this.weaponPopupItems = [];
  }
}
