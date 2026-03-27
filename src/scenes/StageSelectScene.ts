import Phaser from 'phaser';
import { TYPE_COLORS } from '../data/weapons';
import type { PokemonType } from '../types';
import { isStageUnlocked, isStageCleared } from '../lib/stageProgress';
import { getBgmVolume } from '../lib/storage';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';

interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  enemyTypes: PokemonType[];
  bgColor: number;
  bgPokemon: string[];
}

const STAGES: StageConfig[] = [
  { id:  1, name: '태초마을',    subtitle: 'Pallet Town',    enemyTypes: ['normal'],               bgColor: 0x2a5c1a, bgPokemon: ['pokemon_040', 'pokemon_143', 'pokemon_039'] },
  { id:  2, name: '벌레숲',      subtitle: 'Bug Forest',     enemyTypes: ['bug'],                  bgColor: 0x2d5c1a, bgPokemon: ['pokemon_267', 'pokemon_127', 'pokemon_012'] },
  { id:  3, name: '풀밭 지대',   subtitle: 'Grass Fields',   enemyTypes: ['grass'],                bgColor: 0x1a4a10, bgPokemon: ['pokemon_254', 'pokemon_003', 'pokemon_389'] },
  { id:  4, name: '불꽃 산지',   subtitle: 'Fire Mountain',  enemyTypes: ['fire'],                 bgColor: 0x8a2010, bgPokemon: ['pokemon_006', 'pokemon_059', 'pokemon_157'] },
  { id:  5, name: '수로 지대',   subtitle: 'Water Route',    enemyTypes: ['water'],                bgColor: 0x1a3a8a, bgPokemon: ['pokemon_395', 'pokemon_130', 'pokemon_009'] },
  { id:  6, name: '전기 평원',   subtitle: 'Electric Plains', enemyTypes: ['electric'],            bgColor: 0x7a6010, bgPokemon: ['pokemon_026', 'pokemon_466', 'pokemon_181'] },
  { id:  7, name: '구름 위',     subtitle: 'Sky Ruins',      enemyTypes: ['flying'],               bgColor: 0x3a6a9a, bgPokemon: ['pokemon_398', 'pokemon_142', 'pokemon_227'] },
  { id:  8, name: '독 늪지',     subtitle: 'Poison Marsh',   enemyTypes: ['poison'],               bgColor: 0x5a1a7a, bgPokemon: ['pokemon_034', 'pokemon_089', 'pokemon_452'] },
  { id:  9, name: '사막 지대',   subtitle: 'Desert Sands',   enemyTypes: ['ground'],               bgColor: 0x8a5a10, bgPokemon: ['pokemon_076', 'pokemon_450', 'pokemon_208'] },
  { id: 10, name: '암석 지대',   subtitle: 'Rocky Cavern',   enemyTypes: ['rock'],                 bgColor: 0x4a4a4a, bgPokemon: ['pokemon_248', 'pokemon_409', 'pokemon_306'] },
  { id: 11, name: '격투 도장',   subtitle: 'Fighting Dojo',  enemyTypes: ['fighting'],             bgColor: 0x8a2020, bgPokemon: ['pokemon_068', 'pokemon_448', 'pokemon_297'] },
  { id: 12, name: '에스퍼 궁전', subtitle: 'Psychic Palace', enemyTypes: ['psychic'],              bgColor: 0x8a206a, bgPokemon: ['pokemon_065', 'pokemon_282', 'pokemon_376'] },
  { id: 13, name: '보라타운',    subtitle: 'Lavender Town',    enemyTypes: ['ghost'],                bgColor: 0x2a0a4a, bgPokemon: ['pokemon_094', 'pokemon_429', 'pokemon_477'] },
  { id: 14, name: '강철 공장',   subtitle: 'Steel Factory',  enemyTypes: ['steel'],                bgColor: 0x3a4a5a, bgPokemon: ['pokemon_376', 'pokemon_306', 'pokemon_212'] },
  { id: 15, name: '용의 소굴',   subtitle: "Dragon's Den",   enemyTypes: ['dragon'],               bgColor: 0x2a1a7a, bgPokemon: ['pokemon_445', 'pokemon_149', 'pokemon_373'] },
  { id: 16, name: '설산',        subtitle: 'Ice Mountain',   enemyTypes: ['ice'],                  bgColor: 0x4a7a9a, bgPokemon: ['pokemon_473', 'pokemon_131', 'pokemon_461'] },
  { id: 17, name: '신월섬',      subtitle: 'Newmoon Island',     enemyTypes: ['dark'],                 bgColor: 0x0a0a1a, bgPokemon: ['pokemon_442', 'pokemon_262', 'pokemon_197'] },
];


interface CardControl {
  select: () => void;
  deselect: () => void;
}

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageSelectScene' });
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    // BGM
    const vol = getBgmVolume() * 0.5;
    if (this.cache.audio.exists('bgm_select') && !this.sound.get('bgm_select')?.isPlaying) {
      this.sound.stopAll();
      const play = () => { if (this.cache.audio.exists('bgm_select')) this.sound.play('bgm_select', { loop: true, volume: vol }); };
      if ((this.sound as any).locked) { this.sound.once('unlocked', play); } else { play(); }
    }

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0xe8e8d8).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0xd0d0c0, 0.5);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // ── 헤더 (포켓몬 스타일) ──
    PokeUI.panel(this, CX, 36, W - 4, 66, PokePalette.headerBg, 9);
    this.add.text(CX, 24, '스테이지 선택', {
      fontFamily: POKE_FONT, fontSize: '16px', color: PokePalette.textWhite, fontStyle: 'bold',
      stroke: '#101840', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);
    this.add.text(CX, 50, '탐험할 지역을 선택하세요', {
      fontFamily: POKE_FONT, fontSize: '10px', color: '#aaccff',
    }).setOrigin(0.5).setDepth(10);

    // ── 하단 버튼 2개: [뒤로] [다음] ──
    const BTN_Y  = H - 44;
    const BTN_W  = Math.floor((W - 20) / 2) - 4;
    const backX  = CX - BTN_W / 2 - 4;
    const nextX  = CX + BTN_W / 2 + 4;

    // 뒤로 버튼 (포켓몬 스타일)
    const backBg = this.add.rectangle(backX, BTN_Y, BTN_W, 40, PokePalette.btnNormal).setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder)
      .strokeRect(backX - BTN_W / 2, BTN_Y - 20, BTN_W, 40).setDepth(10);
    const backTxt = this.add.text(backX, BTN_Y, '← 뒤로', {
      fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textDark,
    }).setOrigin(0.5).setDepth(11);

    backBg.on('pointerover', () => { backBg.setFillStyle(PokePalette.btnHover); backTxt.setColor('#003399'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(PokePalette.btnNormal); backTxt.setColor(PokePalette.textDark); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    // 다음 버튼 (포켓몬 스타일)
    const nextBg = this.add.rectangle(nextX, BTN_Y, BTN_W, 40, PokePalette.btnPrimary).setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder)
      .strokeRect(nextX - BTN_W / 2, BTN_Y - 20, BTN_W, 40).setDepth(10);
    const nextTxt = this.add.text(nextX, BTN_Y, '다음 →', {
      fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textWhite,
    }).setOrigin(0.5).setDepth(11);

    nextBg.on('pointerover', () => { nextBg.setFillStyle(0x3366cc); });
    nextBg.on('pointerout',  () => { nextBg.setFillStyle(PokePalette.btnPrimary); });
    nextBg.on('pointerdown', () => {
      if (selectedStageId === 0) return;
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.sleep();
        this.scene.launch('CharacterSelectScene', { stageId: selectedStageId });
      });
    });

    // ── 카드 크기 (화면 높이 기반 반응형) ──
    const CARD_H      = Math.round(Math.max(130, H * 0.17));
    const CARD_GAP    = 10;
    const CARD_STRIDE = CARD_H + CARD_GAP;

    // ── 스크롤 영역 ──
    const SCROLL_TOP = 88;
    const SCROLL_BOT = BTN_Y - 16;
    const viewH      = SCROLL_BOT - SCROLL_TOP;
    const totalH     = STAGES.length * CARD_STRIDE;
    const maxScroll  = Math.max(0, totalH - viewH);

    const maskGfx = this.add.graphics();
    maskGfx.fillRect(0, SCROLL_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGfx);

    const container = this.add.container(0, SCROLL_TOP);
    container.setMask(mask);

    const CARD_W = W - 32;

    // 선택 상태
    const firstUnlocked = STAGES.find(s => isStageUnlocked(s.id))?.id ?? 0;
    let selectedStageId = firstUnlocked;
    const cardControls: Map<number, CardControl> = new Map();

    const selectStage = (id: number) => {
      cardControls.get(selectedStageId)?.deselect();
      selectedStageId = id;
      cardControls.get(id)?.select();
    };

    // ── 드래그 스크롤 ──
    let lastY      = 0;
    let isDragging = false;
    let scrollY    = 0;
    let hasDragged = false;
    const DRAG_THRESHOLD = 8;

    STAGES.forEach((stage, i) => {
      const cy = i * CARD_STRIDE + CARD_H / 2;
      const ctrl = this.createStageCard(stage, CX, cy, CARD_W, CARD_H, container, () => hasDragged, () => selectStage(stage.id));
      if (ctrl) cardControls.set(stage.id, ctrl);
    });

    // 초기 선택 하이라이트
    if (selectedStageId > 0) cardControls.get(selectedStageId)?.select();

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
    this.events.once('shutdown', () => this.input.removeAllListeners());
    this.events.on('wake', () => { this.cameras.main.fadeIn(300, 0, 0, 0); });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createStageCard(
    stage: StageConfig, cx: number, cy: number,
    cardW: number, cardH: number,
    container: Phaser.GameObjects.Container,
    getHasDragged: () => boolean,
    onSelect: () => void,
  ): CardControl | null {
    const unlocked = isStageUnlocked(stage.id);
    const cleared  = isStageCleared(stage.id);

    const cardLeft = cx - cardW / 2;
    const cardTop  = cy - cardH / 2;

    const shadow  = this.add.rectangle(cx + 3, cy + 4, cardW + 4, cardH + 4, 0x000000, 0.2);
    const fillColor = unlocked ? PokePalette.panelBg : 0xe0ddd0;
    const cardBorder = this.add.rectangle(cx, cy, cardW, cardH, PokePalette.panelBorder);
    const cardBg    = this.add.rectangle(cx, cy, cardW - 6, cardH - 6, fillColor);
    if (unlocked) cardBg.setInteractive({ useHandCursor: true });

    const typeColor = TYPE_COLORS[stage.enemyTypes[0]] ?? 0x888888;
    // 좌측 타입 스트라이프
    const stripeG = this.add.graphics();
    stripeG.fillStyle(unlocked ? typeColor : 0xb8b5a8, 1);
    stripeG.fillRect(cardLeft + 3, cardTop + 3, 10, cardH - 6);

    const outline = this.add.graphics();

    container.add([shadow, cardBorder, cardBg, stripeG, outline]);

    if (!unlocked) {
      const lockIcon = this.add.text(cx, cy - 14, '🔒', { fontSize: '28px' }).setOrigin(0.5);
      const lockText = this.add.text(cx, cy + 18, `${stage.name}  —  STAGE ${stage.id - 1} 클리어 필요`, {
        fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textGray,
      }).setOrigin(0.5);
      container.add([lockIcon, lockText]);
      return null;
    }

    const L = cardLeft + 20;
    const R = cardLeft + cardW - 16;

    const row1Y = cardTop + 26;
    const badge    = this.add.rectangle(L + 32, row1Y, 64, 20, typeColor, 0.9);
    const badgeTxt = this.add.text(L + 32, row1Y, `STAGE ${stage.id}`, {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const nameTxt = this.add.text(L + 72, row1Y, stage.name, {
      fontFamily: POKE_FONT, fontSize: '20px', color: PokePalette.textDark, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const subtitleTxt = this.add.text(L + 72, cardTop + 52, stage.subtitle, {
      fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textGray,
    }).setOrigin(0, 0.5);

    const line = this.add.graphics().lineStyle(1, 0x989880, 0.5)
      .lineBetween(L, cardTop + 70, R, cardTop + 70);

    const typeLabel = this.add.text(L, cardTop + 86, '출현 타입', {
      fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.textGray,
    }).setOrigin(0, 0.5);

    const typeBadges: Phaser.GameObjects.Text[] = [];
    let bx = 0;
    stage.enemyTypes.forEach(t => {
      const hex    = `#${(TYPE_COLORS[t] ?? 0x888888).toString(16).padStart(6, '0')}`;
      const tbadge = this.add.text(L + bx, cardTop + 110, `  ${t.toUpperCase()}  `, {
        fontFamily: POKE_FONT, fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: hex, padding: { x: 4, y: 3 },
      }).setOrigin(0, 0.5);
      typeBadges.push(tbadge);
      bx += tbadge.width + 6;
    });

    const pkmImages: Phaser.GameObjects.Image[] = [];
    const shown = stage.bgPokemon.filter(k => this.textures.exists(k)).slice(0, 2);
    shown.forEach((key, idx) => {
      const img = this.add.image(R - idx * 56, cy - 4, key)
        .setDisplaySize(60, 60).setOrigin(1, 0.5).setAlpha(0.45 - idx * 0.12);
      pkmImages.push(img);
    });

    const clearItems: Phaser.GameObjects.GameObject[] = [];
    if (cleared) {
      const clearBg  = this.add.rectangle(R - 28, cardTop + 16, 60, 20, 0x228833, 0.9);
      const clearTxt = this.add.text(R - 28, cardTop + 16, '✓ CLEAR', {
        fontFamily: POKE_FONT, fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      clearItems.push(clearBg, clearTxt);
    }

    container.add([badge, badgeTxt, nameTxt, subtitleTxt, line, typeLabel, ...typeBadges, ...pkmImages, ...clearItems]);

    // 선택 하이라이트 오버레이
    const selOverlay = this.add.graphics();
    container.add(selOverlay);

    const select = () => {
      cardBg.setFillStyle(PokePalette.btnHover);
      selOverlay.clear();
      selOverlay.fillStyle(0x3050a0, 0.12);
      selOverlay.fillRect(cardLeft + 3, cardTop + 3, cardW - 6, cardH - 6);
      selOverlay.lineStyle(3, PokePalette.headerBg, 1.0);
      selOverlay.strokeRect(cardLeft, cardTop, cardW, cardH);
    };
    const deselect = () => {
      cardBg.setFillStyle(PokePalette.panelBg);
      selOverlay.clear();
    };

    cardBg.on('pointerover', () => {
      selOverlay.clear();
      selOverlay.fillStyle(0x3050a0, 0.07);
      selOverlay.fillRect(cardLeft + 3, cardTop + 3, cardW - 6, cardH - 6);
    });
    cardBg.on('pointerout', () => {
      selOverlay.clear();
    });
    cardBg.on('pointerup', () => {
      if (getHasDragged()) return;
      onSelect();
    });

    return { select, deselect };
  }
}
