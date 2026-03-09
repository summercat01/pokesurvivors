import Phaser from 'phaser';
import { ALL_WEAPONS, TYPE_COLORS } from '../data/weapons';

const CHARACTERS = [
  {
    trainerName: '광휘',
    subtitle: '포켓몬 트레이너',
    trainerSprKey: 'trainer',
    weaponIndex: 0,
    pokemonSprKey: 'pokemon_001',
    traitColor: 0x44bb44,
  },
  {
    trainerName: '광휘',
    subtitle: '포켓몬 트레이너',
    trainerSprKey: 'trainer',
    weaponIndex: 1,
    pokemonSprKey: 'pokemon_004',
    traitColor: 0xee5522,
  },
  {
    trainerName: '광휘',
    subtitle: '포켓몬 트레이너',
    trainerSprKey: 'trainer',
    weaponIndex: 2,
    pokemonSprKey: 'pokemon_007',
    traitColor: 0x3399ee,
  },
];

export class CharacterSelectScene extends Phaser.Scene {
  private stageId: number = 1;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(data?: { stageId?: number }) {
    this.stageId = data?.stageId ?? 1;
    const W = this.scale.width;
    const H = this.scale.height;

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0x0d1a2e).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3050, 0.4);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // ── 헤더 ──
    this.add.text(W / 2, 36, '트레이너 선택', {
      fontSize: '22px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 5,
      padding: { top: 6 },
    }).setOrigin(0.5);

    this.add.text(W / 2, 70, '함께 싸울 트레이너를 선택하세요', {
      fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // ── 캐릭터 카드 목록 ──
    const CARD_W = W - 32;
    const CARD_H = 160;
    const CARD_GAP = 12;
    const cx = W / 2;
    const totalH = CHARACTERS.length * CARD_H + (CHARACTERS.length - 1) * CARD_GAP;
    const startY = 92;

    CHARACTERS.forEach((char, i) => {
      const cy = startY + i * (CARD_H + CARD_GAP) + CARD_H / 2;
      this.createCharacterCard(char, i, cx, cy, CARD_W, CARD_H);
    });

    // ── 뒤로 버튼 ──
    const backY = H - 44;
    const backBg = this.add.rectangle(cx, backY, 160, 40, 0x222233)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x445566).strokeRect(cx - 80, backY - 20, 160, 40);
    const backTxt = this.add.text(cx, backY, '← 뒤로', {
      fontSize: '15px', color: '#aaaacc', fontStyle: 'bold',
    }).setOrigin(0.5);

    backBg.on('pointerover', () => { backBg.setFillStyle(0x333355); backTxt.setColor('#ffffff'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x222233); backTxt.setColor('#aaaacc'); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StageSelectScene'));
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createCharacterCard(
    char: typeof CHARACTERS[0],
    index: number,
    cx: number, cy: number,
    cardW: number, cardH: number,
  ) {
    const weapon     = ALL_WEAPONS[char.weaponIndex];
    const pokeTypes  = [weapon.type];
    const typeColor  = TYPE_COLORS[weapon.type] ?? 0x888888;
    const typeColor2 = typeColor;

    const STRIPE_W  = 130;
    const cardLeft  = cx - cardW / 2;
    const cardTop   = cy - cardH / 2;
    const cardBot   = cy + cardH / 2;
    const stripeRight = cardLeft + STRIPE_W;

    // 그림자
    this.add.rectangle(cx + 3, cy + 4, cardW + 4, cardH + 4, 0x000000, 0.5);

    // 카드 배경
    const cardBg = this.add.rectangle(cx, cy, cardW, cardH, 0x111827)
      .setInteractive({ useHandCursor: true });

    // 테두리
    const outline = this.add.graphics();
    outline.lineStyle(2, typeColor, 0.6);
    outline.strokeRect(cardLeft, cardTop, cardW, cardH);

    // ── 스트라이프 영역: 대각선 분할 ──
    // 위쪽 삼각형 (트레이너) — 1타입 색
    const bgTop = this.add.graphics();
    bgTop.fillStyle(typeColor, 0.22);
    bgTop.fillTriangle(
      cardLeft, cardTop,
      stripeRight, cardTop,
      cardLeft, cardBot,
    );

    // 아래쪽 삼각형 (포켓몬) — 2타입 색 (단일이면 동일)
    const bgBot = this.add.graphics();
    bgBot.fillStyle(typeColor2, 0.18);
    bgBot.fillTriangle(
      stripeRight, cardTop,
      stripeRight, cardBot,
      cardLeft, cardBot,
    );

    // 대각선 — 두 색 사이 경계선
    const diagLine = this.add.graphics();
    diagLine.lineStyle(2, typeColor2, 0.7);
    diagLine.lineBetween(stripeRight, cardTop, cardLeft, cardBot);

    // 스트라이프 오른쪽 세로 구분선
    this.add.graphics().lineStyle(1, typeColor, 0.5)
      .lineBetween(stripeRight, cardTop, stripeRight, cardBot);

    // ── 트레이너 이미지 (위쪽 삼각형 중심 부근) ──
    // 삼각형 무게중심: (cardLeft + stripeRight + cardLeft)/3, (cardTop + cardTop + cardBot)/3
    const trainerCX = cardLeft + STRIPE_W * 0.32;
    const trainerCY = cardTop  + cardH   * 0.38;

    if (this.textures.exists(char.trainerSprKey)) {
      // GeometryMask로 위쪽 삼각형에만 렌더링
      const maskGfx = this.make.graphics({ x: 0, y: 0 });
      maskGfx.fillStyle(0xffffff);
      maskGfx.fillTriangle(
        cardLeft,    cardTop,
        stripeRight, cardTop,
        cardLeft,    cardBot,
      );
      const trainerImg = this.add.image(trainerCX, trainerCY, char.trainerSprKey)
        .setDisplaySize(80, 94).setDepth(4);
      trainerImg.setMask(maskGfx.createGeometryMask());
    }

    // ── 파트너 포켓몬 이미지 (아래쪽 삼각형 중심 부근) ──
    // 삼각형 무게중심: (stripeRight + stripeRight + cardLeft)/3, (cardTop + cardBot + cardBot)/3
    const pokeCX = cardLeft + STRIPE_W * 0.68;
    const pokeCY = cardTop  + cardH   * 0.70;

    if (this.textures.exists(char.pokemonSprKey)) {
      const maskGfx2 = this.make.graphics({ x: 0, y: 0 });
      maskGfx2.fillStyle(0xffffff);
      maskGfx2.fillTriangle(
        stripeRight, cardTop,
        stripeRight, cardBot,
        cardLeft,    cardBot,
      );
      const pokeImg = this.add.image(pokeCX, pokeCY, char.pokemonSprKey)
        .setDisplaySize(64, 64).setDepth(4);
      pokeImg.setMask(maskGfx2.createGeometryMask());
    }

    // ── 오른쪽 텍스트 영역 ──
    const textX  = stripeRight + 16;
    const rightW = cardLeft + cardW - textX - 12;

    // 이름
    this.add.text(textX, cardTop + 26, char.trainerName, {
      fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
      padding: { top: 6 },
    }).setOrigin(0, 0.5);

    // 부제목
    this.add.text(textX, cardTop + 50, char.subtitle, {
      fontSize: '12px', color: '#88aacc',
    }).setOrigin(0, 0.5);

    // 구분선
    this.add.graphics().lineStyle(1, 0x334455)
      .lineBetween(textX, cardTop + 64, cx + cardW / 2 - 12, cardTop + 64);

    // 파트너 포켓몬 라벨 + 이름
    this.add.text(textX, cardTop + 82, '파트너 포켓몬', {
      fontSize: '10px', color: '#8888aa',
    }).setOrigin(0, 0.5);

    this.add.text(textX, cardTop + 102, weapon.name, {
      fontSize: '17px', color: '#ccddaa', fontStyle: 'bold',
      padding: { top: 4 },
    }).setOrigin(0, 0.5);

    // 타입 뱃지 (위에서 구한 pokeTypes 재사용)
    let badgeOffsetX = 0;
    pokeTypes.forEach(t => {
      const hex = `#${(TYPE_COLORS[t] ?? 0x888888).toString(16).padStart(6, '0')}`;
      const badge = this.add.text(textX + badgeOffsetX, cardTop + 126, `  ${t.toUpperCase()}  `, {
        fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: hex,
        padding: { x: 4, y: 3 },
      }).setOrigin(0, 0.5);
      badgeOffsetX += badge.width + 6;
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
        this.scene.start('GameScene', { weaponIndex: index, stageId: this.stageId });
      });
    });
  }
}
