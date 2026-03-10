import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { ExpOrb } from '../entities/ExpOrb';
import {
  TYPE_COLORS,
  ALL_WEAPONS, MAX_WEAPON_LEVEL, MAX_WEAPON_SLOTS, MAX_PASSIVE_SLOTS,
  getWeaponByPokemonId, getUpgradedWeapon, getUpgradeDescription,
  isSuperEffective,
  type WeaponConfig,
} from '../data/weapons';
import { PASSIVE_ITEMS, getPassiveItem, formatPassiveValue } from '../data/passiveItems';
import { POKEMON_DATA } from '../data/pokemonData';
import { applyPermanentUpgrades } from '../data/upgrades';
import { getStageData, getActiveEnemyPool, getElitePool } from '../data/stages';
import type { LevelUpOption, PokemonType, PlayerStats } from '../types';
import { IS_DEV_MODE } from '../main';

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
  private expToNext: number = 20;
  private gold: number = 0;
  killCount: number = 0;
  private isGameOver: boolean = false;

  // 무기 슬롯
  weapons: WeaponConfig[] = [];          // dev 모드에서 DevScene이 읽음
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
  private waveText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;

  private hpBarMaxW = 0;
  private expBarMaxW = 0;
  private hpLowPulsing = false;

  // 슬롯 UI (포켓몬 6칸 / 장신구 6칸)
  private pokemonSlotBgs:    Phaser.GameObjects.Rectangle[] = [];
  private pokemonSlotLvs:    Phaser.GameObjects.Text[]      = [];
  private pokemonSlotImgs:   Phaser.GameObjects.Image[]     = [];   // 포켓몬 스프라이트
  private pokemonSlotTypes:   Phaser.GameObjects.Rectangle[] = [];   // 타입 색상 바
  private accessorySlotBgs:   Phaser.GameObjects.Rectangle[] = [];
  private accessorySlotLvs:   Phaser.GameObjects.Text[]      = [];
  private accessorySlotTypes: Phaser.GameObjects.Rectangle[] = [];  // 타입 색상 바
  private accessorySlotNames: Phaser.GameObjects.Text[]      = [];  // 타입 약자

  // 가상 조이스틱
  private joystickActive    = false;
  private joystickPointerId = -1;
  private joystickOriginX   = 0;
  private joystickOriginY   = 0;
  private joystickDx        = 0;   // -1 ~ 1
  private joystickDy        = 0;   // -1 ~ 1
  private readonly JOY_RADIUS = 52;
  private readonly JOY_KNOB_R = 22;
  private readonly JOY_UI_TOP = 70;
  private JOY_UI_BOT = 0;

  // 웨이브
  private waveTimer: number = 0;
  private waveNumber: number = 0;
  private spawnTimer: number = 0;
  private eliteTimer: number = 0;
  private readonly MAX_ENEMIES = 80;
  private darkraiSpawned: boolean = false;

  // 보스 패턴
  private bossPatternTimer: number = 0;
  private bossPatternState: string = 'walk';
  private bossRollTarget: { x: number; y: number } | null = null;
  private bossIndicatorGfx: Phaser.GameObjects.Graphics | null = null;

  // 콤보
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private readonly COMBO_TIMEOUT = 1800; // ms

  // 마일스톤
  private readonly KILL_MILESTONES = [10, 25, 50, 100, 200, 500];
  private reachedKillMilestones: Set<number> = new Set();
  private readonly LEVEL_MILESTONES = [5, 10, 20];
  private reachedLevelMilestones: Set<number> = new Set();
  private stageId = 1;
  private worldW = 0;
  private worldH = 0;
  private bgImage!: Phaser.GameObjects.Image;
  private gameCam!: Phaser.Cameras.Scene2D.Camera;
  private bossHpPanelItems: Phaser.GameObjects.GameObject[] = [];
  // 무기별 누적 데미지 추적
  private weaponDamageLog: Map<string, number> = new Map();
  private currentDamageSource: string = '';
  private bossHpBarBg!: Phaser.GameObjects.Rectangle;
  private bossHpBar!: Phaser.GameObjects.Rectangle;
  private bossHpNameText!: Phaser.GameObjects.Text;
  private bossHpNumText!: Phaser.GameObjects.Text;
  private currentBoss: Enemy | null = null;
  private currentBossName: string = '';
  private bossHpRatioDisplayed: number = 1;
  private enemyHpGraphics!: Phaser.GameObjects.Graphics;
  private bossArrow!: Phaser.GameObjects.Text;

  // 무기 정보 팝업
  private weaponPopupItems: Phaser.GameObjects.GameObject[] = [];

  // orbit / zone / rotating_beam 전용 상태
  private orbitOrbs: Map<number, { graphics: Phaser.GameObjects.Graphics[]; angle: number }> = new Map();
  private orbitHitCooldowns: Map<number, number> = new Map();
  private zoneGraphics: Map<number, { graphic: Phaser.GameObjects.Graphics; damageTimer: number }> = new Map();
  private rotatingBeamAngles: Map<number, number> = new Map();
  private rotatingBeamGfx: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private rotatingBeamHitCooldowns: Map<number, number> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: { weaponIndex?: number; stageId?: number }) {
    this.stageId = data?.stageId ?? 1;
    // ── 재시작 시 상태 완전 초기화 ──
    this.gameTime     = 0;
    this.exp          = 0;
    this.level        = 1;
    this.expToNext    = 20;
    this.gold         = 0;
    this.killCount    = 0;
    this.isGameOver   = false;
    this.waveTimer      = 0;
    this.waveNumber     = 0;
    this.spawnTimer     = 0;
    this.eliteTimer     = 0;
    this.darkraiSpawned   = false;
    this.bossPatternTimer = 0;
    this.bossPatternState = 'walk';
    this.bossRollTarget   = null;
    this.bossIndicatorGfx?.destroy();
    this.bossIndicatorGfx = null;
    this.currentBoss = null;
    this.weaponDamageLog = new Map();
    this.currentDamageSource = '';
    this.comboCount   = 0;
    this.comboTimer   = 0;
    this.reachedKillMilestones = new Set();
    this.reachedLevelMilestones = new Set();
    this.weapons      = [];
    this.weaponCooldowns = [];
    this.weaponLevels    = [];
    this.equippedPassives = new Map();

    // orbit/zone 그래픽 정리 (재시작 시)
    this.orbitOrbs?.forEach(s => s.graphics.forEach(g => g.destroy()));
    this.orbitOrbs = new Map();
    this.zoneGraphics?.forEach(s => s.graphic.destroy());
    this.zoneGraphics = new Map();
    this.orbitHitCooldowns = new Map();
    this.rotatingBeamGfx?.forEach(g => g.destroy());
    this.rotatingBeamGfx = new Map();
    this.rotatingBeamAngles = new Map();
    this.rotatingBeamHitCooldowns = new Map();

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
    this.pokemonSlotTypes   = [];
    this.accessorySlotBgs   = [];
    this.accessorySlotTypes = [];
    this.accessorySlotNames = [];
    this.accessorySlotLvs = [];

    // physics가 이전 게임오버로 pause됐을 수 있으므로 resume
    this.physics.resume();

    this.createProjectileTextures();

    // 배경 (이미지를 스케일 업해서 전체 맵으로 사용)
    const MAP_SCALE = 4;
    const stage1Frame = this.textures.get('stage1').get();
    this.worldW = stage1Frame.realWidth * MAP_SCALE;
    this.worldH = stage1Frame.realHeight * MAP_SCALE;
    this.JOY_UI_BOT = this.scale.height - 132;
    this.bgImage = this.add.image(0, 0, 'stage1').setOrigin(0, 0).setScale(MAP_SCALE);

    // 플레이어
    this.player = new Player(this, this.worldW / 2, this.worldH / 2);

    // 그룹
    this.enemies    = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group({ runChildUpdate: false });

    // 물리 월드 경계
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // 시작 무기: 캐릭터 선택에서 전달된 weaponIndex (기본 0 = 이상해씨)
    const weaponIndex = data?.weaponIndex ?? 0;
    const startWeapon = ALL_WEAPONS[weaponIndex] ?? ALL_WEAPONS[0];
    this.weapons         = [getUpgradedWeapon(startWeapon, 1)];
    this.weaponCooldowns = [0];
    this.weaponLevels    = [1];

    // 영구 업그레이드 스탯 적용
    applyPermanentUpgrades(this.player.stats);

    // UI 생성 전 월드 오브젝트 수 스냅샷
    const worldObjCount = this.children.list.length;
    this.createUI();
    this.updateSlotUI();
    this.setupJoystick();

    // 카메라 설정
    const TOP_H = 70;
    const BOT_H = 132;
    // cameras.main: 전체 화면, UI 전용 (고정, 스크롤 없음)
    this.cameras.main.ignore([this.bgImage, this.player]);
    // gameCam: 게임 영역 뷰포트, 월드 렌더링, 플레이어 추적
    this.gameCam = this.cameras.add(0, TOP_H, this.scale.width, this.scale.height - TOP_H - BOT_H);
    this.gameCam.setBounds(0, 0, this.worldW, this.worldH);
    this.gameCam.startFollow(this.player, true, 0.1, 0.1);
    this.gameCam.ignore(this.children.list.slice(worldObjCount));

    // gameCam.ignore 이후 생성 → gameCam이 렌더링 → 게임 영역(y=70~712)에서도 보임
    this.createHudOverlay();  // 골드/웨이브/킬/콤보/보스HP
    this.createPauseUI();     // 일시정지 오버레이 (depth 200)

    // 개발자 모드
    if (IS_DEV_MODE) {
      if (this.scene.isActive('DevScene')) this.scene.stop('DevScene');
      this.scene.launch('DevScene');
    }

    // 맵 경계선 (world space, cameras.main에서 제외)
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(6, 0xff2222, 0.6);
    borderGraphics.strokeRect(3, 3, this.worldW - 6, this.worldH - 6);
    borderGraphics.lineStyle(2, 0xffaaaa, 0.3);
    borderGraphics.strokeRect(10, 10, this.worldW - 20, this.worldH - 20);
    this.cameras.main.ignore(borderGraphics);

    // 적 HP바 그래픽 (worldObj, cameras.main에서 제외)
    this.enemyHpGraphics = this.add.graphics();
    this.cameras.main.ignore(this.enemyHpGraphics);

    // 보스 방향 화살표 (UI - scrollFactor 0, gameCam에서 제외)
    this.bossArrow = this.add.text(0, 0, '▲', {
      fontSize: '20px', color: '#ff4444',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(85).setVisible(false);
    this.gameCam.ignore(this.bossArrow);

    // 충돌 설정
    // 적끼리 하드 충돌 없음 → update 루프에서 소프트 분리력 적용

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

    // orbit 시작 무기 구체 생성 (카메라 설정 이후에 실행)
    this.weapons.forEach((w, idx) => {
      if ((w.behavior ?? 'projectile') === 'orbit') this.createOrbitOrbs(w, idx);
    });

    // 게임 시작 (캐릭터 선택은 CharacterSelectScene에서 완료)
    this.spawnWave();
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.gameCam.fadeIn(400, 0, 0, 0);

    // BGM
    if (this.cache.audio.exists('bgm_game')) {
      this.sound.stopAll();
      this.sound.play('bgm_game', { loop: true, volume: 0.45 });
    }

    // 씬 종료 시 BGM 정지
    this.events.once('shutdown', () => this.sound.stopByKey('bgm_game'));
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

    // 게임오버 체크 (부활 처리 포함)
    if (this.player.isDead()) {
      if (this.player.stats.revives > 0) {
        this.player.stats.revives--;
        this.player.heal(Math.floor(this.player.stats.maxHp * 0.4));
        this.showReviveEffect();
      } else {
        this.triggerGameOver();
        return;
      }
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
    this.tickOrbitCooldowns(delta);
    this.tickRotatingBeamCooldowns(delta);
    this.steerHomingProjectiles();
    this.updateBossPattern(delta);
    this.applySeparation();
    this.renderEnemyHpBars();
    this.updateCombo(delta);

    if (this.waveTimer >= 30000) {
      this.waveTimer -= 30000;
      this.waveNumber++;
      this.spawnWave();
      this.showWaveAnnouncement();
      this.cameras.main.flash(300, 255, 255, 255, false);
    }

    // 꾸준한 일반 몹 스폰
    this.spawnTimer += delta;
    const spawnInterval = Math.max(600, 2800 - this.waveNumber * 120);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer -= spawnInterval;
      const activeCount = this.enemies.getChildren().filter(e => (e as Enemy).active).length;
      if (activeCount < this.MAX_ENEMIES) {
        this.spawnEnemy();
      }
    }

    // 엘리트 1분에 1마리
    this.eliteTimer += delta;
    if (this.eliteTimer >= 60000 && this.waveNumber >= 1) {
      this.eliteTimer -= 60000;
      this.spawnElite();
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
      const behavior = weapon.behavior ?? 'projectile';
      this.currentDamageSource = weapon.name;

      // 매 프레임 업데이트 (쿨다운 게이트 없음)
      if (behavior === 'orbit')         { this.updateOrbit(weapon, idx, delta);        return; }
      if (behavior === 'zone')          { this.updateZone(weapon, idx, delta);         return; }
      if (behavior === 'rotating_beam') { this.updateRotatingBeam(weapon, idx, delta); return; }

      this.weaponCooldowns[idx] -= delta;
      if (this.weaponCooldowns[idx] <= 0) {
        const cdr = Math.min(this.player.stats.cooldownReduction, 0.75);
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
  }

  // ── 투사체 발사 (기존 fireWeapon 이름 변경) ──
  private fireProjectile(weapon: WeaponConfig) {
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

      const speedMult = this.player.stats.projectileSpeed / 300;
      const speed    = Math.round(weapon.projectileSpeed * speedMult);
      const baseDur  = weapon.duration + (this.player.stats.projectileDuration - 2) * 1000;
      const duration = Math.round(baseDur * this.player.stats.projectileRange);
      const damage   = Math.floor(weapon.damage * this.player.stats.attackPower / 10);

      const pierce = weapon.pierce ?? 0;
      const behavior = weapon.behavior ?? 'projectile';

      const proj = new Projectile(
        this,
        this.player.x,
        this.player.y,
        weapon.textureKey,
        damage,
        speed,
        angle,
        duration,
        pierce
      );
      proj.homing = behavior === 'homing';
      proj.explosionRadius = weapon.explosionRadius ?? 0;
      proj.sourceName = weapon.name;
      this.projectiles.add(proj, true);
      this.cameras.main.ignore(proj);
      proj.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
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

    const isCrit = Math.random() < this.player.stats.critChance;
    const superEff = enemy.pokemonTypes.some(t => isSuperEffective(attackType, t));
    let dmg = isCrit
      ? Math.floor(baseDmg * this.player.stats.critDamage)
      : baseDmg;
    if (superEff) dmg = Math.floor(dmg * 1.5);

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
      const kb = this.player.stats.knockback * kbMult;
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.velocity.x += Math.cos(kbAngle) * kb;
      body.velocity.y += Math.sin(kbAngle) * kb;
    }

    const color = isCrit ? '#ffdd00' : superEff ? '#ff8800' : '#ffffff';
    const label = isCrit ? `${dmg}!` : superEff ? `${dmg}▲` : `${dmg}`;
    const dmgText = this.add.text(enemy.x, enemy.y - 20, label, {
      fontSize: isCrit ? '16px' : superEff ? '15px' : '13px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);
    this.cameras.main.ignore(dmgText);
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 25,
      alpha: 0,
      duration: 700,
      onComplete: () => dmgText.destroy(),
    });

    if (enemy.isDead()) this.onEnemyDeath(enemy);
  }

  // ── 근접 공격 ──
  private fireMelee(weapon: WeaponConfig) {
    const px = this.player.x;
    const py = this.player.y;
    const range = (weapon.meleeRange ?? 120) * (this.player.stats.projectileRange ?? 1);
    const halfAngle = (weapon.meleeAngle ?? Math.PI) / 2;

    const target = this.getNearestEnemy();
    const baseAngle = target
      ? Phaser.Math.Angle.Between(px, py, target.x, target.y)
      : -Math.PI / 2;

    const color = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const gfx = this.add.graphics();
    this.cameras.main.ignore(gfx);

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

    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 220,
      onComplete: () => gfx.destroy(),
    });

    const damage = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    this.enemies.getChildren().forEach(obj => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist > range) return;
      const angle = Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y);
      const diff = Phaser.Math.Angle.Wrap(angle - baseAngle);
      if (Math.abs(diff) > halfAngle) return;
      this.applyDamageToEnemy(enemy, damage, weapon.type, { x: px, y: py });
    });
  }

  // ── 빔 공격 ──
  private fireBeam(weapon: WeaponConfig) {
    const px = this.player.x;
    const py = this.player.y;

    const target = this.getNearestEnemy();
    const angle = target
      ? Phaser.Math.Angle.Between(px, py, target.x, target.y)
      : -Math.PI / 2;

    const length  = (weapon.beamLength ?? 260) * (this.player.stats.projectileRange ?? 1);
    const halfW   = (weapon.beamWidth ?? 26) / 2;
    const cos     = Math.cos(angle);
    const sin     = Math.sin(angle);

    const color = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const gfx = this.add.graphics();
    this.cameras.main.ignore(gfx);

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

    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 280,
      onComplete: () => gfx.destroy(),
    });

    const damage = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    this.enemies.getChildren().forEach(obj => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const along = dx * cos + dy * sin;
      const perp  = Math.abs(-dx * sin + dy * cos);
      if (along < 0 || along > length) return;
      if (perp > halfW + 14) return;
      this.applyDamageToEnemy(enemy, damage, weapon.type, { x: px, y: py }, weapon.knockbackMult ?? 0.5);
    });
  }

  // ── 번개 체인 ──
  private fireLightning(weapon: WeaponConfig) {
    const chainCount = weapon.lightningChainCount ?? 3;
    const chainRange = weapon.lightningRange ?? 200;
    const damage = Math.floor(weapon.damage * this.player.stats.attackPower / 10);

    const hit: Enemy[] = [];
    let fromX = this.player.x;
    let fromY = this.player.y;

    for (let chain = 0; chain < chainCount; chain++) {
      let nearest: Enemy | null = null;
      let minDist = chainRange;
      this.enemies.getChildren().forEach(obj => {
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

    const color = TYPE_COLORS[weapon.type] ?? 0xffdd00;
    const splashR = weapon.explosionRadius ?? 0;

    const gfx = this.add.graphics();
    this.cameras.main.ignore(gfx);

    let lx = this.player.x;
    let ly = this.player.y;
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

    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 300,
      onComplete: () => gfx.destroy(),
    });

    hit.forEach((e, i) => {
      const dmgMult = Math.pow(0.8, i);
      const chainDmg = Math.floor(damage * dmgMult);
      this.applyDamageToEnemy(e, chainDmg, weapon.type, { x: this.player.x, y: this.player.y });

      // 체인 스플래시: 각 체인 지점 주변 범위 피해
      if (splashR > 0) {
        const splashDmg = Math.floor(chainDmg * 0.5);
        this.enemies.getChildren().forEach(obj => {
          const splash = obj as Enemy;
          if (!splash.active || hit.includes(splash)) return;
          const d = Phaser.Math.Distance.Between(e.x, e.y, splash.x, splash.y);
          if (d <= splashR) {
            this.applyDamageToEnemy(splash, splashDmg, weapon.type);
          }
        });

        // 스플래시 원형 플래시 이펙트 (적 위치에서 확산)
        const ring = this.add.graphics();
        this.cameras.main.ignore(ring);
        ring.setPosition(e.x, e.y);
        ring.fillStyle(color, 0.25);
        ring.fillCircle(0, 0, splashR);
        ring.lineStyle(2, color, 0.8);
        ring.strokeCircle(0, 0, splashR);
        this.tweens.add({
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

  // ── 궤도 구체 생성 ──
  private createOrbitOrbs(weapon: WeaponConfig, slotIdx: number) {
    const existing = this.orbitOrbs.get(slotIdx);
    if (existing) existing.graphics.forEach(g => g.destroy());

    const count = weapon.orbitCount ?? 1;
    const color = TYPE_COLORS[weapon.type] ?? 0xff44ff;
    const graphics: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < count; i++) {
      const g = this.add.graphics();
      this.cameras.main.ignore(g);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(0, 0, 9);
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, 7);
      graphics.push(g);
    }

    this.orbitOrbs.set(slotIdx, { graphics, angle: this.orbitOrbs.get(slotIdx)?.angle ?? 0 });
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

    const radius = (weapon.orbitRadius ?? 110) * (this.player.stats.projectileRange ?? 1);
    const count  = orbData.graphics.length;
    const damage = Math.floor(weapon.damage * this.player.stats.attackPower / 10);

    orbData.graphics.forEach((g, i) => {
      const a  = orbData!.angle + (i / count) * Math.PI * 2;
      const ox = this.player.x + Math.cos(a) * radius;
      const oy = this.player.y + Math.sin(a) * radius;
      g.setPosition(ox, oy);

      this.enemies.getChildren().forEach(obj => {
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
      gfx = this.add.graphics();
      this.cameras.main.ignore(gfx);
      this.rotatingBeamGfx.set(slotIdx, gfx);
    }

    const px = this.player.x, py = this.player.y;
    const length = weapon.beamLength ?? 270;
    const halfW  = weapon.beamWidth  ?? 26;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const color = TYPE_COLORS[weapon.type] ?? 0xffffff;

    // 원 체인으로 불꽃 표현: 플레이어 쪽 굵고 끝으로 갈수록 가늘게
    gfx.clear();
    const STEPS = 14;
    const startDist = 28;
    for (let i = 0; i < STEPS; i++) {
      const t    = i / (STEPS - 1);
      const dist = startDist + t * (length - startDist);
      const cx   = px + cos * dist;
      const cy   = py + sin * dist;
      const r    = Phaser.Math.Linear(halfW * 0.3, halfW * 1.4, t);
      const alpha = Phaser.Math.Linear(0.85, 0.18, t);
      gfx.fillStyle(color, alpha);
      gfx.fillCircle(cx, cy, r);
    }

    const damage = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    (this.enemies.getChildren() as Enemy[]).forEach(enemy => {
      if (!enemy.active || enemy.isDead()) return;
      const dx = enemy.x - px, dy = enemy.y - py;
      const along = dx * cos + dy * sin;
      if (along < 0 || along > length) return;
      if (Math.abs(-dx * sin + dy * cos) > halfW + 15) return;
      const cdKey = slotIdx * 1000000 + enemy.uid;
      if ((this.rotatingBeamHitCooldowns.get(cdKey) ?? 0) > 0) return;
      this.rotatingBeamHitCooldowns.set(cdKey, 600);
      this.applyDamageToEnemy(enemy, damage, weapon.type, { x: px, y: py }, 0.3);
    });
  }

  // ── 낙하 공격 ──
  private fireFalling(weapon: WeaponConfig) {
    const count    = weapon.fallingCount  ?? 3;
    const radius   = weapon.fallingRadius ?? 50;
    const damage   = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    const color    = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const range    = 260;
    const bounds   = this.physics.world.bounds;

    for (let i = 0; i < count; i++) {
      const tx = Phaser.Math.Clamp(
        this.player.x + Phaser.Math.Between(-range, range),
        bounds.x + radius, bounds.right  - radius
      );
      const ty = Phaser.Math.Clamp(
        this.player.y + Phaser.Math.Between(-range, range),
        bounds.y + radius, bounds.bottom - radius
      );

      const warn = this.add.graphics();
      this.cameras.main.ignore(warn);
      warn.lineStyle(2, color, 0.8);
      warn.strokeCircle(tx, ty, radius);
      warn.fillStyle(color, 0.18);
      warn.fillCircle(tx, ty, radius);

      this.time.delayedCall(700, () => {
        warn.destroy();
        const flash = this.add.graphics();
        this.cameras.main.ignore(flash);
        flash.fillStyle(color, 0.85);
        flash.fillCircle(tx, ty, radius);
        this.time.delayedCall(140, () => flash.destroy());
        (this.enemies.getChildren() as Enemy[]).forEach(e => {
          if (!e.active || e.isDead()) return;
          if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= radius + 16) {
            this.applyDamageToEnemy(e, damage, weapon.type, { x: tx, y: ty });
          }
        });
      });
    }
  }

  // ── 충격파 (expanding ring) ──
  private fireNova(weapon: WeaponConfig) {
    const px = this.player.x, py = this.player.y;
    const maxR      = (weapon.meleeRange ?? 170) * (this.player.stats.projectileRange ?? 1);
    const damage    = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    const color     = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const sourceName = weapon.name; // tween 클로저용 캡처
    const hitSet = new Set<Enemy>();
    const gfx = this.add.graphics();
    this.cameras.main.ignore(gfx);
    const dummy = { r: 0 };
    this.tweens.add({
      targets: dummy,
      r: maxR,
      duration: 420,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        const r = dummy.r;
        const alpha = 1 - r / maxR;
        gfx.clear();
        gfx.lineStyle(5, color, alpha * 0.95);
        gfx.strokeCircle(px, py, r);
        gfx.fillStyle(color, alpha * 0.13);
        gfx.fillCircle(px, py, r);
        (this.enemies.getChildren() as Enemy[]).forEach(e => {
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

  // ── 부메랑 (go & return) ──
  private fireBoomerang(weapon: WeaponConfig) {
    const target = this.getNearestEnemy();
    const angle  = target
      ? Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y)
      : 0;
    const range  = (weapon.meleeRange ?? 200) * (this.player.stats.projectileRange ?? 1);
    const damage = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    const color  = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const endX   = this.player.x + Math.cos(angle) * range;
    const endY   = this.player.y + Math.sin(angle) * range;
    const gfx    = this.add.graphics();
    this.cameras.main.ignore(gfx);
    gfx.fillStyle(color, 0.92);
    gfx.fillCircle(0, 0, 10);
    const pos    = { x: this.player.x, y: this.player.y };
    const hitOut = new Set<Enemy>();
    const hitBack = new Set<Enemy>();
    const checkHit = (hitSet: Set<Enemy>) => {
      (this.enemies.getChildren() as Enemy[]).forEach(e => {
        if (!e.active || e.isDead() || hitSet.has(e)) return;
        if (Phaser.Math.Distance.Between(pos.x, pos.y, e.x, e.y) <= 22) {
          hitSet.add(e);
          this.applyDamageToEnemy(e, damage, weapon.type, { x: pos.x, y: pos.y });
        }
      });
    };
    this.tweens.add({
      targets: pos, x: endX, y: endY,
      duration: 480, ease: 'Quad.easeOut',
      onUpdate: () => { gfx.setPosition(pos.x, pos.y); checkHit(hitOut); },
      onComplete: () => {
        this.tweens.add({
          targets: pos, x: this.player.x, y: this.player.y,
          duration: 360, ease: 'Quad.easeIn',
          onUpdate: () => { gfx.setPosition(pos.x, pos.y); checkHit(hitBack); },
          onComplete: () => gfx.destroy(),
        });
      },
    });
  }

  // ── 전방위 산탄 ──
  private fireScatter(weapon: WeaponConfig) {
    const count    = weapon.projectileCount ?? 8;
    const damage   = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    const speedMult = this.player.stats.projectileSpeed / 300;
    const speed    = Math.round(weapon.projectileSpeed * speedMult);
    const duration = Math.round(weapon.duration * (this.player.stats.projectileRange ?? 1));
    const pierce   = weapon.pierce ?? 0;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const proj  = new Projectile(this, this.player.x, this.player.y, weapon.textureKey, damage, speed, angle, duration, pierce);
      this.projectiles.add(proj, true);
      this.cameras.main.ignore(proj);
      proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  // ── 함정 설치 ──
  private fireTrap(weapon: WeaponConfig) {
    const count   = weapon.projectileCount ?? 2;
    const radius  = (weapon.meleeRange ?? 45) * (this.player.stats.projectileRange ?? 1);
    const damage  = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
    const color   = TYPE_COLORS[weapon.type] ?? 0xffffff;
    const lifeMs  = 4500;
    for (let i = 0; i < count; i++) {
      const a  = Math.random() * Math.PI * 2;
      const d  = Phaser.Math.Between(40, 130);
      const tx = this.player.x + Math.cos(a) * d;
      const ty = this.player.y + Math.sin(a) * d;
      const gfx = this.add.graphics();
      this.cameras.main.ignore(gfx);
      let elapsed = 0;
      let triggered = false;
      const drawTrap = (alpha: number) => {
        gfx.clear();
        gfx.lineStyle(2, color, 0.8 * alpha);
        gfx.strokeCircle(tx, ty, radius);
        gfx.fillStyle(color, 0.25 * alpha);
        gfx.fillCircle(tx, ty, radius);
      };
      drawTrap(1);
      const timer = this.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          elapsed += 100;
          if (triggered || elapsed >= lifeMs) {
            gfx.destroy(); timer.remove(); return;
          }
          drawTrap(1 - elapsed / lifeMs);
          (this.enemies.getChildren() as Enemy[]).forEach(e => {
            if (triggered || !e.active || e.isDead()) return;
            if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= radius + 16) {
              triggered = true;
              gfx.destroy(); timer.remove();
              const flash = this.add.graphics();
              this.cameras.main.ignore(flash);
              flash.fillStyle(color, 0.88);
              flash.fillCircle(tx, ty, radius * 1.6);
              this.time.delayedCall(150, () => flash.destroy());
              (this.enemies.getChildren() as Enemy[]).forEach(e2 => {
                if (!e2.active || e2.isDead()) return;
                if (Phaser.Math.Distance.Between(tx, ty, e2.x, e2.y) <= radius + 20) {
                  this.applyDamageToEnemy(e2, damage, weapon.type, { x: tx, y: ty });
                }
              });
            }
          });
        },
      });
    }
  }

  // ── 유도탄 조종 ──
  private steerHomingProjectiles() {
    (this.projectiles.getChildren() as Projectile[]).forEach(proj => {
      if (!proj.active || !proj.homing) return;
      let nearest: Enemy | null = null;
      let nearestDist = Infinity;
      (this.enemies.getChildren() as Enemy[]).forEach(e => {
        if (!e.active || e.isDead()) return;
        const d = Phaser.Math.Distance.Between(proj.x, proj.y, e.x, e.y);
        if (d < nearestDist) { nearestDist = d; nearest = e; }
      });
      if (!nearest) return;
      const body = proj.body as Phaser.Physics.Arcade.Body;
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      const cur   = Math.atan2(body.velocity.y, body.velocity.x);
      const target = Phaser.Math.Angle.Between(proj.x, proj.y, (nearest as Enemy).x, (nearest as Enemy).y);
      const next  = Phaser.Math.Angle.RotateTo(cur, target, 0.07);
      body.velocity.x = Math.cos(next) * speed;
      body.velocity.y = Math.sin(next) * speed;
    });
  }

  // ── 장판 업데이트 (매 프레임) ──
  private updateZone(weapon: WeaponConfig, slotIdx: number, delta: number) {
    let zoneData = this.zoneGraphics.get(slotIdx);
    if (!zoneData) {
      const g = this.add.graphics();
      this.cameras.main.ignore(g);
      zoneData = { graphic: g, damageTimer: 0 };
      this.zoneGraphics.set(slotIdx, zoneData);
    }

    const radius = (weapon.zoneRadius ?? 180) * (this.player.stats.projectileRange ?? 1);
    const color  = TYPE_COLORS[weapon.type] ?? 0x888888;
    const px = this.player.x;
    const py = this.player.y;

    zoneData.graphic.clear();
    zoneData.graphic.fillStyle(color, 0.12);
    zoneData.graphic.fillCircle(px, py, radius);
    zoneData.graphic.lineStyle(2, color, 0.55);
    zoneData.graphic.strokeCircle(px, py, radius);

    const interval = weapon.zoneDamageInterval ?? 1000;
    zoneData.damageTimer += delta;
    if (zoneData.damageTimer >= interval) {
      zoneData.damageTimer -= interval;
      const damage = Math.floor(weapon.damage * this.player.stats.attackPower / 10);
      this.enemies.getChildren().forEach(obj => {
        const enemy = obj as Enemy;
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
        if (dist > radius) return;
        this.applyDamageToEnemy(enemy, damage, weapon.type, undefined, 0);
      });
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

    // 관통 투사체: 이미 맞춘 적은 스킵
    const enemyId = enemy.getData('uid') as number | undefined;
    const uid = enemyId ?? (enemy.x * 1000 + enemy.y);
    if (proj.hitEnemies.has(uid)) return;
    proj.hitEnemies.add(uid);

    const projType = proj.texture.key.replace('proj_', '') as PokemonType;
    this.currentDamageSource = proj.sourceName;
    this.applyDamageToEnemy(enemy, proj.damage, projType, { x: this.player.x, y: this.player.y });

    // 폭발 처리
    if (proj.explosionRadius > 0) {
      const ex = proj.x, ey = proj.y, er = proj.explosionRadius;
      const color = TYPE_COLORS[projType] ?? 0xffffff;
      const flash = this.add.graphics();
      this.cameras.main.ignore(flash);
      flash.fillStyle(color, 0.7);
      flash.fillCircle(ex, ey, er);
      flash.lineStyle(2, color, 1.0);
      flash.strokeCircle(ex, ey, er);
      this.time.delayedCall(180, () => flash.destroy());
      (this.enemies.getChildren() as Enemy[]).forEach(e => {
        if (!e.active || e.isDead() || e === enemy) return;
        if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) <= er) {
          this.applyDamageToEnemy(e, proj.damage, projType, { x: ex, y: ey });
        }
      });
      proj.destroy();
      return;
    }

    if (proj.pierce > 0) {
      proj.pierce--;
    } else {
      proj.destroy();
    }
  }

  private onPlayerHitEnemy(_player: any, _enemy: any) {
    const player = _player as Player;
    const enemy  = _enemy as Enemy;
    const dmg    = enemy.contactDamage ?? (5 + this.waveNumber * 2);
    const actual = player.takeDamage(dmg);
    if (actual <= 0) return;


    const dmgText = this.add.text(player.x, player.y - 20, `-${actual}`, {
      fontSize: '14px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);
    this.cameras.main.ignore(dmgText);
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
    const flashColor = enemy.isElite ? 0xffdd00 : enemy.isBoss ? 0xff4400 : 0xffffff;
    const flashRadius = enemy.isBoss ? 30 : enemy.isElite ? 20 : 15;
    const flash = this.add.circle(enemy.x, enemy.y, flashRadius, flashColor, 0.85).setDepth(15);
    this.cameras.main.ignore(flash);
    this.tweens.add({
      targets: flash,
      scaleX: 2.5, scaleY: 2.5, alpha: 0,
      duration: enemy.isBoss ? 500 : 300,
      onComplete: () => flash.destroy(),
    });

    // 엘리트 처치 알림
    if (enemy.isElite) {
      const eliteTxt = this.add.text(enemy.x, enemy.y - 30, '★ ELITE ★', {
        fontSize: '14px', color: '#ffdd00', fontStyle: 'bold',
        stroke: '#664400', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(18);
      this.cameras.main.ignore(eliteTxt);
      this.tweens.add({
        targets: eliteTxt,
        y: eliteTxt.y - 30, alpha: 0,
        duration: 800,
        onComplete: () => eliteTxt.destroy(),
      });
    }

    this.killCount++;
    this.gold += Math.ceil(enemy.goldValue * this.player.stats.goldGain);
    this.addComboKill();
    // 처치 마일스톤
    for (const m of this.KILL_MILESTONES) {
      if (this.killCount >= m && !this.reachedKillMilestones.has(m)) {
        this.reachedKillMilestones.add(m);
        this.showMilestone(`${m}마리 처치 달성!`, '#88ffcc');
        break;
      }
    }

    if (enemy.isBoss && this.currentBoss === enemy) {
      this.currentBoss = null;
      this.bossPatternTimer = 0;
      this.bossPatternState = 'walk';
      this.bossRollTarget   = null;
      this.bossIndicatorGfx?.destroy();
      this.bossIndicatorGfx = null;
      this.setBossPanelVisible(false);
      this.bossArrow.setVisible(false);
      this.showBossDefeated();
    }

    // 경험치 구슬 스폰
    const orb = new ExpOrb(this, enemy.x, enemy.y, enemy.exp);
    this.cameras.main.ignore(orb);

    enemy.destroy();
  }

  // ===== 게임오버 =====
  private triggerGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.sound.stopByKey('bgm_game');
    this.cameras.main.shake(400, 0.02);
    // UI 정리
    this.bossArrow.setVisible(false);
    if (IS_DEV_MODE) this.scene.stop('DevScene');

    this.player.setTint(0xff0000);
    this.tweens.add({ targets: this.player, alpha: 0, duration: 600 });

    // 골드 누적 저장
    const prevTotal = parseInt(localStorage.getItem('totalGold') ?? '0', 10);
    const newTotal  = prevTotal + this.gold;
    localStorage.setItem('totalGold', String(newTotal));

    // 베스트 기록 갱신
    const bestWave  = parseInt(localStorage.getItem('bestWave')  ?? '0', 10);
    const bestKills = parseInt(localStorage.getItem('bestKills') ?? '0', 10);
    const bestTime  = parseInt(localStorage.getItem('bestTime')  ?? '0', 10);
    if (this.waveNumber + 1 > bestWave)  localStorage.setItem('bestWave',  String(this.waveNumber + 1));
    if (this.killCount   > bestKills)    localStorage.setItem('bestKills', String(this.killCount));
    if (this.gameTime    > bestTime)     localStorage.setItem('bestTime',  String(Math.floor(this.gameTime)));

    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        level:        this.level,
        killCount:    this.killCount,
        surviveTime:  this.gameTime,
        goldEarned:   this.gold,
        totalGold:    newTotal,
        waveNumber:   this.waveNumber + 1,
        weaponDamageLog: Object.fromEntries(this.weaponDamageLog),
      });
    });
  }

  // ===== 경험치 / 레벨업 =====
  healPlayer(amount: number) {
    this.player.heal(amount);
    this.updateUI();
    // 초록 회복 텍스트
    const txt = this.add.text(this.player.x, this.player.y - 20, `+${amount}`, {
      fontSize: '14px', color: '#44ff88',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(20);
    this.cameras.main.ignore(txt);
    this.tweens.add({
      targets: txt,
      y: txt.y - 25, alpha: 0,
      duration: 700,
      onComplete: () => txt.destroy(),
    });
  }

  gainExp(amount: number) {
    this.exp += Math.floor(amount * this.player.stats.expGain);
    if (this.exp >= this.expToNext && !this.isLevelingUp) {
      this.exp      -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(this.expToNext * 1.20);
      // 레벨 마일스톤
      for (const m of this.LEVEL_MILESTONES) {
        if (this.level >= m && !this.reachedLevelMilestones.has(m)) {
          this.reachedLevelMilestones.add(m);
          this.showMilestone(`레벨 ${m} 돌파!`, '#ffdd44');
          break;
        }
      }
      this.triggerLevelUpUI();
    }
  }

  private triggerLevelUpUI() {
    this.isLevelingUp = true;

    // 황금 플래시
    const flash = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xffdd00, 0.3
    ).setScrollFactor(0).setDepth(50);
    this.gameCam.ignore(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    // 300ms 뒤 씬 일시정지 + LevelUpScene 오버레이 실행
    this.time.delayedCall(300, () => {
      this.closeWeaponPopup();
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
            description: w.description ?? `새로운 포켓몬! ${w.type} 타입`,
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
          description: getUpgradeDescription(base, curLv, nextLv),
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
            description: `${p.description} ${formatPassiveValue(p.statKey, p.values[0])}`,
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
            description: `${item.description} → ${formatPassiveValue(item.statKey, item.values[nextLv - 1])}`,
            levelFrom: curLv,
            levelTo: nextLv,
          });
        }
      }
    });

    // 셔플 후 최대 3개
    Phaser.Utils.Array.Shuffle(pool);
    const result = pool.slice(0, 3);

    // 선택지가 3개 미만이면 +50골드로 채움
    while (result.length < 3) {
      result.push({
        type: 'goldBonus',
        label: '+50 골드',
        description: '골드 50개를 획득합니다.',
      });
    }
    return result;
  }

  // ===== 레벨업 선택 적용 (LevelUpScene에서 호출) =====
  applyLevelUpChoice(option: LevelUpOption) {
    switch (option.type) {
      case 'newPokemon': {
        const base    = getWeaponByPokemonId(option.pokemonId!)!;
        const newWeap = getUpgradedWeapon(base, 1);
        const newIdx  = this.weapons.length;
        this.weapons.push(newWeap);
        this.weaponCooldowns.push(0);
        this.weaponLevels.push(1);
        if ((newWeap.behavior ?? 'projectile') === 'orbit') this.createOrbitOrbs(newWeap, newIdx);
        break;
      }
      case 'upgradePokemon': {
        const idx = this.weapons.findIndex(w => w.pokemonId === option.pokemonId);
        if (idx >= 0) {
          const newLv   = option.levelTo ?? this.weaponLevels[idx] + 1;
          const base    = getWeaponByPokemonId(option.pokemonId!) ?? this.weapons[idx];
          const upgraded = getUpgradedWeapon(base, newLv);
          this.weapons[idx]      = upgraded;
          this.weaponLevels[idx] = newLv;
          if ((upgraded.behavior ?? 'projectile') === 'orbit') this.createOrbitOrbs(upgraded, idx);
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
      case 'goldBonus': {
        this.gold += 50;
        this.goldText.setText(`★  ${this.gold} G`);
        break;
      }
    }

    this.updateSlotUI();
    this.isLevelingUp = false;

    // 연속 레벨업이 쌓여있으면 다음 프레임에서 처리
    if (this.exp >= this.expToNext) {
      this.exp      -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(this.expToNext * 1.20);
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

  // ===== 무기 정보 팝업 =====
  private showWeaponPopup(slotIdx: number) {
    // 기존 팝업 닫기
    this.closeWeaponPopup();

    const weapon = this.weapons[slotIdx];
    if (!weapon) return;

    const W  = this.scale.width;
    const H  = this.scale.height;
    const PW = W - 40;
    const PH = 220;
    const CX = W / 2;
    const CY = H / 2 - 20;
    const D  = 300; // 일시정지 패널(D=200) 위에 뜨도록

    const behavior = weapon.behavior ?? 'projectile';
    const behaviorLabel: Record<string, string> = {
      projectile: '투사체', melee: '근접', beam: '빔',
      orbit: '궤도', zone: '장판', lightning: '번개',
      homing: '유도탄', explosion: '폭발', rotating_beam: '회전빔',
      falling: '낙하', nova: '충격파', boomerang: '부메랑',
      scatter: '산탄', trap: '트랩',
    };
    const typeColor = TYPE_COLORS[weapon.type] ?? 0x888888;
    const typeHex   = `#${typeColor.toString(16).padStart(6, '0')}`;

    const push = (...items: Phaser.GameObjects.GameObject[]) =>
      items.forEach(item => this.weaponPopupItems.push(item));

    // 어두운 오버레이 (클릭하면 닫기)
    const overlay = this.add.rectangle(CX, CY, W, H, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(D).setInteractive();
    overlay.on('pointerdown', () => this.closeWeaponPopup());
    push(overlay);

    // 팝업 배경
    push(this.add.rectangle(CX, CY, PW + 6, PH + 6, typeColor, 0.4)
      .setScrollFactor(0).setDepth(D + 1));
    push(this.add.rectangle(CX, CY, PW, PH, 0x111827)
      .setScrollFactor(0).setDepth(D + 2));

    // 포켓몬 스프라이트
    const sprKey = `pokemon_${String(weapon.pokemonId).padStart(3, '0')}`;
    const LEFT = CX - PW / 2 + 16;
    if (this.textures.exists(sprKey)) {
      push(this.add.image(LEFT + 28, CY - 40, sprKey)
        .setDisplaySize(56, 56).setScrollFactor(0).setDepth(D + 3));
    }

    const TX = LEFT + 64;

    // 이름 + 레벨
    push(this.add.text(TX, CY - 68, `${weapon.name}`, {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3, padding: { top: 4 },
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));

    push(this.add.text(TX, CY - 46, `Lv.${this.weaponLevels[slotIdx] ?? 1}`, {
      fontSize: '13px', color: '#aaddff', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));

    // 타입 + behavior 배지
    push(this.add.text(TX, CY - 28, `  ${weapon.type.toUpperCase()}  `, {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: typeHex, padding: { x: 4, y: 3 },
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));

    push(this.add.text(TX + 80, CY - 28, `  ${behaviorLabel[behavior]}  `, {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#334455', padding: { x: 4, y: 3 },
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));

    // 구분선
    push(this.add.graphics().lineStyle(1, typeColor, 0.5)
      .lineBetween(LEFT, CY - 10, CX + PW / 2 - 16, CY - 10)
      .setScrollFactor(0).setDepth(D + 3));

    // 설명
    push(this.add.text(LEFT, CY + 4, weapon.description ?? '', {
      fontSize: '13px', color: '#ccddcc', lineSpacing: 6,
      wordWrap: { width: PW - 32 },
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));

    // 스탯 라인
    const statParts: string[] = [
      `공격력 ${weapon.damage}`,
      `쿨다운 ${(weapon.cooldown / 1000).toFixed(1)}s`,
    ];
    switch (behavior) {
      case 'melee':         statParts.push(`범위 ${weapon.meleeRange ?? 120}`); break;
      case 'beam':          statParts.push(`길이 ${weapon.beamLength ?? 270}`); break;
      case 'orbit':         statParts.push(`구체 ×${weapon.orbitCount ?? 1}`); break;
      case 'zone':          statParts.push(`반경 ${weapon.zoneRadius ?? 180}`); break;
      case 'lightning':     statParts.push(`체인 ${weapon.lightningChainCount ?? 3}회${(weapon.explosionRadius ?? 0) > 0 ? ` / 스플래시 ${weapon.explosionRadius}` : ''}`); break;
      case 'explosion':     statParts.push(`폭발 반경 ${weapon.explosionRadius ?? 90}`); break;
      case 'rotating_beam': statParts.push(`회전속도 ${((weapon.rotateSpeed ?? 1.8) * 60).toFixed(0)}°/s`); break;
      case 'nova':          statParts.push(`충격 범위 ${weapon.meleeRange ?? 170}`); break;
      case 'boomerang':     statParts.push(`사거리 ${weapon.meleeRange ?? 200}`); break;
      case 'scatter':       statParts.push(`산탄 ×${weapon.projectileCount ?? 8}`); break;
      case 'trap':          statParts.push(`트랩 ×${weapon.fallingCount ?? 2}`); break;
      case 'falling':       statParts.push(`낙하 ×${weapon.fallingCount ?? 3}`); break;
      case 'homing':        statParts.push(`관통 ${weapon.pierce ?? 1}회`); break;
      default:              statParts.push(`투사체 ×${weapon.projectileCount}`); break;
    }
    push(this.add.text(LEFT, CY + 68, statParts.join('  /  '), {
      fontSize: '12px', color: '#88aacc',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3));

    // 닫기 안내
    push(this.add.text(CX, CY + PH / 2 - 14, '탭하면 닫힙니다', {
      fontSize: '11px', color: '#555566',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D + 3));
  }

  private closeWeaponPopup() {
    this.weaponPopupItems.forEach(item => item.destroy());
    this.weaponPopupItems = [];
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
        // 타입 색상 바 표시
        const typeColor = TYPE_COLORS[this.weapons[i].type] ?? 0x888888;
        this.pokemonSlotTypes[i].setFillStyle(typeColor, 1);
      } else {
        bg.setFillStyle(0x8cb890);                     // 비어있음 (어두운 초록)
        this.pokemonSlotLvs[i].setText('');
        this.pokemonSlotImgs[i].setVisible(false);
        this.pokemonSlotTypes[i].setFillStyle(0x000000, 0);
      }
    });

    // 장신구 슬롯
    const passiveEntries = Array.from(this.equippedPassives.entries());
    this.accessorySlotBgs.forEach((bg, i) => {
      if (i < passiveEntries.length) {
        bg.setFillStyle(0x6855cc);                     // 장착됨 (밝은 보라)
        this.accessorySlotLvs[i].setText(`Lv${passiveEntries[i][1]}`);
        const typeColor = TYPE_COLORS[passiveEntries[i][0]] ?? 0x888888;
        this.accessorySlotTypes[i].setFillStyle(typeColor, 1);
        const typeKr: Record<string, string> = {
          normal: '노말', fire: '불꽃', water: '물', grass: '풀',
          electric: '전기', ice: '얼음', fighting: '격투', poison: '독',
          ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
          rock: '바위', ghost: '고스트', dragon: '드래곤', dark: '악', steel: '강철',
        };
        this.accessorySlotNames[i].setText(typeKr[passiveEntries[i][0]] ?? '');
      } else {
        bg.setFillStyle(0x9890c0);                     // 비어있음 (어두운 보라)
        this.accessorySlotLvs[i].setText('');
        this.accessorySlotTypes[i].setFillStyle(0x000000, 0);
        this.accessorySlotNames[i].setText('');
      }
    });
  }

  // ===== 소프트 분리력 =====
  private applySeparation() {
    const list = this.enemies.getChildren() as Enemy[];
    const SEP_FORCE = 90;   // 분리 속도 (px/s)
    const SEP_DIST  = 28;   // 일반 적 최소 거리 (px)
    const BOSS_DIST = 48;   // 보스 포함 최소 거리 (px)

    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.active) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (!b.active) continue;

        const dx     = a.x - b.x;
        const dy     = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        const minDist = (a.isBoss || b.isBoss) ? BOSS_DIST : SEP_DIST;

        if (distSq >= minDist * minDist || distSq < 0.01) continue;

        const dist  = Math.sqrt(distSq);
        // 겹친 비율에 비례한 힘 (멀수록 약하게)
        const force = ((minDist - dist) / minDist) * SEP_FORCE;
        const nx = dx / dist;
        const ny = dy / dist;

        const bodyA = a.body as Phaser.Physics.Arcade.Body;
        const bodyB = b.body as Phaser.Physics.Arcade.Body;
        bodyA.velocity.x += nx * force;
        bodyA.velocity.y += ny * force;
        bodyB.velocity.x -= nx * force;
        bodyB.velocity.y -= ny * force;
      }
    }
  }

  // ===== 콤보 시스템 =====
  private updateCombo(delta: number) {
    if (this.comboCount < 3) return;
    this.comboTimer -= delta;
    if (this.comboTimer <= 0) {
      this.comboCount = 0;
    }
  }

  private addComboKill() {
    this.comboCount++;
    this.comboTimer = this.COMBO_TIMEOUT;
  }

  // ===== 적 HP바 렌더 =====
  private renderEnemyHpBars() {
    // 일반/엘리트 HP바 미표시 — 보스는 상단 패널에서 별도 표시
    this.enemyHpGraphics.clear();
  }

  // ===== 웨이브 =====
  private spawnWave() {
    // 30웨이브(15분) — 다크라이 등장, 일반 스폰 없음
    if (this.waveNumber === 30) {
      this.time.delayedCall(1000, () => this.spawnDarkrai());
      return;
    }

    const count = 12 + this.waveNumber * 4;
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 160, () => this.spawnEnemy());
    }

    // 10웨이브(10분) → 스테이지별 보스, 20웨이브(20분) → 스테이지별 보스
    if (this.waveNumber === 10 || this.waveNumber === 20) {
      this.time.delayedCall(1500, () => this.spawnBoss());
    }
  }

  private getSpawnPosition(): { x: number; y: number } {
    const cam    = this.gameCam;
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
      x: Phaser.Math.Clamp(x, 0, this.worldW),
      y: Phaser.Math.Clamp(y, 0, this.worldH),
    };
  }

  private spawnEnemy() {
    const { x, y } = this.getSpawnPosition();

    const pool  = getActiveEnemyPool(this.stageId, this.waveNumber);
    const entry = pool[Phaser.Math.Between(0, pool.length - 1)];
    const diff  = getStageData(this.stageId).difficulty;

    const enemy = new Enemy(this, x, y, `pokemon_${entry.id}`, {
      hp:           Math.round((60 + this.waveNumber * 22) * diff),
      moveSpeed:    Math.min(55 + this.waveNumber * 5, 160),
      exp:          2 + this.waveNumber,
      pokemonTypes: entry.types,
      isElite:      false,
      goldValue:    1,
    });
    this.enemies.add(enemy);
    this.cameras.main.ignore(enemy);
  }

  private spawnElite() {
    const { x, y } = this.getSpawnPosition();
    const pool  = getElitePool(this.stageId);
    const entry = pool[Phaser.Math.Between(0, pool.length - 1)];
    const diff  = getStageData(this.stageId).difficulty;
    const elite = new Enemy(this, x, y, `pokemon_${entry.id}`, {
      hp:           Math.round((200 + this.waveNumber * 50) * diff),
      moveSpeed:    Math.min(65 + this.waveNumber * 4, 150),
      exp:          10 + this.waveNumber * 2,
      pokemonTypes: entry.types,
      isElite:      true,
      goldValue:    8,
    });
    this.enemies.add(elite);
    this.cameras.main.ignore(elite);
  }

  private spawnBoss() {
    const { x, y } = this.getSpawnPosition();

    const stage      = getStageData(this.stageId);
    const bossConfig = this.waveNumber === 10 ? stage.boss10 : stage.boss20;
    this.currentBossName = bossConfig.name;

    const boss = new Enemy(this, x, y, `pokemon_${bossConfig.id}`, {
      hp:           Math.round(bossConfig.hp * stage.difficulty),
      moveSpeed:    bossConfig.moveSpeed,
      exp:          bossConfig.exp,
      isBoss:       true,
      pokemonTypes: bossConfig.types,
      goldValue:    bossConfig.goldValue,
    });
    this.enemies.add(boss);
    this.cameras.main.ignore(boss);
    this.currentBoss = boss;
    this.bossHpRatioDisplayed = 1;

    this.setBossPanelVisible(true);

    this.gameCam.shake(600, 0.015);
    this.time.delayedCall(300, () => this.showBossAlert(bossConfig.id));
  }

  private spawnDarkrai() {
    if (this.darkraiSpawned) return;
    this.darkraiSpawned = true;

    const { x, y } = this.getSpawnPosition();
    this.currentBossName = '다크라이';

    const darkrai = new Enemy(this, x, y, 'pokemon_491', {
      hp:             99999,
      moveSpeed:      175,
      exp:            0,
      isBoss:         true,
      pokemonTypes:   ['dark'],
      goldValue:      0,
      contactDamage:  9999,
      ignoreKnockback: true,
    });
    // 보랏빛 섬뜩한 글로우
    darkrai.postFX.clear();
    darkrai.postFX.addGlow(0x330066, 4, 0, false, 0.2, 8);
    darkrai.setTint(0xcc88ff);
    darkrai.setScale(2.0);

    this.enemies.add(darkrai);
    this.cameras.main.ignore(darkrai);
    this.currentBoss = darkrai;
    this.bossHpRatioDisplayed = 1;

    this.setBossPanelVisible(true);

    this.gameCam.shake(1000, 0.025);
    this.showDarkraiAlert();
  }

  // ===== 보스 패턴 =====
  private updateBossPattern(delta: number) {
    if (!this.currentBoss?.active) return;
    const key = this.currentBoss.texture.key;
    if (key === 'pokemon_143') this.updateSnorlaxPattern(delta);
    else if (key === 'pokemon_115') this.updateKangaskhanPattern(delta);
  }

  // ── 잠만보: 걷기 → 준비 → 굴리기 ──
  private updateSnorlaxPattern(delta: number) {
    const boss = this.currentBoss!;
    this.bossPatternTimer += delta;

    if (this.bossPatternState === 'walk') {
      boss.movementOverride = null;
      if (this.bossPatternTimer >= 4500) {
        this.bossPatternState = 'charging';
        this.bossPatternTimer = 0;
        this.bossRollTarget = { x: this.player.x, y: this.player.y };
        boss.setTint(0xff8800);
        // 경고 원 생성
        this.bossIndicatorGfx?.destroy();
        this.bossIndicatorGfx = this.add.graphics();
        this.cameras.main.ignore(this.bossIndicatorGfx);
      }

    } else if (this.bossPatternState === 'charging') {
      boss.movementOverride = { vx: 0, vy: 0 };
      // 경고 원 그리기 (점점 커짐)
      if (this.bossIndicatorGfx) {
        const progress = this.bossPatternTimer / 1200;
        const r = 20 + progress * 60;
        this.bossIndicatorGfx.clear();
        this.bossIndicatorGfx.lineStyle(3, 0xff6600, 0.7);
        this.bossIndicatorGfx.strokeCircle(boss.x, boss.y, r);
        this.bossIndicatorGfx.fillStyle(0xff6600, 0.1);
        this.bossIndicatorGfx.fillCircle(boss.x, boss.y, r);
      }
      if (this.bossPatternTimer >= 1200) {
        this.bossPatternState = 'rolling';
        this.bossPatternTimer = 0;
        this.bossIndicatorGfx?.destroy();
        this.bossIndicatorGfx = null;
        boss.setTint(0xff2200);
        // 굴리기 방향 고정
        if (this.bossRollTarget) {
          const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.bossRollTarget.x, this.bossRollTarget.y);
          boss.movementOverride = {
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
          };
        }
      }

    } else if (this.bossPatternState === 'rolling') {
      if (this.bossPatternTimer >= 750) {
        this.bossPatternState = 'walk';
        this.bossPatternTimer = 0;
        boss.movementOverride = null;
        boss.clearTint();
        this.bossRollTarget = null;
      }
    }
  }

  // ── 캥카: 걷기 → 조준 → 발사 ──
  private updateKangaskhanPattern(delta: number) {
    const boss = this.currentBoss!;
    this.bossPatternTimer += delta;

    if (this.bossPatternState === 'walk') {
      boss.movementOverride = null;
      if (this.bossPatternTimer >= 3500) {
        this.bossPatternState = 'aiming';
        this.bossPatternTimer = 0;
        this.bossRollTarget = { x: this.player.x, y: this.player.y };
        boss.setTint(0xffee44);
        // 조준선 표시
        this.bossIndicatorGfx?.destroy();
        this.bossIndicatorGfx = this.add.graphics();
        this.cameras.main.ignore(this.bossIndicatorGfx);
      }

    } else if (this.bossPatternState === 'aiming') {
      boss.movementOverride = { vx: 0, vy: 0 };
      // 조준선 업데이트 (플레이어 위치 추적)
      if (this.bossIndicatorGfx) {
        this.bossIndicatorGfx.clear();
        this.bossIndicatorGfx.lineStyle(2, 0xffee44, 0.5);
        this.bossIndicatorGfx.lineBetween(boss.x, boss.y, this.player.x, this.player.y);
        this.bossIndicatorGfx.fillStyle(0xffee44, 0.6);
        this.bossIndicatorGfx.fillCircle(this.player.x, this.player.y, 12);
      }
      if (this.bossPatternTimer >= 700) {
        this.bossPatternState = 'walk';
        this.bossPatternTimer = 0;
        this.bossIndicatorGfx?.destroy();
        this.bossIndicatorGfx = null;
        boss.movementOverride = null;
        boss.clearTint();
        // 에너지볼 발사 (조준 시작 시 플레이어 위치로)
        const target = this.bossRollTarget ?? { x: this.player.x, y: this.player.y };
        this.fireKangaskhanBall(boss.x, boss.y, target.x, target.y);
        this.bossRollTarget = null;
      }
    }
  }

  private fireKangaskhanBall(fromX: number, fromY: number, toX: number, toY: number) {
    const ball = this.add.circle(fromX, fromY, 10, 0xffcc22, 1).setDepth(15);
    this.cameras.main.ignore(ball);

    this.tweens.add({
      targets: ball,
      x: toX, y: toY,
      duration: 480,
      ease: 'Linear',
      onComplete: () => {
        ball.destroy();
        // 착탄 이펙트
        const splash = this.add.circle(toX, toY, 12, 0xffcc22, 0.7).setDepth(15);
        this.cameras.main.ignore(splash);
        this.tweens.add({
          targets: splash, alpha: 0, scaleX: 3, scaleY: 3,
          duration: 280, onComplete: () => splash.destroy(),
        });
        // 범위 내 플레이어 피해
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, toX, toY);
        if (dist <= 44) {
          const dmg = 12 + this.waveNumber * 2;
          const actual = this.player.takeDamage(dmg);
          if (actual > 0) {
            const txt = this.add.text(this.player.x, this.player.y - 20, `-${actual}`, {
              fontSize: '14px', color: '#ff4444', stroke: '#000000', strokeThickness: 3,
            }).setDepth(20);
            this.cameras.main.ignore(txt);
            this.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
          }
        }
      },
    });
  }

  private showWaveAnnouncement() {
    if (this.waveNumber === 30) return; // 다크라이 웨이브는 별도 연출

    const W  = this.scale.width;
    const cy = 70 + (this.scale.height - 70 - 132) / 2;
    const isBossWave = this.waveNumber === 5 || this.waveNumber === 10;
    const displayWave = this.waveNumber + 1;
    const label = isBossWave
      ? `WAVE ${displayWave}  ★ BOSS WAVE ★`
      : `WAVE ${displayWave}`;
    const color = isBossWave ? '#ff4444' : '#ffffff';

    const txt = this.add.text(W / 2, cy, label, {
      fontSize: '24px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setAlpha(0);
    this.gameCam.ignore(txt);

    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1200,
      onComplete: () => txt.destroy(),
    });
  }

  private showBossAlert(bossId: string) {
    const W  = this.scale.width;
    const cy = 70 + (this.scale.height - 70 - 132) / 2; // 게임 영역 중앙
    const bg = this.add.rectangle(W / 2, cy, W, 60, 0x880000, 0.85)
      .setScrollFactor(0).setDepth(90);
    const txt = this.add.text(W / 2, cy, `⚠  BOSS 등장!  ⚠`, {
      fontSize: '22px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(91);
    this.gameCam.ignore([bg, txt]);

    this.tweens.add({
      targets: [bg, txt],
      alpha: 0,
      duration: 600,
      delay: 1800,
      onComplete: () => { bg.destroy(); txt.destroy(); },
    });
  }

  private showDarkraiAlert() {
    const W  = this.scale.width;
    const cy = 70 + (this.scale.height - 70 - 132) / 2;

    // 전체 화면 암전 플래시
    const flash = this.add.rectangle(W / 2, this.scale.height / 2, W, this.scale.height, 0x000000, 0)
      .setScrollFactor(0).setDepth(95);
    this.gameCam.ignore(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0.85,
      duration: 400,
      yoyo: true,
      hold: 600,
      onComplete: () => flash.destroy(),
    });

    const bg = this.add.rectangle(W / 2, cy, W, 80, 0x110022, 0.95)
      .setScrollFactor(0).setDepth(96);
    const title = this.add.text(W / 2, cy - 18, '⚠  다크라이가 나타났다!  ⚠', {
      fontSize: '20px', color: '#cc88ff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(97).setAlpha(0);
    const sub = this.add.text(W / 2, cy + 14, '도망쳐라, 트레이너!', {
      fontSize: '14px', color: '#ff8888',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(97).setAlpha(0);
    this.gameCam.ignore([bg, title, sub]);

    this.tweens.add({
      targets: [title, sub],
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 2000,
      onComplete: () => { title.destroy(); sub.destroy(); },
    });
    this.tweens.add({
      targets: bg,
      alpha: 0,
      duration: 400,
      delay: 2300,
      onComplete: () => bg.destroy(),
    });
  }

  private setBossPanelVisible(visible: boolean) {
    this.bossHpPanelItems.forEach(item =>
      (item as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(visible)
    );
  }

  private showBossDefeated() {
    const W  = this.scale.width;
    const cy = 70 + (this.scale.height - 70 - 132) / 2;
    this.gameCam.shake(300, 0.012);

    const bg = this.add.rectangle(W / 2, cy, W, 70, 0x004400, 0.9)
      .setScrollFactor(0).setDepth(92);
    const txt = this.add.text(W / 2, cy - 10, 'BOSS DEFEATED!', {
      fontSize: '26px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#003300', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(93).setAlpha(0);
    const sub = this.add.text(W / 2, cy + 20, `${this.currentBossName ?? 'BOSS'} 처치!`, {
      fontSize: '14px', color: '#aaffaa',
      stroke: '#003300', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(93).setAlpha(0);
    this.gameCam.ignore([bg, txt, sub]);

    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1500,
      onComplete: () => txt.destroy(),
    });
    this.tweens.add({
      targets: sub,
      alpha: 1,
      duration: 200,
      delay: 100,
      yoyo: true,
      hold: 1300,
      onComplete: () => sub.destroy(),
    });
    this.tweens.add({
      targets: bg,
      alpha: 0,
      duration: 400,
      delay: 1600,
      onComplete: () => bg.destroy(),
    });
  }

  private showMilestone(message: string, color: string) {
    const W   = this.scale.width;
    const TOP_H = 70;
    const BOT_H = 132;
    const gameH = this.scale.height - TOP_H - BOT_H;
    const y = TOP_H + gameH * 0.2; // 게임 영역 상단 20% 지점

    const bg = this.add.rectangle(W / 2, y, W - 30, 30, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(88).setAlpha(0);
    const txt = this.add.text(W / 2, y, `🏆 ${message}`, {
      fontSize: '13px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(89).setAlpha(0);
    this.gameCam.ignore([bg, txt]);

    this.tweens.add({
      targets: [bg, txt],
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1200,
      onComplete: () => { bg.destroy(); txt.destroy(); },
    });
  }

  private showReviveEffect() {
    const W  = this.scale.width;
    const cy = 70 + (this.scale.height - 70 - 132) / 2;
    // 화면 전체 흰색 플래시
    const flash = this.add.rectangle(W / 2, this.scale.height / 2, W, this.scale.height, 0xffffff, 0.85)
      .setScrollFactor(0).setDepth(95);
    // 부활 메시지
    const txt = this.add.text(W / 2, cy, '부활!', {
      fontSize: '36px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#aa4400', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setAlpha(0);
    this.gameCam.ignore([flash, txt]);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 800,
      onComplete: () => txt.destroy(),
    });
    // 플레이어 무적시간 2초 부여
    this.player.startInvincible(2000);
  }

  // ===== 가상 조이스틱 =====
  private setupJoystick() {
    // 탭 비활성화 시 자동 일시정지
    this.game.events.on('hidden', () => {
      if (!this.isGameOver && !this.isLevelingUp && !this.isPaused) {
        this.pauseGame();
      }
    });

    // 키보드 일시정지 (ESC / P)
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.isGameOver || this.isLevelingUp) return;
      if (this.isPaused) this.resumeGame(); else this.pauseGame();
    });
    this.input.keyboard!.on('keydown-P', () => {
      if (this.isGameOver || this.isLevelingUp) return;
      if (this.isPaused) this.resumeGame(); else this.pauseGame();
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.isGameOver) return;
      if (p.y < this.JOY_UI_TOP || p.y > this.JOY_UI_BOT) return;
      if (this.joystickActive) return;

      this.joystickActive     = true;
      this.joystickPointerId  = p.id;
      this.joystickOriginX    = p.x;
      this.joystickOriginY    = p.y;

    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.joystickActive || p.id !== this.joystickPointerId) return;

      const dx     = p.x - this.joystickOriginX;
      const dy     = p.y - this.joystickOriginY;
      const dist   = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, this.JOY_RADIUS);
      const angle   = Math.atan2(dy, dx);

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
    };

    this.input.on('pointerup',     resetJoystick);
    this.input.on('pointercancel', resetJoystick);
  }

  // ===== UI =====
  private createUI() {
    const D = 100;
    const W = this.scale.width;
    const H = this.scale.height;

    // ── 상단 패널: 트레이너이름 / 타이머 / 레벨 / HP바 / EXP바 ──
    this.add.rectangle(W / 2, 35, W - 4, 70, 0x181810)
      .setScrollFactor(0).setDepth(D);
    this.add.rectangle(W / 2, 35, W - 8, 66, 0xd8d8c0)
      .setScrollFactor(0).setDepth(D + 1);
    this.add.rectangle(7, 35, 2, 60, 0xf0f0e0).setScrollFactor(0).setDepth(D + 2);
    this.add.rectangle(W / 2, 4, W - 12, 2, 0xf0f0e0).setScrollFactor(0).setDepth(D + 2);

    this.add.text(10, 9, '광휘', {
      fontSize: '14px', color: '#181810', fontStyle: 'bold',
      padding: { top: 4 },
    }).setScrollFactor(0).setDepth(D + 3);

    this.timerText = this.add.text(W / 2, 9, '00:00', {
      fontSize: '13px', color: '#484840',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D + 3);

    this.levelText = this.add.text(W - 46, 9, 'Lv  1', {
      fontSize: '14px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(D + 3);

    this.add.text(10, 36, 'HP', {
      fontSize: '11px', color: '#181810', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3);

    const BAR_END     = W - 46; // pause 버튼(30px) + 여백 확보
    const HP_START    = 32;
    this.hpBarMaxW    = BAR_END - HP_START;
    this.add.rectangle(HP_START + this.hpBarMaxW / 2, 36, this.hpBarMaxW + 2, 11, 0x282018)
      .setScrollFactor(0).setDepth(D + 3);
    this.hpBar = this.add.rectangle(HP_START, 36, this.hpBarMaxW, 8, 0x58c040)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 4);

    const EXP_START   = 8;
    this.expBarMaxW   = BAR_END - EXP_START;
    this.add.rectangle(EXP_START + this.expBarMaxW / 2, 55, this.expBarMaxW + 2, 7, 0x282018)
      .setScrollFactor(0).setDepth(D + 3);
    this.expBar = this.add.rectangle(EXP_START, 55, 0, 5, 0x3888e8)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 4);


    // ── 골드/웨이브/킬/콤보/보스HP 는 createHudOverlay()에서 생성 ──
    // (gameCam.ignore 이후 생성해야 gameCam이 렌더링해서 보임)

    // ── 하단 패널: 포켓몬 6칸 + 장신구 6칸 ──
    const BOT_H   = 132;
    const BOT_TOP = H - BOT_H;
    const BOT_CY  = H - BOT_H / 2;

    this.add.rectangle(W / 2, BOT_CY, W - 4, BOT_H, 0x181810)
      .setScrollFactor(0).setDepth(D);
    this.add.rectangle(W / 2, BOT_CY, W - 8, BOT_H - 4, 0xd8d8c0)
      .setScrollFactor(0).setDepth(D + 1);
    this.add.rectangle(W / 2, BOT_TOP + BOT_H / 2, W - 16, 2, 0x989880)
      .setScrollFactor(0).setDepth(D + 2);

    const SLOT_W   = 52;
    const SLOT_H   = 44;
    const SLOT_GAP = Math.floor((374 - 6 * SLOT_W) / 5);
    const SLOT_X0  = Math.round((W - (6 * SLOT_W + 5 * SLOT_GAP)) / 2) + SLOT_W / 2;

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
      // 타입 색상 바 (슬롯 하단, 처음엔 투명)
      const typeBar = this.add.rectangle(sx, ROW_P_Y + SLOT_H / 2 - 3, SLOT_W - 2, 5, 0x000000, 0)
        .setScrollFactor(0).setDepth(D + 5);
      this.pokemonSlotTypes.push(typeBar);

      const lv = this.add.text(sx + SLOT_W / 2 - 2, ROW_P_Y + SLOT_H / 2 - 1, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 6);
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
      // 타입 색상 바
      const accTypeBar = this.add.rectangle(sx, ROW_A_Y + SLOT_H / 2 - 3, SLOT_W - 2, 5, 0x000000, 0)
        .setScrollFactor(0).setDepth(D + 4);
      this.accessorySlotTypes.push(accTypeBar);

      // 타입 약자 텍스트 (슬롯 중앙)
      const accTypeName = this.add.text(sx, ROW_A_Y, '', {
        fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
      this.accessorySlotNames.push(accTypeName);

      const lv = this.add.text(sx + SLOT_W / 2 - 2, ROW_A_Y + SLOT_H / 2 - 1, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 5);
      this.accessorySlotLvs.push(lv);
    }
  }

  // ===== 일시정지 UI =====
  // ===== 개발자 모드 API (DevScene에서 호출) =====
  devAddTime() {
    this.gameTime  += 60_000;
    this.waveTimer += 60_000;
  }
  devHealPlayer() {
    this.player.stats.hp = this.player.stats.maxHp;
  }
  devLevelUp() {
    this.level++;
    this.expToNext = Math.floor(this.expToNext * 1.07);
    this.needsLevelUp = true;
  }
  devAddWeapon(pokemonId: number) {
    if (this.weapons.length >= MAX_WEAPON_SLOTS) return;
    if (this.weapons.some(w => w.pokemonId === pokemonId)) return;
    this.applyLevelUpChoice({ type: 'newPokemon', pokemonId, label: '', description: '' });
  }

  // ── gameCam.ignore 이후 생성, cameras.main에서는 ignore ──
  // gameCam 뷰포트가 screen y=70에서 시작하므로
  // raw_y = 원하는 screen_y - 70 으로 계산해야 정확한 위치에 표시됨
  private createHudOverlay() {
    const D      = 150;
    const W      = this.scale.width;
    const VP_TOP = 70;   // gameCam 뷰포트 screen y 시작

    // 골드 / 킬카운트 / 웨이브 — screen y=79 (상단 패널에서 5px 아래)
    const ROW_Y = 79 - VP_TOP;  // raw = 9
    this.goldText = this.add.text(12, ROW_Y, '★  0 G', {
      fontSize: '12px', color: '#ffd700',
      stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D);

    this.killText = this.add.text(W / 2, ROW_Y, '⚔ 0', {
      fontSize: '12px', color: '#ddaa44', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D);

    this.waveText = this.add.text(W - 8, ROW_Y, 'WAVE 0', {
      fontSize: '12px', color: '#aaaaaa', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(D);

    // 보스 HP 패널 — 골드/킬/웨이브(screen y=79, 높이~12px) 에서 5px 아래 = screen y=96
    const SCREEN_BOSS_TOP = 96;
    const BOSS_PNL_H      = 44;
    const BT = SCREEN_BOSS_TOP - VP_TOP;          // raw top = 12
    const BC = BT + BOSS_PNL_H / 2;               // raw center = 34
    const BOSS_BAR_W = W - 48;
    const BOSS_BAR_H = 12;
    const BAR_LEFT   = 24;

    const pnlBg = this.add.rectangle(W / 2, BC, W, BOSS_PNL_H, 0x0a0a0a, 0.88)
      .setScrollFactor(0).setDepth(D - 1).setVisible(false);
    const pnlBorder = this.add.rectangle(W / 2, BT + BOSS_PNL_H, W, 2, 0xdd2222, 0.6)
      .setScrollFactor(0).setDepth(D).setVisible(false);

    const bossLabel = this.add.text(24, BT + 9, '☠  BOSS', {
      fontSize: '10px', color: '#ff4444', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);

    this.bossHpNameText = this.add.text(24, BT + 9, '', {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);

    this.bossHpNumText = this.add.text(W - 24, BT + 9, '', {
      fontSize: '11px', color: '#ffbbbb',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);

    const barY = BT + 30;
    const barTrack = this.add.rectangle(BAR_LEFT + BOSS_BAR_W / 2, barY, BOSS_BAR_W + 2, BOSS_BAR_H + 4, 0x1a1a1a)
      .setScrollFactor(0).setDepth(D).setVisible(false);
    this.bossHpBarBg = this.add.rectangle(BAR_LEFT + BOSS_BAR_W / 2, barY, BOSS_BAR_W, BOSS_BAR_H, 0x550000)
      .setScrollFactor(0).setDepth(D + 1).setVisible(false);
    this.bossHpBar = this.add.rectangle(BAR_LEFT, barY, BOSS_BAR_W, BOSS_BAR_H, 0xee2222)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2).setVisible(false);

    this.bossHpPanelItems = [
      pnlBg, pnlBorder, bossLabel, barTrack,
      this.bossHpNameText, this.bossHpNumText,
      this.bossHpBarBg, this.bossHpBar,
    ];

    // cameras.main은 이 아이템들을 무시 → gameCam만 렌더링 (위치 중복 방지)
    this.cameras.main.ignore([
      this.goldText, this.killText, this.waveText,
      pnlBg, pnlBorder, bossLabel, barTrack,
      this.bossHpNameText, this.bossHpNumText,
      this.bossHpBarBg, this.bossHpBar,
    ]);
  }

  private createPauseUI() {
    const D     = 200;
    const BTN_W = 240;
    const BTN_H = 52;
    const W     = this.scale.width;
    const CX    = W / 2;
    const TOP_H = 70;
    const BOT_H = 132;
    const CY    = TOP_H + (this.scale.height - TOP_H - BOT_H) / 2 - 30; // 게임 영역 세로 중앙 (위로 올림)

    // ── 일시정지 버튼 (상단 패널 우측) ──
    const PAUSE_BTN_X  = W - 23;
    const PAUSE_BTN_Y  = 35; // 패널 세로 중앙
    const PAUSE_BTN_W  = 34;
    const PAUSE_BTN_H  = 28;

    // 외곽 다크 테두리
    const pauseBtnBorder = this.add.rectangle(PAUSE_BTN_X, PAUSE_BTN_Y, PAUSE_BTN_W + 4, PAUSE_BTN_H + 4, 0x181810)
      .setScrollFactor(0).setDepth(D + 3);
    // 버튼 배경 (파랑)
    const pauseBtn = this.add.rectangle(PAUSE_BTN_X, PAUSE_BTN_Y, PAUSE_BTN_W, PAUSE_BTN_H, 0x2255bb)
      .setScrollFactor(0).setDepth(D + 4)
      .setInteractive({ useHandCursor: true });
    // 하이라이트 (상단 밝은 선)
    const pauseHighlight = this.add.rectangle(PAUSE_BTN_X, PAUSE_BTN_Y - PAUSE_BTN_H / 2 + 2, PAUSE_BTN_W - 4, 2, 0xaabbff, 0.7)
      .setScrollFactor(0).setDepth(D + 5);
    const pauseIcon = this.add.text(PAUSE_BTN_X, PAUSE_BTN_Y + 1, '⏸', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 5);

    this.gameCam.ignore([pauseBtnBorder, pauseBtn, pauseHighlight, pauseIcon]);

    pauseBtn.on('pointerover', () => pauseBtn.setFillStyle(0x3366cc));
    pauseBtn.on('pointerout',  () => pauseBtn.setFillStyle(0x2255bb));
    pauseBtn.on('pointerdown', () => {
      pauseBtn.setFillStyle(0x1144aa);
      if (!this.isLevelingUp) this.pauseGame();
    });
    pauseBtn.on('pointerup', () => pauseBtn.setFillStyle(0x3366cc));

    // ── 일시정지 오버레이 (처음엔 숨김) ──
    this.pauseOverlayItems = [];

    const addOverlay = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      (obj as any).setScrollFactor(0).setDepth(D + 2).setVisible(false);
      this.pauseOverlayItems.push(obj);
      return obj;
    };

    // 패널 크기: 화면 폭 거의 풀로 사용
    const PW  = W - 24;          // 패널 너비 (좌우 12px 여백)
    const PH  = 530;             // 패널 높이 (버튼 나란히 배치)
    const PL  = CX - PW / 2;    // 패널 왼쪽 x
    const PT  = CY - PH / 2;    // 패널 위쪽 y

    // 어두운 배경 (전체 화면 덮음 — 입력 차단)
    addOverlay(
      this.add.rectangle(CX, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.75)
        .setInteractive()
    );

    // 패널
    addOverlay(this.add.rectangle(CX, CY, PW, PH, 0x181820));
    addOverlay(this.add.rectangle(CX, CY, PW - 4, PH - 4, 0x23233a));

    // ── 헤더 ──
    const HEADER_Y = PT + 32;
    addOverlay(
      this.add.text(CX, HEADER_Y, '⏸  일시정지', {
        fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
        padding: { top: 6 },
      }).setOrigin(0.5)
    );
    addOverlay(this.add.rectangle(CX, PT + 54, PW - 20, 1, 0x555570));

    // ── 스탯 격자 (2컬럼 × 4행) ──
    const GRID_TOP  = PT + 64;   // 격자 시작 y
    const CELL_H    = 52;        // 셀 높이
    const CELL_W    = (PW - 20) / 2;  // 셀 너비 (좌우 10px 패딩)
    const COL_L     = PL + 10;        // 왼쪽 컬럼 시작 x
    const COL_R     = CX + 1;         // 오른쪽 컬럼 시작 x

    // 격자 외곽 테두리
    addOverlay(
      this.add.graphics()
        .lineStyle(1, 0x444466)
        .strokeRect(COL_L, GRID_TOP, PW - 20, CELL_H * 4)
    );
    // 세로 중앙선
    addOverlay(
      this.add.graphics()
        .lineStyle(1, 0x444466)
        .lineBetween(CX, GRID_TOP, CX, GRID_TOP + CELL_H * 4)
    );
    // 가로 구분선 (행 사이)
    for (let r = 1; r < 4; r++) {
      addOverlay(
        this.add.graphics()
          .lineStyle(1, 0x444466)
          .lineBetween(COL_L, GRID_TOP + r * CELL_H, COL_L + PW - 20, GRID_TOP + r * CELL_H)
      );
    }

    // 셀 데이터: [row, col, 라벨, 값 함수]
    const cells: Array<[number, number, string, () => string]> = [
      [0, 0, 'HP',        () => `${this.player.stats.hp} / ${this.player.stats.maxHp}`],
      [0, 1, '공격력',    () => `${this.player.stats.attackPower}`],
      [1, 0, '방어',      () => `${this.player.stats.defense}`],
      [1, 1, '이동속도',  () => `${this.player.stats.moveSpeed}`],
      [2, 0, '치명타확률', () => `${Math.round(this.player.stats.critChance * 100)}%`],
      [2, 1, '회피율',    () => `${Math.round(this.player.stats.evasion * 100)}%`],
      [3, 0, '쿨다운 감소', () => `-${Math.round(this.player.stats.cooldownReduction * 100)}%`],
      [3, 1, '투사체 수', () => `${this.player.stats.projectileCount}`],
    ];

    const statValueTexts: Array<{ text: Phaser.GameObjects.Text; fn: () => string }> = [];

    cells.forEach(([row, col, label, fn]) => {
      const cellX = col === 0 ? COL_L : COL_R;
      const cellY = GRID_TOP + row * CELL_H;
      const cellCX = cellX + CELL_W / 2;

      // 셀 라벨 (상단 중앙, 작은 회색)
      const lbl = this.add.text(cellCX, cellY + 12, label, {
        fontSize: '11px', color: '#8888aa',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      this.pauseOverlayItems.push(lbl);

      // 셀 값 (하단 중앙, 큰 흰색)
      const val = this.add.text(cellCX, cellY + 34, fn(), {
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      this.pauseOverlayItems.push(val);
      statValueTexts.push({ text: val, fn });
    });

    // ── 장착 포켓몬 슬롯 섹션 ──
    const POKE_TOP    = GRID_TOP + CELL_H * 4 + 14;
    const POKE_SLOT_W = 50;
    const POKE_SLOT_H = 54;
    const POKE_GAP    = Math.floor((PW - 20 - 6 * POKE_SLOT_W) / 5);
    const POKE_X0     = COL_L + POKE_SLOT_W / 2;

    addOverlay(
      this.add.text(COL_L, POKE_TOP + 12, '장착 포켓몬', {
        fontSize: '11px', color: '#8888aa',
      }).setOrigin(0, 0.5)
    );
    addOverlay(this.add.graphics().lineStyle(1, 0x444466)
      .lineBetween(COL_L, POKE_TOP + 22, COL_L + PW - 20, POKE_TOP + 22));

    // 포켓몬 슬롯 6개 (클릭 → 무기 팝업)
    const pausePokeSlotImgs:  Phaser.GameObjects.Image[]     = [];
    const pausePokeSlotLvs:   Phaser.GameObjects.Text[]      = [];
    const pausePokeSlotBgs:   Phaser.GameObjects.Rectangle[] = [];
    const pausePokeSlotTypes: Phaser.GameObjects.Rectangle[] = [];

    for (let i = 0; i < 6; i++) {
      const sx = POKE_X0 + i * (POKE_SLOT_W + POKE_GAP);
      const sy = POKE_TOP + 28 + POKE_SLOT_H / 2;

      addOverlay(this.add.rectangle(sx, sy, POKE_SLOT_W, POKE_SLOT_H, 0x181810));

      const slotBg = this.add.rectangle(sx, sy, POKE_SLOT_W - 2, POKE_SLOT_H - 2, 0x2a3040)
        .setScrollFactor(0).setDepth(D + 3).setVisible(false)
        .setInteractive({ useHandCursor: true });
      const capturedIdx = i;
      slotBg.on('pointerdown', () => {
        if (this.weapons[capturedIdx]) this.showWeaponPopup(capturedIdx);
      });
      slotBg.on('pointerover', () => { if (this.weapons[capturedIdx]) slotBg.setFillStyle(0x3a4a60); });
      slotBg.on('pointerout',  () => slotBg.setFillStyle(
        this.weapons[capturedIdx] ? 0x2a3a50 : 0x2a3040
      ));
      pausePokeSlotBgs.push(slotBg);
      this.pauseOverlayItems.push(slotBg);

      const img = this.add.image(sx, sy - 4, 'pokemon_001')
        .setDisplaySize(36, 36).setScrollFactor(0).setDepth(D + 4).setVisible(false);
      pausePokeSlotImgs.push(img);
      this.pauseOverlayItems.push(img);

      const typeBar = this.add.rectangle(sx, sy + POKE_SLOT_H / 2 - 3, POKE_SLOT_W - 2, 4, 0x000000, 0)
        .setScrollFactor(0).setDepth(D + 5).setVisible(false);
      pausePokeSlotTypes.push(typeBar);
      this.pauseOverlayItems.push(typeBar);

      const lv = this.add.text(sx + POKE_SLOT_W / 2 - 2, sy + POKE_SLOT_H / 2 - 2, '', {
        fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(D + 5).setVisible(false);
      pausePokeSlotLvs.push(lv);
      this.pauseOverlayItems.push(lv);
    }

    // ── 딜 섹션 (슬롯 1~3 왼쪽, 4~6 오른쪽) ──
    const DMG_TOP = POKE_TOP + 28 + POKE_SLOT_H + 12;

    addOverlay(this.add.text(COL_L, DMG_TOP + 10, '무기 DPS', {
      fontSize: '11px', color: '#8888aa',
    }).setOrigin(0, 0.5));
    addOverlay(this.add.graphics().lineStyle(1, 0x444466)
      .lineBetween(COL_L, DMG_TOP + 20, COL_L + PW - 20, DMG_TOP + 20));
    // 세로 중앙 구분선
    addOverlay(this.add.graphics().lineStyle(1, 0x444466)
      .lineBetween(CX, DMG_TOP + 20, CX, DMG_TOP + 20 + 3 * 22 + 4));

    // 6슬롯 × 2텍스트(이름/딜)
    const dpsNameTexts: Phaser.GameObjects.Text[] = [];
    const dpsDmgTexts:  Phaser.GameObjects.Text[] = [];
    const RIGHT_END_X = COL_L + PW - 20;

    for (let i = 0; i < 6; i++) {
      const col  = i < 3 ? 0 : 1;
      const row  = i % 3;
      const ry   = DMG_TOP + 32 + row * 22;
      const nameX = col === 0 ? COL_L  : CX + 4;
      const dpsX  = col === 0 ? CX - 4 : RIGHT_END_X;

      const nameTxt = this.add.text(nameX, ry, '', {
        fontSize: '12px', color: '#aaaacc',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      dpsNameTexts.push(nameTxt);
      this.pauseOverlayItems.push(nameTxt);

      const dpsTxt = this.add.text(dpsX, ry, '', {
        fontSize: '12px', color: '#eeeeff', fontStyle: 'bold',
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
      dpsDmgTexts.push(dpsTxt);
      this.pauseOverlayItems.push(dpsTxt);
    }

    // ── 버튼 섹션 (나란히 배치) ──
    const BTN_TOP  = DMG_TOP + 30 + 3 * 20 + 8;
    const BTN_H2   = 48;
    const BTN_GAP  = 8;
    const BTN_W2   = (PW - 20 - BTN_GAP) / 2;
    const BTN_Y    = BTN_TOP + BTN_H2 / 2;
    const resumeX  = COL_L + BTN_W2 / 2;
    const titleX   = COL_L + BTN_W2 + BTN_GAP + BTN_W2 / 2;

    // 계속하기 버튼
    const resumeBg = this.add.rectangle(resumeX, BTN_Y, BTN_W2, BTN_H2, 0xeeeee0)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.pauseOverlayItems.push(resumeBg);
    const resumeTxt = this.add.text(resumeX, BTN_Y, '▶  계속하기', {
      fontSize: '16px', color: '#181810', fontStyle: 'bold',
      padding: { top: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
    this.pauseOverlayItems.push(resumeTxt);

    resumeBg.on('pointerover',  () => { resumeBg.setFillStyle(0xd8d8c8); resumeTxt.setStyle({ color: '#003399', fontSize: '16px', fontStyle: 'bold' }); });
    resumeBg.on('pointerout',   () => { resumeBg.setFillStyle(0xeeeee0); resumeTxt.setStyle({ color: '#181810', fontSize: '16px', fontStyle: 'bold' }); });
    resumeBg.on('pointerdown',  () => this.resumeGame());

    // 메인으로 버튼
    const titleBg = this.add.rectangle(titleX, BTN_Y, BTN_W2, BTN_H2, 0xeeeee0)
      .setScrollFactor(0).setDepth(D + 2).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.pauseOverlayItems.push(titleBg);
    const titleTxt = this.add.text(titleX, BTN_Y, '⌂  메인으로', {
      fontSize: '16px', color: '#181810', fontStyle: 'bold',
      padding: { top: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3).setVisible(false);
    this.pauseOverlayItems.push(titleTxt);

    titleBg.on('pointerover',  () => { titleBg.setFillStyle(0xd8d8c8); titleTxt.setStyle({ color: '#003399', fontSize: '16px', fontStyle: 'bold' }); });
    titleBg.on('pointerout',   () => { titleBg.setFillStyle(0xeeeee0); titleTxt.setStyle({ color: '#181810', fontSize: '16px', fontStyle: 'bold' }); });
    titleBg.on('pointerdown',  () => {
      const prevTotal = parseInt(localStorage.getItem('totalGold') ?? '0', 10);
      localStorage.setItem('totalGold', String(prevTotal + this.gold));
      this.scene.start('TitleScene');
    });

    // 일시정지 열릴 때 스탯 + 슬롯 + 딜 순위 갱신
    this.events.on('pause-opened', () => {
      statValueTexts.forEach(({ text, fn }) => text.setText(fn()));

      // 슬롯별 DPS 갱신 (1~6)
      for (let i = 0; i < 6; i++) {
        const w = this.weapons[i];
        if (w) {
          const dmg = this.weaponDamageLog.get(w.name) ?? 0;
          dpsNameTexts[i].setText(`${i + 1}. ${w.name}`);
          dpsDmgTexts[i].setText(dmg.toLocaleString());
        } else {
          dpsNameTexts[i].setText(`${i + 1}. —`);
          dpsDmgTexts[i].setText('');
        }
      }

      for (let i = 0; i < 6; i++) {
        const w = this.weapons[i];
        if (w) {
          const sprKey = `pokemon_${String(w.pokemonId).padStart(3, '0')}`;
          pausePokeSlotBgs[i].setFillStyle(0x2a3a50);
          pausePokeSlotImgs[i].setTexture(sprKey).setVisible(true);
          pausePokeSlotTypes[i].setFillStyle(TYPE_COLORS[w.type] ?? 0x888888, 1);
          pausePokeSlotLvs[i].setText(`Lv${this.weaponLevels[i] ?? 1}`);
        } else {
          pausePokeSlotBgs[i].setFillStyle(0x2a3040);
          pausePokeSlotImgs[i].setVisible(false);
          pausePokeSlotTypes[i].setFillStyle(0x000000, 0);
          pausePokeSlotLvs[i].setText('');
        }
      }
    });
  }

  private pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    this.joystickActive = false;
    this.joystickDx     = 0;
    this.joystickDy     = 0;
    // 오버레이 표시
    this.pauseOverlayItems.forEach(obj => (obj as any).setVisible(true));
    this.events.emit('pause-opened');
    // BGM 일시정지
    this.sound.get('bgm_game')?.pause();
  }

  private resumeGame() {
    this.closeWeaponPopup();
    this.isPaused = false;
    this.physics.resume();
    // 오버레이 숨김
    this.pauseOverlayItems.forEach(obj => (obj as any).setVisible(false));
    // BGM 재개
    this.sound.get('bgm_game')?.resume();
  }

  private startHpLowPulse() {
    if (this.hpLowPulsing) return;
    this.hpLowPulsing = true;
    this.tweens.add({
      targets: this.hpBar,
      alpha: 0.35,
      duration: 350,
      yoyo: true,
      repeat: -1,
      key: 'hp-pulse',
    });
  }

  private stopHpLowPulse() {
    if (!this.hpLowPulsing) return;
    this.hpLowPulsing = false;
    this.tweens.killTweensOf(this.hpBar);
    this.hpBar.setAlpha(1);
  }

  private updateUI() {
    const hpRatio = Math.max(0, this.player.stats.hp / this.player.stats.maxHp);
    this.hpBar.width = this.hpBarMaxW * hpRatio;

    if      (hpRatio > 0.5) { this.hpBar.setFillStyle(0x58c040); this.stopHpLowPulse(); }
    else if (hpRatio > 0.2) { this.hpBar.setFillStyle(0xd8b000); this.stopHpLowPulse(); }
    else                    { this.hpBar.setFillStyle(0xd01818); this.startHpLowPulse(); }

    this.expBar.width = this.expBarMaxW * (this.exp / this.expToNext);

    // 웨이브 진행 바: 꽉 찼다가 0으로 (남은 시간 비율)

    const totalSec = Math.floor(this.gameTime / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    this.timerText.setText(`${min}:${sec}`);

    this.levelText.setText(`Lv  ${this.level}`);
    this.goldText.setText(`★  ${this.gold} G`);
    this.waveText.setText(`WAVE ${this.waveNumber + 1}`);
    this.killText.setText(`⚔ ${this.killCount}`);

    if (this.currentBoss?.active) {
      const ratio = this.currentBoss.hp / this.currentBoss.maxHp;
      // 부드러운 HP 바 감소 (보간)
      this.bossHpRatioDisplayed = Phaser.Math.Linear(this.bossHpRatioDisplayed, ratio, 0.12);
      const BOSS_BAR_FULL = this.scale.width - 48;
      this.bossHpBar.width = BOSS_BAR_FULL * this.bossHpRatioDisplayed;
      // 보스 HP 낮을 때 색상 변화
      const barColor = ratio < 0.3 ? 0xff6600 : ratio < 0.6 ? 0xdd8800 : 0xee2222;
      this.bossHpBar.setFillStyle(barColor);
      this.bossHpNameText.setText(this.currentBossName);
      this.bossHpNumText.setText(`${this.currentBoss.hp.toLocaleString()} / ${this.currentBoss.maxHp.toLocaleString()}`);
      this.updateBossArrow();
    } else {
      this.bossArrow.setVisible(false);
    }
  }

  private updateBossArrow() {
    const boss = this.currentBoss;
    if (!boss?.active) { this.bossArrow.setVisible(false); return; }

    // 보스가 gameCam 뷰포트 안에 있으면 화살표 숨김
    const camLeft   = this.gameCam.scrollX;
    const camTop    = this.gameCam.scrollY;
    const camRight  = camLeft + this.gameCam.width;
    const camBottom = camTop  + this.gameCam.height;
    if (boss.x >= camLeft && boss.x <= camRight && boss.y >= camTop && boss.y <= camBottom) {
      this.bossArrow.setVisible(false);
      return;
    }

    // 화면 중심에서 보스 방향 각도
    const cx    = this.scale.width  / 2;
    const cy    = this.scale.height / 2;
    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, boss.x, boss.y
    );

    // 화면 테두리에 화살표 위치
    const margin = 28;
    const TOP_H  = 70;
    const BOT_H  = 132;
    const minY   = TOP_H  + margin;
    const maxY   = this.scale.height - BOT_H - margin;
    const minX   = margin;
    const maxX   = this.scale.width  - margin;

    // 각도로 테두리 교차점 계산
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let ax: number, ay: number;
    if (Math.abs(cos) > 1e-6) {
      const tx = cos > 0 ? maxX : minX;
      const t  = (tx - cx) / cos;
      ay = cy + sin * t;
      if (ay >= minY && ay <= maxY) {
        ax = tx; ay = Phaser.Math.Clamp(ay, minY, maxY);
      } else {
        const ty = sin > 0 ? maxY : minY;
        const t2 = (ty - cy) / (sin || 1e-6);
        ax = Phaser.Math.Clamp(cx + cos * t2, minX, maxX);
        ay = ty;
      }
    } else {
      ay = sin > 0 ? maxY : minY;
      ax = Phaser.Math.Clamp(cx, minX, maxX);
    }

    this.bossArrow.setPosition(ax, ay);
    this.bossArrow.setRotation(angle - Math.PI / 2);
    this.bossArrow.setVisible(true);
  }
}
