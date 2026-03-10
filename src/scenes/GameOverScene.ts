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
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData) {
    const W = this.scale.width;
    const H = this.scale.height;
    const { level, killCount, surviveTime, goldEarned, totalGold, waveNumber, weaponDamageLog } = data;

    // 베스트 기록 읽기 (triggerGameOver에서 이미 갱신됨)
    const bestWave  = parseInt(localStorage.getItem('bestWave')  ?? '0', 10);
    const bestKills = parseInt(localStorage.getItem('bestKills') ?? '0', 10);
    const bestTime  = parseInt(localStorage.getItem('bestTime')  ?? '0', 10);
    const newWaveRecord  = waveNumber  >= bestWave  && waveNumber  > 0;
    const newKillRecord  = killCount   >= bestKills && killCount   > 0;
    const newTimeRecord  = Math.floor(surviveTime) >= bestTime    && surviveTime > 0;

    const totalSec = Math.floor(surviveTime / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    const timeStr = `${min}:${sec}`;

    // ── 배경 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x181028);
    for (let i = 0; i < 30; i++) {
      const x    = Phaser.Math.Between(0, W);
      const y    = Phaser.Math.Between(0, H);
      const size = Phaser.Math.Between(1, 3);
      this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
    }

    // ── 메시지 박스 ──
    const msgBoxY = H * 0.18;
    this.add.rectangle(W / 2, msgBoxY, W - 20, 70, 0xf8f8d0)
      .setStrokeStyle(4, 0x383030);
    const msgText = this.add.text(W / 2, msgBoxY, '트레이너가\n쓰러졌다!', {
      fontSize: '22px', color: '#383030', fontStyle: 'bold',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msgText, alpha: 1, duration: 400, delay: 200 });

    // ── 결과 패널 (항목 5개) ──
    const panelY = H * 0.50;
    this.add.rectangle(W / 2, panelY, W - 20, 360, 0xf8f8d0)
      .setStrokeStyle(4, 0x383030);
    this.add.text(W / 2, panelY - 130, '— 결과 —', {
      fontSize: '16px', color: '#383030', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.rectangle(W / 2, panelY - 108, W - 60, 2, 0x383030);

    const stats = [
      { label: '생존 시간', value: timeStr,               icon: '⏱', isRecord: newTimeRecord },
      { label: '도달 웨이브', value: `${waveNumber} WAVE`, icon: '🌊', isRecord: newWaveRecord },
      { label: '도달 레벨', value: `Lv.${level}`,         icon: '⭐', isRecord: false },
      { label: '처치 수',   value: `${killCount}마리`,    icon: '⚔', isRecord: newKillRecord },
      { label: '획득 골드', value: `${goldEarned} G`,     icon: '★', isRecord: false },
    ];

    stats.forEach((stat, i) => {
      const y = panelY - 82 + i * 46;
      this.add.text(30, y, `${stat.icon}  ${stat.label}`, {
        fontSize: '14px', color: '#606060',
      }).setOrigin(0, 0.5);
      this.add.text(W - 30, y, stat.value, {
        fontSize: '18px', color: '#383030', fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      if (stat.isRecord) {
        this.add.text(W / 2 - 10, y, '신기록!', {
          fontSize: '11px', color: '#ff4400', fontStyle: 'bold',
          stroke: '#ffffff', strokeThickness: 2,
        }).setOrigin(0.5);
      }
    });

    // ── 무기 딜 순위 (패널 하단) ──
    const dmgRankY = panelY + 112;
    this.add.rectangle(W / 2, dmgRankY, W - 60, 1, 0x888888, 0.5);
    this.add.text(30, dmgRankY + 8, '무기 딜 순위', {
      fontSize: '11px', color: '#888888',
    }).setOrigin(0, 0);

    if (weaponDamageLog) {
      const sorted = Object.entries(weaponDamageLog).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const medals = ['🥇', '🥈', '🥉'];
      sorted.forEach(([name, dmg], i) => {
        const ry = dmgRankY + 24 + i * 20;
        this.add.text(36, ry, `${medals[i]}  ${name}`, {
          fontSize: '13px', color: '#303030', fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        this.add.text(W - 30, ry, dmg.toLocaleString(), {
          fontSize: '13px', color: '#303030', fontStyle: 'bold',
        }).setOrigin(1, 0.5);
      });
    }

    // ── 누적 골드 표시 (패널 하단) ──
    const totalGoldY = panelY + 148;
    this.add.rectangle(W / 2, totalGoldY, W - 60, 2, 0xc8b860);
    this.add.text(W / 2, totalGoldY + 18, `보유 골드   ★  ${totalGold} G`, {
      fontSize: '14px', color: '#9a7a10', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // ── 버튼 2개: 다시 도전 / 타이틀로 ──
    const btnY   = H * 0.855;
    const BTN_W  = 160;
    const BTN_H  = 50;
    const CX     = W / 2;

    const makeBtn = (x: number, label: string, onTap: () => void) => {
      const bg = this.add.rectangle(x, btnY, BTN_W, BTN_H, 0xf8f8d0)
        .setStrokeStyle(3, 0x383030)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, btnY, label, {
        fontSize: '16px', color: '#383030', fontStyle: 'bold',
      }).setOrigin(0.5);
      bg.on('pointerover', () => { bg.setFillStyle(0xe8e8a0); txt.setColor('#181028'); });
      bg.on('pointerout',  () => { bg.setFillStyle(0xf8f8d0); txt.setColor('#383030'); });
      bg.on('pointerdown', onTap);
    };

    makeBtn(CX - BTN_W / 2 - 8, '▶ 다시 도전', () => {
      this.cameras.main.fadeOut(300, 24, 16, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });
    makeBtn(CX + BTN_W / 2 + 8, '⌂ 타이틀로', () => {
      this.cameras.main.fadeOut(300, 24, 16, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    });

    this.cameras.main.fadeIn(500, 24, 16, 40);

    // 로그인 상태면 클라우드에 기록 동기화
    const user = getCurrentUser();
    if (user) {
      pushLocalToCloud(user.id).catch(e => console.warn('[GameOver] cloud sync failed:', e));
    }
  }
}
