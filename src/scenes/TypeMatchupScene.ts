import Phaser from 'phaser';
import type { PokemonType } from '../types';
import type { GameScene } from './GameScene';
import { TYPE_COLORS } from '../data/weapons';
import { TYPE_KR } from '../constants/typeLabels';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';

// ===== Gen IV 타입 상성 테이블 =====
const TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel',
];

// 컬럼 헤더용 1~2자 약칭
const TYPE_ABBR: Record<PokemonType, string> = {
  normal: '노', fire: '불', water: '물', grass: '풀',
  electric: '전', ice: '얼', fighting: '격', poison: '독',
  ground: '땅', flying: '비', psychic: '에', bug: '벌',
  rock: '바', ghost: '고', dragon: '드', dark: '악', steel: '강',
};

// 공격 → 방어 배율 (1이 아닌 것만)
const TYPE_CHART: Partial<Record<PokemonType, Partial<Record<PokemonType, number>>>> = {
  normal:   { rock: 0.5, steel: 0.5, ghost: 0 },
  fire:     { fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5, grass: 2, ice: 2, bug: 2, steel: 2 },
  water:    { water: 0.5, grass: 0.5, dragon: 0.5, fire: 2, ground: 2, rock: 2 },
  grass:    { fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5, water: 2, ground: 2, rock: 2 },
  electric: { electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0, water: 2, flying: 2 },
  ice:      { water: 0.5, ice: 0.5, steel: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2 },
  fighting: { poison: 0.5, bug: 0.5, psychic: 0.5, flying: 0.5, ghost: 0, normal: 2, rock: 2, steel: 2, ice: 2, dark: 2 },
  poison:   { poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, grass: 2 },
  ground:   { grass: 0.5, bug: 0.5, flying: 0, fire: 2, electric: 2, poison: 2, rock: 2, steel: 2 },
  flying:   { rock: 0.5, steel: 0.5, electric: 0.5, grass: 2, fighting: 2, bug: 2 },
  psychic:  { psychic: 0.5, steel: 0.5, dark: 0, fighting: 2, poison: 2 },
  bug:      { fire: 0.5, fighting: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, grass: 2, psychic: 2, dark: 2 },
  rock:     { fighting: 0.5, ground: 0.5, steel: 0.5, fire: 2, ice: 2, flying: 2, bug: 2 },
  ghost:    { normal: 0, dark: 0.5, ghost: 2, psychic: 2 },
  dragon:   { steel: 0.5, dragon: 2 },
  dark:     { fighting: 0.5, dark: 0.5, steel: 0.5, ghost: 2, psychic: 2 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5, ice: 2, rock: 2 },
};

function getEffectiveness(atk: PokemonType, def: PokemonType): number {
  return TYPE_CHART[atk]?.[def] ?? 1;
}

// 타입 색상을 좀 더 밝게 만들어 헤더용으로 사용
function dimColor(hex: number, factor = 0.45): number {
  const r = Math.round(((hex >> 16) & 0xff) * factor);
  const g = Math.round(((hex >> 8)  & 0xff) * factor);
  const b = Math.round((hex         & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export class TypeMatchupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TypeMatchupScene' });
  }

  create(data?: { caller?: string }) {
    const W          = this.scale.width;
    const H          = this.scale.height;
    const CX         = W / 2;
    const caller     = data?.caller ?? 'TitleScene';
    const HEADER_H   = 54;
    const LEGEND_H   = 44;
    const CONTENT_TOP = HEADER_H + LEGEND_H;

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0xe8e8d8).setOrigin(0, 0);

    // ── 헤더 (포켓몬 스타일) ──
    PokeUI.panel(this, CX, HEADER_H / 2, W - 4, HEADER_H, PokePalette.headerBg, 10);
    this.add.text(CX, 18, '타입 상성표', {
      fontFamily: POKE_FONT, fontSize: '16px', color: PokePalette.textWhite, fontStyle: 'bold',
      stroke: '#101840', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    this.add.text(CX, 40, '↓ 공격 타입   →  방어 타입', {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#aaccff',
    }).setOrigin(0.5).setDepth(11);

    // ── 뒤로 버튼 ──
    const backBg = this.add.rectangle(48, HEADER_H / 2, 88, 40, PokePalette.btnNormal)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder).strokeRect(4, HEADER_H / 2 - 20, 88, 40).setDepth(12);
    const backTxt = this.add.text(48, HEADER_H / 2, '← 뒤로', {
      fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textDark,
    }).setOrigin(0.5).setDepth(13);
    backBg.on('pointerover',  () => { backBg.setFillStyle(PokePalette.btnHover); backTxt.setColor('#003399'); });
    backBg.on('pointerout',   () => { backBg.setFillStyle(PokePalette.btnNormal); backTxt.setColor(PokePalette.textDark); });
    backBg.on('pointerdown', () => {
      if (caller === 'GameScene') {
        this.scene.stop('TypeMatchupScene');
        const gs = this.scene.get('GameScene') as unknown as GameScene;
        gs.pauseGame();
      } else {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(caller));
      }
    });

    // ── 범례 (포켓몬 스타일) ──
    this.add.rectangle(CX, HEADER_H + LEGEND_H / 2, W, LEGEND_H, PokePalette.panelBg, 1).setDepth(10);
    this.add.graphics().lineStyle(1, PokePalette.panelBorder, 0.3)
      .lineBetween(0, HEADER_H + LEGEND_H, W, HEADER_H + LEGEND_H).setDepth(10);

    const legends: Array<{ sym: string; label: string; symColor: string; bg: number }> = [
      { sym: '◎',  label: '2배 (효과적)',   symColor: '#228833', bg: 0xd0f0d0 },
      { sym: '▽',  label: '½배 (반감)',     symColor: '#cc4422', bg: 0xf8d8d0 },
      { sym: '✕',  label: '0배 (무효)',     symColor: '#888888', bg: 0xe0ddd0 },
      { sym: '·',  label: '1배',            symColor: PokePalette.textGray, bg: PokePalette.panelBg },
    ];
    const LEG_W = (W - 16) / 4;
    legends.forEach((leg, i) => {
      const lx = 8 + LEG_W * i + LEG_W / 2;
      const ly = HEADER_H + LEGEND_H / 2;
      this.add.rectangle(lx, ly, LEG_W - 4, LEGEND_H - 10, leg.bg).setDepth(11)
        .setStrokeStyle(1, PokePalette.panelBorder, 0.4);
      this.add.text(lx, ly - 7, leg.sym, {
        fontFamily: POKE_FONT, fontSize: '12px', color: leg.symColor, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(12);
      this.add.text(lx, ly + 8, leg.label, {
        fontFamily: POKE_FONT, fontSize: '8px', color: PokePalette.textGray,
      }).setOrigin(0.5).setDepth(12);
    });

    // ── 테이블 레이아웃 ──
    const N        = TYPES.length;  // 17
    const LABEL_W  = 48;
    const COL_H    = 28;   // 컬럼 헤더 높이 (더 넓게)
    const CELL_W   = Math.floor((W - LABEL_W) / N);   // ≈ 20
    const CELL_H   = 22;

    const tableH    = COL_H + N * CELL_H;
    const CONTENT_H = H - CONTENT_TOP;
    let   scrollY   = 0;
    const maxScroll = Math.max(0, tableH - CONTENT_H);

    // 마스크
    const maskGfx = this.add.graphics().fillStyle(0xffffff)
      .fillRect(0, CONTENT_TOP, W, CONTENT_H);
    maskGfx.setVisible(false);
    const mask = maskGfx.createGeometryMask();

    // 컨테이너
    const container = this.add.container(0, CONTENT_TOP).setDepth(5);
    container.setMask(mask);

    // ── 컬럼 헤더 (방어 타입) ──
    TYPES.forEach((defType, ci) => {
      const cx2      = LABEL_W + ci * CELL_W + CELL_W / 2;
      const cy2      = COL_H / 2;
      const typeColor = TYPE_COLORS[defType] ?? 0x444444;
      const bgColor   = dimColor(typeColor, 0.55);

      const bg = this.add.rectangle(cx2, cy2, CELL_W - 1, COL_H - 1, bgColor);
      const stripe = this.add.rectangle(cx2, cy2 + COL_H / 2 - 2, CELL_W - 1, 2, typeColor, 0.9);
      const txt = this.add.text(cx2, cy2 + 1, TYPE_ABBR[defType], {
        fontFamily: POKE_FONT, fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      container.add([bg, stripe, txt]);
    });

    // 좌상단 빈 셀
    const cornerBg = this.add.rectangle(LABEL_W / 2, COL_H / 2, LABEL_W - 1, COL_H - 1, PokePalette.panelBorder);
    container.add(cornerBg);

    // ── 행 (공격 타입) ──
    TYPES.forEach((atkType, ri) => {
      const rowY      = COL_H + ri * CELL_H;
      const typeColor  = TYPE_COLORS[atkType] ?? 0x444444;
      const rowBg      = ri % 2 === 0 ? PokePalette.panelBg : 0xe8e4d8;

      // 행 배경
      const rbg = this.add.rectangle(W / 2, rowY + CELL_H / 2, W, CELL_H - 1, rowBg);
      container.add(rbg);

      // 행 레이블 배경 (타입 색상, 밝게)
      const lblBgColor = dimColor(typeColor, 0.60);
      const labelBg = this.add.rectangle(LABEL_W / 2, rowY + CELL_H / 2, LABEL_W - 1, CELL_H - 1, lblBgColor);
      const labelStripe = this.add.rectangle(2, rowY + CELL_H / 2, 4, CELL_H - 1, typeColor, 0.9);
      const labelTxt = this.add.text(LABEL_W / 2 + 2, rowY + CELL_H / 2 + 1, TYPE_KR[atkType], {
        fontFamily: POKE_FONT, fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      container.add([labelBg, labelStripe, labelTxt]);

      // ── 셀 ──
      TYPES.forEach((defType, ci) => {
        const cx2 = LABEL_W + ci * CELL_W + CELL_W / 2;
        const cy2 = rowY + CELL_H / 2;
        const eff  = getEffectiveness(atkType, defType);

        let bgColor: number;
        let sym: string;
        let symColor: string;
        let symSize: string;

        if (eff === 2) {
          bgColor  = 0xc0ecc0;
          sym      = '◎';
          symColor = '#228833';
          symSize  = '12px';
        } else if (eff === 0.5) {
          bgColor  = 0xf0d0c8;
          sym      = '▽';
          symColor = '#cc4422';
          symSize  = '10px';
        } else if (eff === 0) {
          bgColor  = 0xd8d5c8;
          sym      = '✕';
          symColor = '#888880';
          symSize  = '10px';
        } else {
          bgColor  = 0x00000000;
          sym      = '·';
          symColor = PokePalette.textGray;
          symSize  = '14px';
        }

        if (eff !== 1) {
          const cell = this.add.rectangle(cx2, cy2, CELL_W - 1, CELL_H - 1, bgColor);
          container.add(cell);
        }
        const cellTxt = this.add.text(cx2, cy2 + 1, sym, {
          fontFamily: POKE_FONT, fontSize: symSize, color: symColor, fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(cellTxt);
      });
    });

    // ── 스크롤 ──
    const applyScroll = (dy: number) => {
      scrollY = Phaser.Math.Clamp(scrollY + dy, 0, maxScroll);
      container.setY(CONTENT_TOP - scrollY);
    };

    this.input.on('wheel', (...args: unknown[]) => applyScroll((args[3] as number) * 0.5));

    let dragStartY = 0, dragStartScroll = 0;
    const scrollArea = this.add.rectangle(CX, CONTENT_TOP + CONTENT_H / 2, W, CONTENT_H, 0xffffff, 0)
      .setDepth(6).setInteractive();
    scrollArea.on('pointerdown', (ptr: Phaser.Input.Pointer) => { dragStartY = ptr.y; dragStartScroll = scrollY; });
    scrollArea.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (ptr.isDown) applyScroll(dragStartScroll + (dragStartY - ptr.y) - scrollY);
    });
  }
}
