import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  private lifeTimer: number;
  private maxLife: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    damage: number,
    speed: number,
    angle: number,   // 라디안
    duration: number // 밀리초
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = damage;
    this.lifeTimer = 0;
    this.maxLife = duration;

    // 방향 벡터로 속도 설정
    this.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // 원형 히트박스 (반지름 6px)
    this.setCircle(6, this.width / 2 - 6, this.height / 2 - 6);
  }

  update(delta: number) {
    this.lifeTimer += delta;
    if (this.lifeTimer >= this.maxLife) {
      this.destroy();
    }
  }
}
