import Phaser from 'phaser';
import { ALL_WEAPONS, TYPE_COLORS } from '../data/weapons';
import { getBgmVolume } from '../lib/storage';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';


interface CardControl {
  select: () => void;
  deselect: () => void;
}

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

    // BGM (bgm_select 이미 재생 중이면 유지)
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
    this.add.text(CX, 24, '트레이너 선택', {
      fontFamily: POKE_FONT, fontSize: '16px', color: PokePalette.textWhite, fontStyle: 'bold',
      stroke: '#101840', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);
    this.add.text(CX, 50, '함께 싸울 트레이너를 선택하세요', {
      fontFamily: POKE_FONT, fontSize: '10px', color: '#aaccff',
    }).setOrigin(0.5).setDepth(10);

    // ── 하단 버튼 2개: [뒤로] [게임 시작] ──
    const BTN_Y  = H - 44;
    const BTN_W  = Math.floor((W - 20) / 2) - 4;
    const backX  = CX - BTN_W / 2 - 4;
    const startX = CX + BTN_W / 2 + 4;

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
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.scene.manager.isSleeping('StageSelectScene')) {
          this.scene.stop();
          this.scene.wake('StageSelectScene');
        } else {
          this.scene.start('StageSelectScene');
        }
      });
    });

    // 게임 시작 버튼 (포켓몬 스타일)
    const startBg = this.add.rectangle(startX, BTN_Y, BTN_W, 40, PokePalette.btnPrimary).setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder)
      .strokeRect(startX - BTN_W / 2, BTN_Y - 20, BTN_W, 40).setDepth(10);
    const startTxt = this.add.text(startX, BTN_Y, '▶ 게임 시작', {
      fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textWhite,
    }).setOrigin(0.5).setDepth(11);

    startBg.on('pointerover', () => { startBg.setFillStyle(0x3366cc); });
    startBg.on('pointerout',  () => { startBg.setFillStyle(PokePalette.btnPrimary); });
    startBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('StageSelectScene');
        this.scene.start('GameScene', { weaponIndex: selectedWeaponIndex, stageId: this.stageId });
      });
    });

    // ── 카드 크기 (화면 높이 기반 반응형) ──
    const CARD_H      = Math.round(Math.max(140, H * 0.18));
    const CARD_GAP    = 12;
    const CARD_STRIDE = CARD_H + CARD_GAP;

    // ── 스크롤 영역 ──
    const SCROLL_TOP = 88;
    const SCROLL_BOT = BTN_Y - 16;
    const viewH      = SCROLL_BOT - SCROLL_TOP;
    const totalH     = ALL_WEAPONS.length * CARD_STRIDE;
    const maxScroll  = Math.max(0, totalH - viewH);

    const maskGfx = this.add.graphics();
    maskGfx.fillRect(0, SCROLL_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGfx);

    const container = this.add.container(0, SCROLL_TOP);
    container.setMask(mask);

    const CARD_W = W - 32;

    // 선택 상태
    let selectedWeaponIndex = 0;
    const cardControls: CardControl[] = [];

    const selectWeapon = (idx: number) => {
      cardControls[selectedWeaponIndex]?.deselect();
      selectedWeaponIndex = idx;
      cardControls[idx]?.select();
    };

    ALL_WEAPONS.forEach((_, i) => {
      const cy   = i * CARD_STRIDE + CARD_H / 2;
      const ctrl = this.createCharacterCard(i, CX, cy, CARD_W, CARD_H, container, () => hasDragged, () => selectWeapon(i));
      cardControls.push(ctrl);
    });

    // 초기 선택
    cardControls[0]?.select();

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
    this.events.once('shutdown', () => this.input.removeAllListeners());

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createCharacterCard(
    weaponIndex: number,
    cx: number, cy: number,
    cardW: number, cardH: number,
    container: Phaser.GameObjects.Container,
    getHasDragged: () => boolean,
    onSelect: () => void,
  ): CardControl {
    const weapon    = ALL_WEAPONS[weaponIndex];
    const typeColor = TYPE_COLORS[weapon.type] ?? 0x888888;

    const STRIPE_W    = 130;
    const cardLeft    = cx - cardW / 2;
    const cardTop     = cy - cardH / 2;
    const cardBot     = cy + cardH / 2;
    const stripeRight = cardLeft + STRIPE_W;

    const shadow  = this.add.rectangle(cx + 3, cy + 4, cardW + 4, cardH + 4, 0x000000, 0.2);
    // 포켓몬 스타일 카드 (크림 배경)
    const cardBorder = this.add.rectangle(cx, cy, cardW, cardH, PokePalette.panelBorder);
    const cardBg  = this.add.rectangle(cx, cy, cardW - 6, cardH - 6, PokePalette.panelBg)
      .setInteractive({ useHandCursor: true });

    // 좌측 타입 스트라이프
    const bgTop = this.add.graphics();
    bgTop.fillStyle(typeColor, 1);
    bgTop.fillRect(cardLeft + 3, cardTop + 3, STRIPE_W - 3, cardH - 6);
    // 스트라이프 구분선
    bgTop.fillStyle(0x282018, 0.3);
    bgTop.fillRect(cardLeft + STRIPE_W, cardTop + 3, 2, cardH - 6);

    const outline = this.add.graphics();

    const bgBot  = this.add.graphics(); // (unused placeholder, kept for item list compatibility)
    const diagLine = this.add.graphics(); // (unused placeholder)
    const sideDiv  = this.add.graphics(); // (unused placeholder)

    const trainerCX  = cardLeft + STRIPE_W * 0.26;
    const trainerCY  = cardTop  + cardH   * 0.30;
    const trainerImg = this.textures.exists('trainer')
      ? this.add.image(trainerCX, trainerCY, 'trainer').setDisplaySize(80, 94)
      : null;

    const pokeCX  = cardLeft + STRIPE_W * 0.68;
    const pokeCY  = cardTop  + cardH   * 0.70;
    const sprKey  = `pokemon_${String(weapon.pokemonId).padStart(3, '0')}`;
    const pokeImg = this.textures.exists(sprKey)
      ? this.add.image(pokeCX, pokeCY, sprKey).setDisplaySize(64, 64)
      : null;

    const textX = stripeRight + 16;

    const nameTxt = this.add.text(textX, cardTop + 26, '광휘', {
      fontFamily: POKE_FONT, fontSize: '20px', color: PokePalette.textDark, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const subtitleTxt = this.add.text(textX, cardTop + 50, '포켓몬 트레이너', {
      fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray,
    }).setOrigin(0, 0.5);

    const divLine = this.add.graphics();
    divLine.lineStyle(1, 0x989880, 0.5);
    divLine.lineBetween(textX, cardTop + 64, cx + cardW / 2 - 12, cardTop + 64);

    const partnerLabel = this.add.text(textX, cardTop + 82, '파트너 포켓몬', {
      fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.textGray,
    }).setOrigin(0, 0.5);

    const weaponNameTxt = this.add.text(textX, cardTop + 102, weapon.name, {
      fontFamily: POKE_FONT, fontSize: '14px', color: PokePalette.textDark, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const hex       = `#${typeColor.toString(16).padStart(6, '0')}`;
    const typeBadge = this.add.text(textX, cardTop + 126, `  ${weapon.type.toUpperCase()}  `, {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: hex, padding: { x: 4, y: 3 },
    }).setOrigin(0, 0.5);

    const items: Phaser.GameObjects.GameObject[] = [
      shadow, cardBorder, cardBg, outline, bgTop, bgBot, diagLine, sideDiv,
      nameTxt, subtitleTxt, divLine, partnerLabel, weaponNameTxt, typeBadge,
    ];
    if (trainerImg) items.push(trainerImg);
    if (pokeImg)    items.push(pokeImg);
    container.add(items);

    // 선택 상태
    const select = () => {
      cardBg.setFillStyle(PokePalette.btnHover);
      outline.clear();
      outline.fillStyle(0x3050a0, 0.12);
      outline.fillRect(cardLeft + 3, cardTop + 3, cardW - 6, cardH - 6);
      outline.lineStyle(3, PokePalette.headerBg, 1.0);
      outline.strokeRect(cardLeft, cardTop, cardW, cardH);
    };
    const deselect = () => {
      cardBg.setFillStyle(PokePalette.panelBg);
      outline.clear();
    };

    cardBg.on('pointerover', () => {
      outline.clear();
      outline.fillStyle(0x3050a0, 0.07);
      outline.fillRect(cardLeft + 3, cardTop + 3, cardW - 6, cardH - 6);
    });
    cardBg.on('pointerout', () => {
      outline.clear();
    });
    cardBg.on('pointerup', () => {
      if (getHasDragged()) return;
      onSelect();
    });

    return { select, deselect };
  }
}
