import Phaser from 'phaser';
import { api } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { POKE_FONT, PokePalette } from '../ui/PokeUI';
import { SceneHelper } from '../utils/SceneHelper';
import { t } from '../i18n';

interface Post {
  id: number;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

export class CommunityScene extends Phaser.Scene {
  private overlay!: HTMLDivElement;

  constructor() {
    super({ key: 'CommunityScene' });
  }

  create() {
    this.input.keyboard?.disableGlobalCapture();
    this.createBackground();
    this.createOverlay();

    this.events.once('shutdown', () => this.removeOverlay());
  }

  private createBackground() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0f1420);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a2233, 0.6);
    for (let x = 0; x < W; x += 48) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 48) g.lineBetween(0, y, W, y);
  }

  private createOverlay() {
    const canvas = this.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const user   = getCurrentUser();

    this.overlay = document.createElement('div');
    this.overlay.id = 'community-overlay';

    Object.assign(this.overlay.style, {
      position:      'fixed',
      top:           `${rect.top}px`,
      left:          `${rect.left}px`,
      width:         `${rect.width}px`,
      height:        `${rect.height}px`,
      display:       'flex',
      flexDirection: 'column',
      zIndex:        '1000',
      fontFamily:    '"Noto Sans KR", "Malgun Gothic", Arial, sans-serif',
      fontSize:      '13px',
      color:         '#e0e0e0',
    });

    const catLabels = { bug: '🐛 버그', update: '💡 업데이트', other: '💬 기타' };
    const writeArea = user ? `
      <div id="comm-write" style="padding:8px;background:#0f1520;border-top:1px solid #2a3448;flex-shrink:0;">
        <textarea id="comm-input" maxlength="300"
          placeholder="${t('댓글을 입력하세요 (최대 300자)', 'Write a comment (max 300 chars)')}"
          style="width:100%;height:72px;resize:none;padding:8px;background:#1a2030;border:1px solid #2a3448;
                 border-radius:6px;color:#e0e0e0;font-size:12px;font-family:inherit;outline:none;"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <span id="comm-charcount" style="color:#555;font-size:11px;">0/300</span>
          <button id="comm-submit"
            style="padding:6px 18px;background:#1e3a5f;border:1px solid #2a5080;border-radius:6px;
                   color:#88ccff;cursor:pointer;font-family:inherit;font-size:12px;">
            ${t('작성', 'Post')}
          </button>
        </div>
      </div>
    ` : `
      <div style="padding:10px;background:#0f1520;border-top:1px solid #2a3448;text-align:center;
                  color:#556;font-size:12px;flex-shrink:0;">
        ${t('댓글을 작성하려면 로그인해주세요', 'Please log in to write a comment')}
      </div>
    `;

    this.overlay.innerHTML = `
      <div style="display:flex;align-items:center;padding:10px 14px;background:#1a2233;border-bottom:1px solid #2a3448;flex-shrink:0;">
        <button id="comm-back"
          style="padding:5px 12px;background:#1e2a3a;border:1px solid #2a3a50;border-radius:6px;
                 color:#88aacc;cursor:pointer;font-family:inherit;font-size:12px;margin-right:12px;">
          ← ${t('뒤로', 'Back')}
        </button>
        <span style="font-weight:bold;font-size:15px;color:#88ccff;">💬 ${t('커뮤니티', 'Community')}</span>
        <button id="comm-refresh"
          style="margin-left:auto;padding:5px 10px;background:#1e2a3a;border:1px solid #2a3a50;border-radius:6px;
                 color:#668899;cursor:pointer;font-family:inherit;font-size:11px;">
          🔄 ${t('새로고침', 'Refresh')}
        </button>
      </div>

      <div id="comm-list" style="flex:1;overflow-y:auto;padding:8px;pointer-events:all;">
        <div style="text-align:center;color:#444;padding:24px;">${t('불러오는 중...', 'Loading...')}</div>
      </div>

      ${writeArea}
    `;

    document.body.appendChild(this.overlay);
    this.bindEvents(user);
    this.loadPosts();
  }

  private bindEvents(user: ReturnType<typeof getCurrentUser>) {
    this.overlay.querySelector('#comm-back')!.addEventListener('click', () => {
      SceneHelper.transitionTo(this, 'TitleScene');
    });

    this.overlay.querySelector('#comm-refresh')!.addEventListener('click', () => {
      this.loadPosts();
    });

    if (!user) return;

    const input   = this.overlay.querySelector('#comm-input') as HTMLTextAreaElement;
    const counter = this.overlay.querySelector('#comm-charcount') as HTMLSpanElement;
    const submit  = this.overlay.querySelector('#comm-submit') as HTMLButtonElement;

    input.addEventListener('input', () => {
      counter.textContent = `${input.value.length}/300`;
    });

    submit.addEventListener('click', async () => {
      const content = input.value.trim();
      if (!content) return;
      submit.disabled = true;
      submit.textContent = t('작성 중...', 'Posting...');
      try {
        await api.post('/community', { content });
        input.value = '';
        counter.textContent = '0/300';
        this.loadPosts();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : t('오류가 발생했습니다', 'An error occurred'));
      } finally {
        submit.disabled = false;
        submit.textContent = t('작성', 'Post');
      }
    });
  }

  private async loadPosts() {
    const listEl = this.overlay.querySelector('#comm-list') as HTMLDivElement;
    const user   = getCurrentUser();

    try {
      const data = await api.get<{ posts: Post[]; total: number }>('/community?page=1');
      const { posts } = data;

      if (posts.length === 0) {
        listEl.innerHTML = `<div style="text-align:center;color:#444;padding:32px;">${t('아직 글이 없습니다. 첫 댓글을 남겨보세요!', 'No posts yet. Be the first!')}</div>`;
        return;
      }

      listEl.innerHTML = '';

      posts.forEach(post => {
        const card = document.createElement('div');
        card.style.cssText = `
          background:#1a2030;border:1px solid #2a3448;border-radius:8px;
          padding:10px 12px;margin-bottom:8px;
        `;

        const isOwn  = user && String(post.user_id) === String(user.id);
        const canDel = isOwn;

        const timeStr = this.formatTime(post.created_at);

        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-weight:bold;color:${isOwn ? '#88ffaa' : '#88aacc'};font-size:12px;">
              ${this.esc(post.nickname)}${isOwn ? ` <span style="color:#556;font-size:10px;">(${t('나', 'me')})</span>` : ''}
            </span>
            <span style="color:#445;font-size:10px;">${timeStr}</span>
          </div>
          <div style="color:#d0d8e8;line-height:1.55;white-space:pre-wrap;word-break:break-all;font-size:12px;">
            ${this.esc(post.content)}
          </div>
          <div style="margin-top:8px;display:flex;gap:8px;">
            ${canDel ? `<button data-del="${post.id}" style="font-size:10px;padding:2px 8px;background:#3a1a1a;border:1px solid #5a2a2a;border-radius:4px;color:#ff8888;cursor:pointer;font-family:inherit;">${t('삭제', 'Delete')}</button>` : ''}
            ${user && !isOwn ? `<button data-rep="${post.id}" style="font-size:10px;padding:2px 8px;background:#2a2a1a;border:1px solid #4a4a2a;border-radius:4px;color:#aaa88a;cursor:pointer;font-family:inherit;">${t('신고', 'Report')}</button>` : ''}
          </div>
        `;

        const delBtn = card.querySelector(`[data-del="${post.id}"]`) as HTMLButtonElement | null;
        delBtn?.addEventListener('click', () => this.deletePost(post.id));

        const repBtn = card.querySelector(`[data-rep="${post.id}"]`) as HTMLButtonElement | null;
        repBtn?.addEventListener('click', () => this.reportPost(post.id, post.nickname));

        listEl.appendChild(card);
      });
    } catch {
      listEl.innerHTML = `<div style="text-align:center;color:#844;padding:24px;">${t('불러오기 실패. 다시 시도해주세요.', 'Failed to load. Please try again.')}</div>`;
    }
  }

  private async deletePost(id: number) {
    if (!confirm(t('이 댓글을 삭제하시겠습니까?', 'Delete this post?'))) return;
    try {
      await api.delete(`/community/${id}`);
      this.loadPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('삭제 실패', 'Delete failed'));
    }
  }

  private async reportPost(id: number, nickname: string) {
    const reasons = [
      t('욕설/비방', 'Abuse/Defamation'),
      t('스팸', 'Spam'),
      t('부적절한 내용', 'Inappropriate content'),
      t('기타', 'Other'),
    ];
    const reason = prompt(
      `"${nickname}"${t('의 댓글을 신고합니다.\n사유를 입력해주세요:', '\'s post — enter report reason:')}\n(${reasons.join(' / ')})`,
    );
    if (!reason || !reason.trim()) return;
    try {
      await api.post(`/community/${id}/report`, { reason: reason.trim() });
      alert(t('신고가 접수되었습니다.', 'Report submitted.'));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('신고 실패', 'Report failed'));
    }
  }

  private formatTime(dateStr: string): string {
    const d    = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60)   return t(`${diff}초 전`, `${diff}s ago`);
    if (diff < 3600) return t(`${Math.floor(diff / 60)}분 전`, `${Math.floor(diff / 60)}m ago`);
    if (diff < 86400) return t(`${Math.floor(diff / 3600)}시간 전`, `${Math.floor(diff / 3600)}h ago`);
    return d.toLocaleDateString();
  }

  private esc(str: string): string {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  private removeOverlay() {
    this.overlay?.remove();
    this.input.keyboard?.enableGlobalCapture();
  }
}
