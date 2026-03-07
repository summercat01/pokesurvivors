import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './GameScene';

interface GameOverData {
  level: number;
  killCount: number;
  surviveTime: number;
  goldEarned: number;
  totalGold:  number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData) {
    const { level, killCount, surviveTime, goldEarned, totalGold } = data;

    const totalSec = Math.floor(surviveTime / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    const timeStr = `${min}:${sec}`;

    // ── 배경 ──
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x181028);
    for (let i = 0; i < 30; i++) {
      const x    = Phaser.Math.Between(0, GAME_WIDTH);
      const y    = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
    }

    // ── 메시지 박스 ──
    const msgBoxY = GAME_HEIGHT * 0.18;
    this.add.rectangle(GAME_WIDTH / 2, msgBoxY, GAME_WIDTH - 20, 70, 0xf8f8d0)
      .setStrokeStyle(4, 0x383030);
    const msgText = this.add.text(GAME_WIDTH / 2, msgBoxY, '트레이너가\n쓰러졌다!', {
      fontSize: '22px', color: '#383030', fontStyle: 'bold',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msgText, alpha: 1, duration: 400, delay: 200 });

    // ── 결과 패널 (항목 4개로 확장) ──
    const panelY = GAME_HEIGHT * 0.50;
    this.add.rectangle(GAME_WIDTH / 2, panelY, GAME_WIDTH - 20, 260, 0xf8f8d0)
      .setStrokeStyle(4, 0x383030);
    this.add.text(GAME_WIDTH / 2, panelY - 110, '— 결과 —', {
      fontSize: '16px', color: '#383030', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.rectangle(GAME_WIDTH / 2, panelY - 88, GAME_WIDTH - 60, 2, 0x383030);

    const stats = [
      { label: '생존 시간', value: timeStr,             icon: '⏱' },
      { label: '도달 레벨', value: `Lv.${level}`,      icon: '⭐' },
      { label: '처치 수',   value: `${killCount}마리`, icon: '⚔️' },
      { label: '획득 골드', value: `${goldEarned} G`,  icon: '★' },
    ];

    stats.forEach((stat, i) => {
      const y = panelY - 62 + i * 50;
      this.add.text(30, y, `${stat.icon}  ${stat.label}`, {
        fontSize: '15px', color: '#606060',
      }).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH - 30, y, stat.value, {
        fontSize: '19px', color: '#383030', fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    });

    // ── 누적 골드 표시 (패널 하단) ──
    const totalGoldY = panelY + 112;
    this.add.rectangle(GAME_WIDTH / 2, totalGoldY, GAME_WIDTH - 60, 2, 0xc8b860);
    this.add.text(GAME_WIDTH / 2, totalGoldY + 18, `보유 골드   ★  ${totalGold} G`, {
      fontSize: '14px', color: '#9a7a10', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // ── 버튼 2개: 다시 도전 / 타이틀로 ──
    const btnY   = GAME_HEIGHT * 0.855;
    const BTN_W  = 160;
    const BTN_H  = 50;
    const CX     = GAME_WIDTH / 2;

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
  }
}
