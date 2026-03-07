import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { ExpOrb } from '../entities/ExpOrb';
import {
  BULBASAUR_WEAPON, TYPE_COLORS,
  ALL_WEAPONS, MAX_WEAPON_LEVEL, MAX_WEAPON_SLOTS, MAX_PASSIVE_SLOTS,
  getWeaponByPokemonId, getUpgradedWeapon, getUpgradeDescription,
  type WeaponConfig,
} from '../data/weapons';
import { PASSIVE_ITEMS, getPassiveItem } from '../data/passiveItems';
import { applyPermanentUpgrades } from '../data/upgrades';
import type { LevelUpOption, PokemonType, PlayerStats } from '../types';

// 게임 화면 크기 (모바일 세로 기준)
export const GAME_WIDTH  = 390;
export const GAME_HEIGHT = 844;

// 퍼센트 기반 배율로 적용되는 스탯 목록
const PERCENT_STATS = new Set(['attackPower', 'moveSpeed', 'projectileSpeed', 'knockback']);

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemies!: Phaser.Physics.Arcade.Group;
  projectiles!: Phaser.Physics.Arcade.Group;

  // 게임 상태
  private gameTime: number = 0;
  private exp: number = 0;
  private level: number = 1;
  private expToNext: number = 10;
  private gold: number = 0;
  killCount: number = 0;
  private isGameOver: boolean = false;

  // 무기 슬롯
  private weapons: WeaponConfig[] = [];
  private weaponCooldowns: number[] = [];
  private weaponLevels: number[] = [];

  // 패시브 아이템: type → level (1~5)
  private equippedPassives: Map<PokemonType, number> = new Map();

  // 레벨업 흐름 제어
  private isLevelingUp: boolean = false;
  private needsLevelUp: boolean = false;

  // 일시정지
  private isPaused: boolean = false;
  private pauseOverlayItems: Phaser.GameObjects.GameObject[] = [];

  // UI
  private hpBar!: Phaser.GameObjects.Rectangle;
  private expBar!: Phaser.GameObjects.Rectangle;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private hpBarMaxW = 0;
  private expBarMaxW = 0;

  // 슬롯 UI (포켓몬 6칸 / 장신구 6칸)
  private pokemonSlotBgs:   Phaser.GameObjects.Rectangle[] = [];
  private pokemonSlotLvs:   Phaser.GameObjects.Text[]      = [];
  private pokemonSlotImgs:  Phaser.GameObjects.Image[]     = [];   // 포켓몬 스프라이트
  private accessorySlotBgs: Phaser.GameObjects.Rectangle[] = [];
  private accessorySlotLvs: Phaser.GameObjects.Text[]      = [];

  // 가상 조이스틱
  private joystickActive    = false;
  private joystickPointerId = -1;
  private joystickOriginX   = 0;
  private joystickOriginY   = 0;
  private joystickDx        = 0;   // -1 ~ 1
  private joystickDy        = 0;   // -1 ~ 1
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private joystickOutline!: Phaser.GameObjects.Graphics;
  private readonly JOY_RADIUS = 52;
  private readonly JOY_KNOB_R = 22;
  private readonly JOY_UI_TOP = 70;
  private readonly JOY_UI_BOT = GAME_HEIGHT - 132;

  // 웨이브
  private waveTimer: number = 0;
  private waveNumber: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── 재시작 시 상태 완전 초기화 ──
    this.gameTime     = 0;
    this.exp          = 0;
    this.level        = 1;
    this.expToNext    = 10;
    this.gold         = 0;
    this.killCount    = 0;
    this.isGameOver   = false;
    this.waveTimer    = 0;
    this.waveNumber   = 0;
    this.weapons      = [];
    this.weaponCooldowns = [];
    this.weaponLevels    = [];
    this.equippedPassives = new Map();
    this.isLevelingUp = false;
    this.needsLevelUp = false;
    this.isPaused     = false;

    // 조이스틱 상태 초기화
    this.joystickActive     = false;
    this.joystickPointerId  = -1;
    this.joystickDx         = 0;
    this.joystickDy         = 0;

    // 슬롯 배열 초기화 (createUI에서 push하므로 미리 비워야 함)
    this.pokemonSlotBgs   = [];
    this.pokemonSlotLvs   = [];
    this.pokemonSlotImgs  = [];
    this.accessorySlotBgs = [];
    this.accessorySlotLvs = [];

    // physics가 이전 게임오버로 pause됐을 수 있으므로 resume
    this.physics.resume();

    this.createProjectileTextures();

    // 배경 (이미지를 스케일 업해서 전체 맵으로 사용)
    const MAP_SCALE = 4;
    const stage1Frame = this.textures.get('stage1').get();
    const worldW = stage1Frame.realWidth * MAP_SCALE;
    const worldH = stage1Frame.realHeight * MAP_SCALE;
    this.add.image(0, 0, 'stage1').setOrigin(0, 0).setScale(MAP_SCALE);

    // 플레이어
    this.player = new Player(this, worldW / 2, worldH / 2);

    // 그룹
    this.enemies    = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group({ runChildUpdate: false });

    // 카메라
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 시작 무기: 이상해씨 Lv1
    this.weapons         = [getUpgradedWeapon(BULBASAUR_WEAPON, 1)];
    this.weaponCooldowns = [0];
    this.weaponLevels    = [1];

    // 영구 업그레이드 스탯 적용
    applyPermanentUpgrades(this.player.stats);

    this.createUI();
    this.updateSlotUI();
    this.createPauseUI();

    // 충돌 설정
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.onProjectileHitEnemy,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onPlayerHitEnemy,
      undefined,
      this
    );

    this.spawnWave();
    this.setupJoystick();
  }

  update(_time: number, delta: number) {
    if (this.isGameOver) return;
    if (this.isPaused) return;

    // 연속 레벨업 처리 (앞 선택지 완료 후 다음 발동)
    if (this.needsLevelUp && !this.isLevelingUp) {
      this.needsLevelUp = false;
      this.triggerLevelUpUI();
      return;
    }

    this.gameTime += delta;
    this.waveTimer += delta;

    this.player.update(delta, this.joystickDx, this.joystickDy);

    // 게임오버 체크
    if (this.player.isDead()) {
      this.triggerGameOver();
      return;
    }

    this.enemies.getChildren().forEach(obj => {
      const enemy = obj as Enemy;
      if (enemy.active) enemy.update(this.player);
    });

    this.projectiles.getChildren().forEach(obj => {
      const proj = obj as Projectile;
      if (proj.active) proj.update(delta);
    });

    this.updateWeapons(delta);

    if (this.waveTimer >= 60000) {
      this.waveTimer -= 60000;
      this.waveNumber++;
      this.spawnWave();
    }

    this.updateUI();
  }

  // ===== 투사체 / 구슬 텍스처 생성 =====
  private createProjectileTextures() {
    const size   = 14;
    const radius = size / 2;

    Object.entries(TYPE_COLORS).forEach(([type, color]) => {
      const key = `proj_${type}`;
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(radius, radius, radius);
      g.fillStyle(color, 1);
      g.fillCircle(radius, radius, radius - 2);
      g.generateTexture(key, size, size);
      g.destroy();
    });

    // 경험치 구슬 폴백 텍스처 (rare_candy 미로드 시 사용)
    if (!this.textures.exists('exp_orb')) {
      const s = 20;
      const c = s / 2;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      // 외곽 글로우
      g.fillStyle(0xffdd00, 0.25);
      g.fillCircle(c, c, c);
      // 중간 밝은 레이어
      g.fillStyle(0xffee33, 0.85);
      g.fillCircle(c, c, c - 3);
      // 중심 하이라이트
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(c - 2, c - 2, 3);
      g.generateTexture('exp_orb', s, s);
      g.destroy();
    }
  }

  // ===== 무기 자동 공격 =====
  private updateWeapons(delta: number) {
    this.weapons.forEach((weapon, idx) => {
      this.weaponCooldowns[idx] -= delta;
      if (this.weaponCooldowns[idx] <= 0) {
        const cooldown = weapon.cooldown * (1 - this.player.stats.cooldownReduction);
        this.weaponCooldowns[idx] = cooldown;
        this.fireWeapon(weapon);
      }
    });
  }

  private fireWeapon(weapon: WeaponConfig) {
    const target = this.getNearestEnemy();
    if (!target) return;

    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      target.x, target.y
    );

    const count  = weapon.projectileCount + this.player.stats.projectileCount - 1;
    const spread = weapon.spreadAngle;

    for (let i = 0; i < count; i++) {
      const angleOffset = count > 1 ? (i / (count - 1) - 0.5) * spread : 0;
      const angle       = baseAngle + angleOffset;

      const speed    = weapon.projectileSpeed;
      const duration = weapon.duration + (this.player.stats.projectileDuration - 2) * 1000;
      const damage   = Math.floor(weapon.damage * this.player.stats.attackPower / 10);

      const proj = new Projectile(
        this,
        this.player.x,
        this.player.y,
        weapon.textureKey,
        damage,
        speed,
        angle,
        duration
      );
      this.projectiles.add(proj, true);
      proj.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }
  }

  // ===== 가장 가까운 적 =====
  private getNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    this.enemies.getChildren().forEach(obj => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  // ===== 충돌 =====
  private onProjectileHitEnemy(_proj: any, _enemy: any) {
    const proj  = _proj as Projectile;
    const enemy = _enemy as Enemy;
    if (!proj.active || !enemy.active) return;

    const isCrit = Math.random() < this.player.stats.critChance;
    const dmg = isCrit
      ? Math.floor(proj.damage * this.player.stats.critDamage)
      : proj.damage;

    enemy.takeDamage(dmg);
    proj.destroy();

    const color = isCrit ? '#ffdd00' : '#ffffff';
    const label = isCrit ? `${dmg}!` : `${dmg}`;
    const dmgText = this.add.text(enemy.x, enemy.y - 20, label, {
      fontSize: isCrit ? '16px' : '13px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 25,
      alpha: 0,
      duration: 700,
      onComplete: () => dmgText.destroy(),
    });

    if (enemy.isDead()) this.onEnemyDeath(enemy);
  }

  private onPlayerHitEnemy(_player: any, _enemy: any) {
    const player = _player as Player;
    const dmg    = 5 + this.waveNumber * 2;
    const actual = player.takeDamage(dmg);
    if (actual <= 0) return;

    const dmgText = this.add.text(player.x, player.y - 20, `-${actual}`, {
      fontSize: '14px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 20,
      alpha: 0,
      duration: 600,
      onComplete: () => dmgText.destroy(),
    });
  }

  // ===== 적 사망 =====
  private onEnemyDeath(enemy: Enemy) {
    const flash = this.add.circle(enemy.x, enemy.y, 15, 0xffffff, 0.8).setDepth(15);
    this.tweens.add({
      targets: flash,
      scaleX: 2, scaleY: 2, alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    this.killCount++;
    this.gold += 1;   // 골드 자동 획득

    // 경험치 구슬 스폰 → 플레이어에게 자동 흡수
    new ExpOrb(this, enemy.x, enemy.y, enemy.exp);

    enemy.destroy();
  }

  // ===== 게임오버 =====
  private triggerGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.cameras.main.shake(400, 0.02);

    this.player.setTint(0xff0000);
    this.tweens.add({ targets: this.player, alpha: 0, duration: 600 });

    // 골드 누적 저장
    const prevTotal = parseInt(localStorage.getItem('totalGold') ?? '0', 10);
    const newTotal  = prevTotal + this.gold;
    localStorage.setItem('totalGold', String(newTotal));

    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        level:        this.level,
        killCount:    this.killCount,
        surviveTime:  this.gameTime,
        goldEarned:   this.gold,
        totalGold:    newTotal,
      });
    });
  }

  // ===== 경험치 / 레벨업 =====
  gainExp(amount: number) {
    this.exp += Math.floor(amount * this.player.stats.expGain);
    if (this.exp >= this.expToNext && !this.isLevelingUp) {
      this.exp      -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(this.expToNext * 1.3);
      this.triggerLevelUpUI();
    }
  }

  private triggerLevelUpUI() {
    this.isLevelingUp = true;

    // 황금 플래시
    const flash = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffdd00, 0.3
    ).setScrollFactor(0).setDepth(50);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    // 300ms 뒤 씬 일시정지 + LevelUpScene 오버레이 실행
    this.time.delayedCall(300, () => {
      const options = this.generateLevelUpOptions();
      this.scene.pause('GameScene');
      this.scene.launch('LevelUpScene', { options });
    });
  }

  // ===== 레벨업 선택지 생성 =====
  private generateLevelUpOptions(): LevelUpOption[] {
    const pool: LevelUpOption[] = [];
    const equippedIds   = this.weapons.map(w => w.pokemonId);
    const equippedTypes = Array.from(this.equippedPassives.keys());

    // ① 신규 무기 (슬롯 여유 있을 때)
    if (this.weapons.length < MAX_WEAPON_SLOTS) {
      ALL_WEAPONS.forEach(w => {
        if (!equippedIds.includes(w.pokemonId)) {
          pool.push({
            type: 'newPokemon',
            pokemonId: w.pokemonId,
            label: w.name,
            description: `새로운 포켓몬! ${w.type} 타입 공격력 ${w.damage}`,
            levelTo: 1,
          });
        }
      });
    }

    // ② 무기 강화
    this.weapons.forEach((w, idx) => {
      const curLv = this.weaponLevels[idx] ?? 1;
      if (curLv < MAX_WEAPON_LEVEL) {
        const nextLv = curLv + 1;
        const base   = getWeaponByPokemonId(w.pokemonId) ?? w;
        pool.push({
          type: 'upgradePokemon',
          pokemonId: w.pokemonId,
          label: base.name,
          description: getUpgradeDescription(base, nextLv),
          levelFrom: curLv,
          levelTo: nextLv,
        });
      }
    });

    // ③ 신규 패시브 (슬롯 여유 있을 때)
    if (equippedTypes.length < MAX_PASSIVE_SLOTS) {
      PASSIVE_ITEMS.forEach(p => {
        if (!equippedTypes.includes(p.type)) {
          pool.push({
            type: 'newPassive',
            passiveType: p.type,
            label: p.name,
            description: `${p.description} +${p.values[0]}`,
            levelTo: 1,
          });
        }
      });
    }

    // ④ 패시브 강화
    equippedTypes.forEach(type => {
      const curLv = this.equippedPassives.get(type) ?? 1;
      if (curLv < 5) {
        const nextLv = curLv + 1;
        const item   = getPassiveItem(type);
        if (item) {
          pool.push({
            type: 'upgradePassive',
            passiveType: type,
            label: item.name,
            description: `${item.description} → +${item.values[nextLv - 1]}`,
            levelFrom: curLv,
            levelTo: nextLv,
          });
        }
      }
    });

    // 셔플 후 최대 3개
    Phaser.Utils.Array.Shuffle(pool);
    return pool.slice(0, 3);
  }

  // ===== 레벨업 선택 적용 (LevelUpScene에서 호출) =====
  applyLevelUpChoice(option: LevelUpOption) {
    switch (option.type) {
      case 'newPokemon': {
        const base = getWeaponByPokemonId(option.pokemonId!)!;
        this.weapons.push(getUpgradedWeapon(base, 1));
        this.weaponCooldowns.push(0);
        this.weaponLevels.push(1);
        break;
      }
      case 'upgradePokemon': {
        const idx = this.weapons.findIndex(w => w.pokemonId === option.pokemonId);
        if (idx >= 0) {
          const newLv = option.levelTo ?? this.weaponLevels[idx] + 1;
          const base  = getWeaponByPokemonId(option.pokemonId!) ?? this.weapons[idx];
          this.weapons[idx]      = getUpgradedWeapon(base, newLv);
          this.weaponLevels[idx] = newLv;
        }
        break;
      }
      case 'newPassive': {
        const type = option.passiveType!;
        this.equippedPassives.set(type, 1);
        this.applyPassiveBonus(type, 0, 1);
        break;
      }
      case 'upgradePassive': {
        const type    = option.passiveType!;
        const oldLv   = option.levelFrom ?? (this.equippedPassives.get(type) ?? 1);
        const newLv   = option.levelTo ?? oldLv + 1;
        this.equippedPassives.set(type, newLv);
        this.applyPassiveBonus(type, oldLv, newLv);
        break;
      }
    }

    this.updateSlotUI();
    this.isLevelingUp = false;

    // 연속 레벨업이 쌓여있으면 다음 프레임에서 처리
    if (this.exp >= this.expToNext) {
      this.exp      -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(this.expToNext * 1.3);
      this.needsLevelUp = true;
    }
  }

  // ===== 패시브 스탯 적용 =====
  private applyPassiveBonus(type: PokemonType, fromLevel: number, toLevel: number) {
    const item = getPassiveItem(type);
    if (!item) return;

    const stats  = this.player.stats;
    const key    = item.statKey as keyof PlayerStats;
    const oldVal = fromLevel > 0 ? item.values[fromLevel - 1] : 0;
    const newVal = item.values[toLevel - 1];

    if (PERCENT_STATS.has(item.statKey)) {
      // 기존 배율 제거 후 새 배율 적용
      const oldMult = 1 + oldVal;
      const newMult = 1 + newVal;
      (stats as any)[key] = Math.round((stats as any)[key] / oldMult * newMult);
    } else if (key === 'maxHp') {
      const delta = newVal - oldVal;
      stats.maxHp += delta;
      stats.hp     = Math.min(stats.hp + delta, stats.maxHp);
    } else {
      const delta = newVal - oldVal;
      (stats as any)[key] += delta;
    }
  }

  // ===== 슬롯 UI 갱신 =====
  updateSlotUI() {
    // 포켓몬 슬롯
    this.pokemonSlotBgs.forEach((bg, i) => {
      if (i < this.weapons.length) {
        bg.setFillStyle(0x38886a);                     // 장착됨 (진한 초록)
        this.pokemonSlotLvs[i].setText(`Lv${this.weaponLevels[i] ?? 1}`);
        // 포켓몬 스프라이트 표시
        const sprKey = `pokemon_${String(this.weapons[i].pokemonId).padStart(3, '0')}`;
        this.pokemonSlotImgs[i].setTexture(sprKey).setVisible(true);
      } else {
        bg.setFillStyle(0x8cb890);                     // 비어있음 (어두운 초록)
        this.pokemonSlotLvs[i].setText('');
        this.pokemonSlotImgs[i].setVisible(false);
      }
    });

    // 장신구 슬롯
    const passiveEntries = Array.from(this.equippedPassives.entries());
    this.accessorySlotBgs.forEach((bg, i) => {
      if (i < passiveEntries.length) {
        bg.setFillStyle(0x6855cc);                     // 장착됨 (밝은 보라)
        this.accessorySlotLvs[i].setText(`Lv${passiveEntries[i][1]}`);
      } else {
        bg.setFillStyle(0x9890c0);                     // 비어있음 (어두운 보라)
        this.accessorySlotLvs[i].setText('');
      }
    });
  }

  // ===== 웨이브 =====
  private spawnWave() {
    const count = 5 + this.waveNumber * 3;
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 200, () => this.spawnEnemy());
    }
  }

  private spawnEnemy() {
    const cam    = this.cameras.main;
    const margin = 100;
    const side   = Phaser.Math.Between(0, 3);
    let x: number, y: number;

    const cx = cam.scrollX + cam.width  / 2;
    const cy = cam.scrollY + cam.height / 2;
    const hw = cam.width  / 2 + margin;
    const hh = cam.height / 2 + margin;

    switch (side) {
      case 0: x = cx + Phaser.Math.Between(-hw, hw); y = cy - hh; break;
      case 1: x = cx + Phaser.Math.Between(-hw, hw); y = cy + hh; break;
      case 2: x = cx - hw; y = cy + Phaser.Math.Between(-hh, hh); break;
      default: x = cx + hw; y = cy + Phaser.Math.Between(-hh, hh); break;
    }

    x = Phaser.Math.Clamp(x, 0, GAME_WIDTH * 10);
    y = Phaser.Math.Clamp(y, 0, GAME_HEIGHT * 10);

    const id    = String(Phaser.Math.Between(1, 9)).padStart(3, '0');
    const enemy = new Enemy(this, x, y, `pokemon_${id}`, {
      hp:        20 + this.waveNumber * 5,
      moveSpeed: 60 + this.waveNumber * 5,
      exp:       2  + this.waveNumber,
    });
    this.enemies.add(enemy);
  }

  // ===== 가상 조이스틱 =====
  private setupJoystick() {
    const D = 150;

    this.joystickBase = this.add.arc(0, 0, this.JOY_RADIUS, 0, 360, false, 0x000000, 0.25)
      .setScrollFactor(0).setDepth(D).setVisible(false);
    this.add.arc(0, 0, this.JOY_RADIUS, 0, 360, false, 0xffffff, 0)
      .setScrollFactor(0).setDepth(D);

    this.joystickOutline = this.add.graphics()
      .lineStyle(2, 0xffffff, 0.45)
      .strokeCircle(0, 0, this.JOY_RADIUS);
    this.joystickOutline.setScrollFactor(0).setDepth(D + 1).setVisible(false);

    this.joystickKnob = this.add.arc(0, 0, this.JOY_KNOB_R, 0, 360, false, 0xffffff, 0.55)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.isGameOver) return;
      if (p.y < this.JOY_UI_TOP || p.y > this.JOY_UI_BOT) return;
      if (this.joystickActive) return;

      this.joystickActive     = true;
      this.joystickPointerId  = p.id;
      this.joystickOriginX    = p.x;
      this.joystickOriginY    = p.y;

      this.joystickBase.setPosition(p.x, p.y).setVisible(true);
      this.joystickOutline.setPosition(p.x, p.y).setVisible(true);
      this.joystickKnob.setPosition(p.x, p.y).setVisible(true);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.joystickActive || p.id !== this.joystickPointerId) return;

      const dx     = p.x - this.joystickOriginX;
      const dy     = p.y - this.joystickOriginY;
      const dist   = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, this.JOY_RADIUS);
      const angle   = Math.atan2(dy, dx);

      this.joystickKnob.setPosition(
        this.joystickOriginX + Math.cos(angle) * clamped,
        this.joystickOriginY + Math.sin(angle) * clamped,
      );

      if (dist < 5) {
        this.joystickDx = 0;
        this.joystickDy = 0;
      } else {
        const ratio = Math.min(dist / this.JOY_RADIUS, 1);
        this.joystickDx = Math.cos(angle) * ratio;
        this.joystickDy = Math.sin(angle) * ratio;
      }
    });

    const resetJoystick = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joystickPointerId) return;
      this.joystickActive     = false;
      this.joystickPointerId  = -1;
      this.joystickDx         = 0;
      this.joystickDy         = 0;
      this.joystickBase.setVisible(false);
      this.joystickOutline.setVisible(false);
      this.joystickKnob.setVisible(false);
    };

    this.input.on('pointerup',     resetJoystick);
    this.input.on('pointercancel', resetJoystick);
  }

  // ===== UI =====
  private createUI() {
    const D = 100;

    // ── 상단 패널: 트레이너이름 / 타이머 / 레벨 / HP바 / EXP바 ──
    this.add.rectangle(GAME_WIDTH / 2, 35, 386, 70, 0x181810)
      .setScrollFactor(0).setDepth(D);
    this.add.rectangle(GAME_WIDTH / 2, 35, 382, 66, 0xd8d8c0)
      .setScrollFactor(0).setDepth(D + 1);
    this.add.rectangle(7, 35, 2, 60, 0xf0f0e0).setScrollFactor(0).setDepth(D + 2);
    this.add.rectangle(GAME_WIDTH / 2, 4, 378, 2, 0xf0f0e0).setScrollFactor(0).setDepth(D + 2);

    this.add.text(10, 9, '광휘', {
      fontSize: '14px', color: '#181810', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(D + 3);

    this.timerText = this.add.text(GAME_WIDTH / 2, 9, '00:00', {
      fontSize: '13px', color: '#484840',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D + 3);

    this.levelText = this.add.text(GAME_WIDTH - 8, 9, 'Lv  1', {
      fontSize: '14px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(D + 3);

    this.add.text(10, 36, 'HP', {
      fontSize: '11px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3);

    const HP_START    = 32;
    const HP_END      = GAME_WIDTH - 8;
    this.hpBarMaxW    = HP_END - HP_START;
    this.add.rectangle(HP_START + this.hpBarMaxW / 2, 36, this.hpBarMaxW + 2, 11, 0x282018)
      .setScrollFactor(0).setDepth(D + 3);
    this.hpBar = this.add.rectangle(HP_START, 36, this.hpBarMaxW, 8, 0x58c040)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 4);

    const EXP_START   = 8;
    const EXP_END     = GAME_WIDTH - 8;
    this.expBarMaxW   = EXP_END - EXP_START;
    this.add.rectangle(GAME_WIDTH / 2, 57, this.expBarMaxW + 2, 7, 0x282018)
      .setScrollFactor(0).setDepth(D + 3);
    this.expBar = this.add.rectangle(EXP_START, 57, 0, 5, 0x3888e8)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 4);

    // ── 골드 카운터 (패널 바로 아래 좌측) ──
    this.goldText = this.add.text(12, 84, '★  0 G', {
      fontSize: '13px', color: '#ffd700',
      stroke: '#000000', strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3);

    // ── 하단 패널: 포켓몬 6칸 + 장신구 6칸 ──
    const BOT_H   = 132;
    const BOT_TOP = GAME_HEIGHT - BOT_H;
    const BOT_CY  = GAME_HEIGHT - BOT_H / 2;

    this.add.rectangle(GAME_WIDTH / 2, BOT_CY, 386, BOT_H, 0x181810)
      .setScrollFactor(0).setDepth(D);
    this.add.rectangle(GAME_WIDTH / 2, BOT_CY, 382, BOT_H - 4, 0xd8d8c0)
      .setScrollFactor(0).setDepth(D + 1);
    this.add.rectangle(GAME_WIDTH / 2, BOT_TOP + BOT_H / 2, 374, 2, 0x989880)
      .setScrollFactor(0).setDepth(D + 2);

    const SLOT_W   = 52;
    const SLOT_H   = 44;
    const SLOT_GAP = Math.floor((374 - 6 * SLOT_W) / 5);
    const SLOT_X0  = Math.round((GAME_WIDTH - (6 * SLOT_W + 5 * SLOT_GAP)) / 2) + SLOT_W / 2;

    const ROW_P_Y = BOT_TOP + 4 + 14 + SLOT_H / 2;
    const ROW_A_Y = ROW_P_Y + SLOT_H / 2 + 8 + 14 + SLOT_H / 2;

    const labelStyle = { fontSize: '11px', color: '#383028', fontStyle: 'bold' as const };

    this.add.text(8, ROW_P_Y - SLOT_H / 2 - 14, '포켓몬', labelStyle)
      .setScrollFactor(0).setDepth(D + 2);
    for (let i = 0; i < 6; i++) {
      const sx = SLOT_X0 + i * (SLOT_W + SLOT_GAP);
      this.add.rectangle(sx, ROW_P_Y, SLOT_W, SLOT_H, 0x181810)
        .setScrollFactor(0).setDepth(D + 2);
      const bg = this.add.rectangle(sx, ROW_P_Y, SLOT_W - 2, SLOT_H - 2, 0x8cb890)
        .setScrollFactor(0).setDepth(D + 3);
      this.pokemonSlotBgs.push(bg);
      // 포켓몬 스프라이트 이미지 (처음엔 숨김)
      const img = this.add.image(sx, ROW_P_Y - 2, 'pokemon_001')
        .setDisplaySize(38, 38)
        .setScrollFactor(0).setDepth(D + 4).setVisible(false);
      this.pokemonSlotImgs.push(img);
      const lv = this.add.text(sx + SLOT_W / 2 - 2, ROW_P_Y + SLOT_H / 2 - 1, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 5);
      this.pokemonSlotLvs.push(lv);
    }

    this.add.text(8, ROW_A_Y - SLOT_H / 2 - 14, '장신구', labelStyle)
      .setScrollFactor(0).setDepth(D + 2);
    for (let i = 0; i < 6; i++) {
      const sx = SLOT_X0 + i * (SLOT_W + SLOT_GAP);
      this.add.rectangle(sx, ROW_A_Y, SLOT_W, SLOT_H, 0x181810)
        .setScrollFactor(0).setDepth(D + 2);
      const bg = this.add.rectangle(sx, ROW_A_Y, SLOT_W - 2, SLOT_H - 2, 0x9890c0)
        .setScrollFactor(0).setDepth(D + 3);
      this.accessorySlotBgs.push(bg);
      const lv = this.add.text(sx + SLOT_W / 2 - 2, ROW_A_Y + SLOT_H / 2 - 1, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 4);
      this.accessorySlotLvs.push(lv);
    }
  }

  // ===== 일시정지 UI =====
  private createPauseUI() {
    const D     = 200;
    const BTN_W = 240;
    const BTN_H = 52;
    const CX    = GAME_WIDTH / 2;
    // 상단 패널 아래 (패널 y=35, 높이 70 → 패널 하단 y=70)
    const PAUSE_BTN_Y = 84;

    // ── 일시정지 버튼 (상단 패널 바로 아래 우측) ──
    const pauseBtn = this.add.rectangle(GAME_WIDTH - 28, PAUSE_BTN_Y, 36, 28, 0x181810, 0.80)
      .setScrollFactor(0).setDepth(D)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH - 28, PAUSE_BTN_Y, '⏸', {
      fontSize: '15px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);

    pauseBtn.on('pointerover', () => pauseBtn.setFillStyle(0x333333, 0.95));
    pauseBtn.on('pointerout',  () => pauseBtn.setFillStyle(0x181810, 0.80));
    pauseBtn.on('pointerdown', () => {
      if (!this.isLevelingUp) this.pauseGame();
    });

    // ── 일시정지 오버레이 (처음엔 숨김) ──
    // Container 미사용: Phaser 3 Container 내부의 interactive 객체는
    // 포인터 이벤트를 제대로 받지 못하므로 개별 객체로 관리
    this.pauseOverlayItems = [];

    const addOverlay = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      (obj as any).setScrollFactor(0).setDepth(D + 2).setVisible(false);
      this.pauseOverlayItems.push(obj);
      return obj;
    };

    // 어두운 배경 (뒤 입력 차단)
    addOverlay(
      this.add.rectangle(CX, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
        .setInteractive()
    );

    // 패널 배경
    addOverlay(this.add.rectangle(CX, GAME_HEIGHT / 2, 300, 280, 0x181820));
    addOverlay(this.add.rectangle(CX, GAME_HEIGHT / 2, 296, 276, 0x2a2a40));

    // 헤더
    addOverlay(
      this.add.text(CX, GAME_HEIGHT / 2 - 100, '⏸  일시정지', {
        fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5)
    );

    // 구분선
    addOverlay(this.add.rectangle(CX, GAME_HEIGHT / 2 - 68, 260, 2, 0x555570));

    // ── 계속하기 버튼 ──
    const resumeBg = this.add.rectangle(CX, GAME_HEIGHT / 2 - 20, BTN_W, BTN_H, 0xeeeee0)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.pauseOverlayItems.push(resumeBg);

    // 좌측 초록 스트라이프
    addOverlay(this.add.rectangle(CX - BTN_W / 2 + 6, GAME_HEIGHT / 2 - 20, 8, BTN_H - 4, 0x44cc66));

    const resumeTxt = this.add.text(CX, GAME_HEIGHT / 2 - 20, '▶  계속하기', {
      fontSize: '18px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0.5)
      .setScrollFactor(0).setDepth(D + 3).setVisible(false);
    this.pauseOverlayItems.push(resumeTxt);

    resumeBg.on('pointerover',  () => { resumeBg.setFillStyle(0xd8d8c8); resumeTxt.setStyle({ color: '#003399', fontSize: '18px', fontStyle: 'bold' }); });
    resumeBg.on('pointerout',   () => { resumeBg.setFillStyle(0xeeeee0); resumeTxt.setStyle({ color: '#181810', fontSize: '18px', fontStyle: 'bold' }); });
    resumeBg.on('pointerdown',  () => this.resumeGame());

    // ── 타이틀로 버튼 ──
    const titleBg = this.add.rectangle(CX, GAME_HEIGHT / 2 + 48, BTN_W, BTN_H, 0xeeeee0)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.pauseOverlayItems.push(titleBg);

    const titleTxt = this.add.text(CX, GAME_HEIGHT / 2 + 48, '⌂  타이틀로', {
      fontSize: '18px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0.5)
      .setScrollFactor(0).setDepth(D + 3).setVisible(false);
    this.pauseOverlayItems.push(titleTxt);

    titleBg.on('pointerover',  () => { titleBg.setFillStyle(0xd8d8c8); titleTxt.setStyle({ color: '#003399', fontSize: '18px', fontStyle: 'bold' }); });
    titleBg.on('pointerout',   () => { titleBg.setFillStyle(0xeeeee0); titleTxt.setStyle({ color: '#181810', fontSize: '18px', fontStyle: 'bold' }); });
    titleBg.on('pointerdown',  () => this.scene.start('TitleScene'));
  }

  private pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    // 조이스틱 숨기기
    this.joystickActive = false;
    this.joystickDx     = 0;
    this.joystickDy     = 0;
    this.joystickBase.setVisible(false);
    this.joystickOutline.setVisible(false);
    this.joystickKnob.setVisible(false);
    // 오버레이 표시
    this.pauseOverlayItems.forEach(obj => (obj as any).setVisible(true));
  }

  private resumeGame() {
    this.isPaused = false;
    this.physics.resume();
    // 오버레이 숨김
    this.pauseOverlayItems.forEach(obj => (obj as any).setVisible(false));
  }

  private updateUI() {
    const hpRatio = Math.max(0, this.player.stats.hp / this.player.stats.maxHp);
    this.hpBar.width = this.hpBarMaxW * hpRatio;

    if      (hpRatio > 0.5) this.hpBar.setFillStyle(0x58c040);
    else if (hpRatio > 0.2) this.hpBar.setFillStyle(0xd8b000);
    else                    this.hpBar.setFillStyle(0xd01818);

    this.expBar.width = this.expBarMaxW * (this.exp / this.expToNext);

    const totalSec = Math.floor(this.gameTime / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    this.timerText.setText(`${min}:${sec}`);

    this.levelText.setText(`Lv  ${this.level}`);
    this.goldText.setText(`★  ${this.gold} G`);
  }
}
