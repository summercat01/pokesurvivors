import Phaser from 'phaser';
import { PlayerStats } from '../types';

export const DEFAULT_STATS: PlayerStats = {
  hp: 100,
  maxHp: 100,
  hpRegen: 0,
  defense: 0,
  moveSpeed: 150,
  attackPower: 10,
  projectileSpeed: 300,
  cooldownReduction: 0,
  evasion: 0,
  projectileDuration: 2,
  critChance: 0.05,
  critDamage: 2.0,
  projectileCount: 1,
  revives: 0,
  goldGain: 1.0,
  expGain: 1.0,
  knockback: 100,
  projectileRange: 1.0,
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private hpRegenTimer: number = 0;
  private iFrameTimer: number = 0;       // 현재 무적 남은 시간 (ms)
  private readonly I_FRAME_DURATION = 500; // 피격 후 0.5초 무적

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'trainer');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.stats = { ...DEFAULT_STATS };
    this.setScale(0.75);
    this.setCollideWorldBounds(false);

    // 원형 히트박스 (반지름 20px)
    const radius = 15;
    this.setCircle(radius, this.width / 2 - radius, this.height / 2 - radius);

    // 입력 설정
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(delta: number, joystickDx = 0, joystickDy = 0) {
    this.handleMovement(joystickDx, joystickDy);
    this.handleHpRegen(delta);
    this.handleIFrame(delta);
  }

  private handleIFrame(delta: number) {
    if (this.iFrameTimer <= 0) return;
    this.iFrameTimer -= delta;
    // 무적 중 깜빡임 효과
    this.setAlpha(Math.floor(this.iFrameTimer / 100) % 2 === 0 ? 1 : 0.3);
    if (this.iFrameTimer <= 0) this.setAlpha(1);
  }

  isInvincible(): boolean {
    return this.iFrameTimer > 0;
  }

  private handleMovement(joystickDx: number, joystickDy: number) {
    const speed = this.stats.moveSpeed;
    let vx = 0;
    let vy = 0;

    // ── 키보드 입력 ──
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

    if (left)  vx -= 1;
    if (right) vx += 1;
    if (up)    vy -= 1;
    if (down)  vy += 1;

    // ── 조이스틱 입력 합산 (-1~1 범위) ──
    vx += joystickDx;
    vy += joystickDy;

    // ── 최종 벡터 정규화 (최대 speed 고정) ──
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag > 0.01) {
      const norm = Math.min(mag, 1);   // 1 초과 방지
      vx = (vx / mag) * norm * speed;
      vy = (vy / mag) * norm * speed;
    } else {
      vx = 0;
      vy = 0;
    }

    this.setVelocity(vx, vy);

    // 좌우 반전 (원본 스프라이트가 왼쪽을 바라봄)
    if (vx < 0) this.setFlipX(false);
    else if (vx > 0) this.setFlipX(true);
  }

  private handleHpRegen(delta: number) {
    if (this.stats.hpRegen <= 0) return;
    this.hpRegenTimer += delta;
    if (this.hpRegenTimer >= 1000) {
      this.heal(this.stats.hpRegen);
      this.hpRegenTimer -= 1000;
    }
  }

  takeDamage(amount: number): number {
    // 무적 시간 중 피격 무시
    if (this.iFrameTimer > 0) return 0;
    // 회피 판정
    if (Math.random() < this.stats.evasion) return 0;

    const actual = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actual);
    this.iFrameTimer = this.I_FRAME_DURATION; // 무적 시작
    return actual;
  }

  heal(amount: number) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }
}
