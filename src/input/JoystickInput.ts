import Phaser from 'phaser';

export interface JoystickCallbacks {
  isBlocked: () => boolean;        // isGameOver || isLevelingUp
  onPause:   () => void;
  onResume:  () => void;
  isPaused:  () => boolean;
}

export class JoystickInput {
  private scene: Phaser.Scene;
  private cb: JoystickCallbacks;

  private active    = false;
  private pointerId = -1;
  private originX   = 0;
  private originY   = 0;

  dx = 0;   // -1 ~ 1
  dy = 0;   // -1 ~ 1

  private readonly RADIUS  = 52;
  private readonly KNOB_R  = 22;
  private readonly UI_TOP  = 70;
  private uiBot = 0;

  private base!:  Phaser.GameObjects.Graphics;
  private knob!:  Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, gameCam: Phaser.Cameras.Scene2D.Camera, cb: JoystickCallbacks) {
    this.scene = scene;
    this.cb    = cb;
    this.uiBot = scene.scale.height - 48;   // BOT_H 여유

    this.base = scene.add.graphics();
    this.knob = scene.add.graphics();
    gameCam.ignore([this.base, this.knob]);
    this.drawGraphics();
    this.base.setVisible(false);
    this.knob.setVisible(false);

    this.setup(gameCam);
  }

  reset() {
    this.active    = false;
    this.pointerId = -1;
    this.dx        = 0;
    this.dy        = 0;
    this.hide();
  }

  // ── 내부 ──────────────────────────────────────

  private drawGraphics() {
    this.base.clear();
    this.base.fillStyle(0xffffff, 0.10);
    this.base.fillCircle(0, 0, this.RADIUS);
    this.base.lineStyle(2, 0xffffff, 0.35);
    this.base.strokeCircle(0, 0, this.RADIUS);

    this.knob.clear();
    this.knob.fillStyle(0xffffff, 0.55);
    this.knob.fillCircle(0, 0, this.KNOB_R);
    this.knob.fillStyle(0xffffff, 0.85);
    this.knob.fillCircle(0, 0, this.KNOB_R * 0.45);
  }

  private show(x: number, y: number) {
    this.base.setPosition(x, y).setVisible(true).setAlpha(1);
    this.knob.setPosition(x, y).setVisible(true).setAlpha(1);
  }

  private moveKnob(ox: number, oy: number, tx: number, ty: number) {
    const dx    = tx - ox;
    const dy    = ty - oy;
    const dist  = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const clamp = Math.min(dist, this.RADIUS);
    this.knob.setPosition(ox + Math.cos(angle) * clamp, oy + Math.sin(angle) * clamp);
  }

  private hide() {
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }

  private setup(gameCam: Phaser.Cameras.Scene2D.Camera) {
    const scene = this.scene;

    // 탭 비활성화 시 자동 일시정지
    const onHidden = () => {
      if (!this.cb.isBlocked() && !this.cb.isPaused()) {
        this.cb.onPause();
      }
    };
    scene.game.events.on('hidden', onHidden);
    scene.events.once('shutdown', () => scene.game.events.off('hidden', onHidden));

    // 키보드 일시정지 (ESC / P)
    scene.input.keyboard!.on('keydown-ESC', () => {
      if (this.cb.isBlocked()) return;
      if (this.cb.isPaused()) this.cb.onResume(); else this.cb.onPause();
    });
    scene.input.keyboard!.on('keydown-P', () => {
      if (this.cb.isBlocked()) return;
      if (this.cb.isPaused()) this.cb.onResume(); else this.cb.onPause();
    });

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.cb.isBlocked() || this.cb.isPaused()) return;
      if (p.y < this.UI_TOP || p.y > this.uiBot) return;
      if (this.active) return;

      this.active    = true;
      this.pointerId = p.id;
      this.originX   = p.x;
      this.originY   = p.y;
      this.show(p.x, p.y);
    });

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.active || p.id !== this.pointerId) return;

      const dx    = p.x - this.originX;
      const dy    = p.y - this.originY;
      const dist  = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (dist < 5) {
        this.dx = 0;
        this.dy = 0;
      } else {
        const ratio = Math.min(dist / this.RADIUS, 1);
        this.dx = Math.cos(angle) * ratio;
        this.dy = Math.sin(angle) * ratio;
      }
      this.moveKnob(this.originX, this.originY, p.x, p.y);
    });

    const resetJoystick = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.pointerId) return;
      this.active    = false;
      this.pointerId = -1;
      this.dx        = 0;
      this.dy        = 0;
      this.hide();
    };

    scene.input.on('pointerup',     resetJoystick);
    scene.input.on('pointercancel', resetJoystick);
  }
}
