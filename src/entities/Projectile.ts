import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage: number = 0;
  pierce: number = 0;
  hitEnemies: Set<number> = new Set();
  homing: boolean = false;
  explosionRadius: number = 0;
  sourceName: string = '';
  trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private lifeTimer: number = 0;
  private maxLife: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // 원형 히트박스 (반지름 6px)
    this.setCircle(6, this.width / 2 - 6, this.height / 2 - 6);
    this.setActive(false).setVisible(false);
  }

  fire(
    damage: number,
    speed: number,
    angle: number,
    duration: number,
    pierce: number = 0,
  ) {
    this.damage = damage;
    this.pierce = pierce;
    this.lifeTimer = 0;
    this.maxLife = duration;
    this.homing = false;
    this.explosionRadius = 0;
    this.sourceName = '';
    this.hitEnemies.clear();
    this.setActive(true).setVisible(true);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  kill() {
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      const e = this.trailEmitter;
      this.scene?.time.delayedCall(300, () => { if (e.scene) e.destroy(); });
      this.trailEmitter = null;
    }
    this.setActive(false).setVisible(false);
    this.setVelocity(0, 0);
  }

  update(delta: number) {
    if (!this.active) return;
    if (this.trailEmitter) {
      this.trailEmitter.setPosition(this.x, this.y);
    }
    this.lifeTimer += delta;
    if (this.lifeTimer >= this.maxLife) {
      this.kill();
    }
  }
}
