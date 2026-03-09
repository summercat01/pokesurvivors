import Phaser from 'phaser';
import { TYPE_COLORS } from '../data/weapons';

interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  enemyTypes: string[];
  bgColor: number;
  locked: boolean;
  bgPokemon: string[];
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    name: '태초마을',
    subtitle: 'Pallet Town',
    enemyTypes: ['normal'],
    bgColor: 0x2a5c1a,
    locked: false,
    bgPokemon: ['pokemon_001', 'pokemon_004', 'pokemon_007', 'pokemon_025'],
  },
  {
    id: 2,
    name: '1번 도로',
    subtitle: 'Route 1',
    enemyTypes: ['normal', 'flying'],
    bgColor: 0x1a3a5c,
    locked: true,
    bgPokemon: [],
  },
  {
    id: 3,
    name: '달맞이산',
    subtitle: 'Mt. Moon',
    enemyTypes: ['rock', 'poison'],
    bgColor: 0x2a1a4a,
    locked: true,
    bgPokemon: [],
  },
];

export class StageSelectScene extends Phaser.Scene {
  private stageId: number = 1;

  constructor() {
    super({ key: 'StageSelectScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const CX = W / 2;

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0x0d1a2e).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3050, 0.4);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // ── 헤더 ──
    this.add.text(CX, 36, '스테이지 선택', {
      fontSize: '22px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 5,
      padding: { top: 6 },
    }).setOrigin(0.5);

    this.add.text(CX, 70, '탐험할 지역을 선택하세요', {
      fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // ── 스테이지 카드 ──
    const CARD_W = W - 32;
    const CARD_H = 150;
    const CARD_GAP = 12;
    const startY = 92;

    STAGES.forEach((stage, i) => {
      const cy = startY + i * (CARD_H + CARD_GAP) + CARD_H / 2;
      this.createStageCard(stage, CX, cy, CARD_W, CARD_H);
    });

    // ── 뒤로 버튼 ──
    const backY = H - 44;
    const backBg = this.add.rectangle(CX, backY, 160, 40, 0x222233)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x445566).strokeRect(CX - 80, backY - 20, 160, 40);
    const backTxt = this.add.text(CX, backY, '← 뒤로', {
      fontSize: '15px', color: '#aaaacc', fontStyle: 'bold',
    }).setOrigin(0.5);

    backBg.on('pointerover', () => { backBg.setFillStyle(0x333355); backTxt.setColor('#ffffff'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x222233); backTxt.setColor('#aaaacc'); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createStageCard(stage: StageConfig, cx: number, cy: number, cardW: number, cardH: number) {
    const W = this.scale.width;
    const cardLeft = cx - cardW / 2;
    const cardTop  = cy - cardH / 2;
    const cardBot  = cy + cardH / 2;

    // 그림자
    this.add.rectangle(cx + 3, cy + 4, cardW + 4, cardH + 4, 0x000000, 0.5);

    // 카드 배경
    const fillColor = stage.locked ? 0x0d0d1a : 0x111827;
    const cardBg = this.add.rectangle(cx, cy, cardW, cardH, fillColor);
    if (!stage.locked) cardBg.setInteractive({ useHandCursor: true });

    // 왼쪽 타입 컬러 사이드바
    const typeColor = TYPE_COLORS[stage.enemyTypes[0] as any] ?? 0x888888;
    this.add.rectangle(cardLeft + 4, cy, 6, cardH - 4, stage.locked ? 0x333333 : typeColor);

    // 테두리
    const outline = this.add.graphics();
    outline.lineStyle(2, stage.locked ? 0x333344 : typeColor, stage.locked ? 0.3 : 0.6);
    outline.strokeRect(cardLeft, cardTop, cardW, cardH);

    if (stage.locked) {
      // ── 잠김 상태 ──
      this.add.text(cx, cy - 14, '🔒', { fontSize: '28px' }).setOrigin(0.5);
      this.add.text(cx, cy + 18, `${stage.name}  —  준비 중`, {
        fontSize: '14px', color: '#555566',
      }).setOrigin(0.5);
      return;
    }

    const L = cardLeft + 16;  // 왼쪽 여백
    const R = cardLeft + cardW - 16; // 오른쪽 끝

    // ── Row 1 (cardTop + 26): STAGE 배지 + 맵 이름 ──
    const row1Y = cardTop + 26;
    this.add.rectangle(L + 32, row1Y, 64, 22, typeColor, 0.9);
    this.add.text(L + 32, row1Y, `STAGE ${stage.id}`, {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      padding: { top: 2 },
    }).setOrigin(0.5);

    this.add.text(L + 72, row1Y, stage.name, {
      fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
      padding: { top: 4 },
    }).setOrigin(0, 0.5);

    // ── Row 2 (cardTop + 56): 영문 지역명 ──
    this.add.text(L + 72, cardTop + 56, stage.subtitle, {
      fontSize: '15px', color: '#aabbdd', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // ── 구분선 ──
    this.add.graphics().lineStyle(1, 0x2a3a50)
      .lineBetween(L, cardTop + 76, R, cardTop + 76);

    // ── Row 3 (cardTop + 97): 출현 타입 라벨 ──
    this.add.text(L, cardTop + 97, '출현 타입', {
      fontSize: '13px', color: '#7788aa',
    }).setOrigin(0, 0.5);

    // ── Row 4 (cardTop + 124): 타입 뱃지 ──
    let bx = 0;
    stage.enemyTypes.forEach(t => {
      const hex = `#${(TYPE_COLORS[t as any] ?? 0x888888).toString(16).padStart(6, '0')}`;
      const badge = this.add.text(L + bx, cardTop + 124, `  ${t.toUpperCase()}  `, {
        fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: hex,
        padding: { x: 6, y: 4 },
      }).setOrigin(0, 0.5);
      bx += badge.width + 8;
    });

    // ── 포켓몬 미리보기 (오른쪽 세로 중앙) ──
    const shown = stage.bgPokemon.filter(k => this.textures.exists(k)).slice(0, 2);
    shown.forEach((key, idx) => {
      this.add.image(R - idx * 56, cy - 4, key)
        .setDisplaySize(60, 60)
        .setOrigin(1, 0.5)
        .setAlpha(0.55 - idx * 0.15);
    });

    // ── 호버 / 클릭 ──
    cardBg.on('pointerover', () => {
      cardBg.setFillStyle(0x1a2840);
      outline.clear();
      outline.lineStyle(2, typeColor, 1.0);
      outline.strokeRect(cardLeft, cardTop, cardW, cardH);
    });
    cardBg.on('pointerout', () => {
      cardBg.setFillStyle(0x111827);
      outline.clear();
      outline.lineStyle(2, typeColor, 0.6);
      outline.strokeRect(cardLeft, cardTop, cardW, cardH);
    });
    cardBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CharacterSelectScene', { stageId: stage.id });
      });
    });
  }
}
