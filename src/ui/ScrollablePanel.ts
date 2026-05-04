import Phaser from 'phaser';

/**
 * 드래그/휠 스크롤이 가능한 마스크 컨테이너
 *
 * 사용법:
 *   const panel = new ScrollablePanel(scene, { top: 88, bottom: H - 60 });
 *   panel.container.add([...items]);
 *   panel.setContentHeight(totalH);
 */
export class ScrollablePanel {
  readonly container: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;
  private maskGfx: Phaser.GameObjects.Graphics;

  private scrollY = 0;
  private maxScroll = 0;
  private isDragging = false;
  private lastY = 0;
  private _hasDragged = false;

  private top: number;
  private bottom: number;
  private dragThreshold: number;

  /** 드래그 후 pointerup 시 클릭 무시를 위해 사용 */
  get hasDragged(): boolean { return this._hasDragged; }

  constructor(
    scene: Phaser.Scene,
    options: {
      top: number;
      bottom: number;
      dragThreshold?: number;
      /** 스크롤 방향: 'negative'는 scrollY가 음수(기본), 'positive'는 양수 */
      scrollDirection?: 'negative' | 'positive';
    },
  ) {
    this.scene = scene;
    this.top = options.top;
    this.bottom = options.bottom;
    this.dragThreshold = options.dragThreshold ?? 8;

    const W = scene.scale.width;
    const viewH = this.bottom - this.top;

    // 마스크
    this.maskGfx = scene.add.graphics();
    this.maskGfx.fillRect(0, this.top, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(scene, this.maskGfx);

    // 컨테이너
    this.container = scene.add.container(0, this.top);
    this.container.setMask(mask);

    const scrollDir = options.scrollDirection ?? 'negative';

    // 입력 바인딩
    scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < this.top || ptr.y > this.bottom) return;
      this.lastY = ptr.y;
      this.isDragging = true;
      this._hasDragged = false;
    });

    scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const dy = ptr.y - this.lastY;
      this.lastY = ptr.y;
      if (Math.abs(dy) > this.dragThreshold || this._hasDragged) {
        this._hasDragged = true;
        if (scrollDir === 'negative') {
          this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -this.maxScroll, 0);
          this.container.y = this.top + this.scrollY;
        } else {
          this.scrollY = Phaser.Math.Clamp(this.scrollY - dy, 0, this.maxScroll);
          this.container.y = this.top - this.scrollY;
        }
      }
    });

    scene.input.on('pointerup', () => { this.isDragging = false; });
    scene.input.on('pointerout', () => { this.isDragging = false; });

    // 마우스 휠
    scene.input.on('wheel', (...args: unknown[]) => {
      const deltaY = args[3] as number;
      if (scrollDir === 'negative') {
        this.scrollY = Phaser.Math.Clamp(this.scrollY - deltaY * 0.5, -this.maxScroll, 0);
        this.container.y = this.top + this.scrollY;
      } else {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
        this.container.y = this.top - this.scrollY;
      }
    });

    scene.events.once('shutdown', () => scene.input.removeAllListeners());
  }

  /** 콘텐츠 전체 높이 설정 (뷰포트보다 클 때만 스크롤 활성) */
  setContentHeight(totalH: number) {
    const viewH = this.bottom - this.top;
    this.maxScroll = Math.max(0, totalH - viewH);
  }

  /** 스크롤 위치 초기화 */
  resetScroll() {
    this.scrollY = 0;
    this.container.y = this.top;
  }

  destroy() {
    this.maskGfx.destroy();
    this.container.destroy(true);
  }
}
