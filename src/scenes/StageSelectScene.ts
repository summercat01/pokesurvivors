import Phaser from 'phaser';
import { TYPE_COLORS } from '../data/weapons';
import type { PokemonType } from '../types';

interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  enemyTypes: PokemonType[];
  bgColor: number;
  locked: boolean;
  bgPokemon: string[];
}

const STAGES: StageConfig[] = [
  { id:  1, name: '태초마을',    subtitle: 'Pallet Town',    enemyTypes: ['normal'],               bgColor: 0x2a5c1a, locked: false, bgPokemon: ['pokemon_040', 'pokemon_143', 'pokemon_039'] },
  { id:  2, name: '벌레숲',      subtitle: 'Bug Forest',     enemyTypes: ['bug'],                  bgColor: 0x2d5c1a, locked: false, bgPokemon: ['pokemon_267', 'pokemon_127', 'pokemon_012'] },
  { id:  3, name: '풀밭 지대',   subtitle: 'Grass Fields',   enemyTypes: ['grass'],                bgColor: 0x1a4a10, locked: false, bgPokemon: ['pokemon_254', 'pokemon_003', 'pokemon_389'] },
  { id:  4, name: '불꽃 산지',   subtitle: 'Fire Mountain',  enemyTypes: ['fire'],                 bgColor: 0x8a2010, locked: false, bgPokemon: ['pokemon_006', 'pokemon_059', 'pokemon_157'] },
  { id:  5, name: '수로 지대',   subtitle: 'Water Route',    enemyTypes: ['water'],                bgColor: 0x1a3a8a, locked: false, bgPokemon: ['pokemon_395', 'pokemon_130', 'pokemon_009'] },
  { id:  6, name: '전기 평원',   subtitle: 'Electric Plains', enemyTypes: ['electric'],            bgColor: 0x7a6010, locked: false, bgPokemon: ['pokemon_026', 'pokemon_466', 'pokemon_181'] },
  { id:  7, name: '구름 위',     subtitle: 'Sky Ruins',      enemyTypes: ['flying'],               bgColor: 0x3a6a9a, locked: false, bgPokemon: ['pokemon_398', 'pokemon_142', 'pokemon_227'] },
  { id:  8, name: '독 늪지',     subtitle: 'Poison Marsh',   enemyTypes: ['poison'],               bgColor: 0x5a1a7a, locked: false, bgPokemon: ['pokemon_034', 'pokemon_089', 'pokemon_452'] },
  { id:  9, name: '사막 지대',   subtitle: 'Desert Sands',   enemyTypes: ['ground'],               bgColor: 0x8a5a10, locked: false, bgPokemon: ['pokemon_076', 'pokemon_450', 'pokemon_208'] },
  { id: 10, name: '암석 지대',   subtitle: 'Rocky Cavern',   enemyTypes: ['rock'],                 bgColor: 0x4a4a4a, locked: false, bgPokemon: ['pokemon_248', 'pokemon_409', 'pokemon_306'] },
  { id: 11, name: '격투 도장',   subtitle: 'Fighting Dojo',  enemyTypes: ['fighting'],             bgColor: 0x8a2020, locked: false, bgPokemon: ['pokemon_068', 'pokemon_448', 'pokemon_297'] },
  { id: 12, name: '에스퍼 궁전', subtitle: 'Psychic Palace', enemyTypes: ['psychic'],              bgColor: 0x8a206a, locked: false, bgPokemon: ['pokemon_065', 'pokemon_282', 'pokemon_376'] },
  { id: 13, name: '보라타운',    subtitle: 'Lavender Town',    enemyTypes: ['ghost'],                bgColor: 0x2a0a4a, locked: false, bgPokemon: ['pokemon_094', 'pokemon_429', 'pokemon_477'] },
  { id: 14, name: '강철 공장',   subtitle: 'Steel Factory',  enemyTypes: ['steel'],                bgColor: 0x3a4a5a, locked: false, bgPokemon: ['pokemon_376', 'pokemon_306', 'pokemon_212'] },
  { id: 15, name: '용의 소굴',   subtitle: "Dragon's Den",   enemyTypes: ['dragon'],               bgColor: 0x2a1a7a, locked: false, bgPokemon: ['pokemon_445', 'pokemon_149', 'pokemon_373'] },
  { id: 16, name: '설산',        subtitle: 'Ice Mountain',   enemyTypes: ['ice'],                  bgColor: 0x4a7a9a, locked: false, bgPokemon: ['pokemon_473', 'pokemon_131', 'pokemon_461'] },
  { id: 17, name: '신월섬',      subtitle: 'Newmoon Island',     enemyTypes: ['dark'],                 bgColor: 0x0a0a1a, locked: false, bgPokemon: ['pokemon_442', 'pokemon_262', 'pokemon_197'] },
];

const CARD_H   = 150;
const CARD_GAP = 10;
const CARD_STRIDE = CARD_H + CARD_GAP;

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageSelectScene' });
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0x0d1a2e).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3050, 0.4);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // ── 헤더 (고정) ──
    this.add.text(CX, 36, '스테이지 선택', {
      fontSize: '22px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 5,
      padding: { top: 6 },
    }).setOrigin(0.5).setDepth(10);

    this.add.text(CX, 70, '탐험할 지역을 선택하세요', {
      fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(10);

    // ── 뒤로 버튼 (고정) ──
    const backY  = H - 44;
    const backBg = this.add.rectangle(CX, backY, 160, 40, 0x222233).setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x445566).strokeRect(CX - 80, backY - 20, 160, 40).setDepth(10);
    const backTxt = this.add.text(CX, backY, '← 뒤로', {
      fontSize: '15px', color: '#aaaacc', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    backBg.on('pointerover', () => { backBg.setFillStyle(0x333355); backTxt.setColor('#ffffff'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x222233); backTxt.setColor('#aaaacc'); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    // ── 스크롤 영역 ──
    const SCROLL_TOP = 88;
    const SCROLL_BOT = backY - 16;
    const viewH      = SCROLL_BOT - SCROLL_TOP;
    const totalH     = STAGES.length * CARD_STRIDE;
    const maxScroll  = Math.max(0, totalH - viewH);

    // 마스크
    const maskGfx = this.add.graphics();
    maskGfx.fillRect(0, SCROLL_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGfx);

    // 카드 컨테이너
    const container = this.add.container(0, SCROLL_TOP);
    container.setMask(mask);

    const CARD_W = W - 32;
    // ── 드래그 스크롤 ──
    let lastY      = 0;
    let isDragging = false;
    let scrollY    = 0;
    let hasDragged = false;
    const DRAG_THRESHOLD = 8;

    STAGES.forEach((stage, i) => {
      const cy = i * CARD_STRIDE + CARD_H / 2;
      this.createStageCard(stage, CX, cy, CARD_W, CARD_H, container, () => hasDragged);
    });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < SCROLL_TOP || ptr.y > SCROLL_BOT) return;
      lastY      = ptr.y;
      isDragging = true;
      hasDragged = false;
    });

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const dy = ptr.y - lastY;
      lastY     = ptr.y;
      if (Math.abs(dy) > DRAG_THRESHOLD || hasDragged) {
        hasDragged = true;
        scrollY = Phaser.Math.Clamp(scrollY + dy, -maxScroll, 0);
        container.y = SCROLL_TOP + scrollY;
      }
    });

    this.input.on('pointerup',   () => { isDragging = false; });
    this.input.on('pointerout',  () => { isDragging = false; });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createStageCard(
    stage: StageConfig, cx: number, cy: number,
    cardW: number, cardH: number,
    container: Phaser.GameObjects.Container,
    getHasDragged: () => boolean,
  ) {
    const cardLeft = cx - cardW / 2;
    const cardTop  = cy - cardH / 2;

    // 그림자
    const shadow = this.add.rectangle(cx + 3, cy + 4, cardW + 4, cardH + 4, 0x000000, 0.5);

    // 카드 배경
    const fillColor = stage.locked ? 0x0d0d1a : 0x111827;
    const cardBg    = this.add.rectangle(cx, cy, cardW, cardH, fillColor);
    if (!stage.locked) cardBg.setInteractive({ useHandCursor: true });

    // 타입 컬러 사이드바
    const typeColor = TYPE_COLORS[stage.enemyTypes[0]] ?? 0x888888;
    const sidebar   = this.add.rectangle(cardLeft + 4, cy, 6, cardH - 4, stage.locked ? 0x333333 : typeColor);

    // 테두리
    const outline = this.add.graphics();
    outline.lineStyle(2, stage.locked ? 0x333344 : typeColor, stage.locked ? 0.3 : 0.6);
    outline.strokeRect(cardLeft, cardTop, cardW, cardH);

    container.add([shadow, cardBg, sidebar, outline]);

    if (stage.locked) {
      const lockIcon = this.add.text(cx, cy - 14, '🔒', { fontSize: '28px' }).setOrigin(0.5);
      const lockText = this.add.text(cx, cy + 18, `${stage.name}  —  준비 중`, {
        fontSize: '14px', color: '#555566',
      }).setOrigin(0.5);
      container.add([lockIcon, lockText]);
      return;
    }

    const L = cardLeft + 16;
    const R = cardLeft + cardW - 16;

    // Row 1: STAGE 배지 + 이름
    const row1Y = cardTop + 26;
    const badge = this.add.rectangle(L + 32, row1Y, 64, 22, typeColor, 0.9);
    const badgeTxt = this.add.text(L + 32, row1Y, `STAGE ${stage.id}`, {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      padding: { top: 2 },
    }).setOrigin(0.5);

    const nameTxt = this.add.text(L + 72, row1Y, stage.name, {
      fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
      padding: { top: 4 },
    }).setOrigin(0, 0.5);

    // Row 2: 영문명
    const subtitleTxt = this.add.text(L + 72, cardTop + 56, stage.subtitle, {
      fontSize: '15px', color: '#aabbdd', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // 구분선
    const line = this.add.graphics().lineStyle(1, 0x2a3a50)
      .lineBetween(L, cardTop + 76, R, cardTop + 76);

    // Row 3: 출현 타입 라벨
    const typeLabel = this.add.text(L, cardTop + 97, '출현 타입', {
      fontSize: '13px', color: '#7788aa',
    }).setOrigin(0, 0.5);

    // Row 4: 타입 배지들
    const typeBadges: Phaser.GameObjects.Text[] = [];
    let bx = 0;
    stage.enemyTypes.forEach(t => {
      const hex   = `#${(TYPE_COLORS[t] ?? 0x888888).toString(16).padStart(6, '0')}`;
      const tbadge = this.add.text(L + bx, cardTop + 124, `  ${t.toUpperCase()}  `, {
        fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: hex,
        padding: { x: 6, y: 4 },
      }).setOrigin(0, 0.5);
      typeBadges.push(tbadge);
      bx += tbadge.width + 8;
    });

    // 포켓몬 미리보기
    const pkmImages: Phaser.GameObjects.Image[] = [];
    const shown = stage.bgPokemon.filter(k => this.textures.exists(k)).slice(0, 2);
    shown.forEach((key, idx) => {
      const img = this.add.image(R - idx * 56, cy - 4, key)
        .setDisplaySize(60, 60)
        .setOrigin(1, 0.5)
        .setAlpha(0.55 - idx * 0.15);
      pkmImages.push(img);
    });

    container.add([badge, badgeTxt, nameTxt, subtitleTxt, line, typeLabel, ...typeBadges, ...pkmImages]);

    // 호버 / 클릭
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
    cardBg.on('pointerup', () => {
      if (getHasDragged()) return;
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CharacterSelectScene', { stageId: stage.id });
      });
    });
  }
}
