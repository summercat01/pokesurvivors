import Phaser from 'phaser';
import { getCurrentUser } from '../lib/auth';
import { pushLocalToCloud } from '../lib/userDB';
import { getBgmVolume, getStoredInt } from '../lib/storage';

interface GameOverData {
  level:           number;
  killCount:       number;
  surviveTime:     number;
  goldEarned:      number;
  totalGold:       number;
  waveNumber:      number;
  weaponDamageLog?: Record<string, number>;
  stageId:         number;
  stageCleared:    boolean;
  maxCombo?:       number;
}

// 점수 기반 등급 (0~100)
function calcGrade(level: number, kills: number, wave: number): { grade: string; score: number; color: string; bg: number } {
  const score = Math.round((level / 20) * 40 + Math.min(kills / 400, 1) * 30 + (wave / 20) * 30);
  if (score >= 80) return { grade: 'S', score, color: '#ffd700', bg: 0x3a2800 };
  if (score >= 60) return { grade: 'A', score, color: '#dd88ff', bg: 0x280a38 };
  if (score >= 40) return { grade: 'B', score, color: '#44aaff', bg: 0x082038 };
  if (score >= 20) return { grade: 'C', score, color: '#44dd88', bg: 0x082818 };
  return               { grade: 'D', score, color: '#aaaaaa', bg: 0x181818 };
}

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(data: GameOverData) {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    const { level, killCount, goldEarned, totalGold, waveNumber, weaponDamageLog } = data;
    const surviveTime  = data.surviveTime  ?? 0;
    const stageId      = data.stageId      ?? 1;
    const stageCleared = data.stageCleared ?? false;
    const maxCombo     = data.maxCombo     ?? 0;

    // ── BGM ──────────────────────────────────────────────
    const vol    = getBgmVolume() * 0.5;
    const endKey = stageCleared ? 'bgm_clear' : 'bgm_gameover';
    if (this.cache.audio.exists(endKey)) {
      this.sound.stopAll();
      this.sound.play(endKey, { loop: false, volume: vol });
    }

    // ── 베스트 기록 ──────────────────────────────────────
    const bestWave  = getStoredInt('bestWave');
    const bestKills = getStoredInt('bestKills');
    const bestTime  = getStoredInt('bestTime');
    const bestStage = getStoredInt('bestStage');
    const newWaveRecord  = waveNumber  >= bestWave  && waveNumber  > 0;
    const newKillRecord  = killCount   >= bestKills && killCount   > 0;
    const newTimeRecord  = Math.floor(surviveTime) >= bestTime    && surviveTime > 0;
    const newStageRecord = stageCleared && stageId >= bestStage   && stageId > 0;

    const totalSec = Math.floor(surviveTime / 1000);
    const timeStr  = `${Math.floor(totalSec / 60).toString().padStart(2, '0')}:${(totalSec % 60).toString().padStart(2, '0')}`;

    // 총 피해량 계산
    const totalDmg = weaponDamageLog
      ? Object.values(weaponDamageLog).reduce((s, v) => s + v, 0)
      : 0;

    // 등급 계산
    const { grade, color: gradeColor, bg: gradeBg } = calcGrade(level, killCount, waveNumber);

    // ── 배경 ─────────────────────────────────────────────
    this.add.rectangle(CX, H / 2, W, H, 0x0c0a18);
    // 별 효과
    for (let i = 0; i < 40; i++) {
      this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 2), 0xffffff,
        Phaser.Math.FloatBetween(0.15, 0.7),
      );
    }

    // ── 레이아웃 상수 ─────────────────────────────────────
    const BTN_Y      = H - 36;
    const BTN_H      = 44;
    const BTN_W      = Math.min(156, W / 2 - 14);
    const HEADER_H   = Math.min(72, Math.round(H * 0.085));
    const HEADER_CY  = 12 + HEADER_H / 2;
    const CONTENT_T  = HEADER_CY + HEADER_H / 2 + 6;
    const CONTENT_B  = BTN_Y - BTN_H / 2 - 8;
    const CONTENT_H  = CONTENT_B - CONTENT_T;

    // ── 헤더 (클리어/게임오버 + 등급 배지) ───────────────
    const headerColor = stageCleared ? 0x1a4020 : 0x28180a;
    const headerBorderColor = stageCleared ? 0x44dd66 : 0xdd8844;
    this.add.rectangle(CX, HEADER_CY, W - 16, HEADER_H, headerColor)
      .setStrokeStyle(2, headerBorderColor);

    const headerTxt = stageCleared ? `✦  STAGE ${stageId}  클리어!  ✦` : '트레이너가 쓰러졌다!';
    const headerColor2 = stageCleared ? '#88ffaa' : '#ffcc88';
    this.add.text(CX, HEADER_CY, headerTxt, {
      fontSize: '18px', color: headerColor2, fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // 등급 배지 (오른쪽 상단)
    const BADGE_X = W - 34;
    this.add.circle(BADGE_X, HEADER_CY, 22, gradeBg).setStrokeStyle(2, parseInt(gradeColor.replace('#', ''), 16));
    const gradeObj = this.add.text(BADGE_X, HEADER_CY, grade, {
      fontSize: '22px', color: gradeColor, fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0).setAlpha(0);

    this.tweens.add({ targets: gradeObj, scaleX: 1, scaleY: 1, alpha: 1, duration: 500, delay: 300, ease: 'Back.easeOut' });

    // 헤더 텍스트 페이드인
    this.children.list.forEach(obj => {
      if (obj instanceof Phaser.GameObjects.Text && obj.alpha === 0 && obj !== gradeObj) {
        this.tweens.add({ targets: obj, alpha: 1, duration: 400, delay: 150 });
      }
    });

    // ── 콘텐츠 패널 배경 ─────────────────────────────────
    this.add.rectangle(CX, CONTENT_T + CONTENT_H / 2, W - 16, CONTENT_H, 0x13102a)
      .setStrokeStyle(2, 0x2a2448);

    // 콘텐츠를 두 섹션으로 나눔: 스탯 + 무기 딜
    const SECTION_SPLIT = CONTENT_T + CONTENT_H * 0.55;

    // ── 스탯 섹션 ─────────────────────────────────────────
    this.add.text(CX, CONTENT_T + 10, '─  결과  ─', {
      fontSize: '12px', color: '#556688',
    }).setOrigin(0.5, 0);

    const statData: { icon: string; label: string; value: string; isRecord?: boolean }[] = [
      { icon: '⏱', label: '생존 시간',  value: timeStr,                    isRecord: newTimeRecord },
      { icon: '🌊', label: '웨이브',     value: `${waveNumber} Wave`,       isRecord: newWaveRecord },
      { icon: '⭐', label: '도달 레벨', value: `Lv.${level}` },
      { icon: '✕',  label: '처치 수',   value: `${killCount.toLocaleString()}마리`, isRecord: newKillRecord },
      { icon: '💥', label: '총 피해량', value: totalDmg > 0 ? totalDmg.toLocaleString() : '-' },
      { icon: '🔥', label: '최대 콤보', value: maxCombo > 0 ? `${maxCombo} combo` : '-' },
      { icon: '★',  label: '획득 골드', value: `${goldEarned.toLocaleString()} G` },
    ];

    const STAT_START = CONTENT_T + 30;
    const STAT_GAP   = Math.max(26, Math.min(34, Math.floor((SECTION_SPLIT - STAT_START - 10) / statData.length)));
    const LX = 22;
    const RX = W - 22;

    statData.forEach((s, i) => {
      const y = STAT_START + i * STAT_GAP;
      this.add.text(LX, y, `${s.icon}  ${s.label}`, {
        fontSize: '12px', color: '#8899bb',
      }).setOrigin(0, 0.5);
      this.add.text(RX, y, s.value, {
        fontSize: '14px', color: '#ddeeff', fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      if (s.isRecord) {
        this.add.text(CX, y, 'NEW!', {
          fontSize: '10px', color: '#ff6600', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
      }
    });

    // ── 무기 딜 섹션 ─────────────────────────────────────
    this.add.graphics().lineStyle(1, 0x2a3a5a, 0.8)
      .lineBetween(LX, SECTION_SPLIT, RX, SECTION_SPLIT);

    this.add.text(LX, SECTION_SPLIT + 8, '무기 딜 순위', {
      fontSize: '11px', color: '#556688',
    }).setOrigin(0, 0);

    if (weaponDamageLog && totalDmg > 0) {
      const sorted = Object.entries(weaponDamageLog).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const medals = ['🥇', '🥈', '🥉', ''];
      const barMaxW = W - 100;
      sorted.forEach(([name, dmg], i) => {
        const ry   = SECTION_SPLIT + 26 + i * 30;
        const pct  = dmg / totalDmg;
        const barW = Math.round(pct * barMaxW);
        const barColor = [0xffcc00, 0xcccccc, 0xcc8844, 0x6688aa][i];

        // 배경 바
        this.add.rectangle(LX + barMaxW / 2, ry + 10, barMaxW, 14, 0x1a1830).setOrigin(0.5);
        // 피해량 바
        const bar = this.add.rectangle(LX, ry + 10, 0, 14, barColor, 0.7).setOrigin(0, 0.5);
        this.tweens.add({ targets: bar, width: barW, duration: 500, delay: 200 + i * 80, ease: 'Quad.easeOut' });

        // 이름
        this.add.text(LX + 4, ry + 2, `${medals[i]}  ${name}`, {
          fontSize: '11px', color: '#ccddee',
        }).setOrigin(0, 0);
        // 피해량 + 퍼센트
        this.add.text(RX, ry + 2, `${dmg.toLocaleString()}  (${Math.round(pct * 100)}%)`, {
          fontSize: '10px', color: '#9aaacc',
        }).setOrigin(1, 0);
      });
    } else {
      this.add.text(CX, SECTION_SPLIT + 40, '피해 기록 없음', {
        fontSize: '12px', color: '#445566',
      }).setOrigin(0.5);
    }

    // ── 하단: 보유 골드 / 해금 / 버튼 ───────────────────
    const FOOTER_T = CONTENT_B + 6;
    const goldY = FOOTER_T + 10;

    this.add.text(CX, goldY, `보유 골드  ✦  ${totalGold.toLocaleString()} G`, {
      fontSize: '13px', color: '#c8a020', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // 스테이지 해금 배너
    let unlockH = 0;
    if (stageCleared && stageId < 17) {
      const uy = goldY + 26;
      unlockH = 26;
      const unlockBg = this.add.rectangle(CX, uy, W - 40, 24, 0x1a4020, 0.9)
        .setStrokeStyle(1, 0x44cc66);
      this.add.text(CX, uy, `🔓  STAGE ${stageId + 1}  해금!`, {
        fontSize: '12px', color: '#88ffaa', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({ targets: unlockBg, scaleX: { from: 0, to: 1 }, duration: 450, ease: 'Back.easeOut', delay: 600 });
    }

    // 최고 스테이지 신기록 배너
    if (newStageRecord) {
      const recY = goldY + 26 + unlockH;
      this.add.text(CX, recY, `🏆  최고 스테이지 신기록!  STAGE ${stageId}`, {
        fontSize: '11px', color: '#ffd700', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0);
    }

    // ── 버튼 ─────────────────────────────────────────────
    const makeBtn = (x: number, label: string, fill: number, border: number, textColor: string, onTap: () => void) => {
      const bg = this.add.rectangle(x, BTN_Y, BTN_W, BTN_H, fill)
        .setStrokeStyle(2, border)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, BTN_Y, label, {
        fontSize: '14px', color: textColor, fontStyle: 'bold',
      }).setOrigin(0.5);
      bg.on('pointerover', () => { bg.setFillStyle(border); txt.setColor('#ffffff'); });
      bg.on('pointerout',  () => { bg.setFillStyle(fill);   txt.setColor(textColor); });
      bg.on('pointerdown', onTap);
    };

    makeBtn(CX - BTN_W / 2 - 6, '▶ 다시 도전', 0x1a3820, 0x44aa66, '#88ffaa', () => {
      this.cameras.main.fadeOut(300, 12, 10, 24);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene', { stageId }));
    });
    makeBtn(CX + BTN_W / 2 + 6, '⌂ 타이틀로', 0x18181a, 0x445566, '#aabbcc', () => {
      this.cameras.main.fadeOut(300, 12, 10, 24);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    this.cameras.main.fadeIn(500, 12, 10, 24);

    // 클라우드 동기화
    const user = getCurrentUser();
    if (user) pushLocalToCloud(user.id).catch(() => {});
  }
}
