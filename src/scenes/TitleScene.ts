import Phaser from 'phaser';
import { getCurrentUser, getNickname, signOut } from '../lib/auth';
import { loadUserRecord } from '../lib/userDB';

// ── 패치 노트 ──
interface PatchEntry { version: string; date: string; changes: string[] }
const PATCH_NOTES: PatchEntry[] = [
  {
    version: 'v0.4.0', date: '2026-03-11',
    changes: [
      '전체 무기 범위 50% 너프 조정',
      '독 장판(니드런♂ 계열) Lv1 범위 상향',
      '오박사 가이드 내용 리뉴얼',
      '버전 배지 추가 및 패치 노트 기능 구현',
    ],
  },
  {
    version: 'v0.3.0', date: '2026-03-04',
    changes: [
      '진화 시스템 추가 — 무기 Lv5 + 같은 타입 돌 보유 시 진화',
      '몬스터볼 시스템 — 엘리트/보스 처치 시 몬스터볼 드롭',
      '몬스터볼 획득 시 일시정지 & 획득 결과 패널 표시',
      '다크라이 HP ??? 표시 / 15분 이후 적 스폰 중단',
      '보스 웨이브(5분·10분) 중 엘리트 스폰 제거',
      '개발자 모드 무적 ON/OFF 버튼 추가',
    ],
  },
  {
    version: 'v0.2.0', date: '2026-02-10',
    changes: [
      '스테이지 2~6 추가 (벌레·풀·불꽃·물·전기)',
      '17종 타입 무기 및 패시브 아이템(타입 돌) 완성',
      '영구 업그레이드 상점 8종',
      '보스 전용 패턴 추가 (잠만보·캥카)',
      '딥상어동 버프 / 개무소 너프',
      '타입 상성 1.5배 데미지 적용',
    ],
  },
  {
    version: 'v0.1.0', date: '2026-01-01',
    changes: [
      '포켓몬 서바이버즈 최초 출시',
      '스테이지 1 (노말 타입) 구현',
      '기본 무기·패시브 아이템·레벨업 선택지 시스템',
      '5분 / 10분 / 15분 보스 기본 구조',
    ],
  },
];

// 배경에 돌아다닐 포켓몬 스프라이트 키 목록 (17개 무기 포켓몬)
const BG_POKEMON = [
  'pokemon_174', // 푸푸린 (노말)
  'pokemon_004', // 파이리 (불꽃)
  'pokemon_393', // 팽도리 (물)
  'pokemon_252', // 나무지기 (풀)
  'pokemon_265', // 개무소 (벌레)
  'pokemon_172', // 피츄 (전기)
  'pokemon_066', // 알통몬 (격투)
  'pokemon_246', // 애버라스 (바위)
  'pokemon_074', // 꼬마돌 (땅)
  'pokemon_220', // 꾸꾸리 (얼음)
  'pokemon_032', // 니드런♂ (독)
  'pokemon_396', // 찌르꼬 (비행)
  'pokemon_063', // 캐이시 (에스퍼)
  'pokemon_092', // 고오스 (고스트)
  'pokemon_374', // 메탕 (강철)
  'pokemon_443', // 딥상어동 (드래곤)
  'pokemon_261', // 포챠나 (악)
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
    const COUNT = BG_POKEMON.length;
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

    // ── 버전 배지 (클릭 시 패치노트) ──
    const badgeX = this.scale.width - 50;
    const badgeY = 240;
    const badgeBg = this.add.rectangle(badgeX, badgeY, 48, 18, 0x3377cc)
      .setDepth(10).setInteractive({ useHandCursor: true });
    this.add.text(badgeX, badgeY, `v${__APP_VERSION__}`, {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    badgeBg.on('pointerover', () => badgeBg.setFillStyle(0x5599ee));
    badgeBg.on('pointerout',  () => badgeBg.setFillStyle(0x3377cc));
    badgeBg.on('pointerdown', () => this.showPatchNotes());

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
  // 패치 노트 모달
  // ─────────────────────────────────────────────
  private showPatchNotes() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;
    const D  = 80;

    const allItems: Phaser.GameObjects.GameObject[] = [];
    const close = () => allItems.forEach(o => o.destroy());

    // 반투명 배경
    const dimBg = this.add.rectangle(CX, H / 2, W, H, 0x000000, 0.78)
      .setDepth(D).setInteractive();
    allItems.push(dimBg);

    // 패널
    const PANEL_W = W - 28;
    const PANEL_H = H - 100;
    const PANEL_Y = H / 2 + 10;
    const panel = this.add.rectangle(CX, PANEL_Y, PANEL_W, PANEL_H, 0x0d1a2e, 0.97)
      .setDepth(D + 1).setStrokeStyle(2, 0x3377cc);
    allItems.push(panel);

    // 타이틀
    const titleTxt = this.add.text(CX, PANEL_Y - PANEL_H / 2 + 22, '패치 노트', {
      fontSize: '16px', color: '#88bbff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2);
    allItems.push(titleTxt);

    // 구분선
    const divLine = this.add.graphics()
      .lineStyle(1, 0x3377cc, 0.5)
      .lineBetween(CX - PANEL_W / 2 + 12, PANEL_Y - PANEL_H / 2 + 40,
                   CX + PANEL_W / 2 - 12, PANEL_Y - PANEL_H / 2 + 40)
      .setDepth(D + 2);
    allItems.push(divLine);

    // 닫기 버튼
    const closeBg = this.add.rectangle(CX + PANEL_W / 2 - 18, PANEL_Y - PANEL_H / 2 + 18, 28, 28, 0x223355)
      .setDepth(D + 2).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(CX + PANEL_W / 2 - 18, PANEL_Y - PANEL_H / 2 + 18, '✕', {
      fontSize: '14px', color: '#aabbcc',
    }).setOrigin(0.5).setDepth(D + 3);
    closeBg.on('pointerover', () => { closeBg.setFillStyle(0x334466); closeTxt.setColor('#ffffff'); });
    closeBg.on('pointerout',  () => { closeBg.setFillStyle(0x223355); closeTxt.setColor('#aabbcc'); });
    closeBg.on('pointerdown', close);
    allItems.push(closeBg, closeTxt);

    // 패치 내용
    let curY = PANEL_Y - PANEL_H / 2 + 54;
    const LEFT = CX - PANEL_W / 2 + 18;

    PATCH_NOTES.forEach(entry => {
      // 버전 헤더
      const verTxt = this.add.text(LEFT, curY, entry.version, {
        fontSize: '14px', color: '#55aaff', fontStyle: 'bold',
      }).setDepth(D + 2);
      const dateTxt = this.add.text(CX + PANEL_W / 2 - 18, curY, entry.date, {
        fontSize: '11px', color: '#556677',
      }).setOrigin(1, 0).setDepth(D + 2);
      allItems.push(verTxt, dateTxt);
      curY += 20;

      // 변경 항목
      entry.changes.forEach(change => {
        const line = this.add.text(LEFT + 8, curY, `• ${change}`, {
          fontSize: '12px', color: '#99bbcc',
          wordWrap: { width: PANEL_W - 36 },
        }).setDepth(D + 2);
        allItems.push(line);
        curY += line.height + 2;
      });

      curY += 12; // 버전 간 여백
    });
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
