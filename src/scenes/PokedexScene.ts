import Phaser from 'phaser';
import { getDefeatedIds } from '../data/pokedex';

const COLS       = 5;
const CELL_W     = 70;
const CELL_H     = 76;
const HEADER_H   = 54;
const FOOTER_H   = 52;
const TOTAL      = 493;

export class PokedexScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PokedexScene' });
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0x0d1422).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a2840, 0.3);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    const defeatedIds = getDefeatedIds();
    const revealedCount = this.countRevealed(defeatedIds);

    // ── 헤더 (고정) ──
    this.add.rectangle(CX, HEADER_H / 2, W, HEADER_H, 0x0a1020, 0.95).setDepth(10);
    this.add.graphics().lineStyle(1, 0x334466)
      .lineBetween(0, HEADER_H, W, HEADER_H).setDepth(10);

    this.add.text(CX, 16, '포켓몬 도감', {
      fontSize: '18px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 4, padding: { top: 4 },
    }).setOrigin(0.5).setDepth(11);

    this.add.text(CX, 38, `발견: ${revealedCount} / ${TOTAL}`, {
      fontSize: '12px', color: '#88aabb',
    }).setOrigin(0.5).setDepth(11);

    // ── 뒤로 버튼 (고정) ──
    const backBg = this.add.rectangle(38, 22, 64, 28, 0x1a2840)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x334466)
      .strokeRect(38 - 32, 22 - 14, 64, 28).setDepth(12);
    const backTxt = this.add.text(38, 22, '← 뒤로', {
      fontSize: '12px', color: '#88aacc', fontStyle: 'bold', padding: { top: 2 },
    }).setOrigin(0.5).setDepth(13);
    backBg.on('pointerover', () => { backBg.setFillStyle(0x223355); backTxt.setColor('#ffffff'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x1a2840); backTxt.setColor('#88aacc'); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    // ── 스크롤 영역 계산 ──
    const SCROLL_TOP = HEADER_H;
    const SCROLL_BOT = H - FOOTER_H;
    const viewH      = SCROLL_BOT - SCROLL_TOP;

    // 열 수를 화면 너비에 맞게 조정
    const cols      = Math.max(3, Math.floor(W / CELL_W));
    const cellW     = Math.floor(W / cols);
    const cellH     = CELL_H;
    const rows      = Math.ceil(TOTAL / cols);
    const totalH    = rows * cellH;
    const maxScroll = Math.max(0, totalH - viewH);

    // 마스크
    const maskGfx = this.add.graphics();
    maskGfx.fillRect(0, SCROLL_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGfx);

    const container = this.add.container(0, SCROLL_TOP);
    container.setMask(mask);

    // ── 그리드 셀 생성 ──
    for (let num = 1; num <= TOTAL; num++) {
      const col   = (num - 1) % cols;
      const row   = Math.floor((num - 1) / cols);
      const cellX = col * cellW + cellW / 2;
      const cellY = row * cellH + cellH / 2;

      const id       = String(num).padStart(3, '0');
      const texKey   = `pokemon_${id}`;
      const isLoaded = this.textures.exists(texKey);
      const isFound  = defeatedIds.has(id);

      // 셀 배경
      const cellBg = this.add.rectangle(cellX, cellY, cellW - 2, cellH - 2, 0x111827)
        .setStrokeStyle(1, isFound ? 0x334466 : 0x1a2233);
      container.add(cellBg);

      if (isLoaded) {
        const spr = this.add.image(cellX, cellY - 8, texKey)
          .setDisplaySize(48, 48);
        if (!isFound) {
          spr.setTint(0x000000);
        }
        container.add(spr);
      } else {
        // 스프라이트 없으면 ? 아이콘
        const qTxt = this.add.text(cellX, cellY - 8, '?', {
          fontSize: '24px', color: isFound ? '#445566' : '#222233', fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(qTxt);
      }

      // 번호 텍스트
      const numTxt = this.add.text(cellX, cellY + 28, `#${id}`, {
        fontSize: '9px', color: isFound ? '#88aabb' : '#2a3a44',
      }).setOrigin(0.5);
      container.add(numTxt);

      // 발견 시 반짝임 표시
      if (isFound && isLoaded) {
        const shine = this.add.rectangle(cellX, cellY - 8, 52, 52, 0x4488ff, 0.06)
          .setStrokeStyle(1, 0x4488ff, 0.3);
        container.add(shine);
      }
    }

    // ── 하단 범례 (고정) ──
    this.add.rectangle(CX, H - FOOTER_H / 2, W, FOOTER_H, 0x0a1020, 0.9).setDepth(10);
    this.add.graphics().lineStyle(1, 0x334466)
      .lineBetween(0, H - FOOTER_H, W, H - FOOTER_H).setDepth(10);
    this.add.text(CX, H - FOOTER_H / 2 - 8, '● 컬러 = 처치 완료', {
      fontSize: '11px', color: '#4488ff',
    }).setOrigin(0.5).setDepth(11);
    this.add.text(CX, H - FOOTER_H / 2 + 10, '■ 실루엣 = 미발견', {
      fontSize: '11px', color: '#334455',
    }).setOrigin(0.5).setDepth(11);

    // ── 드래그 스크롤 ──
    let scrollY    = 0;
    let lastY      = 0;
    let isDragging = false;
    let hasDragged = false;
    const DRAG_THRESHOLD = 5;

    const applyScroll = (newY: number) => {
      scrollY       = Phaser.Math.Clamp(newY, 0, maxScroll);
      container.y   = SCROLL_TOP - scrollY;
    };

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < SCROLL_TOP || ptr.y > SCROLL_BOT) return;
      lastY      = ptr.y;
      isDragging = true;
      hasDragged = false;
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const dy = ptr.y - lastY;
      lastY = ptr.y;
      if (Math.abs(dy) > DRAG_THRESHOLD || hasDragged) {
        hasDragged = true;
        applyScroll(scrollY - dy);
      }
    });
    this.input.on('pointerup',  () => { isDragging = false; });
    this.input.on('pointerout', () => { isDragging = false; });

    // 마우스 휠
    this.input.on('wheel', (...args: unknown[]) => {
      applyScroll(scrollY + (args[3] as number) * 0.5);
    });

    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  private countRevealed(defeatedIds: Set<string>): number {
    let count = 0;
    for (let num = 1; num <= TOTAL; num++) {
      if (defeatedIds.has(String(num).padStart(3, '0'))) count++;
    }
    return count;
  }
}
