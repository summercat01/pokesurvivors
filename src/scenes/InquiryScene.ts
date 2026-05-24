import Phaser from 'phaser';
import { api } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { SceneHelper } from '../utils/SceneHelper';
import { t } from '../i18n';

export class InquiryScene extends Phaser.Scene {
  private overlay!: HTMLDivElement;

  constructor() {
    super({ key: 'InquiryScene' });
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
    this.overlay.id = 'inquiry-overlay';

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

    const categories = [
      { value: 'bug',    label: t('🐛 버그 신고', '🐛 Bug Report') },
      { value: 'update', label: t('💡 업데이트 건의', '💡 Feature Request') },
      { value: 'other',  label: t('💬 기타 문의', '💬 Other') },
    ];

    if (!user) {
      this.overlay.innerHTML = `
        <div style="display:flex;align-items:center;padding:10px 14px;background:#1a2233;border-bottom:1px solid #2a3448;flex-shrink:0;">
          <button id="inq-back"
            style="padding:5px 12px;background:#1e2a3a;border:1px solid #2a3a50;border-radius:6px;
                   color:#88aacc;cursor:pointer;font-family:inherit;font-size:12px;margin-right:12px;">
            ← ${t('뒤로', 'Back')}
          </button>
          <span style="font-weight:bold;font-size:15px;color:#88ccff;">📩 ${t('문의하기', 'Contact Us')}</span>
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#0f1420;">
          <div style="font-size:32px;">🔒</div>
          <div style="color:#668;font-size:14px;">${t('문의하려면 로그인해주세요', 'Please log in to submit an inquiry')}</div>
          <button id="inq-login"
            style="padding:8px 20px;background:#1e3a5f;border:1px solid #2a5080;border-radius:8px;
                   color:#88ccff;cursor:pointer;font-family:inherit;font-size:13px;">
            ${t('로그인하기', 'Log In')}
          </button>
        </div>
      `;
      document.body.appendChild(this.overlay);
      this.overlay.querySelector('#inq-back')!.addEventListener('click', () => SceneHelper.transitionTo(this, 'TitleScene'));
      this.overlay.querySelector('#inq-login')!.addEventListener('click', () => SceneHelper.transitionTo(this, 'LoginScene'));
      return;
    }

    this.overlay.innerHTML = `
      <div style="display:flex;align-items:center;padding:10px 14px;background:#1a2233;border-bottom:1px solid #2a3448;flex-shrink:0;">
        <button id="inq-back"
          style="padding:5px 12px;background:#1e2a3a;border:1px solid #2a3a50;border-radius:6px;
                 color:#88aacc;cursor:pointer;font-family:inherit;font-size:12px;margin-right:12px;">
          ← ${t('뒤로', 'Back')}
        </button>
        <span style="font-weight:bold;font-size:15px;color:#88ccff;">📩 ${t('문의하기', 'Contact Us')}</span>
      </div>

      <div style="flex:1;overflow-y:auto;padding:20px 16px;background:#0f1420;">
        <div style="max-width:480px;margin:0 auto;">

          <div style="background:#1a2030;border:1px solid #2a3448;border-radius:10px;padding:16px;margin-bottom:16px;">
            <div style="font-size:11px;color:#556;margin-bottom:4px;">${t('작성자', 'Author')}</div>
            <div style="color:#88ffaa;font-weight:bold;">${this.esc(user.nickname)}</div>
          </div>

          <div style="background:#1a2030;border:1px solid #2a3448;border-radius:10px;padding:16px;margin-bottom:16px;">
            <div style="font-size:11px;color:#556;margin-bottom:10px;">${t('문의 유형', 'Category')}</div>
            <div style="display:flex;gap:8px;">
              ${categories.map(c => `
                <label style="flex:1;cursor:pointer;">
                  <input type="radio" name="inq-category" value="${c.value}" style="display:none;"
                    ${c.value === 'bug' ? 'checked' : ''}>
                  <div class="cat-btn" data-val="${c.value}"
                    style="text-align:center;padding:8px 4px;border-radius:6px;font-size:12px;
                           border:1px solid #2a3448;background:${c.value === 'bug' ? '#1e3a5f' : '#111820'};
                           color:${c.value === 'bug' ? '#88ccff' : '#667'};">
                    ${c.label}
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <div style="background:#1a2030;border:1px solid #2a3448;border-radius:10px;padding:16px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:11px;color:#556;">${t('내용', 'Content')}</span>
              <span id="inq-charcount" style="font-size:11px;color:#445;">0/1000</span>
            </div>
            <textarea id="inq-content" maxlength="1000"
              placeholder="${t('문의 내용을 자세히 작성해주세요.\n버그의 경우 재현 방법도 함께 알려주시면 빠른 처리가 가능합니다.',
                              'Please describe your inquiry in detail.\nFor bugs, please include steps to reproduce.')}"
              style="width:100%;height:160px;resize:none;padding:10px;
                     background:#0f1520;border:1px solid #2a3448;border-radius:6px;
                     color:#e0e0e0;font-size:12px;font-family:inherit;outline:none;line-height:1.55;">
            </textarea>
          </div>

          <div id="inq-msg" style="min-height:20px;margin-bottom:8px;text-align:center;font-size:12px;"></div>

          <button id="inq-submit"
            style="width:100%;padding:12px;background:#1e4a2a;border:1px solid #2a6a3a;border-radius:8px;
                   color:#88ffaa;cursor:pointer;font-family:inherit;font-size:14px;font-weight:bold;">
            ${t('문의 제출', 'Submit Inquiry')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.bindEvents();
  }

  private bindEvents() {
    this.overlay.querySelector('#inq-back')!.addEventListener('click', () => {
      SceneHelper.transitionTo(this, 'TitleScene');
    });

    // 카테고리 버튼 스타일 토글
    this.overlay.querySelectorAll('[name="inq-category"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.overlay.querySelectorAll('.cat-btn').forEach(btn => {
          const b = btn as HTMLElement;
          const isSelected = b.dataset.val === (radio as HTMLInputElement).value;
          b.style.background = isSelected ? '#1e3a5f' : '#111820';
          b.style.color      = isSelected ? '#88ccff' : '#667';
          b.style.borderColor = isSelected ? '#2a5080' : '#2a3448';
        });
      });
    });

    this.overlay.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = (btn as HTMLElement).dataset.val!;
        const radio = this.overlay.querySelector(`[value="${val}"]`) as HTMLInputElement;
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      });
    });

    const textarea = this.overlay.querySelector('#inq-content') as HTMLTextAreaElement;
    const counter  = this.overlay.querySelector('#inq-charcount') as HTMLSpanElement;
    textarea.addEventListener('input', () => {
      counter.textContent = `${textarea.value.length}/1000`;
    });

    const submit  = this.overlay.querySelector('#inq-submit') as HTMLButtonElement;
    const msgEl   = this.overlay.querySelector('#inq-msg') as HTMLDivElement;

    submit.addEventListener('click', async () => {
      const categoryInput = this.overlay.querySelector('[name="inq-category"]:checked') as HTMLInputElement;
      const category = categoryInput?.value;
      const content  = textarea.value.trim();

      if (!content) {
        msgEl.textContent = t('내용을 입력해주세요', 'Please enter content');
        msgEl.style.color = '#ff8888';
        return;
      }

      submit.disabled = true;
      submit.textContent = t('제출 중...', 'Submitting...');
      msgEl.textContent = '';

      try {
        await api.post('/inquiry', { category, content });
        submit.textContent = t('✓ 제출 완료!', '✓ Submitted!');
        submit.style.background = '#1a4a1a';
        submit.style.color = '#aaffaa';
        msgEl.textContent = t('문의가 접수되었습니다. 공지를 통해 안내드릴게요.', 'Your inquiry has been received. We\'ll address it via announcements.');
        msgEl.style.color = '#66aa66';
        textarea.value = '';
        counter.textContent = '0/1000';
      } catch (err: unknown) {
        submit.disabled = false;
        submit.textContent = t('문의 제출', 'Submit Inquiry');
        msgEl.textContent = err instanceof Error ? err.message : t('오류가 발생했습니다', 'An error occurred');
        msgEl.style.color = '#ff8888';
      }
    });
  }

  private esc(str: string): string {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  private removeOverlay() {
    this.overlay?.remove();
    this.input.keyboard?.enableGlobalCapture();
  }
}
