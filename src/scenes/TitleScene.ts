import Phaser from 'phaser';
import { getCurrentUser, getNickname, signOut } from '../lib/auth';
import { loadUserRecord } from '../lib/userDB';

// ── 패치 노트 ──
interface PatchEntry { version: string; date: string; changes: string[] }
const PATCH_NOTES: PatchEntry[] = [
  {
    version: 'v0.6.0', date: '2026-03-15',
    changes: [
      '타입 상성표 추가 — 17×17 매트릭스, 타이틀·일시정지에서 접근 가능',
      '레벨업 카드 개선 — 무기 타입 표시, 스테이지 상성 기반 추천/비추천 배지',
      'HUD 스테이지 번호 표시 추가',
      '포켓볼 오프스크린 방향 화살표',
      '슈퍼볼/하이퍼볼 드롭 수 감소 (3/5 → 1개)',
      '얼음·격투·비행·벌레 타입 너프 (무기 + 패시브)',
      '웨이브 난이도 곡선 완화 (이차항 적용)',
      '일시정지 무기 슬롯/DPS 갱신 버그 수정',
    ],
  },
  {
    version: 'v0.5.0', date: '2026-03-15',
    changes: [
      '스테이지 해금 시스템 — 이전 스테이지 15분 생존 시 다음 스테이지 개방',
      '랭킹 시스템 추가 — 최고 스테이지 + 최고 생존 시간 기준',
      '다크라이 HP 대폭 상향',
      '버그 수정: Pierce 관통 판정, 게임오버 메모리 누수',
    ],
  },
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
    const H = this.scale.height;
    const W = this.scale.width;
    // ── "포켓몬" 소제목 ──
    this.add.text(W / 2, Math.round(H * 0.142), '포켓몬', {
      fontSize: '22px',
      color: '#ffe040',
      fontStyle: 'bold',
      stroke: '#302000',
      strokeThickness: 4,
      padding: { top: 6 },
    }).setOrigin(0.5).setDepth(10);

    // ── 메인 타이틀 ──
    const titleY = Math.round(H * 0.211);
    const title = this.add.text(W / 2, titleY, '서바이버즈', {
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#1a1a00',
      strokeThickness: 7,
      padding: { top: 10 },
    }).setOrigin(0.5).setDepth(10);

    // 타이틀 등장 애니메이션 (아래서 올라오며 페이드인)
    title.setAlpha(0).setY(titleY + 32);
    this.tweens.add({
      targets: title,
      y: titleY,
      alpha: 1,
      duration: 700,
      ease: 'Back.easeOut',
    });

    // ── 영문 서브타이틀 ──
    const subtitleY = Math.round(H * 0.285);
    this.add.text(W / 2, subtitleY, 'Pokémon Survivors', {
      fontSize: '15px',
      color: '#cceeaa',
      stroke: '#102010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // ── 버전 배지 (클릭 시 패치노트) ──
    const badgeX = W - 50;
    const badgeY = subtitleY;
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
      const trainer = this.add.image(W / 2, Math.round(H * 0.391), 'trainer')
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
    const H      = this.scale.height;
    const W      = this.scale.width;
    const BTN_W  = Math.min(280, W - 60);
    const BTN_H  = 54;
    const BTN_CX = W / 2;

    // 버튼 영역: 로고 하단(H*0.41)과 푸터 상단(H-170) 사이에 균등 배치
    const FOOTER_TOP   = H - 170;
    const logoBottom   = Math.round(H * 0.41) + 10;
    const btnSpan      = FOOTER_TOP - logoBottom;
    const spaceBetween = Math.max(10, Math.floor((btnSpan - BTN_H * 3) / 4));
    const BTN_GAP      = BTN_H + spaceBetween;
    const BTN_Y0       = logoBottom + spaceBetween + Math.floor(BTN_H / 2);

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

    const HALF_W = (BTN_W - 8) / 2;
    this.createDPButton(
      BTN_CX - HALF_W / 2 - 4, BTN_Y0 + BTN_GAP * 2,
      HALF_W, BTN_H,
      '🏆 랭킹',
      null,
      () => {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('RankingScene'));
      },
    );
    this.createDPButton(
      BTN_CX + HALF_W / 2 + 4, BTN_Y0 + BTN_GAP * 2,
      HALF_W, BTN_H,
      '⚙ 설정',
      null,
      () => this.showSettingsModal(),
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

    // 스크롤 상태 (휠/드래그 핸들러에서 참조)
    let scrollY   = 0;
    let maxScroll = 0;
    let contentContainer: Phaser.GameObjects.Container | null = null;

    const applyScroll = (newY: number) => {
      scrollY = Phaser.Math.Clamp(newY, 0, maxScroll);
      contentContainer?.setY(-scrollY);
    };

    const onWheel = (...args: unknown[]) => applyScroll(scrollY + (args[3] as number) * 0.5);

    const close = () => {
      this.input.off('wheel', onWheel);
      allItems.forEach(o => o.destroy());
    };

    // 반투명 배경
    const dimBg = this.add.rectangle(CX, H / 2, W, H, 0x000000, 0.78)
      .setDepth(D).setInteractive();
    allItems.push(dimBg);

    // 패널
    const PANEL_W  = W - 28;
    const PANEL_H  = H - 100;
    const PANEL_Y  = H / 2 + 10;
    const HEADER_H = 46;
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

    // ── 스크롤 콘텐츠 영역 ──────────────────────────
    const CONTENT_TOP = PANEL_Y - PANEL_H / 2 + HEADER_H;
    const CONTENT_BOT = PANEL_Y + PANEL_H / 2 - 8;
    const CONTENT_H   = CONTENT_BOT - CONTENT_TOP;
    const LEFT        = CX - PANEL_W / 2 + 18;

    // 마스크 (패널 내부만 보이게 — 마스크 오브젝트 자체는 숨김)
    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(CX - PANEL_W / 2 + 4, CONTENT_TOP, PANEL_W - 8, CONTENT_H);
    maskShape.setVisible(false);
    const mask = maskShape.createGeometryMask();
    allItems.push(maskShape);

    // 콘텐츠 컨테이너
    const container = this.add.container(0, 0).setDepth(D + 2);
    container.setMask(mask);
    allItems.push(container);

    let localY = 0;
    PATCH_NOTES.forEach(entry => {
      const verTxt = this.add.text(LEFT, CONTENT_TOP + localY, entry.version, {
        fontSize: '14px', color: '#55aaff', fontStyle: 'bold',
      });
      const dateTxt = this.add.text(CX + PANEL_W / 2 - 18, CONTENT_TOP + localY, entry.date, {
        fontSize: '11px', color: '#556677',
      }).setOrigin(1, 0);
      container.add([verTxt, dateTxt]);
      localY += 20;

      entry.changes.forEach(change => {
        const line = this.add.text(LEFT + 8, CONTENT_TOP + localY, `• ${change}`, {
          fontSize: '12px', color: '#99bbcc',
          wordWrap: { width: PANEL_W - 36 },
        });
        container.add(line);
        localY += line.height + 2;
      });
      localY += 12;
    });

    maxScroll        = Math.max(0, localY - CONTENT_H);
    contentContainer = container;

    // 마우스 휠
    this.input.on('wheel', onWheel);

    // 터치 드래그
    let dragStartY = 0, dragStartScroll = 0;
    const scrollArea = this.add.rectangle(CX, CONTENT_TOP + CONTENT_H / 2, PANEL_W - 8, CONTENT_H, 0xffffff, 0)
      .setDepth(D + 5).setInteractive();
    allItems.push(scrollArea);
    scrollArea.on('pointerdown', (ptr: Phaser.Input.Pointer) => { dragStartY = ptr.y; dragStartScroll = scrollY; });
    scrollArea.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (ptr.isDown) applyScroll(dragStartScroll + (dragStartY - ptr.y));
    });
  }

  // ─────────────────────────────────────────────
  // 설정 모달
  // ─────────────────────────────────────────────
  private showSettingsModal() {
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
    const PANEL_H = 260;
    const PANEL_Y = H / 2;
    const panel = this.add.rectangle(CX, PANEL_Y, PANEL_W, PANEL_H, 0x0d1a2e, 0.97)
      .setDepth(D + 1).setStrokeStyle(2, 0x3377cc);
    allItems.push(panel);

    // 타이틀
    const titleTxt = this.add.text(CX, PANEL_Y - PANEL_H / 2 + 22, '⚙ 설정', {
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

    // 슬라이더 헬퍼 — 레이블은 위, 트랙은 아래
    const LEFT      = CX - PANEL_W / 2 + 18;
    const SLIDER_W  = PANEL_W - 40;
    const SLIDER_X  = CX - SLIDER_W / 2;
    const makeSlider = (labelText: string, storageKey: string, labelY: number) => {
      const trackY   = labelY + 24;
      const savedVal = parseFloat(localStorage.getItem(storageKey) ?? '1');
      let curVal     = savedVal;

      // 레이블
      const labelTxt = this.add.text(LEFT, labelY, labelText, {
        fontSize: '13px', color: '#ccddee',
      }).setOrigin(0, 0.5).setDepth(D + 2);
      allItems.push(labelTxt);

      // 퍼센트 텍스트 (레이블 오른쪽)
      const pctTxt = this.add.text(CX + PANEL_W / 2 - 18, labelY, `${Math.round(curVal * 100)}%`, {
        fontSize: '12px', color: '#aabbcc',
      }).setOrigin(1, 0.5).setDepth(D + 2);
      allItems.push(pctTxt);

      // 트랙
      const track = this.add.rectangle(CX, trackY, SLIDER_W, 6, 0x223355)
        .setDepth(D + 2);
      allItems.push(track);

      // 채움 바
      const fillBar = this.add.rectangle(SLIDER_X, trackY, SLIDER_W * curVal, 6, 0x3399ff)
        .setOrigin(0, 0.5).setDepth(D + 3);
      allItems.push(fillBar);

      // 핸들
      const handle = this.add.circle(SLIDER_X + SLIDER_W * curVal, trackY, 10, 0x55bbff)
        .setDepth(D + 4).setInteractive({ useHandCursor: true, draggable: true });
      allItems.push(handle);

      const updateSlider = (ratio: number) => {
        curVal = Phaser.Math.Clamp(ratio, 0, 1);
        fillBar.setSize(SLIDER_W * curVal, 6);
        handle.setX(SLIDER_X + SLIDER_W * curVal);
        pctTxt.setText(`${Math.round(curVal * 100)}%`);
        localStorage.setItem(storageKey, String(curVal));
      };

      this.input.setDraggable(handle);
      handle.on('drag', (_: unknown, x: number) => {
        const ratio = (x - SLIDER_X) / SLIDER_W;
        updateSlider(ratio);
      });

      track.setInteractive({ useHandCursor: true });
      track.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        const ratio = (ptr.x - SLIDER_X) / SLIDER_W;
        updateSlider(ratio);
      });
    };

    const BASE_Y = PANEL_Y - PANEL_H / 2 + 72;
    makeSlider('BGM 볼륨',  'bgmVolume',  BASE_Y);
    makeSlider('효과음 볼륨', 'sfxVolume', BASE_Y + 80);
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
    const W           = this.scale.width;
    const H           = this.scale.height;
    const FOOTER_TOP  = H - 170;   // 버튼 영역과 동일 기준

    // ── 배경 오버레이 ──
    this.add.rectangle(W / 2, FOOTER_TOP + 85, W, 170, 0x000000, 0.60).setDepth(9);

    // ── 오박사 가이드 버튼 (푸터 최상단 우측) ──
    const guideY  = FOOTER_TOP + 18;
    const bookBg  = this.add.rectangle(W - 50, guideY, 84, 30, 0x224422, 0.9)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x44aa44, 0.8)
      .strokeRect(W - 92, guideY - 15, 84, 30).setDepth(12);
    const bookTxt = this.add.text(W - 50, guideY, '📖 가이드', {
      fontSize: '12px', color: '#88eeaa', fontStyle: 'bold',
      padding: { top: 2 },
    }).setOrigin(0.5).setDepth(13);
    bookBg.on('pointerover', () => { bookBg.setFillStyle(0x336633); bookTxt.setColor('#aaffcc'); });
    bookBg.on('pointerout',  () => { bookBg.setFillStyle(0x224422); bookTxt.setColor('#88eeaa'); });
    bookBg.on('pointerdown', () => this.scene.launch('OakGuideScene'));

    // ── 상성표 버튼 (가이드 왼쪽) ──
    const matchupX = W - 142;
    const matchupBg = this.add.rectangle(matchupX, guideY, 84, 30, 0x224444, 0.9)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x44aaaa, 0.8)
      .strokeRect(matchupX - 42, guideY - 15, 84, 30).setDepth(12);
    const matchupTxt = this.add.text(matchupX, guideY, '⚡ 상성표', {
      fontSize: '12px', color: '#88eeee', fontStyle: 'bold',
      padding: { top: 2 },
    }).setOrigin(0.5).setDepth(13);
    matchupBg.on('pointerover', () => { matchupBg.setFillStyle(0x336666); matchupTxt.setColor('#aaffff'); });
    matchupBg.on('pointerout',  () => { matchupBg.setFillStyle(0x224444); matchupTxt.setColor('#88eeee'); });
    matchupBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('TypeMatchupScene', { caller: 'TitleScene' })
      );
    });

    // ── 도감 버튼 (화면 왼쪽, 가이드와 대칭) ──
    const dexX  = 50; // 가이드(W-50)의 좌우 대칭
    const dexBg = this.add.rectangle(dexX, guideY, 84, 30, 0x222244, 0.9)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x4444aa, 0.8)
      .strokeRect(dexX - 42, guideY - 15, 84, 30).setDepth(12);
    const dexTxt = this.add.text(dexX, guideY, '📋 도감', {
      fontSize: '12px', color: '#88aaee', fontStyle: 'bold',
      padding: { top: 2 },
    }).setOrigin(0.5).setDepth(13);
    dexBg.on('pointerover',  () => { dexBg.setFillStyle(0x333366); dexTxt.setColor('#bbccff'); });
    dexBg.on('pointerout',   () => { dexBg.setFillStyle(0x222244); dexTxt.setColor('#88aaee'); });
    dexBg.on('pointerdown',  () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('PokedexScene'));
    });

    // ── 저작권 텍스트 ──
    this.add.text(W / 2, FOOTER_TOP + 48,
      'Pokémon and all related names are trademarks of Nintendo / Creatures Inc. / GAME FREAK inc.\n이 게임은 닌텐도와 무관한 비영리 팬 게임입니다.', {
        fontSize: '11px', color: '#aabbaa', align: 'center',
        lineSpacing: 4,
        wordWrap: { width: W - 24 },
      }).setOrigin(0.5, 0).setDepth(10);

    // ── 개발자 정보 ──
    const DEV_Y    = H - 20;
    const GAP      = 6;
    const ICON_SIZE = 16;
    const devTxt   = this.add.text(0, 0, 'Developed by  SummerCat', {
      fontSize: '13px', color: '#88bbff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    const totalW = devTxt.width + GAP + ICON_SIZE;
    devTxt.setPosition(W / 2 - (GAP + ICON_SIZE) / 2, DEV_Y);

    const iconX = W / 2 - totalW / 2 + devTxt.width + GAP + ICON_SIZE / 2;
    if (this.textures.exists('icon_github')) {
      this.add.image(iconX, DEV_Y, 'icon_github').setDisplaySize(ICON_SIZE, ICON_SIZE).setDepth(10);
    } else {
      this.add.text(iconX, DEV_Y, '🐙', { fontSize: '13px' }).setOrigin(0.5).setDepth(10);
    }

    const devHit = this.add.rectangle(W / 2, DEV_Y, totalW + 16, 26, 0xffffff, 0)
      .setDepth(11).setInteractive({ useHandCursor: true });
    devHit.on('pointerover', () => devTxt.setColor('#bbddff'));
    devHit.on('pointerout',  () => devTxt.setColor('#88bbff'));
    devHit.on('pointerdown', () => window.open('https://github.com/summercat01', '_blank'));
  }
}
