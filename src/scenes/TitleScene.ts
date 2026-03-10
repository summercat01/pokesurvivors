import Phaser from 'phaser';
import { getCurrentUser, getNickname, signOut } from '../lib/auth';
import { loadUserRecord } from '../lib/userDB';

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
    this.createUserBadge();

    // BGM 재생
    this.playBGM();

    // 첫 실행 시 오박사 가이드 표시
    if (!localStorage.getItem('guideShown')) {
      this.scene.launch('OakGuideScene');
    }
  }

  private playBGM() {
    if (!this.cache.audio.exists('bgm_title')) return;
    const existing = this.sound.get('bgm_title');
    if (existing?.isPlaying) return;
    this.sound.stopAll();
    this.sound.play('bgm_title', { loop: true, volume: 0.5 });
  }

  // ─────────────────────────────────────────────
  // 배경
  // ─────────────────────────────────────────────
  private createBackground() {
    // 풀밭 기본 색
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1e4a10).setOrigin(0, 0);

    // 격자 (연한 선)
    const g = this.add.graphics();
    g.lineStyle(1, 0x2a6018, 0.4);
    for (let x = 0; x < this.scale.width; x += 48) g.lineBetween(x, 0, x, this.scale.height);
    for (let y = 0; y < this.scale.height; y += 48) g.lineBetween(0, y, this.scale.width, y);

    // 하단 그라데이션 오버레이 (버튼 가독성)
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7);
    overlay.fillRect(0, this.scale.height * 0.45, this.scale.width, this.scale.height * 0.55);
  }

  // ─────────────────────────────────────────────
  // 배경 포켓몬 (슬슬 돌아다님)
  // ─────────────────────────────────────────────
  private createWanderingPokemon() {
    const COUNT = 8;
    for (let i = 0; i < COUNT; i++) {
      const key = BG_POKEMON[i % BG_POKEMON.length];
      const x   = Phaser.Math.Between(30, this.scale.width - 30);
      const y   = Phaser.Math.Between(60, this.scale.height * 0.48 - 20);
      const spr = this.add.image(x, y, key)
        .setDisplaySize(56, 56)
        .setAlpha(0.55)
        .setDepth(2);

      this.startWander(spr);
    }
  }

  private startWander(spr: Phaser.GameObjects.Image) {
    const nextX = Phaser.Math.Between(30, this.scale.width - 30);
    const nextY = Phaser.Math.Between(60, this.scale.height * 0.46);
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
    this.add.text(this.scale.width / 2, 120, '포켓몬', {
      fontSize: '22px',
      color: '#ffe040',
      fontStyle: 'bold',
      stroke: '#302000',
      strokeThickness: 4,
      padding: { top: 6 },
    }).setOrigin(0.5).setDepth(10);

    // ── 메인 타이틀 ──
    const title = this.add.text(this.scale.width / 2, 178, '서바이버즈', {
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#1a1a00',
      strokeThickness: 7,
      padding: { top: 10 },
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
    this.add.text(this.scale.width / 2, 240, 'Pokémon Survivors', {
      fontSize: '15px',
      color: '#cceeaa',
      stroke: '#102010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // ── 버전 배지 (영문 서브타이틀 오른쪽 옆) ──
    const badgeX = this.scale.width - 50;
    const badgeY = 240;
    this.add.rectangle(badgeX, badgeY, 40, 18, 0x3377cc).setDepth(10);
    this.add.text(badgeX, badgeY, 'v0.2', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    // ── 트레이너 이미지 ──
    if (this.textures.exists('trainer')) {
      const trainer = this.add.image(this.scale.width / 2, 330, 'trainer')
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
    const BTN_CX = this.scale.width / 2;
    const BTN_Y0 = 490;
    const BTN_GAP = 68;

    this.createDPButton(
      BTN_CX, BTN_Y0,
      BTN_W, BTN_H,
      '▶  게임 시작',
      0x44cc66,      // 포인트 컬러 (초록)
      () => {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StageSelectScene'));
      },
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
      padding: { top: 6 },
    }).setOrigin(0.5).setDepth(D + 4);

    // ── 인터랙션 ──
    bg.on('pointerover', () => {
      bg.setFillStyle(0xd8d8c8);
      txt.setStyle({ color: '#003399', fontSize: '18px', fontStyle: 'bold', padding: { top: 6 } });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0xeeeee0);
      txt.setStyle({ color: '#181810', fontSize: '18px', fontStyle: 'bold', padding: { top: 6 } });
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
  // 유저 배지 (우상단)
  // ─────────────────────────────────────────────
  private createUserBadge() {
    const W    = this.scale.width;
    const user = getCurrentUser();

    if (user) {
      // 로그인 상태: 닉네임 표시 + 로그아웃 버튼
      const nickname = getNickname();
      const label    = nickname.length > 14 ? nickname.slice(0, 13) + '…' : nickname;
      const nameTxt = this.add.text(W - 100, 20, `👤 ${label}`, {
        fontSize: '10px', color: '#aaccee',
      }).setOrigin(0, 0.5).setDepth(31);

      const badgeBg = this.add.rectangle(W - 70, 20, 130, 28, 0x112233, 0.85)
        .setDepth(30);
      const emailTxt = nameTxt;  // alias for logout block below

      const logoutBg = this.add.rectangle(W - 18, 20, 28, 22, 0x441122, 0.9)
        .setDepth(31).setInteractive({ useHandCursor: true });
      const logoutTxt = this.add.text(W - 18, 20, '⏻', {
        fontSize: '12px', color: '#ff8888',
      }).setOrigin(0.5).setDepth(32);

      logoutBg.on('pointerover', () => { logoutBg.setFillStyle(0x661133); logoutTxt.setColor('#ffaaaa'); });
      logoutBg.on('pointerout',  () => { logoutBg.setFillStyle(0x441122); logoutTxt.setColor('#ff8888'); });
      logoutBg.on('pointerdown', async () => {
        await signOut();
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('LoginScene'));
      });

      void [badgeBg, emailTxt, logoutTxt];
    } else {
      // 게스트 상태: 로그인 버튼
      const loginBg = this.add.rectangle(W - 38, 20, 68, 26, 0x223355, 0.9)
        .setDepth(30).setInteractive({ useHandCursor: true });
      const loginTxt = this.add.text(W - 38, 20, '🔑 로그인', {
        fontSize: '10px', color: '#88bbee',
      }).setOrigin(0.5).setDepth(31);

      loginBg.on('pointerover', () => { loginBg.setFillStyle(0x335577); loginTxt.setColor('#bbddff'); });
      loginBg.on('pointerout',  () => { loginBg.setFillStyle(0x223355); loginTxt.setColor('#88bbee'); });
      loginBg.on('pointerdown', () => {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('LoginScene'));
      });
    }
  }

  // ─────────────────────────────────────────────
  // 하단 푸터
  // ─────────────────────────────────────────────
  private createFooter() {
    const W = this.scale.width;
    const H = this.scale.height;


    this.add.rectangle(W / 2, H - 58, W, 112, 0x000000, 0.60).setDepth(9);

    // ── 오박사 가이드 책 버튼 (저작권 박스 위 우측) ──
    const bookBg = this.add.rectangle(W - 50, H - 138, 84, 32, 0x224422, 0.9)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x44aa44, 0.8)
      .strokeRect(W - 92, H - 154, 84, 32).setDepth(12);  // border around bookBg
    const bookTxt = this.add.text(W - 50, H - 138, '📖 가이드', {
      fontSize: '12px', color: '#88eeaa', fontStyle: 'bold',
      padding: { top: 3 },
    }).setOrigin(0.5).setDepth(13);
    bookBg.on('pointerover', () => { bookBg.setFillStyle(0x336633); bookTxt.setStyle({ fontSize: '13px', color: '#aaffcc', fontStyle: 'bold', padding: { top: 3 } }); });
    bookBg.on('pointerout',  () => { bookBg.setFillStyle(0x224422); bookTxt.setStyle({ fontSize: '13px', color: '#88eeaa', fontStyle: 'bold', padding: { top: 3 } }); });
    bookBg.on('pointerdown', () => this.scene.launch('OakGuideScene'));
    this.add.text(W / 2, H - 108,
      'Pokémon and all related names are trademarks of Nintendo / Creatures Inc. / GAME FREAK inc.\n이 게임은 닌텐도와 무관한 비영리 팬 게임입니다.', {
        fontSize: '15px', color: '#aabbaa', align: 'center',
        lineSpacing: 6,
        wordWrap: { width: W - 24 },
      }).setOrigin(0.5, 0).setDepth(10);

    const GAP = 8;
    const ICON_SIZE = 18;
    const devTxt = this.add.text(0, 0, 'Developed by  SummerCat', {
      fontSize: '15px', color: '#88bbff', fontStyle: 'bold',
      padding: { top: 4 },
    }).setOrigin(0.5).setDepth(10);
    const totalW = devTxt.width + GAP + ICON_SIZE;
    devTxt.setPosition(W / 2 - (GAP + ICON_SIZE) / 2, H - 16);

    const iconX = W / 2 - totalW / 2 + devTxt.width + GAP + ICON_SIZE / 2;
    if (this.textures.exists('icon_github')) {
      this.add.image(iconX, H - 16, 'icon_github').setDisplaySize(ICON_SIZE, ICON_SIZE).setDepth(10);
    } else {
      this.add.text(iconX, H - 16, '🐙', { fontSize: '15px' }).setOrigin(0.5).setDepth(10);
    }

    // 전체 영역 히트박스
    const devHit = this.add.rectangle(W / 2, H - 16, totalW + 16, 28, 0xffffff, 0)
      .setDepth(11).setInteractive({ useHandCursor: true });
    devHit.on('pointerover', () => devTxt.setStyle({ fontSize: '15px', color: '#bbddff', fontStyle: 'bold' }));
    devHit.on('pointerout',  () => devTxt.setStyle({ fontSize: '15px', color: '#88bbff', fontStyle: 'bold' }));
    devHit.on('pointerdown', () => window.open('https://github.com/summercat01', '_blank'));
  }
}
