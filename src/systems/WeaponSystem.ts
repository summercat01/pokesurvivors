import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { TYPE_COLORS, isSuperEffective, getTypeMultiplier } from '../data/weapons';
import type { WeaponConfig } from '../data/weapons';
import type { PokemonType } from '../types';

export interface WeaponContext {
  scene: Phaser.Scene;
  player: Player;
  enemies: Phaser.Physics.Arcade.Group;
  projectiles: Phaser.Physics.Arcade.Group;
  onEnemyKilled: (enemy: Enemy) => void;
}

export class WeaponSystem {
  private ctx: WeaponContext;

  // 쿨다운 (인덱스 = 슬롯 번호)
  weaponCooldowns: number[] = [];

  // 딜 추적
  private currentDamageSource = '';
  readonly weaponDamageLog: Map<string, number> = new Map();

  // orbit 상태
  private orbitOrbs: Map<number, { graphics: Phaser.GameObjects.Graphics[]; angle: number }> = new Map();
  private orbitHitCooldowns: Map<number, number> = new Map();

  // zone 상태
  private zoneGraphics: Map<number, { graphic: Phaser.GameObjects.Graphics; damageTimer: number }> = new Map();

  // rotating beam 상태
  private rotatingBeamAngles: Map<number, number> = new Map();
  private rotatingBeamGfx: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private rotatingBeamHitCooldowns: Map<number, number> = new Map();
  private rotatingBeamParticleTick: Map<number, number> = new Map();

  // zone 파티클 이미터
  private zoneParticleEmitters: Map<number, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  // 파티클 이팩트 추적
  private trailEmitters: Set<Phaser.GameObjects.Particles.ParticleEmitter> = new Set();

  constructor(ctx: WeaponContext) {
    this.ctx = ctx;
  }

  // ===== 매 프레임 업데이트 =====
  update(delta: number, weapons: WeaponConfig[]) {
    weapons.forEach((weapon, idx) => {
      const behavior = weapon.behavior ?? 'projectile';
      this.currentDamageSource = weapon.name;

      // 매 프레임 업데이트 (쿨다운 게이트 없음)
      if (behavior === 'orbit')         { this.updateOrbit(weapon, idx, delta);        return; }
      if (behavior === 'zone')          { this.updateZone(weapon, idx, delta);         return; }
      if (behavior === 'rotating_beam') { this.updateRotatingBeam(weapon, idx, delta); return; }

      this.weaponCooldowns[idx] = (this.weaponCooldowns[idx] ?? 0) - delta;
      if (this.weaponCooldowns[idx] <= 0) {
        const cdr = Math.min(this.ctx.player.stats.cooldownReduction, 0.75);
        this.weaponCooldowns[idx] = weapon.cooldown * (1 - cdr);
        switch (behavior) {
          case 'melee':     this.fireMelee(weapon);          break;
          case 'beam':      this.fireBeam(weapon);           break;
          case 'lightning': this.fireLightning(weapon);      break;
          case 'falling':   this.fireFalling(weapon);        break;
          case 'nova':      this.fireNova(weapon);           break;
          case 'boomerang': this.fireBoomerang(weapon);      break;
          case 'scatter':   this.fireScatter(weapon);        break;
          case 'trap':      this.fireTrap(weapon);           break;
          default:          this.fireProjectile(weapon);     break;
        }
      }
    });
    this.currentDamageSource = '';

    this.tickOrbitCooldowns(delta);
    this.tickRotatingBeamCooldowns(delta);
    this.steerHomingProjectiles();

    // 소멸된 trail 이미터 Set에서 주기적 정리 (메모리 누수 방지)
    if (this.trailEmitters.size > 30) {
      this.trailEmitters.forEach(e => { if (!e.scene) this.trailEmitters.delete(e); });
    }
  }

  // ===== 궤도 구체 생성 (무기 추가 시 호출) =====
  createOrbitOrbs(weapon: WeaponConfig, slotIdx: number) {
    const existing = this.orbitOrbs.get(slotIdx);
    if (existing) existing.graphics.forEach(g => g.destroy());

    const count = weapon.orbitCount ?? 1;
    const color = TYPE_COLORS[weapon.type] ?? 0xff44ff;
    const graphics: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < count; i++) {
      const g = this.ctx.scene.add.graphics();
      this.ctx.scene.cameras.main.ignore(g);
      // 외곽 글로우
      g.fillStyle(color, 0.2);
      g.fillCircle(0, 0, 15);
      // 중간 레이어
      g.fillStyle(color, 0.55);
      g.fillCircle(0, 0, 10);
      // 밝은 코어
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(0, 0, 5);
      // 타입색 코어
      g.fillStyle(color, 1.0);
      g.fillCircle(0, 0, 4);
      graphics.push(g);

      // 펄스 애니메이션
      this.ctx.scene.tweens.add({
        targets: g,
        scaleX: 1.3, scaleY: 1.3,
        alpha: 0.8,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: (i / count) * 350,
      });
    }

    this.orbitOrbs.set(slotIdx, { graphics, angle: this.orbitOrbs.get(slotIdx)?.angle ?? 0 });
  }

  // ===== 충돌 콜백 (GameScene이 physics.add.overlap에 등록) =====
  onProjectileHitEnemy(_proj: any, _enemy: any) {
    const proj  = _proj as Projectile;
    const enemy = _enemy as Enemy;
    if (!proj.active || !enemy.active) return;

    // 관통 투사체: 이미 맞춘 적은 스킵
    const enemyId = enemy.getData('uid') as number | undefined;
    const uid = enemyId ?? (enemy.x * 1000 + enemy.y);
    if (proj.hitEnemies.has(uid)) return;
    proj.hitEnemies.add(uid);

    const projType = proj.texture.key.replace('proj_', '') as PokemonType;
    this.currentDamageSource = proj.sourceName;
    this.applyDamageToEnemy(enemy, proj.damage, projType, { x: this.ctx.player.x, y: this.ctx.player.y });
    // 피격 파티클 버스트
    const hitColor = TYPE_COLORS[projType] ?? 0xffffff;
    this.spawnHitBurst(enemy.x, enemy.y, hitColor, 6);

    // 폭발 처리
    if (proj.explosionRadius > 0) {
      const ex = proj.x, ey = proj.y, er = proj.explosionRadius;
      const color = TYPE_COLORS[projType] ?? 0xffffff;
      const flash = this.ctx.scene.add.graphics();
      flash.setBlendMode(Phaser.BlendModes.ADD);
      this.ctx.scene.cameras.main.ignore(flash);
      flash.fillStyle(color, 0.7);
      flash.fillCircle(ex, ey, er);
      flash.lineStyle(2, color, 1.0);
      flash.strokeCircle(ex, ey, er);
      this.ctx.scene.time.delayedCall(180, () => flash.destroy());
      this.spawnHitBurst(ex, ey, color, Math.round(er / 6 + 10));
      (this.ctx.enemies.getChildren() as Enemy[]).forEach(e => {
        if (!e.active || e.isDead() || e === enemy) return;
        if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) <= er) {
          this.applyDamageToEnemy(e, proj.damage, projType, { x: ex, y: ey });
        }
      });
      proj.kill();
      return;
    }

    if (proj.pierce > 0) {
      proj.pierce--;
    } else {
      proj.kill();
    }
  }

  // ===== 파티클 헬퍼 =====

  private attachTrail(proj: Projectile, color: number) {
    if (!this.ctx.scene.textures.exists('particle_dot')) return;
    const emitter = this.ctx.scene.add.particles(proj.x, proj.y, 'particle_dot', {
      speed: { min: 5, max: 30 },
      lifespan: 160,
      alpha: { start: 0.6, end: 0 },
      scale: { start: 0.55, end: 0.05 },
      frequency: 28,
      tint: color,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.ctx.scene.cameras.main.ignore(emitter);
    proj.trailEmitter = emitter;
    this.trailEmitters.add(emitter);
  }

  private spawnHitBurst(x: number, y: number, color: number, count: number = 6) {
    if (!this.ctx.scene.textures.exists('particle_dot')) return;
    const emitter = this.ctx.scene.add.particles(x, y, 'particle_dot', {
      speed: { min: 30, max: 100 },
      lifespan: { min: 100, max: 280 },
      alpha: { start: 1, end: 0 },
      scale: { start: 0.9, end: 0 },
      tint: color,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.ctx.scene.cameras.main.ignore(emitter);
    emitter.explode(count, x, y);
    this.ctx.scene.time.delayedCall(400, () => { if (emitter.scene) emitter.destroy(); });
  }

  // ===== 상태 초기화 (재시작 시) =====
  reset() {
    this.weaponCooldowns = [];
    this.currentDamageSource = '';
    this.weaponDamageLog.clear();

    this.orbitOrbs.forEach(d => d.graphics.forEach(g => g.destroy()));
    this.orbitOrbs.clear();
    this.orbitHitCooldowns.clear();

    this.zoneGraphics.forEach(d => d.graphic.destroy());
    this.zoneGraphics.clear();

    this.rotatingBeamGfx.forEach(g => g.destroy());
    this.rotatingBeamGfx.clear();
    this.rotatingBeamAngles.clear();
    this.rotatingBeamHitCooldowns.clear();
    this.rotatingBeamParticleTick.clear();

    this.zoneParticleEmitters.forEach(e => { if (e.scene) e.destroy(); });
    this.zoneParticleEmitters.clear();

    this.trailEmitters.forEach(e => { if (e.scene) e.destroy(); });
    this.trailEmitters.clear();
  }

  // ===== PRIVATE: 무기별 공격 구현 =====

  // ── 투사체 발사 ──
  private fireProjectile(weapon: WeaponConfig) {
    const target = this.getNearestEnemy();
    if (!target) return;

    const baseAngle = Phaser.Math.Angle.Between(
      this.ctx.player.x, this.ctx.player.y,
      target.x, target.y
    );

    const count    = weapon.projectileCount + this.ctx.player.stats.projectileCount - 1;
    const spread   = weapon.spreadAngle;
    const speedMult = this.ctx.player.stats.projectileSpeed / 300;
    const speed    = Math.round(weapon.projectileSpeed * speedMult);
    const baseDur  = weapon.duration + (this.ctx.player.stats.projectileDuration - 2) * 1000;
    const duration = Math.round(baseDur * this.ctx.player.stats.projectileRange);
    const damage   = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    const pierce   = weapon.pierce ?? 0;
    const behavior = weapon.behavior ?? 'projectile';

    for (let i = 0; i < count; i++) {
      const angleOffset = count > 1 ? (i / (count - 1) - 0.5) * spread : 0;
      const angle       = baseAngle + angleOffset;

      const proj = this.ctx.projectiles.get(
        this.ctx.player.x, this.ctx.player.y, weapon.textureKey
      ) as Projectile | null;
      if (!proj) continue;
      proj.fire(damage, speed, angle, duration, pierce);
      proj.homing = behavior === 'homing';
      proj.explosionRadius = weapon.explosionRadius ?? 0;
      proj.sourceName = weapon.name;
      this.ctx.scene.cameras.main.ignore(proj);
      this.attachTrail(proj, TYPE_COLORS[weapon.type] ?? 0xffffff);
    }
  }

  // ── 공통 데미지 적용 ──
  private applyDamageToEnemy(
    enemy: Enemy,
    baseDmg: number,
    attackType: PokemonType,
    knockbackSrc?: { x: number; y: number },
    kbMult: number = 1,
  ) {
    if (!enemy.active || enemy.isDead()) return;

    const isCrit  = Math.random() < this.ctx.player.stats.critChance;
    const typeMult = getTypeMultiplier(attackType, enemy.pokemonTypes);
    let dmg = isCrit
      ? Math.floor(baseDmg * this.ctx.player.stats.critDamage)
      : baseDmg;
    if (typeMult !== 1) dmg = Math.floor(dmg * typeMult);
    if (typeMult === 0) {
      // 무효: 데미지 없음, 짧은 '무효' 텍스트만 표시
      const txt = this.ctx.scene.add.text(enemy.x, enemy.y - 20, '무효', {
        fontSize: '12px', color: '#888888', stroke: '#000000', strokeThickness: 3,
      }).setDepth(20);
      this.ctx.scene.cameras.main.ignore(txt);
      this.ctx.scene.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
      return;
    }

    // 무기별 딜 누적
    if (this.currentDamageSource) {
      this.weaponDamageLog.set(
        this.currentDamageSource,
        (this.weaponDamageLog.get(this.currentDamageSource) ?? 0) + dmg
      );
    }

    enemy.takeDamage(dmg);

    if (knockbackSrc && enemy.active && !enemy.isDead() && !enemy.ignoreKnockback) {
      const kbAngle = Phaser.Math.Angle.Between(knockbackSrc.x, knockbackSrc.y, enemy.x, enemy.y);
      const kb = this.ctx.player.stats.knockback * kbMult * (1 - enemy.knockbackResist);
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.velocity.x += Math.cos(kbAngle) * kb;
      body.velocity.y += Math.sin(kbAngle) * kb;
    }

    const superEff = typeMult >= 2;
    const notEff   = typeMult <= 0.5;
    const color = isCrit ? '#ffdd00' : superEff ? '#ff6600' : notEff ? '#aaaaaa' : '#ffffff';
    const suffix = typeMult === 4 ? '▲▲' : superEff ? '▲' : notEff ? '▼' : '';
    const label = isCrit ? `${dmg}!` : `${dmg}${suffix}`;
    const dmgText = this.ctx.scene.add.text(enemy.x, enemy.y - 20, label, {
      fontSize: isCrit ? '16px' : superEff ? '15px' : '13px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);
    this.ctx.scene.cameras.main.ignore(dmgText);
    this.ctx.scene.tweens.add({
      targets: dmgText,
      y: dmgText.y - 25,
      alpha: 0,
      duration: 700,
      onComplete: () => dmgText.destroy(),
    });

    if (enemy.isDead()) this.ctx.onEnemyKilled(enemy);
  }

  // ── 근접 공격 ──
  private fireMelee(weapon: WeaponConfig) {
    const px = this.ctx.player.x;
    const py = this.ctx.player.y;
    const range     = (weapon.meleeRange ?? 120) * (this.ctx.player.stats.projectileRange ?? 1);
    const halfAngle = (weapon.meleeAngle ?? Math.PI) / 2;

    const target    = this.getNearestEnemy();
    const baseAngle = target
      ? Phaser.Math.Angle.Between(px, py, target.x, target.y)
      : -Math.PI / 2;

    const color = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const gfx   = this.ctx.scene.add.graphics();
    gfx.setBlendMode(Phaser.BlendModes.ADD);
    this.ctx.scene.cameras.main.ignore(gfx);

    gfx.fillStyle(color, 0.40);
    gfx.beginPath();
    gfx.moveTo(px, py);
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const a = baseAngle - halfAngle + (i / steps) * halfAngle * 2;
      gfx.lineTo(px + Math.cos(a) * range, py + Math.sin(a) * range);
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.lineStyle(2, color, 0.85);
    gfx.strokePath();

    this.ctx.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 220,
      onComplete: () => gfx.destroy(),
    });

    const damage = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    this.ctx.enemies.getChildren().forEach(obj => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      const dist  = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist > range) return;
      const angle = Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y);
      const diff  = Phaser.Math.Angle.Wrap(angle - baseAngle);
      if (Math.abs(diff) > halfAngle) return;
      this.applyDamageToEnemy(enemy, damage, weapon.type, { x: px, y: py });
      this.spawnHitBurst(enemy.x, enemy.y, color, 5);
    });
  }

  // ── 빔 공격 ──
  private fireBeam(weapon: WeaponConfig) {
    const px = this.ctx.player.x;
    const py = this.ctx.player.y;

    const target = this.getNearestEnemy();
    const angle  = target
      ? Phaser.Math.Angle.Between(px, py, target.x, target.y)
      : -Math.PI / 2;

    const length = (weapon.beamLength ?? 260) * (this.ctx.player.stats.projectileRange ?? 1);
    const halfW  = (weapon.beamWidth ?? 26) / 2;
    const cos    = Math.cos(angle);
    const sin    = Math.sin(angle);

    const color = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const gfx   = this.ctx.scene.add.graphics();
    gfx.setBlendMode(Phaser.BlendModes.ADD);
    this.ctx.scene.cameras.main.ignore(gfx);

    // 빔 사각형 (회전된 좌표로 그리기)
    const corners: [number, number][] = [
      [0, -halfW], [length, -halfW], [length, halfW], [0, halfW],
    ].map(([lx, ly]) => [px + cos * lx - sin * ly, py + sin * lx + cos * ly]) as [number, number][];

    gfx.fillStyle(color, 0.45);
    gfx.beginPath();
    gfx.moveTo(corners[0][0], corners[0][1]);
    corners.slice(1).forEach(([x, y]) => gfx.lineTo(x, y));
    gfx.closePath();
    gfx.fillPath();

    gfx.lineStyle(3, color, 0.90);
    gfx.strokePath();

    // 코어 빔 (밝은 내부)
    const innerHalfW = halfW * 0.4;
    const inner: [number, number][] = [
      [0, -innerHalfW], [length, -innerHalfW], [length, innerHalfW], [0, innerHalfW],
    ].map(([lx, ly]) => [px + cos * lx - sin * ly, py + sin * lx + cos * ly]) as [number, number][];
    gfx.fillStyle(0xffffff, 0.55);
    gfx.beginPath();
    gfx.moveTo(inner[0][0], inner[0][1]);
    inner.slice(1).forEach(([x, y]) => gfx.lineTo(x, y));
    gfx.closePath();
    gfx.fillPath();

    this.ctx.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 280,
      onComplete: () => gfx.destroy(),
    });

    const damage = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    this.ctx.enemies.getChildren().forEach(obj => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      const dx    = enemy.x - px;
      const dy    = enemy.y - py;
      const along = dx * cos + dy * sin;
      const perp  = Math.abs(-dx * sin + dy * cos);
      if (along < 0 || along > length) return;
      if (perp > halfW + 14) return;
      this.applyDamageToEnemy(enemy, damage, weapon.type, { x: px, y: py }, weapon.knockbackMult ?? 0.5);
      this.spawnHitBurst(enemy.x, enemy.y, color, 5);
    });
  }

  // ── 번개 체인 ──
  private fireLightning(weapon: WeaponConfig) {
    const chainCount = weapon.lightningChainCount ?? 3;
    const chainRange = (weapon.lightningRange ?? 200) * (this.ctx.player.stats.projectileRange ?? 1);
    const damage     = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);

    const hit: Enemy[] = [];
    let fromX = this.ctx.player.x;
    let fromY = this.ctx.player.y;

    for (let chain = 0; chain < chainCount; chain++) {
      let nearest: Enemy | null = null;
      let minDist = chainRange;
      this.ctx.enemies.getChildren().forEach(obj => {
        const e = obj as Enemy;
        if (!e.active || hit.includes(e)) return;
        const d = Phaser.Math.Distance.Between(fromX, fromY, e.x, e.y);
        if (d < minDist) { minDist = d; nearest = e; }
      });
      if (!nearest) break;
      hit.push(nearest);
      fromX = (nearest as Enemy).x;
      fromY = (nearest as Enemy).y;
    }

    if (hit.length === 0) return;

    const color  = TYPE_COLORS[weapon.type] ?? 0xffdd00;
    const splashR = weapon.explosionRadius ?? 0;

    const gfx = this.ctx.scene.add.graphics();
    gfx.setBlendMode(Phaser.BlendModes.ADD);
    this.ctx.scene.cameras.main.ignore(gfx);

    let lx = this.ctx.player.x;
    let ly = this.ctx.player.y;
    hit.forEach(e => {
      const mx = (lx + e.x) / 2 + Phaser.Math.Between(-18, 18);
      const my = (ly + e.y) / 2 + Phaser.Math.Between(-18, 18);
      gfx.lineStyle(3, color, 0.9);
      gfx.beginPath();
      gfx.moveTo(lx, ly);
      gfx.lineTo(mx, my);
      gfx.lineTo(e.x, e.y);
      gfx.strokePath();
      // 내부 흰색 선
      gfx.lineStyle(1, 0xffffff, 0.7);
      gfx.lineBetween(lx, ly, e.x, e.y);
      lx = e.x;
      ly = e.y;
    });

    this.ctx.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 300,
      onComplete: () => gfx.destroy(),
    });

    hit.forEach((e, i) => {
      const dmgMult  = Math.pow(0.8, i);
      const chainDmg = Math.floor(damage * dmgMult);
      this.applyDamageToEnemy(e, chainDmg, weapon.type, { x: this.ctx.player.x, y: this.ctx.player.y });
      this.spawnHitBurst(e.x, e.y, color, 8);

      // 체인 스플래시: 각 체인 지점 주변 범위 피해
      if (splashR > 0) {
        const splashDmg = Math.floor(chainDmg * 0.5);
        this.ctx.enemies.getChildren().forEach(obj => {
          const splash = obj as Enemy;
          if (!splash.active || hit.includes(splash)) return;
          const d = Phaser.Math.Distance.Between(e.x, e.y, splash.x, splash.y);
          if (d <= splashR) {
            this.applyDamageToEnemy(splash, splashDmg, weapon.type);
          }
        });

        // 스플래시 원형 플래시 이펙트
        const ring = this.ctx.scene.add.graphics();
        this.ctx.scene.cameras.main.ignore(ring);
        ring.setPosition(e.x, e.y);
        ring.fillStyle(color, 0.25);
        ring.fillCircle(0, 0, splashR);
        ring.lineStyle(2, color, 0.8);
        ring.strokeCircle(0, 0, splashR);
        this.ctx.scene.tweens.add({
          targets: ring,
          alpha: 0,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 350,
          ease: 'Quad.easeOut',
          onComplete: () => ring.destroy(),
        });
      }
    });
  }

  // ── 궤도 업데이트 (매 프레임) ──
  private updateOrbit(weapon: WeaponConfig, slotIdx: number, delta: number) {
    let orbData = this.orbitOrbs.get(slotIdx);
    if (!orbData) {
      this.createOrbitOrbs(weapon, slotIdx);
      orbData = this.orbitOrbs.get(slotIdx)!;
    }

    const speed  = weapon.orbitSpeed ?? 2.0;
    orbData.angle += speed * (delta / 1000);

    const radius = (weapon.orbitRadius ?? 110) * (this.ctx.player.stats.projectileRange ?? 1);
    const count  = orbData.graphics.length;
    const damage = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);

    orbData.graphics.forEach((g, i) => {
      const a  = orbData!.angle + (i / count) * Math.PI * 2;
      const ox = this.ctx.player.x + Math.cos(a) * radius;
      const oy = this.ctx.player.y + Math.sin(a) * radius;
      g.setPosition(ox, oy);

      this.ctx.enemies.getChildren().forEach(obj => {
        const enemy = obj as Enemy;
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(ox, oy, enemy.x, enemy.y);
        if (dist > 22) return;

        const cdKey = slotIdx * 1000000 + enemy.uid;
        if ((this.orbitHitCooldowns.get(cdKey) ?? 0) > 0) return;

        this.applyDamageToEnemy(enemy, damage, weapon.type, { x: ox, y: oy });
        this.orbitHitCooldowns.set(cdKey, 600);
      });
    });
  }

  // ── 궤도 쿨다운 틱 ──
  private tickOrbitCooldowns(delta: number) {
    this.orbitHitCooldowns.forEach((val, key) => {
      const next = val - delta;
      if (next <= 0) this.orbitHitCooldowns.delete(key);
      else this.orbitHitCooldowns.set(key, next);
    });
  }

  private tickRotatingBeamCooldowns(delta: number) {
    this.rotatingBeamHitCooldowns.forEach((val, key) => {
      const next = val - delta;
      if (next <= 0) this.rotatingBeamHitCooldowns.delete(key);
      else this.rotatingBeamHitCooldowns.set(key, next);
    });
  }

  // ── 회전 빔 ──
  private updateRotatingBeam(weapon: WeaponConfig, slotIdx: number, delta: number) {
    const prev  = this.rotatingBeamAngles.get(slotIdx) ?? 0;
    const speed = weapon.rotateSpeed ?? 1.2;
    const angle = prev + speed * (delta / 1000);
    this.rotatingBeamAngles.set(slotIdx, angle);

    let gfx = this.rotatingBeamGfx.get(slotIdx);
    if (!gfx) {
      gfx = this.ctx.scene.add.graphics();
      gfx.setBlendMode(Phaser.BlendModes.ADD);
      this.ctx.scene.cameras.main.ignore(gfx);
      this.rotatingBeamGfx.set(slotIdx, gfx);
    }

    const px     = this.ctx.player.x, py = this.ctx.player.y;
    const rangeMult = this.ctx.player.stats.projectileRange ?? 1;
    const length = (weapon.beamLength ?? 270) * rangeMult;
    const halfW  = (weapon.beamWidth  ?? 26)  * rangeMult;
    const cos    = Math.cos(angle), sin = Math.sin(angle);
    const color  = TYPE_COLORS[weapon.type] ?? 0xffffff;

    // 원 체인으로 불꽃 표현: 플레이어 쪽 굵고 끝으로 갈수록 가늘게
    gfx.clear();
    const STEPS = 14;
    const startDist = 28;
    for (let i = 0; i < STEPS; i++) {
      const t     = i / (STEPS - 1);
      const dist  = startDist + t * (length - startDist);
      const cx    = px + cos * dist;
      const cy    = py + sin * dist;
      const r     = Phaser.Math.Linear(halfW * 0.3, halfW * 1.4, t);
      const alpha = Phaser.Math.Linear(0.85, 0.18, t);
      gfx.fillStyle(color, alpha);
      gfx.fillCircle(cx, cy, r);
    }

    const damage = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    (this.ctx.enemies.getChildren() as Enemy[]).forEach(enemy => {
      if (!enemy.active || enemy.isDead()) return;
      const dx    = enemy.x - px, dy = enemy.y - py;
      const along = dx * cos + dy * sin;
      if (along < 0 || along > length) return;
      if (Math.abs(-dx * sin + dy * cos) > halfW + 15) return;
      const cdKey = slotIdx * 1000000 + enemy.uid;
      if ((this.rotatingBeamHitCooldowns.get(cdKey) ?? 0) > 0) return;
      this.rotatingBeamHitCooldowns.set(cdKey, 600);
      this.applyDamageToEnemy(enemy, damage, weapon.type, { x: px, y: py }, 0.3);
    });

    // 빔 끝 파티클 (180ms마다 발사)
    const ptick = (this.rotatingBeamParticleTick.get(slotIdx) ?? 0) - delta;
    this.rotatingBeamParticleTick.set(slotIdx, ptick);
    if (ptick <= 0) {
      this.rotatingBeamParticleTick.set(slotIdx, 180);
      const tipX = px + cos * length;
      const tipY = py + sin * length;
      this.spawnHitBurst(tipX, tipY, color, 4);
    }
  }

  // ── 낙하 공격 ──
  private fireFalling(weapon: WeaponConfig) {
    const count      = (weapon.fallingCount  ?? 3) + (this.ctx.player.stats.projectileCount - 1);
    const radius     = (weapon.fallingRadius ?? 50) * (this.ctx.player.stats.projectileRange ?? 1);
    const damage     = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    const color      = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const range      = 260;
    const bounds     = this.ctx.scene.physics.world.bounds;
    const sourceName = weapon.name;

    for (let i = 0; i < count; i++) {
      const tx = Phaser.Math.Clamp(
        this.ctx.player.x + Phaser.Math.Between(-range, range),
        bounds.x + radius, bounds.right  - radius
      );
      const ty = Phaser.Math.Clamp(
        this.ctx.player.y + Phaser.Math.Between(-range, range),
        bounds.y + radius, bounds.bottom - radius
      );

      const warn = this.ctx.scene.add.graphics();
      warn.setBlendMode(Phaser.BlendModes.ADD);
      this.ctx.scene.cameras.main.ignore(warn);
      warn.lineStyle(2, color, 0.8);
      warn.strokeCircle(tx, ty, radius);
      warn.fillStyle(color, 0.18);
      warn.fillCircle(tx, ty, radius);

      this.ctx.scene.time.delayedCall(700, () => {
        warn.destroy();
        const flash = this.ctx.scene.add.graphics();
        this.ctx.scene.cameras.main.ignore(flash);
        flash.fillStyle(color, 0.85);
        flash.fillCircle(tx, ty, radius);
        this.ctx.scene.time.delayedCall(140, () => flash.destroy());
        // 낙하 충격 파티클
        this.spawnHitBurst(tx, ty, color, Math.round(radius / 6 + 6));
        this.currentDamageSource = sourceName;
        (this.ctx.enemies.getChildren() as Enemy[]).forEach(e => {
          if (!e.active || e.isDead()) return;
          if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= radius + 16) {
            this.applyDamageToEnemy(e, damage, weapon.type, { x: tx, y: ty });
          }
        });
        this.currentDamageSource = '';
      });
    }
  }

  // ── 충격파 (expanding ring) ──
  private fireNova(weapon: WeaponConfig) {
    const px         = this.ctx.player.x, py = this.ctx.player.y;
    const maxR       = (weapon.meleeRange ?? 170) * (this.ctx.player.stats.projectileRange ?? 1);
    const damage     = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    const color      = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const sourceName = weapon.name;
    const hitSet     = new Set<Enemy>();
    const gfx        = this.ctx.scene.add.graphics();
    gfx.setBlendMode(Phaser.BlendModes.ADD);
    this.ctx.scene.cameras.main.ignore(gfx);
    const dummy = { r: 0, lastParticleR: -30 };
    this.ctx.scene.tweens.add({
      targets: dummy,
      r: maxR,
      duration: 420,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        const r     = dummy.r;
        const alpha = 1 - r / maxR;
        gfx.clear();
        gfx.lineStyle(5, color, alpha * 0.95);
        gfx.strokeCircle(px, py, r);
        gfx.fillStyle(color, alpha * 0.13);
        gfx.fillCircle(px, py, r);
        // 링 위에 파티클 (30px 간격)
        if (r - dummy.lastParticleR > 30) {
          dummy.lastParticleR = r;
          const pCount = Math.round(r * 0.2 + 4);
          for (let i = 0; i < pCount; i++) {
            const a  = Math.random() * Math.PI * 2;
            const px2 = px + Math.cos(a) * r;
            const py2 = py + Math.sin(a) * r;
            this.spawnHitBurst(px2, py2, color, 2);
          }
        }
        (this.ctx.enemies.getChildren() as Enemy[]).forEach(e => {
          if (!e.active || e.isDead() || hitSet.has(e)) return;
          const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
          if (d <= r + 16 && d >= r - 32) {
            hitSet.add(e);
            this.currentDamageSource = sourceName;
            this.applyDamageToEnemy(e, damage, weapon.type, { x: px, y: py });
            this.currentDamageSource = '';
          }
        });
      },
      onComplete: () => gfx.destroy(),
    });
  }

  // ── 부메랑 ──
  private fireBoomerang(weapon: WeaponConfig) {
    const target = this.getNearestEnemy();
    const angle  = target
      ? Phaser.Math.Angle.Between(this.ctx.player.x, this.ctx.player.y, target.x, target.y)
      : 0;
    const range  = (weapon.meleeRange ?? 200) * (this.ctx.player.stats.projectileRange ?? 1);
    const damage = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    const color  = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const endX   = this.ctx.player.x + Math.cos(angle) * range;
    const endY   = this.ctx.player.y + Math.sin(angle) * range;
    const gfx    = this.ctx.scene.add.graphics();
    this.ctx.scene.cameras.main.ignore(gfx);
    // 글로우 레이어
    gfx.fillStyle(color, 0.25);
    gfx.fillCircle(0, 0, 16);
    gfx.fillStyle(color, 0.7);
    gfx.fillCircle(0, 0, 10);
    gfx.fillStyle(0xffffff, 0.85);
    gfx.fillCircle(0, 0, 5);
    const pos     = { x: this.ctx.player.x, y: this.ctx.player.y };
    const hitOut  = new Set<Enemy>();
    const hitBack = new Set<Enemy>();

    // 부메랑 꼬리 파티클 이미터
    const trailEmit = this.ctx.scene.textures.exists('particle_dot')
      ? this.ctx.scene.add.particles(pos.x, pos.y, 'particle_dot', {
          speed: { min: 5, max: 25 },
          lifespan: 200,
          alpha: { start: 0.5, end: 0 },
          scale: { start: 0.6, end: 0.05 },
          frequency: 25,
          tint: color,
          blendMode: Phaser.BlendModes.ADD,
        })
      : null;
    if (trailEmit) this.ctx.scene.cameras.main.ignore(trailEmit);

    const checkHit = (hitSet: Set<Enemy>) => {
      (this.ctx.enemies.getChildren() as Enemy[]).forEach(e => {
        if (!e.active || e.isDead() || hitSet.has(e)) return;
        if (Phaser.Math.Distance.Between(pos.x, pos.y, e.x, e.y) <= 22) {
          hitSet.add(e);
          this.applyDamageToEnemy(e, damage, weapon.type, { x: pos.x, y: pos.y });
          this.spawnHitBurst(e.x, e.y, color, 5);
        }
      });
    };
    this.ctx.scene.tweens.add({
      targets: pos, x: endX, y: endY,
      duration: 480, ease: 'Quad.easeOut',
      onUpdate: () => {
        gfx.setPosition(pos.x, pos.y);
        trailEmit?.setPosition(pos.x, pos.y);
        checkHit(hitOut);
      },
      onComplete: () => {
        this.ctx.scene.tweens.add({
          targets: pos, x: this.ctx.player.x, y: this.ctx.player.y,
          duration: 360, ease: 'Quad.easeIn',
          onUpdate: () => {
            gfx.setPosition(pos.x, pos.y);
            trailEmit?.setPosition(pos.x, pos.y);
            checkHit(hitBack);
          },
          onComplete: () => {
            gfx.destroy();
            if (trailEmit) {
              trailEmit.stop();
              this.ctx.scene.time.delayedCall(300, () => { if (trailEmit.scene) trailEmit.destroy(); });
            }
          },
        });
      },
    });
  }

  // ── 전방위 산탄 ──
  private fireScatter(weapon: WeaponConfig) {
    const count     = (weapon.projectileCount ?? 8) + (this.ctx.player.stats.projectileCount - 1);
    const damage    = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    const speedMult = this.ctx.player.stats.projectileSpeed / 300;
    const speed     = Math.round(weapon.projectileSpeed * speedMult);
    const baseDur   = weapon.duration + (this.ctx.player.stats.projectileDuration - 2) * 1000;
    const duration  = Math.round(baseDur * (this.ctx.player.stats.projectileRange ?? 1));
    const pierce    = weapon.pierce ?? 0;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const proj = this.ctx.projectiles.get(
        this.ctx.player.x, this.ctx.player.y, weapon.textureKey
      ) as Projectile | null;
      if (!proj) continue;
      proj.fire(damage, speed, angle, duration, pierce);
      proj.sourceName = weapon.name;
      this.ctx.scene.cameras.main.ignore(proj);
      this.attachTrail(proj, TYPE_COLORS[weapon.type] ?? 0xffffff);
    }
  }

  // ── 함정 설치 ──
  private fireTrap(weapon: WeaponConfig) {
    const count      = (weapon.projectileCount ?? 2) + (this.ctx.player.stats.projectileCount - 1);
    const radius     = (weapon.meleeRange ?? 45) * (this.ctx.player.stats.projectileRange ?? 1);
    const damage     = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
    const color      = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const lifeMs     = 4500;
    const sourceName = weapon.name;
    for (let i = 0; i < count; i++) {
      const a  = Math.random() * Math.PI * 2;
      const d  = Phaser.Math.Between(40, 130);
      const tx = this.ctx.player.x + Math.cos(a) * d;
      const ty = this.ctx.player.y + Math.sin(a) * d;
      const gfx = this.ctx.scene.add.graphics();
      gfx.setBlendMode(Phaser.BlendModes.ADD);
      this.ctx.scene.cameras.main.ignore(gfx);
      let elapsed  = 0;
      let triggered = false;
      const drawTrap = (alpha: number) => {
        gfx.clear();
        gfx.lineStyle(2, color, 0.8 * alpha);
        gfx.strokeCircle(tx, ty, radius);
        gfx.fillStyle(color, 0.25 * alpha);
        gfx.fillCircle(tx, ty, radius);
      };
      drawTrap(1);
      const timer = this.ctx.scene.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          elapsed += 100;
          if (triggered || elapsed >= lifeMs) {
            gfx.destroy(); timer.remove(); return;
          }
          drawTrap(1 - elapsed / lifeMs);
          (this.ctx.enemies.getChildren() as Enemy[]).forEach(e => {
            if (triggered || !e.active || e.isDead()) return;
            if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= radius + 16) {
              triggered = true;
              gfx.destroy(); timer.remove();
              const flash = this.ctx.scene.add.graphics();
              this.ctx.scene.cameras.main.ignore(flash);
              flash.fillStyle(color, 0.88);
              flash.fillCircle(tx, ty, radius * 1.6);
              this.ctx.scene.time.delayedCall(150, () => flash.destroy());
              this.spawnHitBurst(tx, ty, color, Math.round(radius / 5 + 8));
              this.currentDamageSource = sourceName;
              (this.ctx.enemies.getChildren() as Enemy[]).forEach(e2 => {
                if (!e2.active || e2.isDead()) return;
                if (Phaser.Math.Distance.Between(tx, ty, e2.x, e2.y) <= radius + 20) {
                  this.applyDamageToEnemy(e2, damage, weapon.type, { x: tx, y: ty });
                }
              });
              this.currentDamageSource = '';
            }
          });
        },
      });
    }
  }

  // ── 유도탄 조종 ──
  private steerHomingProjectiles() {
    (this.ctx.projectiles.getChildren() as Projectile[]).forEach(proj => {
      if (!proj.active || !proj.homing) return;
      let nearest: Enemy | null = null;
      let nearestDist = Infinity;
      (this.ctx.enemies.getChildren() as Enemy[]).forEach(e => {
        if (!e.active || e.isDead()) return;
        const d = Phaser.Math.Distance.Between(proj.x, proj.y, e.x, e.y);
        if (d < nearestDist) { nearestDist = d; nearest = e; }
      });
      if (!nearest) return;
      const body  = proj.body as Phaser.Physics.Arcade.Body;
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      const cur   = Math.atan2(body.velocity.y, body.velocity.x);
      const tgt   = Phaser.Math.Angle.Between(proj.x, proj.y, (nearest as Enemy).x, (nearest as Enemy).y);
      const next  = Phaser.Math.Angle.RotateTo(cur, tgt, 0.07);
      body.velocity.x = Math.cos(next) * speed;
      body.velocity.y = Math.sin(next) * speed;
    });
  }

  // ── 장판 업데이트 (매 프레임) ──
  private updateZone(weapon: WeaponConfig, slotIdx: number, delta: number) {
    let zoneData = this.zoneGraphics.get(slotIdx);
    if (!zoneData) {
      const g = this.ctx.scene.add.graphics();
      this.ctx.scene.cameras.main.ignore(g);
      zoneData = { graphic: g, damageTimer: 0 };
      this.zoneGraphics.set(slotIdx, zoneData);
    }

    const radius = (weapon.zoneRadius ?? 180) * (this.ctx.player.stats.projectileRange ?? 1);
    const color  = TYPE_COLORS[weapon.type] ?? 0x888888;
    const px     = this.ctx.player.x;
    const py     = this.ctx.player.y;

    zoneData.graphic.clear();
    zoneData.graphic.fillStyle(color, 0.12);
    zoneData.graphic.fillCircle(px, py, radius);
    zoneData.graphic.lineStyle(2, color, 0.55);
    zoneData.graphic.strokeCircle(px, py, radius);

    // 장판 내 부유 파티클 이미터 (처음 생성 시 한 번만)
    if (!this.zoneParticleEmitters.has(slotIdx) && this.ctx.scene.textures.exists('particle_dot')) {
      const zoneEmit = this.ctx.scene.add.particles(px, py, 'particle_dot', {
        speed: { min: 5, max: 18 },
        lifespan: { min: 600, max: 1200 },
        alpha: { start: 0.5, end: 0 },
        scale: { start: 0.45, end: 0.05 },
        frequency: 120,
        tint: color,
        blendMode: Phaser.BlendModes.ADD,
        // 반경 내 랜덤 방출
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Circle(0, 0, radius * 0.85),
        } as any,
        gravityY: -20,
      });
      this.ctx.scene.cameras.main.ignore(zoneEmit);
      this.zoneParticleEmitters.set(slotIdx, zoneEmit);
    }
    // 이미터 위치를 플레이어 중심으로 갱신
    this.zoneParticleEmitters.get(slotIdx)?.setPosition(px, py);

    const interval = weapon.zoneDamageInterval ?? 1000;
    zoneData.damageTimer += delta;
    if (zoneData.damageTimer >= interval) {
      zoneData.damageTimer -= interval;
      const damage = Math.floor(weapon.damage * this.ctx.player.stats.attackPower / 10);
      this.ctx.enemies.getChildren().forEach(obj => {
        const enemy = obj as Enemy;
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
        if (dist > radius) return;
        this.applyDamageToEnemy(enemy, damage, weapon.type, undefined, 0);
      });
    }
  }

  // ── 가장 가까운 적 ──
  private getNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    this.ctx.enemies.getChildren().forEach(obj => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.ctx.player.x, this.ctx.player.y,
        enemy.x, enemy.y
      );
      if (dist < minDist) {
        minDist  = dist;
        nearest  = enemy;
      }
    });

    return nearest;
  }
}
