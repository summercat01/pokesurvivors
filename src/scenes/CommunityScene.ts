import Phaser from 'phaser';
import { api } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
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
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0e18);
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
      background:    '#0f1520',
    });

    const inputBar = user ? `
      <div style="display:flex;align-items:flex-end;gap:8px;padding:8px 10px;
                  background:#1a2030;border-top:1px solid #252e40;flex-shrink:0;">
        <textarea id="comm-input" maxlength="300" rows="1"
          placeholder="${t('메시지 입력...', 'Message...')}"
          style="flex:1;resize:none;padding:8px 12px;background:#252e40;border:none;
                 border-radius:18px;color:#e8eaf0;font-size:13px;font-family:inherit;
                 outline:none;line-height:1.45;max-height:90px;overflow-y:auto;"></textarea>
        <button id="comm-submit"
          style="flex-shrink:0;width:38px;height:38px;background:#3a7bd5;border:none;
                 border-radius:50%;color:#fff;font-size:18px;cursor:pointer;
                 display:flex;align-items:center;justify-content:center;padding:0;">
          ➤
        </button>
      </div>
    ` : `
      <div style="padding:10px;background:#1a2030;border-top:1px solid #252e40;
                  text-align:center;color:#445;font-size:12px;flex-shrink:0;">
        ${t('채팅하려면 로그인해주세요', 'Log in to chat')}
      </div>
    `;

    this.overlay.innerHTML = `
      <div style="display:flex;align-items:center;padding:8px 12px;
                  background:#151e30;border-bottom:1px solid #252e40;flex-shrink:0;gap:10px;">
        <button id="comm-back"
          style="background:none;border:none;color:#7a9cc4;font-size:20px;
                 cursor:pointer;padding:0;line-height:1;">‹</button>
        <span style="font-size:14px;font-weight:bold;color:#d0daf0;">
          💬 ${t('커뮤니티', 'Community')}
        </span>
        <button id="comm-refresh"
          style="margin-left:auto;background:none;border:none;color:#4a6080;
                 font-size:15px;cursor:pointer;padding:2px;">↻</button>
      </div>

      <div id="comm-list"
        style="flex:1;overflow-y:auto;padding:10px 10px 4px;display:flex;
               flex-direction:column;gap:6px;">
        <div style="text-align:center;color:#334;font-size:12px;margin:auto;">
          ${t('불러오는 중...', 'Loading...')}
        </div>
      </div>

      ${inputBar}
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

    const input  = this.overlay.querySelector('#comm-input') as HTMLTextAreaElement;
    const submit = this.overlay.querySelector('#comm-submit') as HTMLButtonElement;

    // textarea 자동 높이
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 90) + 'px';
    });

    // Enter 전송 (Shift+Enter는 줄바꿈)
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit.click();
      }
    });

    submit.addEventListener('click', async () => {
      const content = input.value.trim();
      if (!content) return;
      submit.disabled = true;
      try {
        await api.post('/community', { content });
        input.value = '';
        input.style.height = 'auto';
        this.loadPosts(true);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : t('오류가 발생했습니다', 'An error occurred'));
      } finally {
        submit.disabled = false;
      }
    });
  }

  private async loadPosts(scrollToBottom = false) {
    const listEl = this.overlay.querySelector('#comm-list') as HTMLDivElement;
    const user   = getCurrentUser();

    try {
      const data  = await api.get<{ posts: Post[] }>('/community?page=1');
      // 서버가 최신순으로 주므로 뒤집어서 오래된 게 위로
      const posts = [...data.posts].reverse();

      listEl.innerHTML = '';

      if (posts.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center;color:#334;font-size:12px;margin:auto;">
            ${t('아직 메시지가 없어요. 첫 메시지를 남겨보세요!', 'No messages yet. Say hi!')}
          </div>`;
        return;
      }

      let prevNick = '';
      posts.forEach(post => {
        const isMe = user && String(post.user_id) === String(user.id);
        const showNick = !isMe && post.nickname !== prevNick;
        prevNick = post.nickname;

        const bubble = document.createElement('div');
        bubble.style.cssText = `
          display:flex;
          flex-direction:column;
          align-items:${isMe ? 'flex-end' : 'flex-start'};
          max-width:100%;
        `;

        // 닉네임 (상대방만, 연속 메시지면 생략)
        if (showNick) {
          const nick = document.createElement('div');
          nick.style.cssText = 'font-size:10px;color:#5a7a9a;margin-bottom:2px;padding-left:4px;';
          nick.textContent = post.nickname;
          bubble.appendChild(nick);
        }

        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:flex-end;gap:5px;flex-direction:${isMe ? 'row-reverse' : 'row'};max-width:85%;`;

        // 말풍선
        const msgBubble = document.createElement('div');
        msgBubble.style.cssText = `
          padding:8px 12px;
          border-radius:${isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};
          background:${isMe ? '#3a7bd5' : '#1e2a3e'};
          color:${isMe ? '#fff' : '#d0daf0'};
          font-size:13px;
          line-height:1.5;
          word-break:break-all;
          white-space:pre-wrap;
          max-width:100%;
          position:relative;
        `;
        msgBubble.textContent = post.content;

        // 시간
        const timeEl = document.createElement('div');
        timeEl.style.cssText = 'font-size:9px;color:#3a4a5a;flex-shrink:0;padding-bottom:2px;';
        timeEl.textContent = this.formatTime(post.created_at);

        row.appendChild(msgBubble);
        row.appendChild(timeEl);
        bubble.appendChild(row);

        // 삭제/신고 버튼 (말풍선 아래 작게)
        if (isMe || (user && !isMe)) {
          const actions = document.createElement('div');
          actions.style.cssText = `display:flex;gap:6px;margin-top:2px;padding:0 4px;`;

          if (isMe) {
            const delBtn = document.createElement('button');
            delBtn.textContent = t('삭제', 'Del');
            delBtn.style.cssText = 'font-size:10px;background:none;border:none;color:#3a4a5a;cursor:pointer;padding:0;';
            delBtn.addEventListener('click', () => this.deletePost(post.id));
            actions.appendChild(delBtn);
          } else if (user) {
            const repBtn = document.createElement('button');
            repBtn.textContent = t('신고', 'Rep');
            repBtn.style.cssText = 'font-size:10px;background:none;border:none;color:#3a4a5a;cursor:pointer;padding:0;';
            repBtn.addEventListener('click', () => this.reportPost(post.id, post.nickname));
            actions.appendChild(repBtn);
          }

          bubble.appendChild(actions);
        }

        listEl.appendChild(bubble);
      });

      // 새 메시지 전송 시 or 첫 로드 시 맨 아래로 스크롤
      if (scrollToBottom || listEl.scrollTop === 0) {
        listEl.scrollTop = listEl.scrollHeight;
      }
    } catch {
      listEl.innerHTML = `
        <div style="text-align:center;color:#553333;font-size:12px;margin:auto;">
          ${t('불러오기 실패. ↻ 를 눌러 다시 시도해주세요.', 'Failed to load. Tap ↻ to retry.')}
        </div>`;
    }
  }

  private async deletePost(id: number) {
    if (!confirm(t('이 메시지를 삭제하시겠습니까?', 'Delete this message?'))) return;
    try {
      await api.delete(`/community/${id}`);
      this.loadPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('삭제 실패', 'Delete failed'));
    }
  }

  private async reportPost(id: number, nickname: string) {
    const reason = prompt(
      `"${nickname}" ${t('메시지 신고 사유:', 'report reason:')}\n${t('욕설 / 스팸 / 부적절한 내용 / 기타', 'Abuse / Spam / Inappropriate / Other')}`,
    );
    if (!reason?.trim()) return;
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
    if (diff < 60)    return t(`${diff}초 전`, `${diff}s`);
    if (diff < 3600)  return t(`${Math.floor(diff / 60)}분 전`, `${Math.floor(diff / 60)}m`);
    if (diff < 86400) return t(`${Math.floor(diff / 3600)}시간 전`, `${Math.floor(diff / 3600)}h`);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  private removeOverlay() {
    this.overlay?.remove();
    this.input.keyboard?.enableGlobalCapture();
  }
}
