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

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_LIMIT = 20;

export class RankingScene extends Phaser.Scene {
  private currentPage = 1;
  private totalPages  = 1;

  constructor() {
    super({ key: 'RankingScene' });
  }

  create() {
    this.currentPage = 1;
    this.totalPages  = 1;
    this.renderPage(1);
  }

  private async renderPage(page: number) {
    // 씬 오브젝트 전체 초기화
    this.children.removeAll(true);

    const W  = this.scale.width;
    const H  = this.scale.height;
    const CX = W / 2;

    PokeUI.gridBackground(this);
    PokeUI.sceneHeader(this, t('🏆 랭킹', '🏆 Ranking'), t('최고 스테이지 · 최고 시간 기준', 'Best stage · Best time'), { depth: 10 });

    // ── 뒤로 버튼 ──
    const NAV_H  = 44;
    const backY  = H - NAV_H;
    PokeUI.navButton(this, CX, backY, 140, 36, t('← 뒤로', '← Back'),
      () => SceneHelper.transitionTo(this, 'TitleScene'));

    // ── 컬럼 헤더 ──
    const TABLE_TOP = 90;
    const ROW_H     = 48;
    this.add.rectangle(CX, TABLE_TOP + 18, W - 20, 36, PokePalette.panelBorder, 0.08).setDepth(5);
    this.add.text(28,       TABLE_TOP + 18, t('순위', 'Rank'),     { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(72,       TABLE_TOP + 18, t('닉네임', 'Name'),   { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(W - 140,  TABLE_TOP + 18, t('스테이지', 'Stage'), { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(W - 28,   TABLE_TOP + 18, t('시간', 'Time'),     { fontFamily: POKE_FONT, fontSize: '10px', color: PokePalette.textGray, fontStyle: 'bold' }).setOrigin(1, 0.5).setDepth(6);

    // ── 로딩 텍스트 ──
    const loadingTxt = this.add.text(CX, H / 2, t('불러오는 중...', 'Loading...'), {
      fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textGray,
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(200, 0, 0, 0);

    // ── 데이터 fetch ──
    const currentUser = getCurrentUser();
    let data: LeaderboardResponse | null = null;
    let fetchError = false;

    try {
      data = await api.get<LeaderboardResponse>(`/leaderboard?page=${page}&limit=${PAGE_LIMIT}`);
    } catch {
      fetchError = true;
    }

    loadingTxt.destroy();

    if (fetchError || !data || data.entries.length === 0) {
      this.add.text(CX, H / 2,
        fetchError
          ? t('랭킹을 불러올 수 없습니다.', 'Failed to load rankings.')
          : t('아직 기록이 없습니다.', 'No records yet.'),
        { fontFamily: POKE_FONT, fontSize: '13px', color: PokePalette.textGray, align: 'center' },
      ).setOrigin(0.5);
      return;
    }

    this.currentPage = data.page;
    this.totalPages  = Math.max(1, Math.ceil(data.total / PAGE_LIMIT));

    // ── 페이지네이션 영역 높이 계산 ──
    const PAGING_H   = this.totalPages > 1 ? 44 : 0;
    const SCROLL_TOP = TABLE_TOP + 36;
    const SCROLL_BOT = backY - PAGING_H - 8;

    // ── 스크롤 영역 ──
    const scrollPanel = new ScrollablePanel(this, { top: SCROLL_TOP, bottom: SCROLL_BOT });
    scrollPanel.setContentHeight(data.entries.length * ROW_H);
    const container = scrollPanel.container;

    data.entries.forEach((entry, i) => {
      const rowY    = i * ROW_H + ROW_H / 2;
      const isMe    = currentUser?.nickname === entry.nickname;
      const bgColor = isMe ? 0xd0f0d0 : (i % 2 === 0 ? PokePalette.panelBg : 0xe8e4d8);
      const textColor = isMe ? '#226622' : PokePalette.textDark;

      const rowBg = this.add.rectangle(CX, rowY, W - 20, ROW_H - 4, bgColor);
      if (isMe) rowBg.setStrokeStyle(1, 0x228833, 0.8);

      // 순위 (전체 기준)
      const rankStr = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}`;
      this.add.text(28, rowY, rankStr, {
        fontFamily: POKE_FONT, fontSize: entry.rank <= 3 ? '18px' : '12px', color: textColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 닉네임
      this.add.text(72, rowY, entry.nickname, {
        fontFamily: POKE_FONT, fontSize: '12px', color: textColor, fontStyle: isMe ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      // 스테이지
      const stageColor = entry.best_stage >= 10 ? '#8a6000' : entry.best_stage >= 5 ? '#2255aa' : PokePalette.textDark;
      this.add.text(W - 140, rowY, `STAGE ${entry.best_stage}`, {
        fontFamily: POKE_FONT, fontSize: '11px', color: stageColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 시간
      const totalSec = Math.floor(entry.best_time / 1000);
      const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const sec = (totalSec % 60).toString().padStart(2, '0');
      this.add.text(W - 28, rowY, `${min}:${sec}`, {
        fontFamily: POKE_FONT, fontSize: '11px', color: PokePalette.textGray,
      }).setOrigin(1, 0.5);

      container.add([rowBg]);
    });

    // ── 페이지네이션 버튼 ──
    if (this.totalPages > 1) {
      this.renderPagination(CX, SCROLL_BOT + PAGING_H / 2 + 4, W);
    }
  }

  private renderPagination(cx: number, y: number, W: number) {
    const BTN_W = 56;
    const BTN_H = 30;
    const GAP   = 6;
    const D     = 15;

    // 이전 버튼
    const prevDisabled = this.currentPage <= 1;
    const prevBg = this.add.rectangle(cx - BTN_W - GAP, y, BTN_W, BTN_H,
      prevDisabled ? 0x1a1a1a : 0x1e2a3a).setDepth(D);
    if (!prevDisabled) {
      prevBg.setInteractive({ useHandCursor: true });
      prevBg.on('pointerover', () => prevBg.setFillStyle(0x253545));
      prevBg.on('pointerout',  () => prevBg.setFillStyle(0x1e2a3a));
      prevBg.on('pointerdown', () => this.renderPage(this.currentPage - 1));
    }
    this.add.text(cx - BTN_W - GAP, y, '◀ 이전', {
      fontFamily: POKE_FONT, fontSize: '11px',
      color: prevDisabled ? '#333' : '#88aacc',
    }).setOrigin(0.5).setDepth(D + 1);

    // 페이지 정보
    this.add.text(cx, y, `${this.currentPage} / ${this.totalPages}`, {
      fontFamily: POKE_FONT, fontSize: '12px', color: PokePalette.textGray,
    }).setOrigin(0.5).setDepth(D + 1);

    // 다음 버튼
    const nextDisabled = this.currentPage >= this.totalPages;
    const nextBg = this.add.rectangle(cx + BTN_W + GAP, y, BTN_W, BTN_H,
      nextDisabled ? 0x1a1a1a : 0x1e2a3a).setDepth(D);
    if (!nextDisabled) {
      nextBg.setInteractive({ useHandCursor: true });
      nextBg.on('pointerover', () => nextBg.setFillStyle(0x253545));
      nextBg.on('pointerout',  () => nextBg.setFillStyle(0x1e2a3a));
      nextBg.on('pointerdown', () => this.renderPage(this.currentPage + 1));
    }
    this.add.text(cx + BTN_W + GAP, y, '다음 ▶', {
      fontFamily: POKE_FONT, fontSize: '11px',
      color: nextDisabled ? '#333' : '#88aacc',
    }).setOrigin(0.5).setDepth(D + 1);
  }
}
