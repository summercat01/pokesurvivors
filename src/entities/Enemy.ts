import Phaser from 'phaser';
import { Player } from './Player';
import type { PokemonType } from '../types';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  moveSpeed: number;
  exp: number;
  isBoss: boolean;
  isElite: boolean;
  pokemonTypes: PokemonType[];   // 이중 타입 지원 (최대 2개)
  /** @deprecated pokemonTypes[0] 사용 권장 */
  get pokemonType(): PokemonType { return this.pokemonTypes[0]; }
  goldValue: number;
  contactDamage?: number;  // 설정 시 접촉 데미지로 사용 (기본값: 게임씬 수식)
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
      isElite?: boolean;
      pokemonTypes?: PokemonType[];
      pokemonType?: PokemonType;   // 단일 타입 하위 호환
      goldValue?: number;
      contactDamage?: number;
    }
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.postFX.addGlow(0x000000, 1, 0, false, 0.1, 2);

    this.hp = config.hp;
    this.maxHp = config.hp;
    this.moveSpeed = config.moveSpeed;
    this.exp = config.exp;
    this.isBoss = config.isBoss ?? false;
    this.isElite = config.isElite ?? false;
    this.pokemonTypes = config.pokemonTypes
      ?? (config.pokemonType ? [config.pokemonType] : ['normal']);
    this.goldValue    = config.goldValue ?? (this.isBoss ? 5 : 1);
    this.contactDamage = config.contactDamage;

    this.setScale(this.isBoss ? 1.6 : this.isElite ? 1.0 : 0.75);
    this.setCollideWorldBounds(true);

    // 엘리트 → 황금 틴트
    if (this.isElite) {
      this.setTint(0xffdd44);
      this.postFX.clear();
      this.postFX.addGlow(0xffaa00, 2, 0, false, 0.15, 3);
    }

    // 원형 히트박스 설정
    // 일반: 반지름 15px, 보스: 반지름 28px
    const radius = this.isBoss ? 28 : 15;
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
    // 피격 시 흰색 플래시
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });
    return amount;
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}
