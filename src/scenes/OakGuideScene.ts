import Phaser from 'phaser';

interface DialogStep {
  text: string;
}

const DIALOGS: DialogStep[] = [
  {
    text: '안녕하세요!\n저는 포켓몬 연구소의 오박사입니다.\n잠깐, 게임을 시작하기 전에\n기본적인 규칙을 알려드리겠습니다!',
  },
  {
    text: '【 이동 】\n화면을 터치하면 가상 조이스틱이 나타납니다.\n조이스틱을 움직여 트레이너를 조종하세요.\n키보드는 WASD 또는 방향키를 사용합니다.',
  },
  {
    text: '【 자동 공격 】\n파트너 포켓몬이 주변 적을\n자동으로 공격합니다!\n더 강한 포켓몬을 모아 화력을 높이세요.',
  },
  {
    text: '【 레벨업 】\n경험치 구슬을 모으면 레벨이 올라갑니다!\n새로운 파트너 포켓몬 기술을 배우거나\n기존 기술을 강화할 수 있습니다.',
  },
  {
    text: '【 타입 상성 】\n약점 타입으로 공격하면\n1.5배 데미지를 줄 수 있습니다!\n예) 물→불꽃, 전기→물, 풀→바위',
  },
  {
    text: '【 골드 & 영구 업그레이드 】\n적을 쓰러뜨리면 골드가 쌓입니다.\n게임 종료 후 메인 메뉴에서\n영구 업그레이드를 구매하세요!',
  },
  {
    text: '자, 준비됐나요?\n포켓몬과 함께 살아남으세요!\n\n행운을 빕니다, 트레이너!',
  },
];

export class OakGuideScene extends Phaser.Scene {
  private step = 0;
  private dialogText!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Rectangle;
  private nextTxt!: Phaser.GameObjects.Text;
  private stepDots: Phaser.GameObjects.Arc[] = [];
  private isTyping = false;
  private fullText = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private inputBlocked = false;

  constructor() {
    super({ key: 'OakGuideScene' });
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    // ── 반투명 배경 (interactive로 뒤 씬 입력 차단) ──
    this.add.rectangle(CX, H / 2, W, H, 0x000000, 0.88).setInteractive();

    // ── 헤더 ──
    this.add.rectangle(CX, 36, W, 70, 0x0d3320);
    this.add.graphics().lineStyle(2, 0x44cc66, 0.6).lineBetween(0, 70, W, 70);
    this.add.text(CX, 30, '포켓몬 서바이버즈', {
      fontSize: '14px', color: '#88eeaa', fontStyle: 'bold',
      padding: { top: 4 },
    }).setOrigin(0.5);
    this.add.text(CX, 52, '트레이너 가이드', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#003300', strokeThickness: 4,
      padding: { top: 6 },
    }).setOrigin(0.5);

    // ── 오박사 초상화 ──
    const PORTRAIT_CX = CX;
    const PORTRAIT_CY = 220;
    const PORTRAIT_W  = 160;
    const PORTRAIT_H  = 200;

    // 초상화 배경
    this.add.rectangle(PORTRAIT_CX, PORTRAIT_CY, PORTRAIT_W + 8, PORTRAIT_H + 8, 0x44cc66, 0.2);
    this.add.rectangle(PORTRAIT_CX, PORTRAIT_CY, PORTRAIT_W,     PORTRAIT_H,     0x0d2a18);
    this.add.graphics()
      .lineStyle(3, 0x44cc66, 0.9)
      .strokeRect(PORTRAIT_CX - PORTRAIT_W / 2, PORTRAIT_CY - PORTRAIT_H / 2, PORTRAIT_W, PORTRAIT_H);
    // 모서리 장식
    const corners = [
      [PORTRAIT_CX - PORTRAIT_W / 2, PORTRAIT_CY - PORTRAIT_H / 2],
      [PORTRAIT_CX + PORTRAIT_W / 2, PORTRAIT_CY - PORTRAIT_H / 2],
      [PORTRAIT_CX - PORTRAIT_W / 2, PORTRAIT_CY + PORTRAIT_H / 2],
      [PORTRAIT_CX + PORTRAIT_W / 2, PORTRAIT_CY + PORTRAIT_H / 2],
    ] as [number, number][];
    const cornerGfx = this.add.graphics().fillStyle(0x44cc66);
    corners.forEach(([cx2, cy2]) => cornerGfx.fillRect(cx2 - 5, cy2 - 5, 10, 10));

    if (this.textures.exists('prof_oak')) {
      this.add.image(PORTRAIT_CX, PORTRAIT_CY, 'prof_oak')
        .setDisplaySize(PORTRAIT_W - 8, PORTRAIT_H - 8);
    } else {
      // 폴백 초상화
      this.add.text(PORTRAIT_CX, PORTRAIT_CY - 30, '🧪', {
        fontSize: '56px',
      }).setOrigin(0.5);
      this.add.rectangle(PORTRAIT_CX, PORTRAIT_CY + 55, 100, 30, 0x224422);
      this.add.text(PORTRAIT_CX, PORTRAIT_CY + 55, 'Prof. Oak', {
        fontSize: '13px', color: '#88eeaa', fontStyle: 'bold',
        padding: { top: 4 },
      }).setOrigin(0.5);
    }

    // ── 스텝 도트 ──
    const DOT_Y     = PORTRAIT_CY + PORTRAIT_H / 2 + 22;
    const dotGap    = 14;
    const dotStartX = CX - (DIALOGS.length - 1) * dotGap / 2;
    for (let i = 0; i < DIALOGS.length; i++) {
      const dot = this.add.arc(dotStartX + i * dotGap, DOT_Y, 4, 0, 360, false, 0x556655);
      this.stepDots.push(dot);
    }

    // ── 대화창 ──
    const BOX_TOP = DOT_Y + 20;
    const BOX_H   = H - BOX_TOP - 50;
    const BOX_L   = 12;
    const BOX_R   = W - 12;
    const BOX_W   = BOX_R - BOX_L;
    const BOX_CY  = BOX_TOP + BOX_H / 2;

    // 배경
    this.add.rectangle(CX, BOX_CY, BOX_W, BOX_H, 0xf0eedc);
    this.add.graphics().lineStyle(3, 0x44aa44).strokeRect(BOX_L, BOX_TOP, BOX_W, BOX_H);
    // 내부 미세 선
    this.add.graphics().lineStyle(1, 0x88cc88, 0.3)
      .strokeRect(BOX_L + 4, BOX_TOP + 4, BOX_W - 8, BOX_H - 8);

    // 화자 배지
    this.add.rectangle(BOX_L + 54, BOX_TOP - 14, 108, 26, 0x44aa44);
    this.add.graphics().lineStyle(2, 0x228822).strokeRect(BOX_L, BOX_TOP - 27, 108, 26);
    this.add.text(BOX_L + 54, BOX_TOP - 14, '오박사', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      padding: { top: 4 },
    }).setOrigin(0.5);

    // 대화 텍스트
    this.dialogText = this.add.text(BOX_L + 16, BOX_TOP + 18, '', {
      fontSize: '15px',
      color: '#181810',
      lineSpacing: 8,
      wordWrap: { width: BOX_W - 32 },
    });

    // ── 다음 버튼 ──
    const BTN_Y = BOX_TOP + BOX_H - 28;
    this.nextBtn = this.add.rectangle(CX + 52, BTN_Y, 120, 30, 0x44aa44)
      .setInteractive({ useHandCursor: true });
    this.nextTxt = this.add.text(CX + 52, BTN_Y, '다음 ▶', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      padding: { top: 4 },
    }).setOrigin(0.5);

    this.nextBtn.on('pointerover', () => this.nextBtn.setFillStyle(0x55cc55));
    this.nextBtn.on('pointerout',  () => this.nextBtn.setFillStyle(0x44aa44));
    this.nextBtn.on('pointerdown', () => this.advance());

    // 화면 탭으로 진행 (버튼 외 영역)
    this.input.on('pointerdown', (_ptr: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (!targets.includes(this.nextBtn)) this.advance();
    });

    this.showStep(0);
  }

  private showStep(index: number) {
    this.step     = index;
    this.fullText = DIALOGS[index].text;

    // 도트 갱신
    this.stepDots.forEach((d, i) =>
      d.setFillStyle(i === index ? 0x44cc66 : i < index ? 0x228833 : 0x445544),
    );

    // 타이핑 초기화
    this.dialogText.setText('');
    this.isTyping = true;
    let charIdx = 0;
    this.typeTimer?.remove();
    this.typeTimer = this.time.addEvent({
      delay: 28,
      repeat: this.fullText.length - 1,
      callback: () => {
        charIdx++;
        this.dialogText.setText(this.fullText.slice(0, charIdx));
        if (charIdx >= this.fullText.length) this.isTyping = false;
      },
    });

    // 버튼 텍스트
    const isLast = index === DIALOGS.length - 1;
    this.nextTxt.setText(isLast ? '시작! ▶' : '다음 ▶');
    this.nextBtn.setFillStyle(isLast ? 0xcc4422 : 0x44aa44);

    // 연속 입력 방지 (200ms 차단)
    this.inputBlocked = true;
    this.time.delayedCall(200, () => { this.inputBlocked = false; });
  }

  private advance() {
    if (this.inputBlocked) return;

    if (this.isTyping) {
      // 타이핑 중이면 즉시 완성
      this.typeTimer?.remove();
      this.dialogText.setText(this.fullText);
      this.isTyping = false;
      return;
    }

    if (this.step < DIALOGS.length - 1) {
      this.showStep(this.step + 1);
    } else {
      localStorage.setItem('guideShown', '1');
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('OakGuideScene');
      });
    }
  }
}
