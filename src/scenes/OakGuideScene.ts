import Phaser from 'phaser';
import { getBgmVolume } from '../lib/storage';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';

interface DialogStep {
  text: string;
}

const DIALOGS: DialogStep[] = [
  {
    text: '안녕하세요!\n저는 포켓몬 연구소의 오박사입니다.\n이 세계에서 살아남으려면\n포켓몬의 힘이 필요합니다!\n잠시 제 이야기를 들어주세요.',
  },
  {
    text: '【 이동 】\n화면을 터치하면 가상 조이스틱이 나타납니다.\n조이스틱으로 트레이너를 조종하세요.\n\n키보드: WASD 또는 방향키\nESC / P: 일시정지',
  },
  {
    text: '【 자동 공격 & 레벨업 】\n파트너 포켓몬이 자동으로 공격합니다!\n\n쓰러진 적에서 경험치 구슬이 떨어집니다.\n구슬을 모으면 레벨업!\n새 포켓몬을 얻거나 기존 기술을 강화하고\n장신구 슬롯에 타입 돌을 끼울 수 있습니다.',
  },
  {
    text: '【 타입 상성 & 장신구 】\n약점 타입으로 공격하면 1.5배 데미지!\n예) 물→불꽃, 전기→물, 풀→바위\n\n장신구(타입 돌)는 공격력·범위·쿨다운 등\n다양한 스탯을 강화해줍니다.\n최대 6개까지 장착 가능합니다.',
  },
  {
    text: '【 골드 & 영구 업그레이드 】\n일반 적을 쓰러뜨리면 골드를 얻습니다.\n(엘리트·보스는 몬스터볼로 대체)\n\n게임 종료 후 메인 메뉴의 업그레이드 상점에서\n공격력·체력·쿨다운 등을 영구적으로 강화하세요!\n강화 효과는 모든 게임에 적용됩니다.',
  },
  {
    text: '자, 이제 준비됐나요?\n\n포켓몬과 함께 끝까지 살아남으세요!\n\n행운을 빕니다, 트레이너!',
  },
];

export class OakGuideScene extends Phaser.Scene {
  private step = 0;
  private dialogText!: Phaser.GameObjects.Text;
  private prevBtn!: Phaser.GameObjects.Rectangle;
  private prevTxt!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Rectangle;
  private nextTxt!: Phaser.GameObjects.Text;
  private stepDots: Phaser.GameObjects.Arc[] = [];
  private isTyping = false;
  private fullText = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private inputBlocked = false;
  private dontShowAgain = false;
  private checkBox!: Phaser.GameObjects.Rectangle;
  private disclaimerText!: Phaser.GameObjects.Text;
  private checkMark!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'OakGuideScene' });
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    // BGM (locked이면 unlock 후 재생)
    const vol = getBgmVolume() * 0.5;
    const playOakBgm = () => {
      if (this.cache.audio.exists('bgm_oak')) {
        this.sound.stopAll();
        this.sound.play('bgm_oak', { loop: true, volume: vol });
      }
    };
    if ((this.sound as any).locked) {
      this.sound.once('unlocked', playOakBgm);
    } else {
      playOakBgm();
    }
    this.events.once('shutdown', () => { this.sound.stopByKey('bgm_oak'); });

    // ── 반투명 배경 (interactive로 뒤 씬 입력 차단) ──
    this.add.rectangle(CX, H / 2, W, H, 0x000000, 0.88).setInteractive();

    // ── 헤더 (포켓몬 스타일) ──
    PokeUI.panel(this, CX, 36, W - 4, 66, PokePalette.headerBg);
    this.add.text(CX, 24, '포켓몬 서바이버즈', {
      fontFamily: POKE_FONT, fontSize: '10px', color: '#aaccff',
    }).setOrigin(0.5);
    this.add.text(CX, 46, '트레이너 가이드', {
      fontFamily: POKE_FONT, fontSize: '16px', color: PokePalette.textWhite, fontStyle: 'bold',
      stroke: '#101840', strokeThickness: 3,
    }).setOrigin(0.5);

    // ── 오박사 초상화 ──
    const PORTRAIT_CX = CX;
    const PORTRAIT_CY = 195;
    const PORTRAIT_W  = 150;
    const PORTRAIT_H  = 170;

    // 초상화 배경 (포켓몬 스타일 패널)
    PokeUI.panel(this, PORTRAIT_CX, PORTRAIT_CY, PORTRAIT_W + 8, PORTRAIT_H + 8, 0xf0f8e8);

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
    const DOT_Y     = PORTRAIT_CY + PORTRAIT_H / 2 + 20;
    const dotGap    = 14;
    const dotStartX = CX - (DIALOGS.length - 1) * dotGap / 2;
    for (let i = 0; i < DIALOGS.length; i++) {
      const dot = this.add.arc(dotStartX + i * dotGap, DOT_Y, 4, 0, 360, false, PokePalette.panelShadow);
      this.stepDots.push(dot);
    }

    // ── 대화창 (포켓몬 정통 대화창) ──
    const BOX_TOP = DOT_Y + 16;
    const BOX_H   = H - BOX_TOP - 50;
    const BOX_L   = 12;
    const BOX_R   = W - 12;
    const BOX_W   = BOX_R - BOX_L;
    const BOX_CY  = BOX_TOP + BOX_H / 2;

    PokeUI.dialog(this, CX, BOX_CY, BOX_W, BOX_H);

    // 화자 배지 (포켓몬 스타일 헤더 태그)
    const badgeG = this.add.graphics();
    badgeG.fillStyle(PokePalette.panelBorder); badgeG.fillRect(BOX_L + 1, BOX_TOP - 26 + 1, 90, 24);
    badgeG.fillStyle(PokePalette.headerBg);    badgeG.fillRect(BOX_L, BOX_TOP - 27, 90, 24);
    badgeG.fillStyle(0xffffff, 0.3);           badgeG.fillRect(BOX_L, BOX_TOP - 27, 90, 3);
    this.add.text(BOX_L + 45, BOX_TOP - 15, '오박사', {
      fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textWhite, fontStyle: 'bold',
    }).setOrigin(0.5);

    // 대화 텍스트
    this.dialogText = this.add.text(BOX_L + 16, BOX_TOP + 22, '', {
      fontFamily: POKE_FONT,
      fontSize: '13px',
      color: PokePalette.textDark,
      lineSpacing: 8,
      wordWrap: { width: BOX_W - 40 },
    });

    // ── 버튼 행 ──
    const BTN_Y = BOX_TOP + BOX_H - 28;
    const CB_Y  = BTN_Y - 38;

    // 이전 버튼 (포켓몬 스타일)
    this.prevBtn = this.add.rectangle(CX - 66, BTN_Y, 110, 30, PokePalette.btnNormal)
      .setInteractive({ useHandCursor: true });
    // 버튼 테두리
    this.add.graphics().lineStyle(2, PokePalette.panelBorder).strokeRect(CX - 66 - 55, BTN_Y - 15, 110, 30);
    this.prevTxt = this.add.text(CX - 66, BTN_Y, '◀ 이전', {
      fontFamily: POKE_FONT, fontSize: '12px', color: PokePalette.textGray,
      padding: { top: 4 },
    }).setOrigin(0.5);
    this.prevBtn.on('pointerover', () => { if (this.step > 0) this.prevBtn.setFillStyle(PokePalette.btnHover); });
    this.prevBtn.on('pointerout',  () => { if (this.step > 0) this.prevBtn.setFillStyle(PokePalette.btnNormal); });
    this.prevBtn.on('pointerdown', () => this.goBack());

    // 다음 버튼
    this.nextBtn = this.add.rectangle(CX + 66, BTN_Y, 110, 30, PokePalette.btnPrimary)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder).strokeRect(CX + 66 - 55, BTN_Y - 15, 110, 30);
    this.nextTxt = this.add.text(CX + 66, BTN_Y, '다음 ▶', {
      fontFamily: POKE_FONT, fontSize: '12px', color: PokePalette.textWhite,
      padding: { top: 4 },
    }).setOrigin(0.5);
    this.nextBtn.on('pointerover', () => this.nextBtn.setFillStyle(0x3366cc));
    this.nextBtn.on('pointerout',  () => this.nextBtn.setFillStyle(this.step === DIALOGS.length - 1 ? PokePalette.btnDanger : PokePalette.btnPrimary));
    this.nextBtn.on('pointerdown', () => this.advance());

    // ── 다시 보지 않기 체크박스 ──
    const cbX = BOX_L + 16;
    this.checkBox = this.add.rectangle(cbX + 9, CB_Y, 18, 18, PokePalette.panelBg)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, PokePalette.panelBorder).strokeRect(cbX, CB_Y - 9, 18, 18);
    this.checkMark = this.add.text(cbX + 9, CB_Y, '', {
      fontFamily: POKE_FONT, fontSize: '11px', color: '#228822', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cbX + 26, CB_Y, '다시 보지 않기', {
      fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray,
    }).setOrigin(0, 0.5);

    this.checkBox.on('pointerdown', () => {
      this.dontShowAgain = !this.dontShowAgain;
      this.checkMark.setText(this.dontShowAgain ? '✓' : '');
      this.checkBox.setFillStyle(this.dontShowAgain ? 0xcceecc : 0xffffff);
    });

    // ── 법적 고지 (마지막 스텝에만 표시) ──
    this.disclaimerText = this.add.text(CX, CB_Y - 28, '본 게임은 포켓몬 팬 게임으로, 어떠한 수익도 창출하지 않으며\n닌텐도 / 포켓몬컴퍼니 / GAME FREAK과 무관합니다.', {
      fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.textGray, align: 'center',
      lineSpacing: 4,
      wordWrap: { width: BOX_W - 32 },
    }).setOrigin(0.5, 1).setVisible(false);

    this.showStep(0);
  }

  private showStep(index: number) {
    this.step     = index;
    this.fullText = DIALOGS[index].text;

    // 도트 갱신
    this.stepDots.forEach((d, i) =>
      d.setFillStyle(i === index ? PokePalette.headerBg : i < index ? 0x3366aa : PokePalette.panelShadow),
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

    // 다음 버튼
    const isLast = index === DIALOGS.length - 1;
    this.nextTxt.setText(isLast ? '시작! ▶' : '다음 ▶');
    this.nextBtn.setFillStyle(isLast ? PokePalette.btnDanger : PokePalette.btnPrimary);
    this.disclaimerText.setVisible(isLast);

    // 이전 버튼 (첫 스텝이면 흐리게)
    const isFirst = index === 0;
    this.prevBtn.setFillStyle(isFirst ? PokePalette.panelShadow : PokePalette.btnNormal);
    this.prevTxt.setColor(isFirst ? '#b0b0a0' : PokePalette.textDark);
    this.prevBtn.setInteractive(isFirst ? false : { useHandCursor: true });

    // 연속 입력 방지 (200ms 차단)
    this.inputBlocked = true;
    this.time.delayedCall(200, () => { this.inputBlocked = false; });
  }

  private goBack() {
    if (this.inputBlocked || this.step === 0) return;
    if (this.isTyping) {
      this.typeTimer?.remove();
      this.dialogText.setText(this.fullText);
      this.isTyping = false;
      return;
    }
    this.showStep(this.step - 1);
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
      if (this.dontShowAgain) {
        localStorage.setItem('guideShown', '1');
      }
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('OakGuideScene');
      });
    }
  }
}
