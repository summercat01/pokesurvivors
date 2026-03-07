import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './GameScene';

// 배경에 돌아다닐 포켓몬 스프라이트 키 목록
const BG_POKEMON = [
  'pokemon_001', 'pokemon_002', 'pokemon_003',
  'pokemon_004', 'pokemon_005', 'pokemon_006',
  'pokemon_007', 'pokemon_008', 'pokemon_009',
  'pokemon_025', 'pokemon_054',
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.createBackground();
    this.createWanderingPokemon();
    this.createLogo();
    this.createButtons();
    this.createFooter();
  }

  // ─────────────────────────────────────────────
  // 배경
  // ─────────────────────────────────────────────
  private createBackground() {
    // 풀밭 기본 색
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1e4a10).setOrigin(0, 0);

    // 격자 (연한 선)
    const g = this.add.graphics();
    g.lineStyle(1, 0x2a6018, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += 48) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 48) g.lineBetween(0, y, GAME_WIDTH, y);

    // 하단 그라데이션 오버레이 (버튼 가독성)
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7);
    overlay.fillRect(0, GAME_HEIGHT * 0.45, GAME_WIDTH, GAME_HEIGHT * 0.55);
  }

  // ─────────────────────────────────────────────
  // 배경 포켓몬 (슬슬 돌아다님)
  // ─────────────────────────────────────────────
  private createWanderingPokemon() {
    const COUNT = 8;
    for (let i = 0; i < COUNT; i++) {
      const key = BG_POKEMON[i % BG_POKEMON.length];
      const x   = Phaser.Math.Between(30, GAME_WIDTH - 30);
      const y   = Phaser.Math.Between(60, GAME_HEIGHT * 0.48 - 20);
      const spr = this.add.image(x, y, key)
        .setDisplaySize(56, 56)
        .setAlpha(0.55)
        .setDepth(2);

      this.startWander(spr);
    }
  }

  private startWander(spr: Phaser.GameObjects.Image) {
    const nextX = Phaser.Math.Between(30, GAME_WIDTH - 30);
    const nextY = Phaser.Math.Between(60, GAME_HEIGHT * 0.46);
    const dur   = Phaser.Math.Between(2500, 5000);

    spr.setFlipX(nextX > spr.x); // 오른쪽이면 flip (Gen4 기본=왼쪽 방향)

    this.tweens.add({
      targets: spr,
      x: nextX,
      y: nextY,
      duration: dur,
      ease: 'Sine.easeInOut',
      onComplete: () => this.startWander(spr),
    });
  }

  // ─────────────────────────────────────────────
  // 타이틀 로고
  // ─────────────────────────────────────────────
  private createLogo() {
    // ── "포켓몬" 소제목 ──
    this.add.text(GAME_WIDTH / 2, 120, '포켓몬', {
      fontSize: '22px',
      color: '#ffe040',
      fontStyle: 'bold',
      stroke: '#302000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    // ── 메인 타이틀 ──
    const title = this.add.text(GAME_WIDTH / 2, 178, '서바이버즈', {
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#1a1a00',
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(10);

    // 타이틀 등장 애니메이션 (아래서 올라오며 페이드인)
    title.setAlpha(0).setY(210);
    this.tweens.add({
      targets: title,
      y: 178,
      alpha: 1,
      duration: 700,
      ease: 'Back.easeOut',
    });

    // ── 영문 서브타이틀 ──
    this.add.text(GAME_WIDTH / 2, 240, 'Pokémon Survivors', {
      fontSize: '15px',
      color: '#cceeaa',
      stroke: '#102010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // ── 버전 배지 (영문 서브타이틀 오른쪽 옆) ──
    const badgeX = GAME_WIDTH - 50;
    const badgeY = 240;
    this.add.rectangle(badgeX, badgeY, 40, 18, 0x3377cc).setDepth(10);
    this.add.text(badgeX, badgeY, 'v0.1', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    // ── 트레이너 이미지 ──
    if (this.textures.exists('trainer')) {
      const trainer = this.add.image(GAME_WIDTH / 2, 330, 'trainer')
        .setOrigin(0.5, 1)
        .setDepth(8);

      // 자연스러운 등장
      trainer.setAlpha(0);
      this.tweens.add({
        targets: trainer,
        alpha: 1,
        duration: 600,
        delay: 300,
      });
    }
  }

  // ─────────────────────────────────────────────
  // 메뉴 버튼
  // ─────────────────────────────────────────────
  private createButtons() {
    const BTN_W  = 280;
    const BTN_H  = 54;
    const BTN_CX = GAME_WIDTH / 2;
    const BTN_Y0 = 490;
    const BTN_GAP = 68;

    this.createDPButton(
      BTN_CX, BTN_Y0,
      BTN_W, BTN_H,
      '▶  게임 시작',
      0x44cc66,      // 포인트 컬러 (초록)
      () => this.scene.start('GameScene'),
    );

    this.createDPButton(
      BTN_CX, BTN_Y0 + BTN_GAP,
      BTN_W, BTN_H,
      '⬆  업그레이드',
      null,
      () => {
        this.cameras.main.fadeOut(200, 24, 16, 40);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('UpgradeScene'));
      },
    );

    this.createDPButton(
      BTN_CX, BTN_Y0 + BTN_GAP * 2,
      BTN_W, BTN_H,
      '⚙  설  정',
      null,
      () => this.showComingSoon(BTN_CX, BTN_Y0 + BTN_GAP * 2 - 35),
    );
  }

  /**
   * 포켓몬 DP 스타일 버튼
   * @param accentColor null 이면 일반 버튼, color 지정 시 왼쪽 색 스트라이프 추가
   */
  private createDPButton(
    cx: number, cy: number,
    w: number, h: number,
    label: string,
    accentColor: number | null,
    onClick: () => void,
  ) {
    const D = 20;

    // 외곽 테두리 (그림자 효과)
    this.add.rectangle(cx + 2, cy + 3, w + 4, h + 4, 0x000000, 0.4).setDepth(D);

    // 버튼 테두리
    this.add.rectangle(cx, cy, w + 4, h + 4, 0x181810).setDepth(D + 1);

    // 버튼 배경 (크림색)
    const bg = this.add.rectangle(cx, cy, w, h, 0xeeeee0)
      .setDepth(D + 2)
      .setInteractive({ useHandCursor: true });

    // 하이라이트 (상단 밝은 선)
    this.add.rectangle(cx, cy - h / 2 + 2, w - 4, 3, 0xffffff, 0.6).setDepth(D + 3);

    // 좌측 포인트 스트라이프 (게임 시작 버튼만)
    if (accentColor !== null) {
      this.add.rectangle(cx - w / 2 + 6, cy, 8, h - 4, accentColor).setDepth(D + 3);
    }

    // 버튼 텍스트
    const txt = this.add.text(cx, cy, label, {
      fontSize: '18px',
      color: '#181810',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 4);

    // ── 인터랙션 ──
    bg.on('pointerover', () => {
      bg.setFillStyle(0xd8d8c8);
      txt.setStyle({ color: '#003399', fontSize: '18px', fontStyle: 'bold' });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0xeeeee0);
      txt.setStyle({ color: '#181810', fontSize: '18px', fontStyle: 'bold' });
    });
    bg.on('pointerdown', () => {
      bg.setFillStyle(0xc8c8b8);
      this.time.delayedCall(80, onClick);
    });
    bg.on('pointerup', () => bg.setFillStyle(0xd8d8c8));
  }

  // ─────────────────────────────────────────────
  // 준비중 팝업
  // ─────────────────────────────────────────────
  private showComingSoon(x: number, y: number) {
    const txt = this.add.text(x, y, '🚧 준비 중...', {
      fontSize: '16px',
      color: '#ffdd44',
      stroke: '#302000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 800,
      onComplete: () => txt.destroy(),
    });
  }

  // ─────────────────────────────────────────────
  // 하단 푸터
  // ─────────────────────────────────────────────
  private createFooter() {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, '© 2025  포켓서바이버즈', {
      fontSize: '11px',
      color: '#556644',
    }).setOrigin(0.5).setDepth(10);
  }
}
