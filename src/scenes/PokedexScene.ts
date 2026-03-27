import Phaser from 'phaser';
import { getDefeatedIds } from '../data/pokedex';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';

const HEADER_H = 54;
const TAB_H    = 36;
const FOOTER_H = 48;
const CELL_H   = 76;

const GENS = [
  { label: '1세대', start: 1,   end: 151 },
  { label: '2세대', start: 152, end: 251 },
  { label: '3세대', start: 252, end: 386 },
  { label: '4세대', start: 387, end: 493 },
];

export class PokedexScene extends Phaser.Scene {
  private currentGen   = 0;
  private gridContainer: Phaser.GameObjects.Container | null = null;
  private maskGfx:       Phaser.GameObjects.Graphics  | null = null;
  private defeatedIds!:  Set<string>;
  private scrollY      = 0;
  private maxScroll    = 0;
  private tabBgs:  Phaser.GameObjects.Rectangle[] = [];
  private tabTxts: Phaser.GameObjects.Text[]      = [];
  private countTxt!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PokedexScene' });
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    this.defeatedIds = getDefeatedIds();

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0xe8e8d8).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0xd0d0c0, 0.5);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // ── 헤더 (포켓몬 스타일) ──
    PokeUI.panel(this, CX, HEADER_H / 2, W - 4, HEADER_H, PokePalette.headerBg, 10);
    this.add.text(CX, 16, '포켓몬 도감', {
      fontFamily: POKE_FONT, fontSize: '16px', color: PokePalette.textWhite, fontStyle: 'bold',
      stroke: '#101840', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    this.countTxt = this.add.text(CX, 38, this.getTotalCountText(), {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#aaccff',
    }).setOrigin(0.5).setDepth(11);

    // ── 뒤로 버튼 ──
    const backBg = this.add.rectangle(42, HEADER_H / 2, 68, 28, PokePalette.btnNormal)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder)
      .strokeRect(8, HEADER_H / 2 - 14, 68, 28).setDepth(12);
    const backTxt = this.add.text(42, HEADER_H / 2, '← 뒤로', {
      fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textDark,
    }).setOrigin(0.5).setDepth(13);
    backBg.on('pointerover', () => { backBg.setFillStyle(PokePalette.btnHover); backTxt.setColor('#003399'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(PokePalette.btnNormal); backTxt.setColor(PokePalette.textDark); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    // ── 세대 탭 ──
    const TAB_Y = HEADER_H + TAB_H / 2;
    this.add.rectangle(CX, TAB_Y, W, TAB_H, PokePalette.panelBg, 1).setDepth(10);
    this.add.graphics().lineStyle(1, PokePalette.panelBorder, 0.4)
      .lineBetween(0, HEADER_H + TAB_H, W, HEADER_H + TAB_H).setDepth(10);

    const tabW = W / GENS.length;
    GENS.forEach((gen, i) => {
      const tabX    = tabW * i + tabW / 2;
      const active  = i === this.currentGen;
      const tabBg   = this.add.rectangle(tabX, TAB_Y, tabW - 2, TAB_H - 6, active ? PokePalette.btnPrimary : PokePalette.btnNormal)
        .setDepth(11).setInteractive({ useHandCursor: true });
      const tabTxt  = this.add.text(tabX, TAB_Y, gen.label, {
        fontFamily: POKE_FONT, fontSize: '11px',
        color: active ? PokePalette.textWhite : PokePalette.textGray,
        fontStyle: active ? 'bold' : 'normal',
      }).setOrigin(0.5).setDepth(12);
      this.tabBgs.push(tabBg);
      this.tabTxts.push(tabTxt);
      tabBg.on('pointerdown', () => this.switchGen(i));
      tabBg.on('pointerover', () => { if (i !== this.currentGen) tabBg.setFillStyle(PokePalette.btnHover); });
      tabBg.on('pointerout',  () => { if (i !== this.currentGen) tabBg.setFillStyle(PokePalette.btnNormal); });
    });

    // ── 하단 범례 (고정) ──
    PokeUI.panel(this, CX, H - FOOTER_H / 2, W - 4, FOOTER_H, PokePalette.panelBg, 10);
    this.add.graphics().lineStyle(1, PokePalette.panelBorder, 0.4)
      .lineBetween(0, H - FOOTER_H, W, H - FOOTER_H).setDepth(10);
    this.add.text(CX, H - FOOTER_H / 2 - 8, '● 컬러 = 처치 완료', {
      fontFamily: POKE_FONT, fontSize: '9px', color: '#2255aa',
    }).setOrigin(0.5).setDepth(11);
    this.add.text(CX, H - FOOTER_H / 2 + 8, '■ 실루엣 = 미발견', {
      fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.textGray,
    }).setOrigin(0.5).setDepth(11);

    // ── 스크롤 입력 등록 ──
    this.setupScrollInput();

    // ── 초기 그리드 ──
    this.buildGrid(0);

    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // ───────────────────────────────────────────────────────
  // 그리드 빌드 (세대 전환 시 재호출)
  // ───────────────────────────────────────────────────────
  private buildGrid(genIndex: number) {
    // 기존 컨테이너·마스크 제거
    if (this.gridContainer) { this.gridContainer.destroy(true); this.gridContainer = null; }
    if (this.maskGfx)       { this.maskGfx.destroy();            this.maskGfx       = null; }
    this.scrollY = 0;

    const W = this.scale.width;
    const H = this.scale.height;

    const gen        = GENS[genIndex];
    const SCROLL_TOP = HEADER_H + TAB_H;
    const SCROLL_BOT = H - FOOTER_H;
    const viewH      = SCROLL_BOT - SCROLL_TOP;

    const cols   = Math.max(3, Math.floor(W / 70));
    const cellW  = Math.floor(W / cols);
    const count  = gen.end - gen.start + 1;
    const rows   = Math.ceil(count / cols);
    this.maxScroll = Math.max(0, rows * CELL_H - viewH);

    // 마스크
    this.maskGfx = this.add.graphics();
    this.maskGfx.fillRect(0, SCROLL_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, this.maskGfx);

    this.gridContainer = this.add.container(0, SCROLL_TOP);
    this.gridContainer.setMask(mask);

    // 세대 내 발견 카운트
    let genFound = 0;

    for (let i = 0; i < count; i++) {
      const num   = gen.start + i;
      const col   = i % cols;
      const row   = Math.floor(i / cols);
      const cellX = col * cellW + cellW / 2;
      const cellY = row * CELL_H + CELL_H / 2;

      const id       = String(num).padStart(3, '0');
      const texKey   = `pokemon_${id}`;
      const isLoaded = this.textures.exists(texKey);
      const isFound  = this.defeatedIds.has(id);
      if (isFound) genFound++;

      // 셀 배경 (포켓몬 스타일)
      const cellBg = this.add.rectangle(cellX, cellY, cellW - 2, CELL_H - 2, isFound ? PokePalette.panelBg : 0xe0ddd0)
        .setStrokeStyle(1, isFound ? PokePalette.panelBorder : 0xc8c5b8, isFound ? 0.6 : 0.3);
      this.gridContainer.add(cellBg);

      if (isLoaded) {
        const spr = this.add.image(cellX, cellY - 8, texKey).setDisplaySize(48, 48);
        if (!isFound) spr.setTint(0x000000);
        this.gridContainer.add(spr);
      } else {
        // 스프라이트 없음: ? 아이콘
        const qTxt = this.add.text(cellX, cellY - 8, '?', {
          fontFamily: POKE_FONT, fontSize: '20px', color: PokePalette.textGray, fontStyle: 'bold',
        }).setOrigin(0.5);
        this.gridContainer.add(qTxt);
      }

      // 번호 텍스트 — 미발견도 충분히 보이도록
      const numTxt = this.add.text(cellX, cellY + 28, `#${id}`, {
        fontFamily: POKE_FONT, fontSize: '8px', color: isFound ? PokePalette.textDark : PokePalette.textGray,
      }).setOrigin(0.5);
      this.gridContainer.add(numTxt);

      // 발견 시 하이라이트
      if (isFound && isLoaded) {
        const shine = this.add.rectangle(cellX, cellY - 8, 52, 52, PokePalette.btnHover, 0.2)
          .setStrokeStyle(1, PokePalette.headerBg, 0.4);
        this.gridContainer.add(shine);
      }
    }

    // 헤더 카운트 텍스트 갱신
    const totalFound = this.countTotal();
    this.countTxt.setText(`전체 발견: ${totalFound} / 493   |   ${gen.label}: ${genFound} / ${count}`);
  }

  // ───────────────────────────────────────────────────────
  private switchGen(genIndex: number) {
    if (genIndex === this.currentGen) return;
    this.tabBgs.forEach((bg, i)  => bg.setFillStyle(i === genIndex ? PokePalette.btnPrimary : PokePalette.btnNormal));
    this.tabTxts.forEach((txt, i) => {
      txt.setColor(i === genIndex ? PokePalette.textWhite : PokePalette.textGray);
      txt.setFontStyle(i === genIndex ? 'bold' : 'normal');
    });
    this.currentGen = genIndex;
    this.buildGrid(genIndex);
  }

  private countTotal(): number {
    let n = 0;
    for (let num = 1; num <= 493; num++) {
      if (this.defeatedIds.has(String(num).padStart(3, '0'))) n++;
    }
    return n;
  }

  private getTotalCountText(): string {
    return `전체 발견: ${this.countTotal()} / 493`;
  }

  // ───────────────────────────────────────────────────────
  // 스크롤 입력 (한 번만 등록)
  // ───────────────────────────────────────────────────────
  private setupScrollInput() {
    const H          = this.scale.height;
    const SCROLL_TOP = HEADER_H + TAB_H;
    const SCROLL_BOT = H - FOOTER_H;
    const DRAG_TH    = 5;

    let lastY = 0, isDragging = false, hasDragged = false;

    const applyScroll = (newY: number) => {
      this.scrollY = Phaser.Math.Clamp(newY, 0, this.maxScroll);
      if (this.gridContainer) this.gridContainer.y = SCROLL_TOP - this.scrollY;
    };

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < SCROLL_TOP || ptr.y > SCROLL_BOT) return;
      lastY = ptr.y; isDragging = true; hasDragged = false;
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const dy = ptr.y - lastY; lastY = ptr.y;
      if (Math.abs(dy) > DRAG_TH || hasDragged) { hasDragged = true; applyScroll(this.scrollY - dy); }
    });
    this.input.on('pointerup',  () => { isDragging = false; });
    this.input.on('pointerout', () => { isDragging = false; });
    this.input.on('wheel', (...args: unknown[]) => applyScroll(this.scrollY + (args[3] as number) * 0.5));
    this.events.once('shutdown', () => this.input.removeAllListeners());
  }
}
