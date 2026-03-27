import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { ExpOrb } from '../entities/ExpOrb';
import { TOP_H, BOT_H, MAP_SCALE, MAX_ENEMIES } from '../constants/layout';
import { TYPE_KR } from '../constants/typeLabels';
import { getBgmVolume } from '../lib/storage';
import { GameHud } from '../ui/GameHud';
import { PauseOverlay } from '../ui/PauseOverlay';
import { WeaponSystem } from '../systems/WeaponSystem';
import { PokeballSystem } from '../systems/PokeballSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { BossPatternSystem } from '../systems/BossPatternSystem';
import {
  showWaveAnnouncement,
  showBossDefeated, showMilestone, showReviveEffect,
} from '../ui/Announcements';
import {
  generateLevelUpOptions, applyPassiveBonus,
} from '../lib/progressionUtils';
import {
  TYPE_COLORS,
  ALL_WEAPONS, MAX_WEAPON_SLOTS,
  getWeaponByPokemonId, getUpgradedWeapon,
  type WeaponConfig,
} from '../data/weapons';
import { applyPermanentUpgrades } from '../data/upgrades';
import type { LevelUpOption, PokemonType } from '../types';
import { IS_DEV_MODE } from '../main';
import { clearStage } from '../lib/stageProgress';
import { recordDefeatedId } from '../data/pokedex';
import { getCurrentUser } from '../lib/auth';
import { pushLocalToCloud } from '../lib/userDB';


// 스테이지별 BGM 키
const STAGE_BGM: Record<number, string> = {
   1: 'bgm_stage_1',   // Pallet Town
   2: 'bgm_stage_2',   // Viridian Forest
   3: 'bgm_stage_3',   // Route 24
   4: 'bgm_stage_4',   // Cinnabar Island
   5: 'bgm_stage_5',   // Surf
   6: 'bgm_stage_6',   // Pokémon Gym
   7: 'bgm_stage_7',   // Route 3
   8: 'bgm_stage_8',   // Rocket Hideout
   9: 'bgm_stage_9',   // Mt. Moon
  10: 'bgm_stage_10',  // Victory Road
  11: 'bgm_stage_11',  // Route 11
  12: 'bgm_stage_12',  // Lavender Town
  13: 'bgm_stage_13',  // Pokémon Tower
  14: 'bgm_stage_14',  // Silph Co.
  15: 'bgm_stage_15',  // Battle! (Legendary)
  16: 'bgm_stage_16',  // S.S. Anne
  17: 'bgm_stage_17',  // Pokémon Mansion
};

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
  private activeEnemyCount: number = 0;
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

  // BGM
  private stageBgmKey: string = '';
  private bossBgmActive: boolean = false;

  // 일시정지
  private isPaused: boolean = false;

  // UI 시스템
  private hud!: GameHud;
  private pauseOverlay!: PauseOverlay;
  // 시스템
  private weaponSystem!: WeaponSystem;
  private pokeballSystem!: PokeballSystem;
  private spawnSystem!: SpawnSystem;
  private bossPatternSystem!: BossPatternSystem;

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
  private joyBase!:  Phaser.GameObjects.Graphics;
  private joyStick!: Phaser.GameObjects.Graphics;

  // 웨이브
  private waveTimer: number = 0;
  private waveNumber: number = 0;
  private spawnTimer: number = 0;
  private eliteTimer: number = 0;
  // MAX_ENEMIES는 constants/layout.ts 에서 import
  private darkraiSpawned: boolean = false;
  private stageCleared: boolean = false;
  isGodMode: boolean = false;
  private currentBossWave: number = 0;         // 10 or 20

  // 콤보
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private maxCombo:   number = 0;
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
  private currentBoss: Enemy | null = null;
  private currentBossName: string = '';
  private enemyHpGraphics!: Phaser.GameObjects.Graphics;

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
    this.killCount          = 0;
    this.activeEnemyCount   = 0;
    this.isGameOver         = false;
    this.waveTimer      = 0;
    this.waveNumber     = 0;
    this.spawnTimer     = 0;
    this.eliteTimer     = 0;
    this.darkraiSpawned   = false;
    this.stageCleared     = false;
    this.currentBoss = null;
    this.comboCount   = 0;
    this.comboTimer   = 0;
    this.maxCombo     = 0;
    this.reachedKillMilestones = new Set();
    this.reachedLevelMilestones = new Set();
    this.weapons      = [];
    this.weaponLevels    = [];
    this.equippedPassives = new Map();
    // 시스템 정리 (재시작 시)
    this.weaponSystem?.reset();
    this.pokeballSystem?.reset();
    this.bossPatternSystem?.reset();

    this.isLevelingUp = false;
    this.needsLevelUp = false;
    this.isPaused     = false;

    // 조이스틱 상태 초기화
    this.joystickActive     = false;
    this.joystickPointerId  = -1;
    this.joystickDx         = 0;
    this.joystickDy         = 0;


    // physics가 이전 게임오버로 pause됐을 수 있으므로 resume
    this.physics.resume();

    this.createProjectileTextures();

    // 배경 (이미지를 스케일 업해서 전체 맵으로 사용)
    const stage1Frame = this.textures.get('stage1').get();
    this.worldW = stage1Frame.realWidth * MAP_SCALE;
    this.worldH = stage1Frame.realHeight * MAP_SCALE;
    this.JOY_UI_BOT = this.scale.height - BOT_H;
    this.bgImage = this.add.image(0, 0, 'stage1').setOrigin(0, 0).setScale(MAP_SCALE);

    // 플레이어
    this.player = new Player(this, this.worldW / 2, this.worldH / 2);

    // 그룹
    this.enemies    = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group({
      classType: Projectile,
      maxSize: 300,
      runChildUpdate: false,
    });

    // 물리 월드 경계
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // 시작 무기: 캐릭터 선택에서 전달된 weaponIndex (기본 0 = 이상해씨)
    const weaponIndex = data?.weaponIndex ?? 0;
    const startWeapon = ALL_WEAPONS[weaponIndex] ?? ALL_WEAPONS[0];
    this.weapons      = [getUpgradedWeapon(startWeapon, 1)];
    this.weaponLevels = [1];

    // 영구 업그레이드 스탯 적용
    applyPermanentUpgrades(this.player.stats);

    // UI 생성 전 월드 오브젝트 수 스냅샷
    const worldObjCount = this.children.list.length;
    // gameCam은 아직 생성 전이므로 임시 placeholder — 카메라 설정 후 hud/pauseOverlay에 실제 gameCam 전달
    this.gameCam = this.cameras.add(0, TOP_H, this.scale.width, this.scale.height - TOP_H - BOT_H);
    this.hud = new GameHud(this, this.gameCam);
    this.weaponSystem = new WeaponSystem({
      scene:         this,
      player:        this.player,
      enemies:       this.enemies as Phaser.Physics.Arcade.Group,
      projectiles:   this.projectiles as Phaser.Physics.Arcade.Group,
      onEnemyKilled: (enemy) => this.onEnemyDeath(enemy),
    });
    this.pokeballSystem = new PokeballSystem({
      scene:              this,
      gameCam:            this.gameCam,
      player:             this.player,
      getWeapons:         () => this.weapons,
      getWeaponLevels:    () => this.weaponLevels,
      getEquippedPassives: () => this.equippedPassives,
      addGold:            (amount) => { this.gold += amount; },
      onSlotsChanged:     () => this.hud.updateSlots(this.weapons, this.weaponLevels, this.equippedPassives),
      onPause:            () => { this.isPaused = true; this.physics.pause(); },
      onResume:           (fromEvolution) => {
        if (fromEvolution) {
          this.sound.stopByKey('bgm_evolution');
          this.playBgm(this.bossBgmActive ? 'bgm_boss' : this.stageBgmKey);
        } else {
          const bgmKey = this.bossBgmActive ? 'bgm_boss' : this.stageBgmKey;
          const snd = this.sound.get(bgmKey);
          if (snd?.isPaused) snd.resume();
          else if (!snd?.isPlaying) this.playBgm(bgmKey);
        }
        this.isPaused = false;
        this.physics.resume();
      },
    });
    this.spawnSystem = new SpawnSystem({
      scene:         this,
      gameCam:       this.gameCam,
      enemies:       this.enemies as Phaser.Physics.Arcade.Group,
      getStageId:    () => this.stageId,
      getPlayer:     () => this.player,
      getWorldW:     () => this.worldW,
      getWorldH:     () => this.worldH,
      onBossSpawned: (boss, name, wave) => {
        this.currentBoss     = boss;
        this.currentBossName = name;
        this.currentBossWave = wave;
        this.hud.resetBossHpRatio();
        this.hud.setBossPanelVisible(true);
        this.startBossBgm();
      },
      onDarkraiPhase: () => {
        this.darkraiSpawned   = true;
        this.stageCleared     = true;
        this.activeEnemyCount = 0;
        clearStage(this.stageId);
      },
      onDarkraiSpawned: (darkrai) => {
        this.currentBoss     = darkrai;
        this.currentBossName = '다크라이';
        this.hud.resetBossHpRatio();
        this.hud.setBossPanelVisible(true);
      },
      onEnemySpawned: () => { this.activeEnemyCount++; },
    });
    this.bossPatternSystem = new BossPatternSystem({
      scene:          this,
      getCurrentBoss: () => this.currentBoss,
      getPlayer:      () => this.player,
      getWaveNumber:  () => this.waveNumber,
    });
    this.pauseOverlay = new PauseOverlay(this, this.gameCam, {
      onResume:          () => this.resumeGame(),
      onQuit:            () => { this.saveResults(); this.scene.start('TitleScene'); },
      onViewMatchup:     () => this.scene.launch('TypeMatchupScene', { caller: 'GameScene' }),
      onShowWeaponPopup: (idx) => this.pauseOverlay.showWeaponPopup(idx, this.weapons[idx]!, this.weaponLevels[idx] ?? 1),
      getWeapon:         (idx) => this.weapons[idx],
      getWeaponLevel:    (idx) => this.weaponLevels[idx] ?? 1,
    });
    this.hud.createUI();
    this.hud.updateSlots(this.weapons, this.weaponLevels, this.equippedPassives);
    this.setupJoystick();

    // 카메라 설정 (TOP_H, BOT_H는 constants/layout.ts)
    // cameras.main: 전체 화면, UI 전용 (고정, 스크롤 없음)
    this.cameras.main.ignore([this.bgImage, this.player]);
    // gameCam: 게임 영역 뷰포트, 월드 렌더링, 플레이어 추적
    this.gameCam.setBounds(0, 0, this.worldW, this.worldH);
    this.gameCam.startFollow(this.player, true, 0.1, 0.1);
    this.gameCam.ignore(this.children.list.slice(worldObjCount));

    // gameCam.ignore 이후 생성 → gameCam이 렌더링 → 게임 영역(y=70~712)에서도 보임
    this.hud.createHudOverlay();   // 골드/웨이브/킬/콤보/보스HP
    this.pauseOverlay.create(() => { if (!this.isLevelingUp) this.pauseGame(); }); // 일시정지 오버레이

    // 가상 조이스틱 그래픽 (cameras.main에서만 렌더링)
    this.joyBase  = this.add.graphics();
    this.joyStick = this.add.graphics();
    this.gameCam.ignore([this.joyBase, this.joyStick]);
    this.drawJoystickGraphics();
    this.joyBase.setVisible(false);
    this.joyStick.setVisible(false);

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

    // 충돌 설정
    // 적끼리 하드 충돌 없음 → update 루프에서 소프트 분리력 적용

    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (p, e) => this.weaponSystem.onProjectileHitEnemy(p, e)
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
      if ((w.behavior ?? 'projectile') === 'orbit') this.weaponSystem.createOrbitOrbs(w, idx);
    });

    // 게임 시작 (캐릭터 선택은 CharacterSelectScene에서 완료)
    this.spawnSystem.spawnWave(this.waveNumber);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.gameCam.fadeIn(400, 0, 0, 0);

    // BGM
    this.sound.setMute(localStorage.getItem('bgmMuted') === '1');
    this.stageBgmKey = STAGE_BGM[this.stageId] ?? 'bgm_stage_1';
    this.bossBgmActive = false;
    this.playBgm(this.stageBgmKey);

    // 씬 종료 시 정리
    this.events.once('shutdown', () => {
      this.sound.stopAll();
      this.weaponSystem?.reset();
      this.pokeballSystem?.reset();
      this.bossPatternSystem?.reset();
    });
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
      if (this.isGodMode) {
        this.player.heal(this.player.stats.maxHp);
      } else if (this.player.stats.revives > 0) {
        this.player.stats.revives--;
        this.player.heal(Math.floor(this.player.stats.maxHp * 0.4));
        showReviveEffect(this, this.gameCam, this.player);
      } else if (this.darkraiSpawned) {
        this.showDarkraiDeathOverlay();
        return;
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

    this.weaponSystem.update(delta, this.weapons);
    this.bossPatternSystem.update(delta);
    this.applySeparation();
    this.renderEnemyHpBars();
    this.updateCombo(delta);
    this.pokeballSystem.checkAndPickup();
    this.pokeballSystem.updateArrows();

    if (!this.darkraiSpawned && this.waveTimer >= 30000) {
      this.waveTimer -= 30000;
      this.waveNumber++;
      this.spawnSystem.spawnWave(this.waveNumber);
      showWaveAnnouncement(this, this.gameCam, this.waveNumber);
      this.cameras.main.flash(300, 255, 255, 255, false);
    }

    // 꾸준한 일반 몹 스폰 (다크라이 페이즈 이후 중단)
    if (!this.darkraiSpawned) {
      this.spawnTimer += delta;
      const spawnInterval = Math.max(600, 2800 - this.waveNumber * 120);
      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer -= spawnInterval;
        if (this.activeEnemyCount < MAX_ENEMIES) {
          this.spawnSystem.spawnEnemy(this.waveNumber);
        }
      }

      // 엘리트 1분에 1마리 (보스 웨이브 제외)
      const isBossActive = this.waveNumber === 10 || this.waveNumber === 20;
      this.eliteTimer += delta;
      if (this.eliteTimer >= 60000 && this.waveNumber >= 1 && !isBossActive) {
        this.eliteTimer -= 60000;
        this.spawnSystem.spawnElite(this.waveNumber);
      }
    }

    this.hud.update({
      hp: this.player.stats.hp,
      maxHp: this.player.stats.maxHp,
      exp: this.exp,
      expToNext: this.expToNext,
      gameTime: this.gameTime,
      level: this.level,
      gold: this.gold,
      stageId: this.stageId,
      waveNumber: this.waveNumber,
      killCount: this.killCount,
      bossActive: !!this.currentBoss?.active,
      bossHp: this.currentBoss?.hp ?? 0,
      bossMaxHp: this.currentBoss?.maxHp ?? 1,
      bossName: this.currentBossName,
      darkraiSpawned: this.darkraiSpawned,
      playerX: this.player.x,
      playerY: this.player.y,
      bossX: this.currentBoss?.x ?? 0,
      bossY: this.currentBoss?.y ?? 0,
    });
  }

  // ===== 투사체 / 구슬 텍스처 생성 =====
  private createProjectileTextures() {
    const size   = 20;
    const c      = size / 2;

    Object.entries(TYPE_COLORS).forEach(([type, color]) => {
      const key = `proj_${type}`;
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      // 외곽 글로우
      g.fillStyle(color, 0.18);
      g.fillCircle(c, c, c);
      // 중간 레이어
      g.fillStyle(color, 0.55);
      g.fillCircle(c, c, c * 0.65);
      // 밝은 코어
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(c, c, c * 0.35);
      // 타입 색 코어
      g.fillStyle(color, 0.9);
      g.fillCircle(c, c, c * 0.25);
      g.generateTexture(key, size, size);
      g.destroy();
    });

    // 파티클 도트 텍스처 (이팩트용 소형 흰색 원)
    if (!this.textures.exists('particle_dot')) {
      const ps = 8, pc = ps / 2;
      const pg = this.make.graphics({ x: 0, y: 0 }, false);
      pg.fillStyle(0xffffff, 0.9);
      pg.fillCircle(pc, pc, pc);
      pg.fillStyle(0xffffff, 0.5);
      pg.fillCircle(pc, pc, pc * 0.5);
      pg.generateTexture('particle_dot', ps, ps);
      pg.destroy();
    }

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

  private onPlayerHitEnemy(_player: any, _enemy: any) {
    const player = _player as Player;
    const enemy  = _enemy as Enemy;
    const dmg    = enemy.contactDamage ?? Math.round(3 + this.waveNumber * 1.5 + this.waveNumber * this.waveNumber * 0.1);
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

    // 엘리트 처치 알림 + 몬스터볼 드롭
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
      this.pokeballSystem.spawn(enemy.x, enemy.y, 'pokeball', 1);
    }

    this.killCount++;
    this.activeEnemyCount = Math.max(0, this.activeEnemyCount - 1);
    // 도감 처치 기록
    const texKey = enemy.texture.key; // e.g. 'pokemon_025'
    if (texKey.startsWith('pokemon_')) {
      recordDefeatedId(texKey.replace('pokemon_', ''));
    }
    if (!enemy.isElite && !enemy.isBoss) {
      this.gold += Math.ceil(enemy.goldValue * this.player.stats.goldGain);
    }
    this.addComboKill();
    // 처치 마일스톤
    for (const m of this.KILL_MILESTONES) {
      if (this.killCount >= m && !this.reachedKillMilestones.has(m)) {
        this.reachedKillMilestones.add(m);
        showMilestone(this, this.gameCam, `${m}마리 처치 달성!`, '#88ffcc');
        break;
      }
    }

    if (enemy.isBoss && this.currentBoss === enemy) {
      this.currentBoss = null;
      this.bossPatternSystem.reset();
      this.hud.setBossPanelVisible(false);
      this.hud.bossArrow.setVisible(false);
      showBossDefeated(this, this.gameCam, this.currentBossName);
      // 5분/10분 보스 처치 → 스테이지 BGM 복귀
      if (this.currentBossWave === 10) {
        this.pokeballSystem.spawn(enemy.x, enemy.y, 'superball', 1);
        this.stopBossBgm();
      } else if (this.currentBossWave === 20) {
        this.pokeballSystem.spawn(enemy.x, enemy.y, 'hyperball', 1);
        this.stopBossBgm();
      } else if (this.darkraiSpawned) {
        // 다크라이 처치 → 스테이지 클리어 (bgm은 triggerGameOver에서 처리)
        this.time.delayedCall(2500, () => this.triggerGameOver());
      }
    }

    // 경험치 구슬 스폰 (엘리트/보스는 몬스터볼로 대체)
    if (!enemy.isElite && !enemy.isBoss) {
      const orb = new ExpOrb(this, enemy.x, enemy.y, enemy.exp);
      this.cameras.main.ignore(orb);
    }

    enemy.destroy();
  }

  // ===== 다크라이 페이즈 사망 오버레이 =====
  private showDarkraiDeathOverlay() {
    this.isGameOver = true;
    this.physics.pause();

    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;
    const CY = H / 2;

    // 반투명 배경 (scrollFactor 0 → cameras.main 기준 고정, gameCam 제외)
    const overlay = this.add.rectangle(CX, CY, W, H, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(200);
    this.gameCam.ignore(overlay);

    // 텍스트
    const titleTxt = this.add.text(CX, CY - 110, '당신은 쓰러졌습니다', {
      fontSize: '20px', color: '#ff4444', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.gameCam.ignore(titleTxt);

    const hasRevive = this.player.stats.revives > 0;

    // 부활 버튼
    const reviveBg = this.add.rectangle(CX, CY - 30, 200, 50, hasRevive ? 0x226633 : 0x333333)
      .setScrollFactor(0).setDepth(201);
    this.gameCam.ignore(reviveBg);
    const reviveLabel = hasRevive
      ? `부활 (남은 횟수: ${this.player.stats.revives})`
      : '부활 불가';
    const reviveTxt = this.add.text(CX, CY - 30, reviveLabel, {
      fontSize: '15px', color: hasRevive ? '#88ffaa' : '#666666', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    this.gameCam.ignore(reviveTxt);

    if (hasRevive) {
      reviveBg.setInteractive({ useHandCursor: true });
      reviveBg.on('pointerover', () => reviveBg.setFillStyle(0x33aa55));
      reviveBg.on('pointerout',  () => reviveBg.setFillStyle(0x226633));
      reviveBg.on('pointerdown', () => {
        this.player.stats.revives--;
        this.player.heal(Math.floor(this.player.stats.maxHp * 0.4));
        overlay.destroy(); titleTxt.destroy();
        reviveBg.destroy(); reviveTxt.destroy();
        quitBg.destroy(); quitTxt.destroy();
        this.isGameOver = false;
        this.physics.resume();
        showReviveEffect(this, this.gameCam, this.player);
      });
    }

    // 종료 버튼
    const quitBg = this.add.rectangle(CX, CY + 40, 200, 50, 0x442222)
      .setScrollFactor(0).setDepth(201)
      .setInteractive({ useHandCursor: true });
    this.gameCam.ignore(quitBg);
    const quitTxt = this.add.text(CX, CY + 40, '종료', {
      fontSize: '15px', color: '#ffaaaa', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    this.gameCam.ignore(quitTxt);

    quitBg.on('pointerover', () => quitBg.setFillStyle(0x773333));
    quitBg.on('pointerout',  () => quitBg.setFillStyle(0x442222));
    quitBg.on('pointerdown', () => {
      this.isGameOver = false; // triggerGameOver가 내부에서 true로 재설정
      this.triggerGameOver();
    });
  }

  // ===== 결과 저장 (게임오버 / 타이틀 귀환 공통) =====
  /** totalGold·베스트 기록·랭킹을 localStorage에 저장하고 클라우드 동기화. 새 totalGold 반환 */
  private saveResults(): number {
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

    // 랭킹 기준 갱신: 최고 스테이지 + 그 스테이지에서의 최고 생존 시간
    const rankStage = parseInt(localStorage.getItem('rankStage') ?? '1', 10);
    const rankTime  = parseInt(localStorage.getItem('rankTime')  ?? '0', 10);
    if (this.stageId > rankStage) {
      localStorage.setItem('rankStage', String(this.stageId));
      localStorage.setItem('rankTime',  String(Math.floor(this.gameTime)));
    } else if (this.stageId === rankStage && Math.floor(this.gameTime) > rankTime) {
      localStorage.setItem('rankTime', String(Math.floor(this.gameTime)));
    }

    const user = getCurrentUser();
    if (user) {
      pushLocalToCloud(user.id).catch(e => console.warn('[GameScene] cloud sync failed:', e));
    }

    return newTotal;
  }

  // ===== 게임오버 =====
  private triggerGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.sound.stopAll();
    this.cameras.main.shake(400, 0.02);
    // UI 정리
    this.hud.bossArrow.setVisible(false);
    if (IS_DEV_MODE) this.scene.stop('DevScene');

    // 진행 중인 모든 Tween 정리 후 플레이어 사망 애니메이션 실행
    this.tweens.killAll();
    this.player.setTint(0xff0000);
    this.tweens.add({ targets: this.player, alpha: 0, duration: 600 });

    const newTotal = this.saveResults();

    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        level:        this.level,
        killCount:    this.killCount,
        surviveTime:  this.gameTime,
        goldEarned:   this.gold,
        totalGold:    newTotal,
        waveNumber:   this.waveNumber + 1,
        weaponDamageLog: Object.fromEntries(this.weaponSystem.weaponDamageLog),
        stageId:      this.stageId,
        stageCleared: this.stageCleared,
        maxCombo:     this.maxCombo,
      });
    });
  }

  // ===== 경험치 / 레벨업 =====
  healPlayer(amount: number) {
    this.player.heal(amount);
    this.hud.update({
      hp: this.player.stats.hp,
      maxHp: this.player.stats.maxHp,
      exp: this.exp,
      expToNext: this.expToNext,
      gameTime: this.gameTime,
      level: this.level,
      gold: this.gold,
      stageId: this.stageId,
      waveNumber: this.waveNumber,
      killCount: this.killCount,
      bossActive: !!this.currentBoss?.active,
      bossHp: this.currentBoss?.hp ?? 0,
      bossMaxHp: this.currentBoss?.maxHp ?? 1,
      bossName: this.currentBossName,
      darkraiSpawned: this.darkraiSpawned,
      playerX: this.player.x,
      playerY: this.player.y,
      bossX: this.currentBoss?.x ?? 0,
      bossY: this.currentBoss?.y ?? 0,
    });
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
    if (this.isGameOver) return;
    this.exp += Math.floor(amount * this.player.stats.expGain);
    if (this.exp >= this.expToNext && !this.isLevelingUp) {
      this.exp      -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(this.expToNext * 1.20);
      // 레벨 마일스톤
      for (const m of this.LEVEL_MILESTONES) {
        if (this.level >= m && !this.reachedLevelMilestones.has(m)) {
          this.reachedLevelMilestones.add(m);
          showMilestone(this, this.gameCam, `레벨 ${m} 돌파!`, '#ffdd44');
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
      this.pauseOverlay.closeWeaponPopup();
      const options = generateLevelUpOptions(this.weapons, this.weaponLevels, this.equippedPassives, this.stageId);
      // 레벨업 BGM (짧은 징글, 1회)
      const vol = getBgmVolume() * 0.6;
      if (this.cache.audio.exists('bgm_levelup')) {
        const lvlSnd = this.sound.get(this.stageBgmKey);
        lvlSnd?.pause();
        const jingle = this.sound.add('bgm_levelup', { loop: false, volume: vol });
        jingle.play();
        jingle.once('complete', () => {
          if (!this.isGameOver && !this.isPaused) lvlSnd?.resume();
        });
      }
      this.scene.pause('GameScene');
      this.scene.launch('LevelUpScene', { options });
    });
  }

  // ===== 레벨업 선택 적용 (LevelUpScene에서 호출) =====
  applyLevelUpChoice(option: LevelUpOption) {
    switch (option.type) {
      case 'newPokemon': {
        const base    = getWeaponByPokemonId(option.pokemonId!)!;
        const newWeap = getUpgradedWeapon(base, 1);
        const newIdx  = this.weapons.length;
        this.weapons.push(newWeap);
        this.weaponLevels.push(1);
        if ((newWeap.behavior ?? 'projectile') === 'orbit') this.weaponSystem.createOrbitOrbs(newWeap, newIdx);
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
          if ((upgraded.behavior ?? 'projectile') === 'orbit') this.weaponSystem.createOrbitOrbs(upgraded, idx);
        }
        break;
      }
      case 'newPassive': {
        const type = option.passiveType!;
        this.equippedPassives.set(type, 1);
        applyPassiveBonus(this.player.stats, type, 0, 1);
        break;
      }
      case 'upgradePassive': {
        const type    = option.passiveType!;
        const oldLv   = option.levelFrom ?? (this.equippedPassives.get(type) ?? 1);
        const newLv   = option.levelTo ?? oldLv + 1;
        this.equippedPassives.set(type, newLv);
        applyPassiveBonus(this.player.stats, type, oldLv, newLv);
        break;
      }
      case 'goldBonus': {
        this.gold += 50;
        // goldText는 매 프레임 hud.update()에서 자동 갱신됨
        break;
      }
    }

    this.hud.updateSlots(this.weapons, this.weaponLevels, this.equippedPassives);
    this.isLevelingUp = false;

    // 연속 레벨업이 쌓여있으면 다음 프레임에서 처리
    if (this.exp >= this.expToNext) {
      this.exp      -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(this.expToNext * 1.20);
      for (const m of this.LEVEL_MILESTONES) {
        if (this.level >= m && !this.reachedLevelMilestones.has(m)) {
          this.reachedLevelMilestones.add(m);
          showMilestone(this, this.gameCam, `레벨 ${m} 돌파!`, '#ffdd44');
          break;
        }
      }
      this.needsLevelUp = true;
    }
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
    if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
  }

  // ===== 적 HP바 렌더 =====
  private renderEnemyHpBars() {
    // 일반/엘리트 HP바 미표시 — 보스는 상단 패널에서 별도 표시
    this.enemyHpGraphics.clear();
  }

  // ===== 가상 조이스틱 =====
  private drawJoystickGraphics() {
    const R = this.JOY_RADIUS;
    const K = this.JOY_KNOB_R;

    // 베이스 링
    this.joyBase.clear();
    this.joyBase.fillStyle(0xffffff, 0.10);
    this.joyBase.fillCircle(0, 0, R);
    this.joyBase.lineStyle(2, 0xffffff, 0.35);
    this.joyBase.strokeCircle(0, 0, R);

    // 스틱 노브
    this.joyStick.clear();
    this.joyStick.fillStyle(0xffffff, 0.55);
    this.joyStick.fillCircle(0, 0, K);
    this.joyStick.fillStyle(0xffffff, 0.85);
    this.joyStick.fillCircle(0, 0, K * 0.45);
  }

  private showJoystick(x: number, y: number) {
    this.joyBase.setPosition(x, y).setVisible(true).setAlpha(1);
    this.joyStick.setPosition(x, y).setVisible(true).setAlpha(1);
  }

  private moveJoystickKnob(ox: number, oy: number, tx: number, ty: number) {
    const dx    = tx - ox;
    const dy    = ty - oy;
    const dist  = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const clamp = Math.min(dist, this.JOY_RADIUS);
    this.joyStick.setPosition(ox + Math.cos(angle) * clamp, oy + Math.sin(angle) * clamp);
  }

  private hideJoystick() {
    this.joyBase.setVisible(false);
    this.joyStick.setVisible(false);
  }

  private setupJoystick() {
    // 탭 비활성화 시 자동 일시정지 (game 전역 이벤트 → shutdown 시 명시적 제거)
    const onHidden = () => {
      if (!this.isGameOver && !this.isLevelingUp && !this.isPaused) {
        this.pauseGame();
      }
    };
    this.game.events.on('hidden', onHidden);
    this.events.once('shutdown', () => this.game.events.off('hidden', onHidden));

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
      this.showJoystick(p.x, p.y);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.joystickActive || p.id !== this.joystickPointerId) return;

      const dx    = p.x - this.joystickOriginX;
      const dy    = p.y - this.joystickOriginY;
      const dist  = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (dist < 5) {
        this.joystickDx = 0;
        this.joystickDy = 0;
      } else {
        const ratio = Math.min(dist / this.JOY_RADIUS, 1);
        this.joystickDx = Math.cos(angle) * ratio;
        this.joystickDy = Math.sin(angle) * ratio;
      }
      this.moveJoystickKnob(this.joystickOriginX, this.joystickOriginY, p.x, p.y);
    });

    const resetJoystick = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joystickPointerId) return;
      this.joystickActive     = false;
      this.joystickPointerId  = -1;
      this.joystickDx         = 0;
      this.joystickDy         = 0;
      this.hideJoystick();
    };

    this.input.on('pointerup',     resetJoystick);
    this.input.on('pointercancel', resetJoystick);
  }

  // ===== 개발자 모드 API (DevScene에서 호출) =====
  devToggleGodMode(): boolean {
    this.isGodMode = !this.isGodMode;
    return this.isGodMode;
  }
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


  pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    this.joystickActive = false;
    this.joystickDx     = 0;
    this.joystickDy     = 0;
    this.hideJoystick();
    this.gameCam.setVisible(false);
    this.pauseOverlay.show(this.weapons, this.weaponLevels, this.equippedPassives, this.player.stats);
    this.sound.get(this.stageBgmKey)?.pause();
    this.sound.get('bgm_boss')?.pause();
  }

  resumeGame() {
    this.pauseOverlay.closeWeaponPopup();
    this.isPaused = false;
    this.physics.resume();
    this.gameCam.setVisible(true);
    this.pauseOverlay.hide();
    if (this.bossBgmActive) {
      this.sound.get('bgm_boss')?.resume();
    } else {
      this.sound.get(this.stageBgmKey)?.resume();
    }
  }

  /** 스테이지 BGM 시작 */
  private playBgm(key: string) {
    const vol = getBgmVolume() * 0.45;
    this.sound.stopAll();
    if (!this.cache.audio.exists(key)) return;
    if ((this.sound as any).locked) {
      this.sound.once('unlocked', () => {
        this.sound.stopAll();
        if (this.cache.audio.exists(key)) this.sound.play(key, { loop: true, volume: vol });
      });
    } else {
      this.sound.play(key, { loop: true, volume: vol });
    }
  }

  /** 보스 BGM 시작 (스테이지 BGM 페이드아웃 후 보스 BGM) */
  private startBossBgm() {
    this.bossBgmActive = true;
    const stageSnd = this.sound.get(this.stageBgmKey);
    if (stageSnd?.isPlaying) stageSnd.stop();
    const vol = getBgmVolume() * 0.45;
    if (this.cache.audio.exists('bgm_boss')) {
      this.sound.play('bgm_boss', { loop: true, volume: vol });
    }
  }

  /** 보스 BGM 종료 후 스테이지 BGM 복귀 */
  private stopBossBgm() {
    this.bossBgmActive = false;
    this.sound.stopByKey('bgm_boss');
    this.playBgm(this.stageBgmKey);
  }

}
