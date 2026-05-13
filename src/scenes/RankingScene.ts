import Phaser from 'phaser';
import { api } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';
import { ScrollablePanel } from '../ui/ScrollablePanel';
import { SceneHelper } from '../utils/SceneHelper';
import { t } from '../i18n';

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

    // ── 배경 + 헤더 ──
    PokeUI.gridBackground(this);
    PokeUI.sceneHeader(this, t('🏆 랭킹', '🏆 Ranking'), t('최고 스테이지 · 최고 시간 기준', 'Best stage · Best time'), { depth: 10 });

    // ── 뒤로 버튼 ──
    const backY = H - 44;
    PokeUI.navButton(this, CX, backY, 160, 40, t('← 뒤로', '← Back'),
      () => SceneHelper.transitionTo(this, 'TitleScene'));

    // ── 컬럼 헤더 ──
    const TABLE_TOP = 90;
    const ROW_H     = 52;
    this.add.rectangle(CX, TABLE_TOP + 18, W - 20, 36, PokePalette.panelBorder, 0.08).setDepth(5);
    this.add.text(28,       TABLE_TOP + 18, t('순위', 'Rank'),     { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(72,       TABLE_TOP + 18, t('닉네임', 'Name'),   { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(W - 140,  TABLE_TOP + 18, t('스테이지', 'Stage'), { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(W - 28,   TABLE_TOP + 18, t('시간', 'Time'),     { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(1, 0.5).setDepth(6);

    // ── 로딩 텍스트 ──
    const loadingTxt = this.add.text(CX, H / 2, t('불러오는 중...', 'Loading...'), {
      fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textGray,
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ── 데이터 fetch ──
    const currentUser = getCurrentUser();
    let entries: LeaderboardEntry[] = [];
    let fetchError = false;

    try {
      entries = await api.get<LeaderboardEntry[]>('/leaderboard');
    } catch {
      fetchError = true;
    }

    loadingTxt.destroy();

    if (fetchError || entries.length === 0) {
      this.add.text(CX, H / 2, fetchError ? t('랭킹을 불러올 수 없습니다.', 'Failed to load rankings.') : t('아직 기록이 없습니다.', 'No records yet.'), {
        fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textGray, align: 'center',
      }).setOrigin(0.5);
      return;
    }

    // ── 스크롤 영역 ──
    const SCROLL_TOP = TABLE_TOP + 36;
    const SCROLL_BOT = backY - 16;
    const scrollPanel = new ScrollablePanel(this, { top: SCROLL_TOP, bottom: SCROLL_BOT });
    scrollPanel.setContentHeight(entries.length * ROW_H);
    const container = scrollPanel.container;

    entries.forEach((entry, i) => {
      const rowY   = i * ROW_H + ROW_H / 2;
      const isMe   = currentUser?.nickname === entry.nickname;
      const bgColor = isMe ? 0xd0f0d0 : (i % 2 === 0 ? PokePalette.panelBg : 0xe8e4d8);
      const textColor = isMe ? '#226622' : PokePalette.textDark;

      const rowBg = this.add.rectangle(CX, rowY, W - 20, ROW_H - 4, bgColor);
      if (isMe) rowBg.setStrokeStyle(1, 0x228833, 0.8);

      // 순위 메달/숫자
      const rankStr = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}`;
      const rankTxt = this.add.text(28, rowY, rankStr, {
        fontFamily: POKE_FONT, fontSize: entry.rank <= 3 ? '18px' : '12px', color: textColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 닉네임
      const nickTxt = this.add.text(72, rowY, entry.nickname, {
        fontFamily: POKE_FONT, fontSize: '12px', color: textColor, fontStyle: isMe ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      // 스테이지
      const stageColor = entry.best_stage >= 10 ? '#8a6000' : entry.best_stage >= 5 ? '#2255aa' : PokePalette.textDark;
      const stageTxt = this.add.text(W - 140, rowY, `STAGE ${entry.best_stage}`, {
        fontFamily: POKE_FONT, fontSize: '11px', color: stageColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 시간 MM:SS
      const totalSec = Math.floor(entry.best_time / 1000);
      const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const sec = (totalSec % 60).toString().padStart(2, '0');
      const timeTxt = this.add.text(W - 28, rowY, `${min}:${sec}`, {
        fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textGray,
      }).setOrigin(1, 0.5);

      container.add([rowBg, rankTxt, nickTxt, stageTxt, timeTxt]);
    });

  }
}
