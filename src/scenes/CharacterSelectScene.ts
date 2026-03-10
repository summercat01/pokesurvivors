import Phaser from 'phaser';
import { ALL_WEAPONS, TYPE_COLORS } from '../data/weapons';

const CARD_H      = 160;
const CARD_GAP    = 12;
const CARD_STRIDE = CARD_H + CARD_GAP;

export class CharacterSelectScene extends Phaser.Scene {
  private stageId: number = 1;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(data?: { stageId?: number }) {
    this.stageId = data?.stageId ?? 1;
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
    this.add.text(CX, 36, '트레이너 선택', {
      fontSize: '22px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 5,
      padding: { top: 6 },
    }).setOrigin(0.5).setDepth(10);

    this.add.text(CX, 70, '함께 싸울 트레이너를 선택하세요', {
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
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StageSelectScene'));
    });

    // ── 스크롤 영역 ──
    const SCROLL_TOP = 88;
    const SCROLL_BOT = backY - 16;
    const viewH      = SCROLL_BOT - SCROLL_TOP;
    const totalH     = ALL_WEAPONS.length * CARD_STRIDE;
    const maxScroll  = Math.max(0, totalH - viewH);

    const maskGfx = this.add.graphics();
    maskGfx.fillRect(0, SCROLL_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGfx);

    const container = this.add.container(0, SCROLL_TOP);
    container.setMask(mask);

    const CARD_W = W - 32;
    ALL_WEAPONS.forEach((_, i) => {
      const cy = i * CARD_STRIDE + CARD_H / 2;
      this.createCharacterCard(i, CX, cy, CARD_W, CARD_H, container, () => hasDragged);
    });

    // ── 드래그 스크롤 ──
    let lastY      = 0;
    let isDragging = false;
    let scrollY    = 0;
    let hasDragged = false;
    const DRAG_THRESHOLD = 8;

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

    this.input.on('pointerup',  () => { isDragging = false; });
    this.input.on('pointerout', () => { isDragging = false; });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createCharacterCard(
    weaponIndex: number,
    cx: number, cy: number,
    cardW: number, cardH: number,
    container: Phaser.GameObjects.Container,
    getHasDragged: () => boolean,
  ) {
    const weapon    = ALL_WEAPONS[weaponIndex];
    const typeColor = TYPE_COLORS[weapon.type] ?? 0x888888;

    const STRIPE_W    = 130;
    const cardLeft    = cx - cardW / 2;
    const cardTop     = cy - cardH / 2;
    const cardBot     = cy + cardH / 2;
    const stripeRight = cardLeft + STRIPE_W;

    // 그림자
    const shadow = this.add.rectangle(cx + 3, cy + 4, cardW + 4, cardH + 4, 0x000000, 0.5);

    // 카드 배경
    const cardBg = this.add.rectangle(cx, cy, cardW, cardH, 0x111827)
      .setInteractive({ useHandCursor: true });

    // 테두리
    const outline = this.add.graphics();
    outline.lineStyle(2, typeColor, 0.6);
    outline.strokeRect(cardLeft, cardTop, cardW, cardH);

    // 삼각 배경
    const bgTop = this.add.graphics();
    bgTop.fillStyle(typeColor, 0.22);
    bgTop.fillTriangle(cardLeft, cardTop, stripeRight, cardTop, cardLeft, cardBot);

    const bgBot = this.add.graphics();
    bgBot.fillStyle(typeColor, 0.18);
    bgBot.fillTriangle(stripeRight, cardTop, stripeRight, cardBot, cardLeft, cardBot);

    const diagLine = this.add.graphics();
    diagLine.lineStyle(2, typeColor, 0.7);
    diagLine.lineBetween(stripeRight, cardTop, cardLeft, cardBot);

    const sideDiv = this.add.graphics();
    sideDiv.lineStyle(1, typeColor, 0.5);
    sideDiv.lineBetween(stripeRight, cardTop, stripeRight, cardBot);

    // 트레이너 이미지
    const trainerCX = cardLeft + STRIPE_W * 0.32;
    const trainerCY = cardTop  + cardH   * 0.38;
    const trainerImg = this.textures.exists('trainer')
      ? this.add.image(trainerCX, trainerCY, 'trainer').setDisplaySize(80, 94)
      : null;

    // 파트너 포켓몬 이미지
    const pokeCX = cardLeft + STRIPE_W * 0.68;
    const pokeCY = cardTop  + cardH   * 0.70;
    const sprKey = `pokemon_${String(weapon.pokemonId).padStart(3, '0')}`;
    const pokeImg = this.textures.exists(sprKey)
      ? this.add.image(pokeCX, pokeCY, sprKey).setDisplaySize(64, 64)
      : null;

    // 텍스트 영역
    const textX = stripeRight + 16;

    const nameTxt = this.add.text(textX, cardTop + 26, '광휘', {
      fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3, padding: { top: 6 },
    }).setOrigin(0, 0.5);

    const subtitleTxt = this.add.text(textX, cardTop + 50, '포켓몬 트레이너', {
      fontSize: '12px', color: '#88aacc',
    }).setOrigin(0, 0.5);

    const divLine = this.add.graphics();
    divLine.lineStyle(1, 0x334455);
    divLine.lineBetween(textX, cardTop + 64, cx + cardW / 2 - 12, cardTop + 64);

    const partnerLabel = this.add.text(textX, cardTop + 82, '파트너 포켓몬', {
      fontSize: '10px', color: '#8888aa',
    }).setOrigin(0, 0.5);

    const weaponNameTxt = this.add.text(textX, cardTop + 102, weapon.name, {
      fontSize: '17px', color: '#ccddaa', fontStyle: 'bold', padding: { top: 4 },
    }).setOrigin(0, 0.5);

    const hex = `#${typeColor.toString(16).padStart(6, '0')}`;
    const typeBadge = this.add.text(textX, cardTop + 126, `  ${weapon.type.toUpperCase()}  `, {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: hex, padding: { x: 4, y: 3 },
    }).setOrigin(0, 0.5);

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
        this.scene.start('GameScene', { weaponIndex, stageId: this.stageId });
      });
    });

    const items: Phaser.GameObjects.GameObject[] = [
      shadow, cardBg, outline, bgTop, bgBot, diagLine, sideDiv,
      nameTxt, subtitleTxt, divLine, partnerLabel, weaponNameTxt, typeBadge,
    ];
    if (trainerImg) items.push(trainerImg);
    if (pokeImg)    items.push(pokeImg);
    container.add(items);
  }
}
