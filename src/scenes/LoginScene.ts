import Phaser from 'phaser';
import { signIn, signUp } from '../lib/auth';
import { syncLocalWithCloud, overwriteLocalWithCloud } from '../lib/userDB';
import { POKE_FONT, PokePalette } from '../ui/PokeUI';
import { SceneHelper } from '../utils/SceneHelper';
import { t } from '../i18n';

/**
 * LoginScene
 * - Phaser 씬은 배경만 담당
 * - 실제 입력 폼은 HTML div 오버레이로 구현
 */
export class LoginScene extends Phaser.Scene {
  private overlay!: HTMLDivElement;
  private isSignupMode = false;

  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    this.isSignupMode = false;
    // HTML input 필드에서 키 입력이 Phaser에 차단되지 않도록
    this.input.keyboard?.disableGlobalCapture();
    this.createBackground();
    this.createOverlay();
  }

  // ── 배경 ──────────────────────────────────────────
  private createBackground() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0xe8e8d8);
    const g = this.add.graphics();
    g.lineStyle(1, 0xd0d0c0, 0.5);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y2 = 0; y2 < H; y2 += 40) g.lineBetween(0, y2, W, y2);

    this.add.text(W / 2, 110, t('포켓몬', 'Pokémon'), {
      fontFamily: POKE_FONT, fontSize: '18px', color: PokePalette.textGold, fontStyle: 'bold',
      stroke: '#302000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(W / 2, 155, t('서바이버즈', 'Survivors'), {
      fontFamily: POKE_FONT, fontSize: '40px', color: PokePalette.textDark, fontStyle: 'bold',
      stroke: '#ffffff', strokeThickness: 5,
    }).setOrigin(0.5);
  }

  // ── HTML 오버레이 ─────────────────────────────────
  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'login-overlay';

    const canvas = this.game.canvas;
    const rect   = canvas.getBoundingClientRect();

    Object.assign(this.overlay.style, {
      position:       'fixed',
      top:            `${rect.top}px`,
      left:           `${rect.left}px`,
      width:          `${rect.width}px`,
      height:         `${rect.height}px`,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         '1000',
      pointerEvents:  'none',
    });

    this.overlay.innerHTML = this.buildFormHTML();
    document.body.appendChild(this.overlay);

    this.bindEvents();

    // Enter 키
    this.overlay.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (this.isSignupMode) this.handleSignup();
        else                   this.handleLogin();
      }
    });
  }

  private buildFormHTML(): string {
    return `
    <div id="login-box" style="${boxStyle()}">
      <div id="form-title" style="text-align:center; font-size:16px; font-weight:bold; color:#181810; margin-bottom:20px;">
        ${t('로그인', 'Login')}
      </div>

      <div id="msg-area" style="min-height:22px; text-align:center; font-size:12px; color:#cc3311; margin-bottom:8px;"></div>

      <div style="margin-bottom:12px;">
        <label style="${labelStyle()}">${t('아이디', 'Username')}</label>
        <input id="inp-id" type="text" autocomplete="username"
          placeholder="${t('트레이너 아이디', 'Trainer ID')}"
          style="${inputStyle()}">
      </div>

      <div style="margin-bottom:20px;">
        <label style="${labelStyle()}">${t('비밀번호', 'Password')}</label>
        <input id="inp-pw" type="password" autocomplete="current-password"
          placeholder="${t('비밀번호 (6자 이상)', 'Password (6+ chars)')}"
          style="${inputStyle()}">
      </div>

      <!-- 로그인 버튼 -->
      <button id="btn-login" style="${btnStyle('#2255aa')}">▶ ${t('로그인', 'Login')}</button>

      <!-- 회원가입 전용 영역 (기본 숨김) -->
      <div id="signup-extra" style="display:none;">
        <div style="margin-bottom:16px;">
          <label style="${labelStyle()}">${t('닉네임', 'Nickname')} <span style="color:#484838; font-size:11px;">${t('(게임 내 표시 이름)', '(display name)')}</span></label>
          <input id="inp-nickname" type="text" autocomplete="off"
            placeholder="${t('ex) 포켓몬마스터', 'ex) PokeMaster')}"
            style="${inputStyle()}">
        </div>
        <button id="btn-signup" style="${btnStyle('#228833')}">✦ ${t('회원가입', 'Sign Up')}</button>
      </div>

      <div style="text-align:center; margin-top:10px;">
        <a id="link-toggle" href="#" style="font-size:12px; color:#2255aa; cursor:pointer; text-decoration:none;">
          ${t('계정이 없으신가요? 회원가입', "Don't have an account? Sign Up")}
        </a>
      </div>

      <div style="margin-top:16px; border-top:1px solid #989880; padding-top:14px;">
        <button id="btn-guest" style="${btnStyle('#443322', true)}">👤 ${t('게스트로 플레이', 'Play as Guest')}</button>
      </div>
    </div>`;
  }

  private bindEvents() {
    this.overlay.querySelector('#btn-login')!.addEventListener('click', () => this.handleLogin());
    this.overlay.querySelector('#btn-signup')!.addEventListener('click', () => this.handleSignup());
    this.overlay.querySelector('#btn-guest')!.addEventListener('click', () => this.proceedAsGuest());
    this.overlay.querySelector('#link-toggle')!.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMode();
    });
  }

  // ── 로그인 ────────────────────────────────────────
  private async handleLogin() {
    const id = (this.overlay.querySelector('#inp-id') as HTMLInputElement).value.trim();
    const pw = (this.overlay.querySelector('#inp-pw') as HTMLInputElement).value;

    if (!id || !pw) { this.setMsg(t('아이디와 비밀번호를 입력해 주세요.', 'Please enter username and password.')); return; }

    this.setMsg('');
    this.setBusy(true);

    try {
      const user = await signIn(id, pw);
      if (user) {
        this.setMsg(t('✔ 로그인 성공!', '✔ Login successful!'), '#228833');
        await syncLocalWithCloud(user.id);
        this.time.delayedCall(400, () => this.proceed());
      }
    } catch (e: unknown) {
      this.setMsg(translateError(e instanceof Error ? e.message : ''));
    } finally {
      this.setBusy(false);
    }
  }

  // ── 회원가입 ──────────────────────────────────────
  private async handleSignup() {
    const id       = (this.overlay.querySelector('#inp-id') as HTMLInputElement).value.trim();
    const pw       = (this.overlay.querySelector('#inp-pw') as HTMLInputElement).value;
    const nickname = (this.overlay.querySelector('#inp-nickname') as HTMLInputElement).value.trim();

    if (!id)           { this.setMsg(t('아이디를 입력해 주세요.', 'Please enter a username.')); return; }
    if (id.length < 3) { this.setMsg(t('아이디는 3자 이상이어야 합니다.', 'Username must be 3+ characters.')); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(id)) { this.setMsg(t('아이디는 영문·숫자·_만 사용 가능합니다.', 'Username: letters, numbers, _ only.')); return; }
    if (pw.length < 6) { this.setMsg(t('비밀번호는 6자 이상이어야 합니다.', 'Password must be 6+ characters.')); return; }
    if (!nickname)     { this.setMsg(t('닉네임을 입력해 주세요.', 'Please enter a nickname.')); return; }
    if (nickname.length < 2) { this.setMsg(t('닉네임은 2자 이상이어야 합니다.', 'Nickname must be 2+ characters.')); return; }

    this.setMsg('');
    this.setBusy(true);

    try {
      const user = await signUp(id, pw, nickname);
      if (user) {
        this.setMsg(t('✔ 가입 완료! 바로 로그인합니다.', '✔ Signed up! Logging in...'), '#228833');
        await overwriteLocalWithCloud(user.id);
        this.time.delayedCall(400, () => this.proceed());
      }
    } catch (e: unknown) {
      this.setMsg(translateError(e instanceof Error ? e.message : ''));
    } finally {
      this.setBusy(false);
    }
  }

  // ── 게스트 ────────────────────────────────────────
  private proceedAsGuest() {
    this.proceed();
  }

  private proceed() {
    this.destroyOverlay();
    SceneHelper.transitionTo(this, 'TitleScene', { duration: 300 });
  }

  // ── 모드 전환 ─────────────────────────────────────
  private toggleMode() {
    this.isSignupMode = !this.isSignupMode;

    const signupExtra = this.overlay.querySelector('#signup-extra') as HTMLElement;
    const formTitle   = this.overlay.querySelector('#form-title') as HTMLElement;
    const linkToggle  = this.overlay.querySelector('#link-toggle') as HTMLElement;
    const btnLogin    = this.overlay.querySelector('#btn-login') as HTMLElement;
    const inpPw       = this.overlay.querySelector('#inp-pw') as HTMLInputElement;

    if (this.isSignupMode) {
      signupExtra.style.display = 'block';
      formTitle.textContent     = t('회원가입', 'Sign Up');
      linkToggle.textContent    = t('이미 계정이 있으신가요? 로그인', 'Already have an account? Login');
      btnLogin.style.display    = 'none';
      inpPw.autocomplete        = 'new-password';
    } else {
      signupExtra.style.display = 'none';
      formTitle.textContent     = t('로그인', 'Login');
      linkToggle.textContent    = t('계정이 없으신가요? 회원가입', "Don't have an account? Sign Up");
      btnLogin.style.display    = 'block';
      inpPw.autocomplete        = 'current-password';
    }
    this.setMsg('');
  }

  // ── 헬퍼 ──────────────────────────────────────────
  private setMsg(msg: string, color = '#cc3311') {
    const el = this.overlay.querySelector('#msg-area') as HTMLElement;
    el.textContent = msg;
    el.style.color = color;
  }

  private setBusy(busy: boolean) {
    ['#btn-login', '#btn-signup', '#btn-guest'].forEach(sel => {
      const btn = this.overlay.querySelector(sel) as HTMLButtonElement | null;
      if (btn) btn.disabled = busy;
    });
  }

  private destroyOverlay() {
    this.overlay?.remove();
  }

  shutdown() {
    this.destroyOverlay();
  }
}

// ── 스타일 헬퍼 ───────────────────────────────────────
function boxStyle() {
  return `
    background: #f0f0e0;
    border: 3px solid #282018;
    border-radius: 8px;
    padding: 28px 32px 24px;
    width: min(320px, 84vw);
    pointer-events: auto;
    box-sizing: border-box;
    font-family: 'DungGeunMo', 'Press Start 2P', monospace;
    box-shadow: 3px 4px 0 #282018;
  `.replace(/\n\s+/g, ' ').trim();
}

function labelStyle() {
  return 'display:block; font-size:11px; color:#484838; margin-bottom:4px; font-family: inherit;';
}

function inputStyle() {
  return `
    width: 100%;
    padding: 9px 10px;
    background: #ffffff;
    border: 2px solid #282018;
    border-radius: 4px;
    color: #181810;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
    font-family: inherit;
  `.replace(/\n\s+/g, ' ').trim();
}

function btnStyle(bg: string, outline = false) {
  return `
    width: 100%;
    padding: 11px;
    background: ${outline ? '#e8e0d0' : bg};
    border: 2px solid #282018;
    border-radius: 4px;
    color: ${outline ? '#484838' : '#ffffff'};
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 8px;
    box-sizing: border-box;
    font-family: inherit;
  `.replace(/\n\s+/g, ' ').trim();
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return t('아이디 또는 비밀번호가 올바르지 않습니다.', 'Invalid username or password.');
  if (msg.includes('Email not confirmed'))        return t('계정 인증이 필요합니다. (관리자에게 문의)', 'Account verification needed.');
  if (msg.includes('User already registered'))   return t('이미 사용 중인 아이디입니다.', 'Username already taken.');
  if (msg.includes('users_nickname_unique'))      return t('이미 사용 중인 닉네임입니다.', 'Nickname already taken.');
  if (msg.includes('Password should be'))        return t('비밀번호는 6자 이상이어야 합니다.', 'Password must be 6+ characters.');
  if (msg.includes('Database error'))            return t('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'Server error. Please try again later.');
  return t('오류가 발생했습니다: ', 'Error: ') + msg;
}
