import Phaser from 'phaser';
import { getCurrentUser } from '../lib/auth';
import { pushLocalToCloud } from '../lib/userDB';
import { getBgmVolume, getStoredInt } from '../lib/storage';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';

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
  if (score >= 80) return { grade: 'S', score, color: '#c8a020', bg: 0xfff8d0 };
  if (score >= 60) return { grade: 'A', score, color: '#8833aa', bg: 0xf0e0f8 };
  if (score >= 40) return { grade: 'B', score, color: '#2255aa', bg: 0xe0e8f8 };
  if (score >= 20) return { grade: 'C', score, color: '#228833', bg: 0xe0f0e8 };
  return               { grade: 'D', score, color: '#886644', bg: 0xf0ece0 };
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
    this.add.rectangle(CX, H / 2, W, H, 0x181820);
    // 별 효과
    for (let i = 0; i < 30; i++) {
      this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 2), 0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.5),
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

    // ── 헤더 (포켓몬 스타일) ───────────────
    const headerBg = stageCleared ? 0x3050a0 : 0x802010;
    PokeUI.panel(this, CX, HEADER_CY, W - 16, HEADER_H, headerBg);

    const headerTxt = stageCleared ? `✦  STAGE ${stageId}  클리어!  ✦` : '트레이너가 쓰러졌다!';
    this.add.text(CX, HEADER_CY, headerTxt, {
      fontFamily: POKE_FONT, fontSize: '16px', color: PokePalette.textWhite, fontStyle: 'bold',
      stroke: '#101020', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // 등급 배지 (포켓몬 스타일 태그)
    const BADGE_X = W - 38;
    const badgeG = this.add.graphics();
    badgeG.fillStyle(PokePalette.panelBorder); badgeG.fillRect(BADGE_X - 21, HEADER_CY - 21, 42, 42);
    badgeG.fillStyle(parseInt(gradeBg.toString(16).padStart(6, '0'), 16) || gradeBg);
    badgeG.fillRect(BADGE_X - 20, HEADER_CY - 20, 40, 40);
    const gradeObj = this.add.text(BADGE_X, HEADER_CY, grade, {
      fontFamily: POKE_FONT, fontSize: '20px', color: gradeColor, fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0).setAlpha(0);

    this.tweens.add({ targets: gradeObj, scaleX: 1, scaleY: 1, alpha: 1, duration: 500, delay: 300, ease: 'Back.easeOut' });

    // 헤더 텍스트 페이드인
    this.children.list.forEach(obj => {
      if (obj instanceof Phaser.GameObjects.Text && obj.alpha === 0 && obj !== gradeObj) {
        this.tweens.add({ targets: obj, alpha: 1, duration: 400, delay: 150 });
      }
    });

    // ── 콘텐츠 패널 배경 (포켓몬 스타일) ─────────────────────────────────
    PokeUI.panel(this, CX, CONTENT_T + CONTENT_H / 2, W - 16, CONTENT_H, PokePalette.panelBg);

    // 콘텐츠를 두 섹션으로 나눔: 스탯 + 무기 딜
    const SECTION_SPLIT = CONTENT_T + CONTENT_H * 0.55;

    // ── 스탯 섹션 ─────────────────────────────────────────
    this.add.text(CX, CONTENT_T + 10, '─  결과  ─', {
      fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray,
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
        fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray,
      }).setOrigin(0, 0.5);
      this.add.text(RX, y, s.value, {
        fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textDark, fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      if (s.isRecord) {
        this.add.text(CX, y, 'NEW!', {
          fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.btnDanger === 0xcc3311 ? '#cc3311' : '#cc3311', fontStyle: 'bold',
        }).setOrigin(0.5);
      }
    });

    // ── 무기 딜 섹션 ─────────────────────────────────────
    PokeUI.divider(this, LX, SECTION_SPLIT, RX);

    this.add.text(LX, SECTION_SPLIT + 8, '무기 딜 순위', {
      fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.textGray,
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
        this.add.rectangle(LX + barMaxW / 2, ry + 10, barMaxW, 12, PokePalette.hpBg).setOrigin(0.5);
        // 피해량 바
        const bar = this.add.rectangle(LX, ry + 10, 0, 12, barColor, 0.85).setOrigin(0, 0.5);
        this.tweens.add({ targets: bar, width: barW, duration: 500, delay: 200 + i * 80, ease: 'Quad.easeOut' });

        // 이름
        this.add.text(LX + 4, ry + 2, `${medals[i]}  ${name}`, {
          fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.textDark,
        }).setOrigin(0, 0);
        // 피해량 + 퍼센트
        this.add.text(RX, ry + 2, `${dmg.toLocaleString()}  (${Math.round(pct * 100)}%)`, {
          fontFamily: POKE_FONT, fontSize: '8px', color: PokePalette.textGray,
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
      fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textGold, fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // 스테이지 해금 배너
    let unlockH = 0;
    if (stageCleared && stageId < 17) {
      const uy = goldY + 26;
      unlockH = 26;
      const unlockBg = this.add.rectangle(CX, uy, W - 40, 24, 0xe8f0e8)
        .setStrokeStyle(1, 0x228833);
      this.add.text(CX, uy, `🔓  STAGE ${stageId + 1}  해금!`, {
        fontFamily: POKE_FONT, fontSize: '10px', color: '#228833', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({ targets: unlockBg, scaleX: { from: 0, to: 1 }, duration: 450, ease: 'Back.easeOut', delay: 600 });
    }

    // 최고 스테이지 신기록 배너
    if (newStageRecord) {
      const recY = goldY + 26 + unlockH;
      this.add.text(CX, recY, `🏆  최고 스테이지 신기록!  STAGE ${stageId}`, {
        fontFamily: POKE_FONT, fontSize: '9px', color: PokePalette.textGold, fontStyle: 'bold',
      }).setOrigin(0.5, 0);
    }

    // ── 버튼 ─────────────────────────────────────────────
    const makeBtn = (x: number, label: string, fill: number, hoverFill: number, textColor: string, onTap: () => void) => {
      const { bg, hit } = PokeUI.button(this, x, BTN_Y, BTN_W, BTN_H, fill);
      const txt = this.add.text(x, BTN_Y, label, {
        fontFamily: POKE_FONT, fontSize: '12px', color: textColor, padding: { top: 4 },
      }).setOrigin(0.5);
      hit.on('pointerover', () => bg.clear().fillStyle(hoverFill).fillRect(x - BTN_W/2, BTN_Y - BTN_H/2, BTN_W, BTN_H));
      hit.on('pointerout',  () => bg.clear().fillStyle(fill).fillRect(x - BTN_W/2, BTN_Y - BTN_H/2, BTN_W, BTN_H));
      hit.on('pointerdown', onTap);
    };

    makeBtn(CX - BTN_W / 2 - 6, '▶ 다시 도전', PokePalette.btnPrimary, 0x3366cc, PokePalette.textWhite, () => {
      this.cameras.main.fadeOut(300, 12, 10, 24);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene', { stageId }));
    });
    makeBtn(CX + BTN_W / 2 + 6, '⌂ 타이틀로', PokePalette.btnNormal, PokePalette.btnHover, PokePalette.textDark, () => {
      this.cameras.main.fadeOut(300, 12, 10, 24);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    this.cameras.main.fadeIn(500, 12, 10, 24);

    // 클라우드 동기화
    const user = getCurrentUser();
    if (user) pushLocalToCloud(user.id).catch(() => {});
  }
}
