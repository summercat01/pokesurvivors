import Phaser from 'phaser';
import { getDefeatedIds } from '../data/pokedex';

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
    this.add.rectangle(0, 0, W, H, 0x0d1422).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a2840, 0.3);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // ── 헤더 (고정) ──
    this.add.rectangle(CX, HEADER_H / 2, W, HEADER_H, 0x0a1020, 0.95).setDepth(10);
    this.add.graphics().lineStyle(1, 0x334466)
      .lineBetween(0, HEADER_H, W, HEADER_H).setDepth(10);
    this.add.text(CX, 16, '포켓몬 도감', {
      fontSize: '18px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 4, padding: { top: 4 },
    }).setOrigin(0.5).setDepth(11);
    this.countTxt = this.add.text(CX, 38, this.getTotalCountText(), {
      fontSize: '11px', color: '#88aabb',
    }).setOrigin(0.5).setDepth(11);

    // ── 뒤로 버튼 ──
    const backBg = this.add.rectangle(38, 22, 64, 28, 0x1a2840)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x334466)
      .strokeRect(6, 8, 64, 28).setDepth(12);
    const backTxt = this.add.text(38, 22, '← 뒤로', {
      fontSize: '12px', color: '#88aacc', fontStyle: 'bold', padding: { top: 2 },
    }).setOrigin(0.5).setDepth(13);
    backBg.on('pointerover', () => { backBg.setFillStyle(0x223355); backTxt.setColor('#ffffff'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x1a2840); backTxt.setColor('#88aacc'); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    // ── 세대 탭 ──
    const TAB_Y = HEADER_H + TAB_H / 2;
    this.add.rectangle(CX, TAB_Y, W, TAB_H, 0x111828, 0.95).setDepth(10);
    this.add.graphics().lineStyle(1, 0x334466)
      .lineBetween(0, HEADER_H + TAB_H, W, HEADER_H + TAB_H).setDepth(10);

    const tabW = W / GENS.length;
    GENS.forEach((gen, i) => {
      const tabX    = tabW * i + tabW / 2;
      const active  = i === this.currentGen;
      const tabBg   = this.add.rectangle(tabX, TAB_Y, tabW - 2, TAB_H - 6, active ? 0x2244aa : 0x161e2e)
        .setDepth(11).setInteractive({ useHandCursor: true });
      const tabTxt  = this.add.text(tabX, TAB_Y, gen.label, {
        fontSize: '13px', color: active ? '#ffffff' : '#556677',
        fontStyle: active ? 'bold' : 'normal', padding: { top: 2 },
      }).setOrigin(0.5).setDepth(12);
      this.tabBgs.push(tabBg);
      this.tabTxts.push(tabTxt);
      tabBg.on('pointerdown', () => this.switchGen(i));
      tabBg.on('pointerover', () => { if (i !== this.currentGen) tabBg.setFillStyle(0x223366); });
      tabBg.on('pointerout',  () => { if (i !== this.currentGen) tabBg.setFillStyle(0x161e2e); });
    });

    // ── 하단 범례 (고정) ──
    this.add.rectangle(CX, H - FOOTER_H / 2, W, FOOTER_H, 0x0a1020, 0.9).setDepth(10);
    this.add.graphics().lineStyle(1, 0x334466)
      .lineBetween(0, H - FOOTER_H, W, H - FOOTER_H).setDepth(10);
    this.add.text(CX, H - FOOTER_H / 2 - 8,  '● 컬러 = 처치 완료', { fontSize: '11px', color: '#4488ff' })
      .setOrigin(0.5).setDepth(11);
    this.add.text(CX, H - FOOTER_H / 2 + 8, '■ 실루엣 = 미발견', { fontSize: '11px', color: '#556677' })
      .setOrigin(0.5).setDepth(11);

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

      // 셀 배경
      const cellBg = this.add.rectangle(cellX, cellY, cellW - 2, CELL_H - 2, 0x111827)
        .setStrokeStyle(1, isFound ? 0x334466 : 0x1a2233);
      this.gridContainer.add(cellBg);

      if (isLoaded) {
        const spr = this.add.image(cellX, cellY - 8, texKey).setDisplaySize(48, 48);
        if (!isFound) spr.setTint(0x000000);
        this.gridContainer.add(spr);
      } else {
        // 스프라이트 없음: ? 아이콘
        const qTxt = this.add.text(cellX, cellY - 8, '?', {
          fontSize: '22px', color: '#2a3545', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.gridContainer.add(qTxt);
      }

      // 번호 텍스트 — 미발견도 충분히 보이도록
      const numTxt = this.add.text(cellX, cellY + 28, `#${id}`, {
        fontSize: '9px', color: isFound ? '#88aabb' : '#5a7080',
      }).setOrigin(0.5);
      this.gridContainer.add(numTxt);

      // 발견 시 하이라이트
      if (isFound && isLoaded) {
        const shine = this.add.rectangle(cellX, cellY - 8, 52, 52, 0x4488ff, 0.07)
          .setStrokeStyle(1, 0x4488ff, 0.35);
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
    this.tabBgs.forEach((bg, i)  => bg.setFillStyle(i === genIndex ? 0x2244aa : 0x161e2e));
    this.tabTxts.forEach((txt, i) => {
      txt.setColor(i === genIndex ? '#ffffff' : '#556677');
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
  }
}
