import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

export interface BossPatternContext {
  scene: Phaser.Scene;
  getCurrentBoss: () => Enemy | null;
  getPlayer: () => Player;
  getWaveNumber: () => number;
}

export class BossPatternSystem {
  private ctx: BossPatternContext;
  private timer: number = 0;
  private state: string = 'walk';
  private rollTarget: { x: number; y: number } | null = null;
  private indicatorGfx: Phaser.GameObjects.Graphics | null = null;
  private phaseCount: number = 0;

  constructor(ctx: BossPatternContext) {
    this.ctx = ctx;
  }

  update(delta: number) {
    const boss = this.ctx.getCurrentBoss();
    if (!boss?.active) return;
    const key = boss.texture.key;
    // ─── Stage 1 ───
    if      (key === 'pokemon_143') this.updateSnorlax(delta, boss);
    else if (key === 'pokemon_115') this.updateKangaskhan(delta, boss);
    else if (key === 'pokemon_040') this.updateWigglytuff(delta, boss);
    // ─── Stage 2 Bug ───
    else if (key === 'pokemon_127') this.updatePinsir(delta, boss);
    else if (key === 'pokemon_267') this.updateBeautifly(delta, boss);
    // ─── Stage 3 Grass ───
    else if (key === 'pokemon_003') this.updateVenusaur(delta, boss);
    else if (key === 'pokemon_254') this.updateSceptile(delta, boss);
    // ─── Stage 4 Fire ───
    else if (key === 'pokemon_059') this.updateArcanine(delta, boss);
    else if (key === 'pokemon_006') this.updateCharizard(delta, boss);
    // ─── Stage 5 Water ───
    else if (key === 'pokemon_130') this.updateGyarados(delta, boss);
    else if (key === 'pokemon_395') this.updateEmpoleon(delta, boss);
    // ─── Stage 6 Electric ───
    else if (key === 'pokemon_466') this.updateElectivire(delta, boss);
    else if (key === 'pokemon_026') this.updateRaichu(delta, boss);
    // ─── Stage 7 Flying ───
    else if (key === 'pokemon_142') this.updateAerodactyl(delta, boss);
    else if (key === 'pokemon_398') this.updateStartaptor(delta, boss);
    // ─── Stage 8 Poison ───
    else if (key === 'pokemon_089') this.updateMuk(delta, boss);
    else if (key === 'pokemon_034') this.updateNidoking(delta, boss);
    // ─── Stage 9 Ground ───
    else if (key === 'pokemon_450') this.updateHippowdon(delta, boss);
    else if (key === 'pokemon_076') this.updateGolem(delta, boss);
    // ─── Stage 10 Rock ───
    else if (key === 'pokemon_409') this.updateRampardos(delta, boss);
    else if (key === 'pokemon_248') this.updateTyranitar(delta, boss);
    // ─── Stage 11 Fighting ───
    else if (key === 'pokemon_297') this.updateHariyama(delta, boss);
    else if (key === 'pokemon_068') this.updateMachamp(delta, boss);
    // ─── Stage 12 Psychic ───
    else if (key === 'pokemon_282') this.updateGardevoir(delta, boss);
    else if (key === 'pokemon_065') this.updateAlakazam(delta, boss);
    // ─── Stage 13 Ghost ───
    else if (key === 'pokemon_429') this.updateMismagius(delta, boss);
    else if (key === 'pokemon_094') this.updateGengar(delta, boss);
    // ─── Stage 14 Steel ───
    else if (key === 'pokemon_306') this.updateAggron(delta, boss);
    else if (key === 'pokemon_376') this.updateMetagross(delta, boss);
    // ─── Stage 15 Dragon ───
    else if (key === 'pokemon_149') this.updateDragonite(delta, boss);
    else if (key === 'pokemon_445') this.updateGarchomp(delta, boss);
    // ─── Stage 16 Ice ───
    else if (key === 'pokemon_131') this.updateLapras(delta, boss);
    else if (key === 'pokemon_473') this.updateMamoswine(delta, boss);
    // ─── Stage 17 Dark ───
    else if (key === 'pokemon_262') this.updateMightyena(delta, boss);
    else if (key === 'pokemon_442') this.updateSpiritomb(delta, boss);
  }

  reset() {
    this.timer      = 0;
    this.state      = 'walk';
    this.rollTarget = null;
    this.phaseCount = 0;
    this.indicatorGfx?.destroy();
    this.indicatorGfx = null;
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 1 ─────────────────────────────────────────────

  // 잠만보(#143): 걷기 → 준비 → 굴리기
  private updateSnorlax(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 4500) {
        this.state = 'charging'; this.timer = 0;
        this.rollTarget = { x: this.ctx.getPlayer().x, y: this.ctx.getPlayer().y };
        boss.setTint(0xff8800);
        this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        const r = 20 + (this.timer / 1200) * 60;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0xff6600, 0.7);
        this.indicatorGfx.strokeCircle(boss.x, boss.y, r);
        this.indicatorGfx.fillStyle(0xff6600, 0.1);
        this.indicatorGfx.fillCircle(boss.x, boss.y, r);
      }
      if (this.timer >= 1200) {
        this.state = 'rolling'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xff2200);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 };
        }
      }
    } else if (this.state === 'rolling') {
      if (this.timer >= 750) {
        this.state = 'walk'; this.timer = 0;
        boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
      }
    }
  }

  // 캥카(#115): 걷기 → 조준 → 발사
  private updateKangaskhan(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'aiming'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0xffee44); this.mkGfx();
      }
    } else if (this.state === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(2, 0xffee44, 0.5);
        this.indicatorGfx.lineBetween(boss.x, boss.y, player.x, player.y);
        this.indicatorGfx.fillStyle(0xffee44, 0.6);
        this.indicatorGfx.fillCircle(player.x, player.y, 12);
      }
      if (this.timer >= 700) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        const t = this.rollTarget ?? { x: player.x, y: player.y };
        this.fireBall(boss.x, boss.y, t.x, t.y, 480, 10, 0xffcc22, 44);
        this.rollTarget = null;
      }
    }
  }

  // 푸크린(#040): 노래 AoE
  private updateWigglytuff(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'singing'; this.timer = 0; this.phaseCount = 0;
        boss.setTint(0xff88ff); this.mkGfx();
      }
    } else if (this.state === 'singing') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        this.indicatorGfx.clear();
        for (let i = 0; i < 3; i++) {
          const p = ((this.timer % 600) / 600 + i / 3) % 1;
          this.indicatorGfx.lineStyle(3, 0xff88ff, (1 - p) * 0.85);
          this.indicatorGfx.strokeCircle(boss.x, boss.y, 20 + p * 130);
        }
      }
      const tick = Math.floor(this.timer / 500);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        if (Phaser.Math.Distance.Between(boss.x, boss.y, player.x, player.y) <= 130)
          this.hitPlayer(8 + this.ctx.getWaveNumber() * 2, player);
      }
      if (this.timer >= 2000) {
        this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
        boss.movementOverride = null; boss.clearTint(); this.clearGfx();
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 2 Bug ─────────────────────────────────────────

  // 파르셀(#127) Pinsir: 집게 — 2연속 돌진
  private updatePinsir(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3200) {
        this.state = 'charging'; this.timer = 0; this.phaseCount = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x88cc00); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        const p = this.timer / 800;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0x88cc00, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
        this.indicatorGfx.fillStyle(0x88cc00, 0.3);
        this.indicatorGfx.fillCircle(this.rollTarget.x, this.rollTarget.y, 14 + p * 12);
      }
      if (this.timer >= 800) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0x44aa00);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 380, vy: Math.sin(a) * 380 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 380) {
        this.phaseCount++;
        if (this.phaseCount >= 2) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
        } else {
          this.state = 'charging'; this.timer = 0;
          this.rollTarget = { x: player.x, y: player.y };
          boss.setTint(0x88cc00); boss.movementOverride = { vx: 0, vy: 0 };
          this.mkGfx();
        }
      }
    }
  }

  // 뷰티플라이(#267): 인분 — 12발 링 → 안으로 수렴
  private updateBeautifly(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'spawning'; this.timer = 0;
        boss.setTint(0xffaa22); this.mkGfx();
      }
    } else if (this.state === 'spawning') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        this.indicatorGfx.clear();
        const spin = (this.timer / 800) * Math.PI * 2;
        for (let i = 0; i < 12; i++) {
          const a = spin + (i / 12) * Math.PI * 2;
          this.indicatorGfx.fillStyle(0xffaa22, 0.8);
          this.indicatorGfx.fillCircle(boss.x + Math.cos(a) * 70, boss.y + Math.sin(a) * 70, 5);
        }
      }
      if (this.timer >= 1000) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        this.fireRingOrbs(boss.x, boss.y, 12, 0xffaa22, 70, 14, 260);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 3 Grass ───────────────────────────────────────

  // 이상해꽃(#003) Venusaur: 덩굴채찍 5방향 부채꼴
  private updateVenusaur(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3200) {
        this.state = 'aiming'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x44cc44); this.mkGfx();
      }
    } else if (this.state === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
        for (let i = -2; i <= 2; i++) {
          const a = baseAngle + i * 0.28;
          this.indicatorGfx.lineStyle(2, 0x44cc44, 0.55);
          this.indicatorGfx.lineBetween(boss.x, boss.y, boss.x + Math.cos(a) * 240, boss.y + Math.sin(a) * 240);
        }
      }
      if (this.timer >= 900) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        if (this.rollTarget) {
          const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          for (let i = -2; i <= 2; i++) {
            const a = baseAngle + i * 0.28;
            const bx = boss.x, by = boss.y;
            this.ctx.scene.time.delayedCall(i * 80 + 80, () => {
              this.fireBall(bx, by, bx + Math.cos(a) * 260, by + Math.sin(a) * 260, 450, 9, 0x44cc44, 14);
            });
          }
        }
        this.rollTarget = null;
      }
    }
  }

  // 나무킹(#254) Sceptile: 빠른 돌진 + 리프블레이드 3발
  private updateSceptile(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 2800) {
        this.state = 'charging'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x22dd44); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0x22dd44, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
      }
      if (this.timer >= 600) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0x00ff44);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 500, vy: Math.sin(a) * 500 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 300) {
        this.state = 'shooting'; this.timer = 0; this.phaseCount = 0;
        boss.movementOverride = { vx: 0, vy: 0 }; boss.clearTint();
      }
    } else if (this.state === 'shooting') {
      const tick = Math.floor(this.timer / 280);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        const a = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y) + (this.phaseCount - 2) * 0.3;
        this.fireBall(boss.x, boss.y, boss.x + Math.cos(a) * 280, boss.y + Math.sin(a) * 280, 400, 10, 0x22dd44, 13);
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; this.rollTarget = null;
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 4 Fire ────────────────────────────────────────

  // 윈디(#059): 3연속 돌진
  private updateArcanine(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'charging'; this.timer = 0; this.phaseCount = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0xff6600); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        const p = this.timer / 700;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0xff6600, 0.6 + p * 0.4);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
        this.indicatorGfx.fillStyle(0xff6600, 0.25);
        this.indicatorGfx.fillCircle(this.rollTarget.x, this.rollTarget.y, 18 + p * 10);
      }
      if (this.timer >= 700) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xff2200);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 450, vy: Math.sin(a) * 450 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 350) {
        this.phaseCount++;
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
        } else {
          this.state = 'charging'; this.timer = 0;
          this.rollTarget = { x: player.x, y: player.y };
          boss.setTint(0xff6600); boss.movementOverride = { vx: 0, vy: 0 }; this.mkGfx();
        }
      }
    }
  }

  // 리자몽(#006): 8방향 화염탄 폭발
  private updateCharizard(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'windup'; this.timer = 0;
        boss.setTint(0xff4400); this.mkGfx();
      }
    } else if (this.state === 'windup') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        const r = 20 + (this.timer / 1000) * 80;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0xff4400, 0.85);
        this.indicatorGfx.strokeCircle(boss.x, boss.y, r);
        this.indicatorGfx.fillStyle(0xff4400, 0.08 + (this.timer / 1000) * 0.1);
        this.indicatorGfx.fillCircle(boss.x, boss.y, r);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          this.indicatorGfx.lineStyle(1, 0xff8800, 0.5);
          this.indicatorGfx.lineBetween(boss.x, boss.y, boss.x + Math.cos(a) * r, boss.y + Math.sin(a) * r);
        }
      }
      if (this.timer >= 1000) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        this.fireCharizardBurst(boss.x, boss.y);
      }
    }
  }

  private fireCharizardBurst(fromX: number, fromY: number) {
    const { scene } = this.ctx;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      scene.time.delayedCall(i * 55, () => {
        const endX = fromX + Math.cos(angle) * 280;
        const endY = fromY + Math.sin(angle) * 280;
        this.fireBall(fromX, fromY, endX, endY, 520, 10, 0xff4400, 18);
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 5 Water ───────────────────────────────────────

  // 갸라도스(#130): 하이퍼빔 160px AoE
  private updateGyarados(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'charging'; this.timer = 0;
        boss.setTint(0x4488ff); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        const r = 60 + (this.timer / 1500) * 100;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(4, 0xffffff, 0.85);
        this.indicatorGfx.strokeCircle(boss.x, boss.y, r);
        this.indicatorGfx.fillStyle(0x4488ff, 0.07 + (this.timer / 1500) * 0.13);
        this.indicatorGfx.fillCircle(boss.x, boss.y, r);
      }
      if (this.timer >= 1500) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        const { scene } = this.ctx; const player = this.ctx.getPlayer();
        const flash = scene.add.circle(boss.x, boss.y, 160, 0xffffff, 0.9).setDepth(14);
        scene.cameras.main.ignore(flash);
        scene.tweens.add({ targets: flash, alpha: 0, scaleX: 0.15, scaleY: 0.15, duration: 380, onComplete: () => flash.destroy() });
        if (Phaser.Math.Distance.Between(boss.x, boss.y, player.x, player.y) <= 160)
          this.hitPlayer(20 + this.ctx.getWaveNumber() * 3, player);
      }
    }
  }

  // 엠페르트(#395): 파도 — 보스 전방 파형 AoE
  private updateEmpoleon(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'windup'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x2266cc); this.mkGfx();
      }
    } else if (this.state === 'windup') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
        for (let i = 1; i <= 3; i++) {
          const alpha = (this.timer / 900) * (1 - i * 0.25);
          this.indicatorGfx.lineStyle(4, 0x4499ff, alpha);
          const cx = boss.x + Math.cos(angle) * i * 80;
          const cy = boss.y + Math.sin(angle) * i * 80;
          this.indicatorGfx.strokeCircle(cx, cy, 36);
        }
      }
      if (this.timer >= 900) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        // 3개의 파도가 전방으로 순차 발사
        if (this.rollTarget) {
          const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          const bx = boss.x, by = boss.y;
          for (let i = 0; i < 3; i++) {
            this.ctx.scene.time.delayedCall(i * 180, () => {
              this.fireBall(bx, by, bx + Math.cos(angle) * 280, by + Math.sin(angle) * 280, 480, 11, 0x4499ff, 36);
            });
          }
        }
        this.rollTarget = null;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 6 Electric ────────────────────────────────────

  // 에레키블(#466): 번개주먹 — 플레이어 위치에 3번 낙뢰
  private updateElectivire(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3200) {
        this.state = 'aiming'; this.timer = 0; this.phaseCount = 0;
        boss.setTint(0xffdd00);
      }
    } else if (this.state === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      const tick = Math.floor(this.timer / 600);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        this.fireLightningStrike(player.x + Phaser.Math.Between(-40, 40), player.y + Phaser.Math.Between(-40, 40), 12 + this.ctx.getWaveNumber() * 2);
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint();
        }
      }
    }
  }

  // 라이츄(#026): 전기 오브 6개 → 플레이어 추적
  private updateRaichu(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'spawning'; this.timer = 0;
        boss.setTint(0xffee44); this.mkGfx();
      }
    } else if (this.state === 'spawning') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        this.indicatorGfx.clear();
        const spin = (this.timer / 700) * Math.PI * 2;
        for (let i = 0; i < 6; i++) {
          const a = spin + (i / 6) * Math.PI * 2;
          this.indicatorGfx.fillStyle(0xffee44, 0.9);
          this.indicatorGfx.fillCircle(boss.x + Math.cos(a) * 48, boss.y + Math.sin(a) * 48, 7);
        }
      }
      if (this.timer >= 1100) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        const spin = (1100 / 700) * Math.PI * 2;
        this.fireRingOrbs(boss.x, boss.y, 6, 0xffee44, 48, 12, 280);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 7 Flying ──────────────────────────────────────

  // 프테라(#142) Aerodactyl: 급강하 — 빠른 단독 돌진
  private updateAerodactyl(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 2800) {
        this.state = 'aiming'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x8888bb); this.mkGfx();
      }
    } else if (this.state === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0xaaaadd, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
        this.indicatorGfx.fillStyle(0xaaaadd, 0.35);
        this.indicatorGfx.fillCircle(this.rollTarget.x, this.rollTarget.y, 20);
      }
      if (this.timer >= 650) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xccccff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 520, vy: Math.sin(a) * 520 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 300) {
        this.state = 'walk'; this.timer = 0;
        boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
      }
    }
  }

  // 찌르호크(#398) Staraptor: 용감한 새 — 3연속 고속 돌진
  private updateStartaptor(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 2500) {
        this.state = 'charging'; this.timer = 0; this.phaseCount = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0xccaaff); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(2, 0xccaaff, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
      }
      if (this.timer >= 500) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xffffff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 560, vy: Math.sin(a) * 560 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 280) {
        this.phaseCount++;
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
        } else {
          this.state = 'charging'; this.timer = 0;
          this.rollTarget = { x: player.x, y: player.y };
          boss.setTint(0xccaaff); boss.movementOverride = { vx: 0, vy: 0 }; this.mkGfx();
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 8 Poison ──────────────────────────────────────

  // 질뻐기(#089) Muk: 독 구름 — 주변에 독 영역 2개 생성
  private updateMuk(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'spreading'; this.timer = 0; this.phaseCount = 0;
        boss.setTint(0x996688);
      }
    } else if (this.state === 'spreading') {
      boss.movementOverride = { vx: 0, vy: 0 };
      // 600ms마다 독 구름 생성
      const tick = Math.floor(this.timer / 600);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        this.spawnPoisonCloud(
          boss.x + Phaser.Math.Between(-80, 80),
          boss.y + Phaser.Math.Between(-80, 80),
          60, 2000, 6 + this.ctx.getWaveNumber()
        );
      }
      if (this.timer >= 1800) {
        this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
        boss.movementOverride = null; boss.clearTint();
      }
    }
  }

  // 니드킹(#034): 돌진 + 독 폭발
  private updateNidoking(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3200) {
        this.state = 'charging'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x9955cc); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0x9955cc, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
      }
      if (this.timer >= 900) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xcc55ff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 380, vy: Math.sin(a) * 380 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 400) {
        // 착지 시 독 폭발
        this.spawnPoisonCloud(boss.x, boss.y, 90, 1500, 12 + this.ctx.getWaveNumber() * 2);
        this.state = 'walk'; this.timer = 0;
        boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 9 Ground ──────────────────────────────────────

  // 하마축마(#450) Hippowdon: 지진 — 확장 충격파 링
  private updateHippowdon(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3800) {
        this.state = 'stomping'; this.timer = 0; this.phaseCount = 0;
        boss.movementOverride = { vx: 0, vy: 0 };
        boss.setTint(0xddaa55);
      }
    } else if (this.state === 'stomping') {
      // 500ms마다 충격파 링
      const tick = Math.floor(this.timer / 500);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        this.fireShockwaveRing(boss.x, boss.y, 80 + tick * 40, 0xddaa55, 10 + this.ctx.getWaveNumber() * 2);
      }
      if (this.timer >= 1500) {
        this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
        boss.movementOverride = null; boss.clearTint();
      }
    }
  }

  // 딱구리(#076) Golem: 구르기 — 3번, 점점 빠르게
  private updateGolem(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'charging'; this.timer = 0; this.phaseCount = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0xbbaa66); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0xbbaa66, 0.7);
        this.indicatorGfx.strokeCircle(boss.x, boss.y, 20 + (this.timer / 800) * 40);
      }
      if (this.timer >= 800) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xffddaa);
        const speed = 280 + this.phaseCount * 90; // 점점 빠르게
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 420) {
        this.phaseCount++;
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
        } else {
          this.state = 'charging'; this.timer = 0;
          this.rollTarget = { x: player.x, y: player.y };
          boss.setTint(0xbbaa66); boss.movementOverride = { vx: 0, vy: 0 }; this.mkGfx();
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 10 Rock ───────────────────────────────────────

  // 람파르드(#409) Rampardos: 박치기 — 긴 차징 + 강력한 단독 돌진
  private updateRampardos(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'charging'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x8888aa); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        const p = this.timer / 2000;
        const r = 20 + p * 100;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(4, 0xffffff, 0.5 + p * 0.5);
        this.indicatorGfx.strokeCircle(boss.x, boss.y, r);
        this.indicatorGfx.fillStyle(0x888888, 0.05 + p * 0.15);
        this.indicatorGfx.fillCircle(boss.x, boss.y, r);
        this.indicatorGfx.lineStyle(2, 0xccccff, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
      }
      if (this.timer >= 2000) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xffffff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 600, vy: Math.sin(a) * 600 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 400) {
        this.state = 'walk'; this.timer = 0;
        boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
      }
    }
  }

  // 마기라스(#248) Tyranitar: 암석 낙하 5개
  private updateTyranitar(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'summoning'; this.timer = 0; this.phaseCount = 0;
        boss.setTint(0x667744);
      }
    } else if (this.state === 'summoning') {
      boss.movementOverride = { vx: 0, vy: 0 };
      const tick = Math.floor(this.timer / 350);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        const tx = player.x + Phaser.Math.Between(-100, 100);
        const ty = player.y + Phaser.Math.Between(-100, 100);
        this.fireRock(tx, ty, 12 + this.ctx.getWaveNumber() * 2);
      }
      if (this.timer >= 1750) {
        this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
        boss.movementOverride = null; boss.clearTint();
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 11 Fighting ───────────────────────────────────

  // 하리테(#297) Hariyama: 지진내기 — 플레이어 위치로 점프 AoE
  private updateHariyama(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3200) {
        this.state = 'aiming'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0xcc8844); this.mkGfx();
      }
    } else if (this.state === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        const p = this.timer / 1200;
        const r = 20 + p * 80;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(4, 0xcc8844, 0.75);
        this.indicatorGfx.strokeCircle(this.rollTarget.x, this.rollTarget.y, r);
        this.indicatorGfx.fillStyle(0xcc8844, 0.1 + p * 0.1);
        this.indicatorGfx.fillCircle(this.rollTarget.x, this.rollTarget.y, r);
      }
      if (this.timer >= 1200) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        // 착지 AoE
        const tx = this.rollTarget!.x, ty = this.rollTarget!.y;
        const { scene } = this.ctx;
        const flash = scene.add.circle(tx, ty, 100, 0xdd9955, 0.85).setDepth(14);
        scene.cameras.main.ignore(flash);
        scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 350, onComplete: () => flash.destroy() });
        if (Phaser.Math.Distance.Between(tx, ty, player.x, player.y) <= 100)
          this.hitPlayer(18 + this.ctx.getWaveNumber() * 2, player);
        this.rollTarget = null;
      }
    }
  }

  // 괴력몬(#068) Machamp: 연속 펀치 — 4방향 순차 발사
  private updateMachamp(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'punching'; this.timer = 0; this.phaseCount = 0;
        boss.setTint(0xcc4444);
      }
    } else if (this.state === 'punching') {
      boss.movementOverride = { vx: 0, vy: 0 };
      const tick = Math.floor(this.timer / 320);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
        const a = baseAngle + (this.phaseCount - 1) * (Math.PI / 2);
        this.fireBall(boss.x, boss.y, boss.x + Math.cos(a) * 260, boss.y + Math.sin(a) * 260, 380, 11, 0xcc4444, 16);
        if (this.phaseCount >= 4) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint();
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 12 Psychic ────────────────────────────────────

  // 가디안(#282): 사이코 오브 6발 산개
  private updateGardevoir(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'spawning'; this.timer = 0;
        boss.setTint(0xff88cc); this.mkGfx();
      }
    } else if (this.state === 'spawning') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        this.indicatorGfx.clear();
        const spin = (this.timer / 900) * Math.PI * 2;
        for (let i = 0; i < 6; i++) {
          const a = spin + (i / 6) * Math.PI * 2;
          this.indicatorGfx.fillStyle(0xff88cc, 0.9);
          this.indicatorGfx.fillCircle(boss.x + Math.cos(a) * 52, boss.y + Math.sin(a) * 52, 8);
        }
      }
      if (this.timer >= 1200) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        const spin = (1200 / 900) * Math.PI * 2;
        this.fireRingOrbs(boss.x, boss.y, 6, 0xff88cc, 52, 12, 300);
      }
    }
  }

  // 후딘(#065) Alakazam: 사이코 파동 3발 추적
  private updateAlakazam(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'casting'; this.timer = 0; this.phaseCount = 0;
        boss.setTint(0xff66aa);
      }
    } else if (this.state === 'casting') {
      boss.movementOverride = { vx: 0, vy: 0 };
      const tick = Math.floor(this.timer / 500);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        // 플레이어 현재 위치로 추적 발사
        this.fireBall(boss.x, boss.y, player.x, player.y, 550, 10, 0xff66aa, 16);
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint();
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 13 Ghost ──────────────────────────────────────

  // 무우마직(#429) Mismagius: 도깨비불 — 6개 오브 공전 후 산개
  private updateMismagius(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 2800) {
        this.state = 'spawning'; this.timer = 0;
        boss.setTint(0xcc44cc); this.mkGfx();
      }
    } else if (this.state === 'spawning') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        this.indicatorGfx.clear();
        const spin = (this.timer / 600) * Math.PI * 2;
        for (let i = 0; i < 6; i++) {
          const a = spin + (i / 6) * Math.PI * 2;
          this.indicatorGfx.fillStyle(0xee6600, 0.85);
          this.indicatorGfx.fillCircle(boss.x + Math.cos(a) * 55, boss.y + Math.sin(a) * 55, 7);
        }
      }
      if (this.timer >= 1000) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        const spin = (1000 / 600) * Math.PI * 2;
        this.fireRingOrbs(boss.x, boss.y, 6, 0xee6600, 55, 11, 290);
      }
    }
  }

  // 팬텀(#094) Gengar: 순간이동 + 섀도볼 3발
  private updateGengar(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 2500) {
        this.state = 'vanishing'; this.timer = 0;
        boss.setTint(0x110022); boss.movementOverride = { vx: 0, vy: 0 };
      }
    } else if (this.state === 'vanishing') {
      boss.setAlpha(Math.max(0, 1 - this.timer / 500));
      if (this.timer >= 500) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 60;
        boss.setPosition(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist);
        boss.setAlpha(0);
        this.state = 'appearing'; this.timer = 0;
      }
    } else if (this.state === 'appearing') {
      boss.setAlpha(Math.min(1, this.timer / 400));
      if (this.timer >= 400) {
        boss.setAlpha(1); boss.clearTint();
        this.state = 'shooting'; this.timer = 0; this.phaseCount = 0;
      }
    } else if (this.state === 'shooting') {
      boss.movementOverride = { vx: 0, vy: 0 };
      const tick = Math.floor(this.timer / 380);
      if (tick > this.phaseCount) {
        this.phaseCount = tick;
        this.fireBall(boss.x, boss.y, player.x, player.y, 580, 14, 0x440066, 18);
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null;
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 14 Steel ──────────────────────────────────────

  // 보스로라(#306) Aggron: 아이언헤드 — 2.5초 초장기 차징 + 초강력 돌진
  private updateAggron(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'charging'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x888899); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        const p = this.timer / 2500;
        const r = 15 + p * 120;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(5, 0xccccdd, 0.5 + p * 0.5);
        this.indicatorGfx.strokeCircle(boss.x, boss.y, r);
        this.indicatorGfx.fillStyle(0xaaaacc, 0.05 + p * 0.15);
        this.indicatorGfx.fillCircle(boss.x, boss.y, r);
        this.indicatorGfx.lineStyle(3, 0xffffff, p * 0.8);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
      }
      if (this.timer >= 2500) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xffffff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 650, vy: Math.sin(a) * 650 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 450) {
        this.state = 'walk'; this.timer = 0;
        boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
      }
    }
  }

  // 메타그로스(#376): 유성강습 — 플레이어 위치로 낙하 AoE
  private updateMetagross(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3200) {
        this.state = 'aiming'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x6688bb); this.mkGfx();
      }
    } else if (this.state === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        const p = this.timer / 1400;
        const r = 30 + p * 90;
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(4, 0x88aaff, 0.7 + p * 0.3);
        this.indicatorGfx.strokeCircle(this.rollTarget.x, this.rollTarget.y, r);
        this.indicatorGfx.fillStyle(0x4466cc, 0.08 + p * 0.12);
        this.indicatorGfx.fillCircle(this.rollTarget.x, this.rollTarget.y, r);
      }
      if (this.timer >= 1400) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        const tx = this.rollTarget!.x, ty = this.rollTarget!.y;
        const { scene } = this.ctx;
        const flash = scene.add.circle(tx, ty, 110, 0x88aaff, 0.9).setDepth(14);
        scene.cameras.main.ignore(flash);
        scene.tweens.add({ targets: flash, alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 400, onComplete: () => flash.destroy() });
        if (Phaser.Math.Distance.Between(tx, ty, player.x, player.y) <= 110)
          this.hitPlayer(22 + this.ctx.getWaveNumber() * 3, player);
        this.rollTarget = null;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 15 Dragon ─────────────────────────────────────

  // 망나뇽(#149) Dragonite: 드래곤 크로우 — 3연 고속 돌진
  private updateDragonite(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'charging'; this.timer = 0; this.phaseCount = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x5544ff); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0x5544ff, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
        this.indicatorGfx.fillStyle(0x5544ff, 0.3);
        this.indicatorGfx.fillCircle(this.rollTarget.x, this.rollTarget.y, 18);
      }
      if (this.timer >= 700) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0x8877ff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 480, vy: Math.sin(a) * 480 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 320) {
        this.phaseCount++;
        if (this.phaseCount >= 3) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
        } else {
          this.state = 'charging'; this.timer = 0;
          this.rollTarget = { x: player.x, y: player.y };
          boss.setTint(0x5544ff); boss.movementOverride = { vx: 0, vy: 0 }; this.mkGfx();
        }
      }
    }
  }

  // 한카리아스(#445) Garchomp: 드래곤 다이브 — 2단계 방향 전환 돌진
  private updateGarchomp(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 2800) {
        this.state = 'charging'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x4433cc); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(4, 0x4433cc, 0.8);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
      }
      if (this.timer >= 750) {
        this.state = 'dash1'; this.timer = 0;
        this.clearGfx(); boss.setTint(0x6655ff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 550, vy: Math.sin(a) * 550 };
        }
      }
    } else if (this.state === 'dash1') {
      if (this.timer >= 260) {
        // 방향 전환: 플레이어 현재 위치로 재조준
        this.state = 'dash2'; this.timer = 0;
        const a = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
        boss.movementOverride = { vx: Math.cos(a) * 550, vy: Math.sin(a) * 550 };
        boss.setTint(0xffffff);
      }
    } else if (this.state === 'dash2') {
      if (this.timer >= 260) {
        this.state = 'walk'; this.timer = 0;
        boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 16 Ice ────────────────────────────────────────

  // 라프라스(#131): 눈보라 — 7발 부채꼴 얼음 탄
  private updateLapras(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3500) {
        this.state = 'aiming'; this.timer = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x99eeff); this.mkGfx();
      }
    } else if (this.state === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        const base = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
        for (let i = -3; i <= 3; i++) {
          const a = base + i * 0.22;
          this.indicatorGfx.lineStyle(2, 0x99eeff, 0.55);
          this.indicatorGfx.lineBetween(boss.x, boss.y, boss.x + Math.cos(a) * 260, boss.y + Math.sin(a) * 260);
        }
      }
      if (this.timer >= 1000) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        if (this.rollTarget) {
          const base = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          const bx = boss.x, by = boss.y;
          for (let i = -3; i <= 3; i++) {
            const a = base + i * 0.22;
            this.ctx.scene.time.delayedCall((i + 3) * 60, () => {
              this.fireBall(bx, by, bx + Math.cos(a) * 280, by + Math.sin(a) * 280, 500, 10, 0x99eeff, 13);
            });
          }
        }
        this.rollTarget = null;
      }
    }
  }

  // 맘모꾸리(#473) Mamoswine: 눈사태 — 4연속 돌진 (방향 바뀜)
  private updateMamoswine(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3800) {
        this.state = 'charging'; this.timer = 0; this.phaseCount = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0xaaddff); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(4, 0xaaddff, 0.7);
        this.indicatorGfx.strokeCircle(boss.x, boss.y, 15 + (this.timer / 700) * 50);
      }
      if (this.timer >= 700) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xffffff);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 400, vy: Math.sin(a) * 400 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 380) {
        this.phaseCount++;
        if (this.phaseCount >= 4) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
        } else {
          // 다음 방향은 플레이어 + 약간의 오프셋
          const offset = (this.phaseCount % 2 === 0 ? 1 : -1) * 0.5;
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y) + offset;
          this.rollTarget = { x: boss.x + Math.cos(a) * 200, y: boss.y + Math.sin(a) * 200 };
          this.state = 'charging'; this.timer = 0;
          boss.setTint(0xaaddff); boss.movementOverride = { vx: 0, vy: 0 }; this.mkGfx();
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── STAGE 17 Dark ───────────────────────────────────────

  // 그라에나(#262) Mightyena: 물어뜯기 — 빠른 2연 돌진
  private updateMightyena(delta: number, boss: Enemy) {
    this.timer += delta;
    const player = this.ctx.getPlayer();
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 2800) {
        this.state = 'charging'; this.timer = 0; this.phaseCount = 0;
        this.rollTarget = { x: player.x, y: player.y };
        boss.setTint(0x886688); this.mkGfx();
      }
    } else if (this.state === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx && this.rollTarget) {
        this.indicatorGfx.clear();
        this.indicatorGfx.lineStyle(3, 0x886688, 0.7);
        this.indicatorGfx.lineBetween(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
      }
      if (this.timer >= 650) {
        this.state = 'dashing'; this.timer = 0;
        this.clearGfx(); boss.setTint(0xcc88cc);
        if (this.rollTarget) {
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.rollTarget.x, this.rollTarget.y);
          boss.movementOverride = { vx: Math.cos(a) * 460, vy: Math.sin(a) * 460 };
        }
      }
    } else if (this.state === 'dashing') {
      if (this.timer >= 300) {
        this.phaseCount++;
        if (this.phaseCount >= 2) {
          this.state = 'walk'; this.timer = 0; this.phaseCount = 0;
          boss.movementOverride = null; boss.clearTint(); this.rollTarget = null;
        } else {
          this.state = 'charging'; this.timer = 0;
          this.rollTarget = { x: player.x, y: player.y };
          boss.setTint(0x886688); boss.movementOverride = { vx: 0, vy: 0 }; this.mkGfx();
        }
      }
    }
  }

  // 화강돌(#442) Spiritomb: 불길한바람 — 8개 섀도 오브 나선 산개
  private updateSpiritomb(delta: number, boss: Enemy) {
    this.timer += delta;
    if (this.state === 'walk') {
      boss.movementOverride = null;
      if (this.timer >= 3000) {
        this.state = 'spawning'; this.timer = 0;
        boss.setTint(0x224422); this.mkGfx();
      }
    } else if (this.state === 'spawning') {
      boss.movementOverride = { vx: 0, vy: 0 };
      if (this.indicatorGfx) {
        this.indicatorGfx.clear();
        const spin = -(this.timer / 600) * Math.PI * 2;
        for (let i = 0; i < 8; i++) {
          const a = spin + (i / 8) * Math.PI * 2;
          this.indicatorGfx.fillStyle(i % 2 === 0 ? 0x224422 : 0x8833aa, 0.85);
          this.indicatorGfx.fillCircle(boss.x + Math.cos(a) * 55, boss.y + Math.sin(a) * 55, 7);
        }
      }
      if (this.timer >= 1100) {
        this.state = 'walk'; this.timer = 0;
        this.clearGfx(); boss.movementOverride = null; boss.clearTint();
        const spin = -(1100 / 600) * Math.PI * 2;
        this.fireRingOrbs(boss.x, boss.y, 8, 0x8833aa, 55, 11, 310);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ─── 공통 헬퍼 ───────────────────────────────────────────

  /** 단순 투사체 발사 (onUpdate 히트 감지 포함) */
  private fireBall(
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
        scene.tweens.add({ targets: splash, alpha: 0, scaleX: 2, scaleY: 2, duration: 250, onComplete: () => splash.destroy() });
        ball.destroy();
      },
    });
  }

  /** 링 형태로 오브 발사 (orbitRadius 위치에서 바깥으로) */
  private fireRingOrbs(
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
  private fireLightningStrike(tx: number, ty: number, baseDmg: number) {
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
      scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
      const player = this.ctx.getPlayer();
      if (Phaser.Math.Distance.Between(tx, ty, player.x, player.y) <= 30)
        this.hitPlayer(baseDmg, player);
    });
  }

  /** 독 구름 — 지속 시간 동안 남아서 틱 피해 */
  private spawnPoisonCloud(x: number, y: number, radius: number, lifeMs: number, baseDmg: number) {
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
        // 500ms마다 틱 피해
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
  private fireShockwaveRing(x: number, y: number, radius: number, color: number, baseDmg: number) {
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
  private fireRock(tx: number, ty: number, baseDmg: number) {
    const { scene } = this.ctx;
    const warn = scene.add.graphics();
    scene.cameras.main.ignore(warn);
    warn.fillStyle(0xbbaa66, 0.4); warn.fillCircle(tx, ty, 28);
    warn.lineStyle(2, 0xbbaa66, 0.7); warn.strokeCircle(tx, ty, 28);
    scene.time.delayedCall(500, () => {
      warn.destroy();
      const rock = scene.add.circle(tx, ty, 18, 0x887755, 0.95).setDepth(14);
      scene.cameras.main.ignore(rock);
      scene.tweens.add({ targets: rock, alpha: 0, scaleX: 2, scaleY: 2, duration: 280, onComplete: () => rock.destroy() });
      const player = this.ctx.getPlayer();
      if (Phaser.Math.Distance.Between(tx, ty, player.x, player.y) <= 32)
        this.hitPlayer(baseDmg, player);
    });
  }

  /** 플레이어 피해 + 텍스트 */
  private hitPlayer(dmg: number, player: Player) {
    const actual = player.takeDamage(dmg);
    if (actual <= 0) return;
    const txt = this.ctx.scene.add.text(player.x, player.y - 20, `-${actual}`, {
      fontSize: '14px', color: '#ff4444', stroke: '#000000', strokeThickness: 3,
    }).setDepth(20);
    this.ctx.scene.cameras.main.ignore(txt);
    this.ctx.scene.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
  }

  /** indicatorGfx 생성 헬퍼 */
  private mkGfx() {
    this.indicatorGfx?.destroy();
    this.indicatorGfx = this.ctx.scene.add.graphics();
    this.ctx.scene.cameras.main.ignore(this.indicatorGfx);
  }

  /** indicatorGfx 제거 헬퍼 */
  private clearGfx() {
    this.indicatorGfx?.destroy();
    this.indicatorGfx = null;
  }
}
