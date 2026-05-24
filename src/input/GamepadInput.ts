/**
 * PS5 DualSense (및 표준 gamepad API 호환 컨트롤러) 입력 처리.
 * 왼쪽 스틱 + D-패드로 이동, Options 버튼으로 일시정지.
 * rumble()로 햅틱 피드백 발생.
 *
 * 표준 gamepad 버튼 인덱스 (PS5 DualSense 기준):
 *   0=Cross 1=Circle 2=Square 3=Triangle
 *   4=L1 5=R1 6=L2 7=R2
 *   8=Create 9=Options 10=L3 11=R3
 *   12=D↑ 13=D↓ 14=D← 15=D→
 *   16=PS 17=Touchpad
 */

const DEADZONE = 0.15;

export interface GamepadCallbacks {
  isBlocked: () => boolean;
  onPause:   () => void;
  onResume:  () => void;
  isPaused:  () => boolean;
}

/** 연결된 첫 번째 gamepad를 반환. 없으면 null. */
function getActiveGamepad(): Gamepad | null {
  for (const gp of navigator.getGamepads()) {
    if (gp && gp.connected) return gp;
  }
  return null;
}

export class GamepadInput {
  dx = 0;
  dy = 0;

  private cb: GamepadCallbacks;
  private prevOptions = false;

  constructor(cb: GamepadCallbacks) {
    this.cb = cb;
  }

  /** GameScene.update() 안에서 매 프레임 호출 */
  update() {
    const gp = getActiveGamepad();
    if (!gp) { this.dx = 0; this.dy = 0; return; }

    // 왼쪽 스틱
    let ax = gp.axes[0] ?? 0;
    let ay = gp.axes[1] ?? 0;

    // 데드존 처리
    if (Math.abs(ax) < DEADZONE) ax = 0;
    if (Math.abs(ay) < DEADZONE) ay = 0;

    // D-패드 폴백 (스틱 입력 없을 때)
    if (ax === 0 && ay === 0) {
      if (gp.buttons[14]?.pressed) ax = -1; // 왼쪽
      if (gp.buttons[15]?.pressed) ax =  1; // 오른쪽
      if (gp.buttons[12]?.pressed) ay = -1; // 위
      if (gp.buttons[13]?.pressed) ay =  1; // 아래
    }

    // 대각선 이동 시 크기 1로 정규화
    const len = Math.sqrt(ax * ax + ay * ay);
    if (len > 1) { ax /= len; ay /= len; }

    this.dx = ax;
    this.dy = ay;

    // Options 버튼(9) → 일시정지 토글
    const optDown = gp.buttons[9]?.pressed ?? false;
    if (optDown && !this.prevOptions && !this.cb.isBlocked()) {
      if (this.cb.isPaused()) this.cb.onResume(); else this.cb.onPause();
    }
    this.prevOptions = optDown;
  }

  /**
   * 컨트롤러 햅틱 진동.
   * DualSense는 'dual-rumble' 타입을 지원함.
   * @param strong  저주파(강한) 모터 세기 0~1
   * @param weak    고주파(약한) 모터 세기 0~1
   * @param ms      진동 지속 시간(밀리초)
   */
  rumble(strong = 1.0, weak = 0.6, ms = 700) {
    const gp = getActiveGamepad();
    if (!gp) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const va = (gp as any).vibrationActuator;
    if (!va) return;
    va.playEffect('dual-rumble', {
      startDelay: 0,
      duration: ms,
      weakMagnitude: weak,
      strongMagnitude: strong,
    }).catch(() => { /* 지원 안 하는 브라우저/컨트롤러 무시 */ });
  }

  /** 현재 연결·활성화된 gamepad가 있는지 여부 */
  get connected(): boolean {
    return getActiveGamepad() !== null;
  }
}
