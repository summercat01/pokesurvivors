import Phaser from 'phaser';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  best_stage: number;
  best_time: number;
}

export class RankingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RankingScene' });
  }

  async create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    // ── 배경 ──
    this.add.rectangle(0, 0, W, H, 0x0d1a2e).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a3050, 0.4);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // ── 헤더 ──
    this.add.text(CX, 36, '🏆 랭킹', {
      fontSize: '24px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(CX, 68, '최고 스테이지 · 최고 시간 기준', {
      fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(10);

    // ── 뒤로 버튼 ──
    const backY  = H - 44;
    const backBg = this.add.rectangle(CX, backY, 160, 40, 0x222233)
      .setDepth(10).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(1, 0x445566)
      .strokeRect(CX - 80, backY - 20, 160, 40).setDepth(10);
    const backTxt = this.add.text(CX, backY, '← 뒤로', {
      fontSize: '15px', color: '#aaaacc', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    backBg.on('pointerover', () => { backBg.setFillStyle(0x333355); backTxt.setColor('#ffffff'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x222233); backTxt.setColor('#aaaacc'); });
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    // ── 컬럼 헤더 ──
    const TABLE_TOP = 90;
    const ROW_H     = 52;
    this.add.rectangle(CX, TABLE_TOP + 18, W - 20, 36, 0x1a2840).setDepth(5);
    this.add.text(28,       TABLE_TOP + 18, '순위',     { fontSize: '12px', color: '#7788aa', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(72,       TABLE_TOP + 18, '닉네임',   { fontSize: '12px', color: '#7788aa', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(W - 140,  TABLE_TOP + 18, '스테이지', { fontSize: '12px', color: '#7788aa', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(W - 28,   TABLE_TOP + 18, '시간',     { fontSize: '12px', color: '#7788aa', fontStyle: 'bold' }).setOrigin(1, 0.5).setDepth(6);

    // ── 로딩 텍스트 ──
    const loadingTxt = this.add.text(CX, H / 2, '불러오는 중...', {
      fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ── 데이터 fetch ──
    const currentUser = getCurrentUser();
    let entries: LeaderboardEntry[] = [];
    let fetchError = false;

    try {
      const { data, error } = await supabase.rpc('get_leaderboard');
      if (error) { fetchError = true; }
      else { entries = (data as LeaderboardEntry[]) ?? []; }
    } catch {
      fetchError = true;
    }

    loadingTxt.destroy();

    if (fetchError || entries.length === 0) {
      this.add.text(CX, H / 2, fetchError ? '랭킹을 불러올 수 없습니다.' : '아직 기록이 없습니다.', {
        fontSize: '15px', color: '#888888', align: 'center',
      }).setOrigin(0.5);
      return;
    }

    // ── 스크롤 영역 ──
    const SCROLL_TOP = TABLE_TOP + 36;
    const SCROLL_BOT = backY - 16;
    const viewH      = SCROLL_BOT - SCROLL_TOP;
    const totalH     = entries.length * ROW_H;
    const maxScroll  = Math.max(0, totalH - viewH);

    const maskGfx = this.add.graphics();
    maskGfx.fillRect(0, SCROLL_TOP, W, viewH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskGfx);

    const container = this.add.container(0, SCROLL_TOP);
    container.setMask(mask);

    entries.forEach((entry, i) => {
      const rowY   = i * ROW_H + ROW_H / 2;
      const isMe   = currentUser?.nickname === entry.nickname;
      const bgColor = isMe ? 0x1a3a1a : (i % 2 === 0 ? 0x111827 : 0x0d1320);
      const textColor = isMe ? '#aaffaa' : '#dddddd';

      const rowBg = this.add.rectangle(CX, rowY, W - 20, ROW_H - 4, bgColor);
      if (isMe) rowBg.setStrokeStyle(1, 0x44cc44, 0.6);

      // 순위 메달/숫자
      const rankStr = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}`;
      const rankTxt = this.add.text(28, rowY, rankStr, {
        fontSize: entry.rank <= 3 ? '20px' : '15px', color: textColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 닉네임
      const nickTxt = this.add.text(72, rowY, entry.nickname, {
        fontSize: '15px', color: textColor, fontStyle: isMe ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      // 스테이지
      const stageColor = entry.best_stage >= 10 ? '#ffdd44' : entry.best_stage >= 5 ? '#88ddff' : '#dddddd';
      const stageTxt = this.add.text(W - 140, rowY, `STAGE ${entry.best_stage}`, {
        fontSize: '14px', color: stageColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 시간 MM:SS
      const totalSec = Math.floor(entry.best_time / 1000);
      const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const sec = (totalSec % 60).toString().padStart(2, '0');
      const timeTxt = this.add.text(W - 28, rowY, `${min}:${sec}`, {
        fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(1, 0.5);

      container.add([rowBg, rankTxt, nickTxt, stageTxt, timeTxt]);
    });

    // ── 드래그 스크롤 ──
    let lastY = 0, isDragging = false, scrollY = 0;
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < SCROLL_TOP || ptr.y > SCROLL_BOT) return;
      lastY = ptr.y; isDragging = true;
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const dy = ptr.y - lastY; lastY = ptr.y;
      scrollY = Phaser.Math.Clamp(scrollY + dy, -maxScroll, 0);
      container.y = SCROLL_TOP + scrollY;
    });
    this.input.on('pointerup',  () => { isDragging = false; });
    this.input.on('pointerout', () => { isDragging = false; });
  }
}
