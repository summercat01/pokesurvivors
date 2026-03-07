import Phaser from 'phaser';
import { Player } from './Player';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  moveSpeed: number;
  exp: number;
  isBoss: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: {
      hp: number;
      moveSpeed: number;
      exp: number;
      isBoss?: boolean;
    }
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = config.hp;
    this.maxHp = config.hp;
    this.moveSpeed = config.moveSpeed;
    this.exp = config.exp;
    this.isBoss = config.isBoss ?? false;

    this.setScale(this.isBoss ? 1.0 : 0.75);

    // 원형 히트박스 설정
    // 일반: 반지름 15px, 보스: 반지름 20px
    const radius = this.isBoss ? 20 : 15;
    this.setCircle(
      radius,
      this.width / 2 - radius,   // offset X (스프라이트 중앙 정렬)
      this.height / 2 - radius   // offset Y
    );
  }

  update(player: Player) {
    // 플레이어 방향 목표 속도
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const targetVx = Math.cos(angle) * this.moveSpeed;
    const targetVy = Math.sin(angle) * this.moveSpeed;

    // 현재 velocity → 목표 velocity 로 lerp (떨림 방지)
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setVelocity(
      Phaser.Math.Linear(body.velocity.x, targetVx, 0.15),
      Phaser.Math.Linear(body.velocity.y, targetVy, 0.15),
    );

    // 좌우 반전 — 수평 거리가 8px 이상일 때만 갱신 (겹칠 때 깜빡임 방지)
    const dx = player.x - this.x;
    if (Math.abs(dx) > 8) {
      this.setFlipX(dx > 0);
    }
  }

  takeDamage(amount: number): number {
    this.hp = Math.max(0, this.hp - amount);
    return amount;
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}
