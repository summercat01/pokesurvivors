/**
 * PokeUI.ts — 포켓몬 스타일 UI 공통 유틸
 *
 * 사용법:
 *   import { PokeUI } from '../ui/PokeUI';
 *   PokeUI.panel(this, cx, cy, w, h);
 *   PokeUI.dialog(this, cx, cy, w, h);
 */

export const POKE_FONT = "'DungGeunMo', 'Press Start 2P', monospace";
export const POKE_FONT_EN = "'Press Start 2P', monospace";

/** 포켓몬 UI 색상 팔레트 */
export const PokePalette = {
  panelBg:      0xf0f0e0,  // 크림 흰색 (패널 배경)
  panelBorder:  0x282018,  // 진한 갈색-검정 (외곽선)
  panelHighlight: 0xffffff, // 상단/좌측 하이라이트
  panelShadow:  0xa8a898,  // 하단/우측 그림자 라인
  dialogBg:     0xf8f8f0,  // 대화창 배경 (더 흰색)
  headerBg:     0x3050a0,  // 파란 헤더
  btnNormal:    0xe8e0d0,  // 버튼 기본
  btnHover:     0xc8d8f8,  // 버튼 호버
  btnPressed:   0xa8b8d8,  // 버튼 눌림
  btnDanger:    0xcc3311,  // 위험 버튼 (빨강)
  btnPrimary:   0x2255aa,  // 주요 버튼 (파랑)
  hpGreen:      0x58c840,  // HP바 초록
  hpYellow:     0xe8c000,  // HP바 노랑
  hpRed:        0xd01818,  // HP바 빨강
  hpBg:         0x282018,  // HP바 배경
  textDark:     '#181810', // 기본 텍스트 (어두운 갈색)
  textGray:     '#484838', // 보조 텍스트
  textWhite:    '#ffffff', // 흰 텍스트 (어두운 배경용)
  textGold:     '#8a6000', // 골드 텍스트
};

export class PokeUI {
  /**
   * 기본 포켓몬 패널
   * 검정 외곽선 + 입체감 있는 배경
   */
  static panel(
    scene: Phaser.Scene,
    cx: number, cy: number,
    w: number, h: number,
    bgColor = PokePalette.panelBg,
    depth = 0,
  ): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics().setDepth(depth);
    const x = cx - w / 2;
    const y = cy - h / 2;

    // 그림자
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 4, y + 4, w, h);

    // 외곽 (두꺼운 검정)
    g.fillStyle(PokePalette.panelBorder);
    g.fillRect(x, y, w, h);

    // 메인 배경
    g.fillStyle(bgColor);
    g.fillRect(x + 3, y + 3, w - 6, h - 6);

    // 상단/좌측 하이라이트
    g.fillStyle(PokePalette.panelHighlight, 0.7);
    g.fillRect(x + 3, y + 3, w - 6, 2);
    g.fillRect(x + 3, y + 3, 2, h - 6);

    // 하단/우측 그림자 라인
    g.fillStyle(0x000000, 0.15);
    g.fillRect(x + 3, y + h - 5, w - 6, 2);
    g.fillRect(x + w - 5, y + 3, 2, h - 6);

    return g;
  }

  /**
   * 포켓몬 대화창 (하단 고정형)
   * 더 두꺼운 테두리, 더 흰 배경
   */
  static dialog(
    scene: Phaser.Scene,
    cx: number, cy: number,
    w: number, h: number,
    depth = 0,
  ): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics().setDepth(depth);
    const x = cx - w / 2;
    const y = cy - h / 2;

    // 그림자
    g.fillStyle(0x000000, 0.4);
    g.fillRect(x + 5, y + 5, w, h);

    // 외곽 (4px 두꺼운 검정)
    g.fillStyle(PokePalette.panelBorder);
    g.fillRect(x, y, w, h);

    // 흰 안쪽 테두리
    g.fillStyle(0xffffff);
    g.fillRect(x + 4, y + 4, w - 8, h - 8);

    // 메인 배경 (안쪽 테두리 안)
    g.fillStyle(PokePalette.dialogBg);
    g.fillRect(x + 6, y + 6, w - 12, h - 12);

    return g;
  }

  /**
   * 포켓몬 버튼
   * 눌렸을 때 offset으로 이동하는 효과
   */
  static button(
    scene: Phaser.Scene,
    cx: number, cy: number,
    w: number, h: number,
    color = PokePalette.btnNormal,
    depth = 0,
  ): { bg: Phaser.GameObjects.Graphics; hit: Phaser.GameObjects.Rectangle } {
    const g = scene.add.graphics().setDepth(depth);
    const x = cx - w / 2;
    const y = cy - h / 2;

    // 버튼 그림자 (아래 오프셋)
    g.fillStyle(PokePalette.panelBorder);
    g.fillRect(x + 2, y + 4, w, h);

    // 버튼 본체
    g.fillStyle(color);
    g.fillRect(x, y, w, h);

    // 상단 하이라이트
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(x, y, w, 3);

    // 외곽선
    g.lineStyle(2, PokePalette.panelBorder);
    g.strokeRect(x, y, w, h);

    const hit = scene.add.rectangle(cx, cy, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 1);

    return { bg: g, hit };
  }

  /**
   * 포켓몬 HP바
   * label: 'HP' 텍스트 포함
   */
  static hpBar(
    scene: Phaser.Scene,
    x: number, y: number,
    totalW: number, h: number,
    ratio: number,
    showLabel = true,
    depth = 0,
  ): { bar: Phaser.GameObjects.Rectangle; track: Phaser.GameObjects.Graphics } {
    const g = scene.add.graphics().setDepth(depth);
    const barX = showLabel ? x + 28 : x;
    const barW = showLabel ? totalW - 28 : totalW;

    if (showLabel) {
      scene.add.text(x, y, 'HP', {
        fontFamily: POKE_FONT,
        fontSize: `${Math.max(8, h + 2)}px`,
        color: PokePalette.textDark,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setDepth(depth + 1);
    }

    // 트랙 (배경)
    g.fillStyle(PokePalette.hpBg);
    g.fillRect(barX, y - h / 2 - 1, barW + 2, h + 2);

    // 초록 채움
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const barColor = clampedRatio > 0.5
      ? PokePalette.hpGreen
      : clampedRatio > 0.2
        ? PokePalette.hpYellow
        : PokePalette.hpRed;

    const bar = scene.add.rectangle(barX, y, barW * clampedRatio, h, barColor)
      .setOrigin(0, 0.5)
      .setDepth(depth + 2);

    return { bar, track: g };
  }

  /**
   * 타입 배지 (포켓몬 타입 라벨)
   */
  static typeBadge(
    scene: Phaser.Scene,
    cx: number, cy: number,
    label: string,
    color: number,
    depth = 0,
  ): void {
    const w = Math.max(52, label.length * 10 + 16);
    const h = 18;
    const g = scene.add.graphics().setDepth(depth);

    // 그림자
    g.fillStyle(0x000000, 0.4);
    g.fillRect(cx - w / 2 + 1, cy - h / 2 + 2, w, h);

    // 배지 본체
    g.fillStyle(color);
    g.fillRect(cx - w / 2, cy - h / 2, w, h);

    // 상단 하이라이트
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(cx - w / 2, cy - h / 2, w, 3);

    // 외곽선
    g.lineStyle(1, PokePalette.panelBorder, 0.8);
    g.strokeRect(cx - w / 2, cy - h / 2, w, h);

    scene.add.text(cx, cy, label, {
      fontFamily: POKE_FONT,
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5).setDepth(depth + 1);
  }

  /**
   * 타이핑 효과 텍스트 (한 글자씩 출력)
   * 완료 시 onComplete 콜백 호출
   */
  static typewriter(
    scene: Phaser.Scene,
    textObj: Phaser.GameObjects.Text,
    fullText: string,
    speed = 40,
    onComplete?: () => void,
  ): Phaser.Time.TimerEvent {
    let i = 0;
    textObj.setText('');
    const timer = scene.time.addEvent({
      delay: speed,
      repeat: fullText.length - 1,
      callback: () => {
        i++;
        textObj.setText(fullText.slice(0, i));
        if (i >= fullText.length && onComplete) onComplete();
      },
    });
    return timer;
  }

  /**
   * ▼ 깜빡이는 커서 (대화 계속 표시)
   */
  static blinkCursor(
    scene: Phaser.Scene,
    x: number, y: number,
    depth = 0,
  ): Phaser.GameObjects.Text {
    const cursor = scene.add.text(x, y, '▼', {
      fontFamily: POKE_FONT,
      fontSize: '12px',
      color: PokePalette.textDark,
    }).setOrigin(0.5).setDepth(depth);

    scene.tweens.add({
      targets: cursor,
      alpha: 0,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    return cursor;
  }

  /**
   * 섹션 구분선
   */
  static divider(
    scene: Phaser.Scene,
    x1: number, y: number, x2: number,
    depth = 0,
  ): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics().setDepth(depth);
    g.lineStyle(1, PokePalette.panelBorder, 0.25);
    g.lineBetween(x1, y, x2, y);
    return g;
  }
}
