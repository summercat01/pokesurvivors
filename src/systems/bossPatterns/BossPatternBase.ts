import Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';

export interface BossPatternContext {
  scene: Phaser.Scene;
  getCurrentBoss: () => Enemy | null;
  getPlayer: () => Player;
  getWaveNumber: () => number;
}

/**
 * 보스 패턴 공유 상태 + 헬퍼.
 * BossPatternSystem이 상속하여 사용.
 */
export abstract class BossPatternBase {
  protected ctx: BossPatternContext;
  protected timer = 0;
  protected state = 'walk';
  protected rollTarget: { x: number; y: number } | null = null;
  protected indicatorGfx: Phaser.GameObjects.Graphics | null = null;
  protected phaseCount = 0;

  constructor(ctx: BossPatternContext) {
    this.ctx = ctx;
  }

  reset() {
    this.timer      = 0;
    this.state      = 'walk';
    this.rollTarget = null;
    this.phaseCount = 0;
    this.indicatorGfx?.destroy();
    this.indicatorGfx = null;
  }

  // ── 공통 헬퍼 ──────────────────────────────────────

  /** indicatorGfx 생성 */
  protected mkGfx() {
    this.indicatorGfx?.destroy();
    this.indicatorGfx = this.ctx.scene.add.graphics();
    this.ctx.scene.cameras.main.ignore(this.indicatorGfx);
  }

  /** indicatorGfx 제거 */
  protected clearGfx() {
    this.indicatorGfx?.destroy();
    this.indicatorGfx = null;
  }

  /** 플레이어 피해 + 텍스트 */
  protected hitPlayer(dmg: number, player: Player) {
    const actual = player.takeDamage(dmg);
    if (actual <= 0) return;
    const txt = this.ctx.scene.add.text(player.x, player.y - 20, `-${actual}`, {
      fontSize: '14px', color: '#ff4444', stroke: '#000000', strokeThickness: 3,
    }).setDepth(20);
    this.ctx.scene.cameras.main.ignore(txt);
    this.ctx.scene.tweens.add({
      targets: txt, y: txt.y - 20, alpha: 0,
      duration: 600, onComplete: () => txt.destroy(),
    });
  }

  /** 단순 투사체 발사 (onUpdate 히트 감지 포함) */
  protected fireBall(
    fromX: number, fromY: number,
    toX: number, toY: number,
    duration: number,
    baseDmg: number,
    color: number,
    hitRadius: number,
  ) {
    const { scene } = this.ctx;
    const ball = scene.add.circle(fromX, fromY, Math.max(6, hitRadius * 0.6), color, 1).setDepth(15);
    scene.cameras.main.ignore(ball);
    let hit = false;
    scene.tweens.add({
      targets: ball, x: toX, y: toY, duration, ease: 'Linear',
      onUpdate: () => {
        if (hit) return;
        const player = this.ctx.getPlayer();
        if (Phaser.Math.Distance.Between(ball.x, ball.y, player.x, player.y) <= hitRadius) {
          hit = true;
          this.hitPlayer(baseDmg + this.ctx.getWaveNumber() * 2, player);
        }
      },
      onComplete: () => {
        const splash = scene.add.circle(toX, toY, hitRadius * 0.9, color, 0.6).setDepth(15);
        scene.cameras.main.ignore(splash);
        scene.tweens.add({
          targets: splash, alpha: 0, scaleX: 2, scaleY: 2,
          duration: 250, onComplete: () => splash.destroy(),
        });
        ball.destroy();
      },
    });
  }

  /** 링 형태로 오브 발사 */
  protected fireRingOrbs(
    fromX: number, fromY: number,
    count: number, color: number,
    orbitRadius: number, baseDmg: number,
    travelDist: number,
  ) {
    const { scene } = this.ctx;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const startX = fromX + Math.cos(a) * orbitRadius;
      const startY = fromY + Math.sin(a) * orbitRadius;
      const endX   = fromX + Math.cos(a) * travelDist;
      const endY   = fromY + Math.sin(a) * travelDist;
      const orb = scene.add.circle(startX, startY, 8, color, 1).setDepth(15);
      scene.cameras.main.ignore(orb);
      let hit = false;
      scene.tweens.add({
        targets: orb, x: endX, y: endY, duration: 650, ease: 'Quad.easeIn',
        onUpdate: () => {
          if (hit) return;
          const player = this.ctx.getPlayer();
          if (Phaser.Math.Distance.Between(orb.x, orb.y, player.x, player.y) <= 16) {
            hit = true;
            this.hitPlayer(baseDmg + this.ctx.getWaveNumber() * 2, player);
          }
        },
        onComplete: () => orb.destroy(),
      });
    }
  }

  /** 낙뢰 연출 + 피해 */
  protected fireLightningStrike(tx: number, ty: number, baseDmg: number) {
    const { scene } = this.ctx;
    const warn = scene.add.graphics();
    scene.cameras.main.ignore(warn);
    warn.lineStyle(2, 0xffdd00, 0.7);
    warn.strokeCircle(tx, ty, 24);
    scene.time.delayedCall(450, () => {
      warn.destroy();
      const flash = scene.add.graphics();
      scene.cameras.main.ignore(flash);
      flash.fillStyle(0xffffff, 0.95);
      flash.fillCircle(tx, ty, 28);
      scene.tweens.add({
        targets: flash, alpha: 0, duration: 200,
        onComplete: () => flash.destroy(),
      });
      const player = this.ctx.getPlayer();
      if (Phaser.Math.Distance.Between(tx, ty, player.x, player.y) <= 30)
        this.hitPlayer(baseDmg, player);
    });
  }

  /** 독 구름 — 지속 시간 동안 남아서 틱 피해 */
  protected spawnPoisonCloud(x: number, y: number, radius: number, lifeMs: number, baseDmg: number) {
    const { scene } = this.ctx;
    const gfx = scene.add.graphics();
    scene.cameras.main.ignore(gfx);
    let elapsed = 0;
    let lastTick = 0;
    const timer = scene.time.addEvent({
      delay: 100, loop: true,
      callback: () => {
        elapsed += 100;
        const alpha = 1 - elapsed / lifeMs;
        if (alpha <= 0) { gfx.destroy(); timer.remove(); return; }
        gfx.clear();
        gfx.fillStyle(0x99cc44, alpha * 0.35);
        gfx.fillCircle(x, y, radius);
        gfx.lineStyle(2, 0x99cc44, alpha * 0.6);
        gfx.strokeCircle(x, y, radius);
        if (elapsed - lastTick >= 500) {
          lastTick = elapsed;
          const player = this.ctx.getPlayer();
          if (Phaser.Math.Distance.Between(x, y, player.x, player.y) <= radius)
            this.hitPlayer(baseDmg, player);
        }
      },
    });
  }

  /** 충격파 링 */
  protected fireShockwaveRing(x: number, y: number, radius: number, color: number, baseDmg: number) {
    const { scene } = this.ctx;
    const dummy = { r: 0 };
    const gfx = scene.add.graphics();
    scene.cameras.main.ignore(gfx);
    let hit = false;
    scene.tweens.add({
      targets: dummy, r: radius, duration: 400, ease: 'Sine.easeOut',
      onUpdate: () => {
        gfx.clear();
        const alpha = 1 - dummy.r / radius;
        gfx.lineStyle(5, color, alpha * 0.9);
        gfx.strokeCircle(x, y, dummy.r);
        if (!hit) {
          const player = this.ctx.getPlayer();
          const d = Phaser.Math.Distance.Between(x, y, player.x, player.y);
          if (d <= dummy.r + 20 && d >= dummy.r - 30) {
            hit = true;
            this.hitPlayer(baseDmg, player);
          }
        }
      },
      onComplete: () => gfx.destroy(),
    });
  }

  /** 암석 낙하 */
  protected fireRock(tx: number, ty: number, baseDmg: number) {
    const { scene } = this.ctx;
    const warn = scene.add.graphics();
    scene.cameras.main.ignore(warn);
    warn.fillStyle(0xbbaa66, 0.4); warn.fillCircle(tx, ty, 28);
    warn.lineStyle(2, 0xbbaa66, 0.7); warn.strokeCircle(tx, ty, 28);
    scene.time.delayedCall(500, () => {
      warn.destroy();
      const rock = scene.add.circle(tx, ty, 18, 0x887755, 0.95).setDepth(14);
      scene.cameras.main.ignore(rock);
      scene.tweens.add({
        targets: rock, alpha: 0, scaleX: 2, scaleY: 2,
        duration: 280, onComplete: () => rock.destroy(),
      });
      const player = this.ctx.getPlayer();
      if (Phaser.Math.Distance.Between(tx, ty, player.x, player.y) <= 32)
        this.hitPlayer(baseDmg, player);
    });
  }
}
