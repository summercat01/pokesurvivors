import Phaser from 'phaser';
import { getCurrentUser } from '../lib/auth';
import { pushLocalToCloud } from '../lib/userDB';

interface GameOverData {
  level: number;
  killCount: number;
  surviveTime: number;
  goldEarned: number;
  totalGold:  number;
  waveNumber: number;
  weaponDamageLog?: Record<string, number>;
  stageId:      number;
  stageCleared: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData) {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;
    const { level, killCount, goldEarned, totalGold, waveNumber, weaponDamageLog } = data;
    const surviveTime  = data.surviveTime ?? 0;
    const stageId      = data.stageId ?? 1;
    const stageCleared = data.stageCleared ?? false;

    // BGM
    const vol = parseFloat(localStorage.getItem('bgmVolume') ?? '1') * 0.5;
    const endKey = stageCleared ? 'bgm_clear' : 'bgm_gameover';
    if (this.cache.audio.exists(endKey)) {
      this.sound.stopAll();
      this.sound.play(endKey, { loop: false, volume: vol });
    }

    // 베스트 기록
    const bestWave  = parseInt(localStorage.getItem('bestWave')  ?? '0', 10);
    const bestKills = parseInt(localStorage.getItem('bestKills') ?? '0', 10);
    const bestTime  = parseInt(localStorage.getItem('bestTime')  ?? '0', 10);
    const bestStage = parseInt(localStorage.getItem('bestStage') ?? '0', 10);
    const newWaveRecord  = waveNumber  >= bestWave  && waveNumber  > 0;
    const newKillRecord  = killCount   >= bestKills && killCount   > 0;
    const newTimeRecord  = Math.floor(surviveTime) >= bestTime    && surviveTime > 0;
    const newStageRecord = stageCleared && stageId >= bestStage   && stageId > 0;

    const totalSec = Math.floor((surviveTime ?? 0) / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    const timeStr = `${min}:${sec}`;

    // ── 배경 ──────────────────────────────────────────
    this.add.rectangle(CX, H / 2, W, H, 0x181028);
    for (let i = 0; i < 30; i++) {
      this.add.circle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8),
      );
    }

    // ── 버튼 (항상 최하단 고정) ───────────────────────
    const BTN_Y = H - 38;
    const BTN_W = Math.min(162, W / 2 - 14);
    const BTN_H = 48;

    // ── 타이틀 박스 ──────────────────────────────────
    const MSG_H  = Math.min(76, Math.round(H * 0.09));
    const MSG_CY = 16 + MSG_H / 2;
    const msgBgColor  = stageCleared ? 0xd0f8d0 : 0xf8f8d0;
    const msgTxtColor = stageCleared ? '#1a6a1a' : '#383030';
    const msgContent  = stageCleared ? `STAGE ${stageId}\n클리어!` : '트레이너가\n쓰러졌다!';

    this.add.rectangle(CX, MSG_CY, W - 20, MSG_H, msgBgColor)
      .setStrokeStyle(4, 0x383030);
    const msgText = this.add.text(CX, MSG_CY, msgContent, {
      fontSize: '22px', color: msgTxtColor, fontStyle: 'bold',
      align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msgText, alpha: 1, duration: 400, delay: 200 });

    // ── 결과 패널 (버튼 위~타이틀 아래) ──────────────
    const PANEL_TOP = MSG_CY + MSG_H / 2 + 8;
    const PANEL_BOT = BTN_Y - BTN_H / 2 - 10;
    const PANEL_H   = PANEL_BOT - PANEL_TOP;
    const panelCY   = PANEL_TOP + PANEL_H / 2;

    this.add.rectangle(CX, panelCY, W - 20, PANEL_H, 0xf8f8d0)
      .setStrokeStyle(4, 0x383030);

    // 결과 헤더
    this.add.text(CX, PANEL_TOP + 16, '— 결과 —', {
      fontSize: '15px', color: '#383030', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add.rectangle(CX, PANEL_TOP + 38, W - 60, 2, 0x383030);

    // ── 스탯 6행 ─────────────────────────────────────
    const STAT_START = PANEL_TOP + 50;
    const STAT_GAP   = Math.max(34, Math.min(44, Math.floor((PANEL_H - 180) / 6)));

    const stats = [
      { label: '최고 스테이지', value: bestStage > 0 ? `${bestStage} STAGE` : '-', icon: '🏆', isRecord: newStageRecord },
      { label: '생존 시간',     value: timeStr,               icon: '⏱', isRecord: newTimeRecord },
      { label: '도달 웨이브',   value: `${waveNumber} WAVE`,  icon: '🌊', isRecord: newWaveRecord },
      { label: '도달 레벨',     value: `Lv.${level}`,         icon: '⭐', isRecord: false },
      { label: '처치 수',       value: `${killCount}마리`,    icon: '✕',  isRecord: newKillRecord },
      { label: '획득 골드',     value: `${goldEarned} G`,     icon: '★',  isRecord: false },
    ];

    stats.forEach((stat, i) => {
      const y = STAT_START + i * STAT_GAP;
      this.add.text(28, y, `${stat.icon}  ${stat.label}`, {
        fontSize: '13px', color: '#606060',
      }).setOrigin(0, 0.5);
      this.add.text(W - 28, y, stat.value, {
        fontSize: '16px', color: '#383030', fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      if (stat.isRecord) {
        this.add.text(CX - 6, y, '신기록!', {
          fontSize: '11px', color: '#ff4400', fontStyle: 'bold',
          stroke: '#ffffff', strokeThickness: 2,
        }).setOrigin(0.5);
      }
    });

    // ── 무기 딜 순위 ──────────────────────────────────
    const RANK_TOP = STAT_START + 6 * STAT_GAP + 8;

    this.add.rectangle(CX, RANK_TOP, W - 60, 1, 0x888888, 0.6);
    this.add.text(28, RANK_TOP + 10, '무기 딜 순위', {
      fontSize: '12px', color: '#888888',
    }).setOrigin(0, 0);

    if (weaponDamageLog) {
      const sorted = Object.entries(weaponDamageLog).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const medals = ['🥇', '🥈', '🥉'];
      sorted.forEach(([name, dmg], i) => {
        const ry = RANK_TOP + 28 + i * 24;
        this.add.text(34, ry, `${medals[i]}  ${name}`, {
          fontSize: '13px', color: '#303030', fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        this.add.text(W - 28, ry, dmg.toLocaleString(), {
          fontSize: '13px', color: '#303030', fontStyle: 'bold',
        }).setOrigin(1, 0.5);
      });
    }

    // ── 보유 골드 ─────────────────────────────────────
    const GOLD_TOP = RANK_TOP + 94;

    this.add.rectangle(CX, GOLD_TOP, W - 60, 2, 0xc8b860);
    this.add.text(CX, GOLD_TOP + 12, `보유 골드   ★  ${totalGold} G`, {
      fontSize: '14px', color: '#9a7a10', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // ── 다음 스테이지 해금 알림 (클리어 시) ────────────
    if (stageCleared && stageId < 17) {
      const unlockY = GOLD_TOP + 34;
      const unlockBg = this.add.rectangle(CX, unlockY, W - 40, 26, 0x1a6a1a, 0.9)
        .setStrokeStyle(1, 0x44cc44);
      this.add.text(CX, unlockY, `🔓  STAGE ${stageId + 1}  해금!`, {
        fontSize: '13px', color: '#aaffaa', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: [unlockBg],
        scaleX: { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut',
        delay: 600,
      });
    }

    const makeBtn = (x: number, label: string, onTap: () => void) => {
      const bg = this.add.rectangle(x, BTN_Y, BTN_W, BTN_H, 0xf8f8d0)
        .setStrokeStyle(3, 0x383030)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, BTN_Y, label, {
        fontSize: '16px', color: '#383030', fontStyle: 'bold',
      }).setOrigin(0.5);
      bg.on('pointerover', () => { bg.setFillStyle(0xe8e8a0); txt.setColor('#181028'); });
      bg.on('pointerout',  () => { bg.setFillStyle(0xf8f8d0); txt.setColor('#383030'); });
      bg.on('pointerdown', onTap);
    };

    makeBtn(CX - BTN_W / 2 - 6, '▶ 다시 도전', () => {
      this.cameras.main.fadeOut(300, 24, 16, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene', { stageId }));
    });
    makeBtn(CX + BTN_W / 2 + 6, '⌂ 타이틀로', () => {
      this.cameras.main.fadeOut(300, 24, 16, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    this.cameras.main.fadeIn(500, 24, 16, 40);

    // 클라우드 동기화
    const user = getCurrentUser();
    if (user) {
      pushLocalToCloud(user.id).catch(e => console.warn('[GameOver] cloud sync failed:', e));
    }
  }
}
