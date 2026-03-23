import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { getStageData, getActiveEnemyPool, getElitePool } from '../data/stages';
import { showBossAlert, showDarkraiAlert } from '../ui/Announcements';
import { clearStage } from '../lib/stageProgress';
import type { Player } from '../entities/Player';

export interface SpawnContext {
  scene: Phaser.Scene;
  gameCam: Phaser.Cameras.Scene2D.Camera;
  enemies: Phaser.Physics.Arcade.Group;
  getStageId: () => number;
  getPlayer: () => Player;
  getWorldW: () => number;
  getWorldH: () => number;
  /** ボス출현 시 호출 — currentBoss/Name/Wave 세팅, HUD, BGM */
  onBossSpawned: (boss: Enemy, name: string, wave: number) => void;
  /** 다크라이 페이즈 시작 시 호출 — darkraiSpawned=true, stageCleared=true, clearStage */
  onDarkraiPhase: () => void;
  /** 다크라이 엔티티 생성 후 호출 — currentBoss 세팅, HUD */
  onDarkraiSpawned: (darkrai: Enemy) => void;
  /** 적 1마리 스폰될 때마다 호출 — activeEnemyCount 카운터 증가 */
  onEnemySpawned: () => void;
}

export class SpawnSystem {
  private ctx: SpawnContext;

  constructor(ctx: SpawnContext) {
    this.ctx = ctx;
  }

  spawnWave(waveNumber: number) {
    // 30웨이브(15분) — 다크라이 등장, 일반 스폰 없음
    if (waveNumber === 30) {
      this.ctx.scene.time.delayedCall(1000, () => this.spawnDarkrai());
      return;
    }

    const count = Math.round(6 + waveNumber * 2 + waveNumber * waveNumber * 0.3);
    for (let i = 0; i < count; i++) {
      this.ctx.scene.time.delayedCall(i * 160, () => this.spawnEnemy(waveNumber));
    }

    // 10웨이브(5분) → 스테이지별 보스, 20웨이브(10분) → 스테이지별 보스
    if (waveNumber === 10 || waveNumber === 20) {
      this.ctx.scene.time.delayedCall(1500, () => this.spawnBoss(waveNumber));
    }
  }

  spawnEnemy(waveNumber: number) {
    const { x, y } = this.getSpawnPosition();
    const pool  = getActiveEnemyPool(this.ctx.getStageId(), waveNumber);
    const entry = pool[Phaser.Math.Between(0, pool.length - 1)];
    const hp    = entry.baseHp ?? (30 + entry.minWave * 40);

    const enemy = new Enemy(this.ctx.scene, x, y, `pokemon_${entry.id}`, {
      hp,
      moveSpeed:    Math.min(Math.round(40 + waveNumber * 4 + waveNumber * waveNumber * 0.3), 180),
      exp:          2 + waveNumber,
      pokemonTypes: entry.types,
      isElite:      false,
      goldValue:    1,
    });
    this.ctx.enemies.add(enemy);
    this.ctx.scene.cameras.main.ignore(enemy);
    this.ctx.onEnemySpawned();
  }

  spawnElite(waveNumber: number) {
    const { x, y } = this.getSpawnPosition();
    const pool   = getElitePool(this.ctx.getStageId());
    const entry  = pool[Phaser.Math.Between(0, pool.length - 1)];
    const baseHp = entry.baseHp ?? 200;
    const elite  = new Enemy(this.ctx.scene, x, y, `pokemon_${entry.id}`, {
      hp:           baseHp * 5,
      moveSpeed:    Math.min(65 + waveNumber * 4, 150),
      exp:          10 + waveNumber * 2,
      pokemonTypes: entry.types,
      isElite:      true,
      goldValue:    8,
    });
    this.ctx.enemies.add(elite);
    this.ctx.scene.cameras.main.ignore(elite);
    this.ctx.onEnemySpawned();
  }

  // ──────────────────────────────────────────────────────────

  private spawnBoss(wave: number) {
    const { x, y } = this.getSpawnPosition();
    const stage      = getStageData(this.ctx.getStageId());
    const bossConfig = wave === 10 ? stage.boss10 : stage.boss20;

    const boss = new Enemy(this.ctx.scene, x, y, `pokemon_${bossConfig.id}`, {
      hp:           Math.round(bossConfig.hp * stage.difficulty),
      moveSpeed:    bossConfig.moveSpeed,
      exp:          bossConfig.exp,
      isBoss:       true,
      pokemonTypes: bossConfig.types,
      goldValue:    bossConfig.goldValue,
    });
    this.ctx.enemies.add(boss);
    this.ctx.scene.cameras.main.ignore(boss);
    this.ctx.onEnemySpawned();

    this.ctx.onBossSpawned(boss, bossConfig.name, wave);
    this.ctx.gameCam.shake(600, 0.015);
    this.ctx.scene.time.delayedCall(300, () => showBossAlert(this.ctx.scene, this.ctx.gameCam));
  }

  private spawnDarkrai() {
    this.ctx.onDarkraiPhase();

    // ── 1. 기존 모든 적 제거 ──
    this.ctx.enemies.getChildren().slice().forEach(e => (e as Enemy).destroy());

    // ── 2. 맵 흑백 전환 ──
    const cm = this.ctx.gameCam.postFX.addColorMatrix();
    cm.grayscale(0, false);
    this.ctx.scene.tweens.add({
      targets: { v: 0 },
      v: 1,
      duration: 1800,
      ease: 'Sine.easeIn',
      onUpdate: (tween) => { cm.grayscale(tween.getValue() as number, false); },
    });

    // ── 3. 화면 암전 후 다크라이 등장 ──
    this.ctx.scene.cameras.main.flash(400, 0, 0, 0, true);
    this.ctx.gameCam.flash(400, 0, 0, 0, true);

    this.ctx.scene.time.delayedCall(600, () => {
      const player = this.ctx.getPlayer();
      const spawnX = player.x;
      const spawnY = player.y - 300;

      const darkrai = new Enemy(this.ctx.scene, spawnX, spawnY, 'pokemon_491', {
        hp:              99990000,
        moveSpeed:       210,
        exp:             0,
        isBoss:          true,
        pokemonTypes:    ['dark'],
        goldValue:       0,
        contactDamage:   30000,
        ignoreKnockback: true,
      });

      darkrai.postFX.clear();
      darkrai.postFX.addGlow(0x330066, 6, 0, false, 0.2, 10);
      darkrai.setTint(0xcc88ff);
      darkrai.setScale(2.5);
      darkrai.setAlpha(0);

      this.ctx.enemies.add(darkrai);
      this.ctx.scene.cameras.main.ignore(darkrai);
      this.ctx.onEnemySpawned();

      // 페이드인 + 낙하 연출
      this.ctx.scene.tweens.add({
        targets: darkrai,
        alpha: 1,
        y: spawnY + 200,
        duration: 800,
        ease: 'Back.easeOut',
      });

      this.ctx.onDarkraiSpawned(darkrai);
      this.ctx.gameCam.shake(1200, 0.03);
      showDarkraiAlert(this.ctx.scene, this.ctx.gameCam);
    });
  }

  private getSpawnPosition(): { x: number; y: number } {
    const cam    = this.ctx.gameCam;
    const margin = 100;
    const side   = Phaser.Math.Between(0, 3);
    const cx = cam.scrollX + cam.width  / 2;
    const cy = cam.scrollY + cam.height / 2;
    const hw = cam.width  / 2 + margin;
    const hh = cam.height / 2 + margin;
    let x: number, y: number;
    switch (side) {
      case 0: x = cx + Phaser.Math.Between(-hw, hw); y = cy - hh; break;
      case 1: x = cx + Phaser.Math.Between(-hw, hw); y = cy + hh; break;
      case 2: x = cx - hw; y = cy + Phaser.Math.Between(-hh, hh); break;
      default: x = cx + hw; y = cy + Phaser.Math.Between(-hh, hh); break;
    }
    return {
      x: Phaser.Math.Clamp(x, 0, this.ctx.getWorldW()),
      y: Phaser.Math.Clamp(y, 0, this.ctx.getWorldH()),
    };
  }
}
