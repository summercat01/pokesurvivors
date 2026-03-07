import type { PlayerStats } from '../types';
import { DEFAULT_STATS } from '../entities/Player';

// ===== 업그레이드 설정 =====
export interface UpgradeConfig {
  id:          string;
  name:        string;
  description: string;
  icon:        string;
  color:       number;
  statKey:     keyof PlayerStats;
  applyMode:   'add' | 'multiply';
  /** 레벨 1~5의 누적 총 보너스 (apply 시 직접 사용) */
  totals:      number[];
  /** 카드에 표시할 레벨별 문구 */
  labels:      string[];
  /** 레벨 n으로 올리는 비용 (costs[0] = Lv0→Lv1) */
  costs:       number[];
}

const BASE_COSTS = [50, 100, 180, 300, 500];

export const UPGRADES: UpgradeConfig[] = [
  {
    id: 'attackPower', name: '공격력', icon: '⚔',
    description: '모든 포켓몬 공격력 증가',
    color: 0xe84040, statKey: 'attackPower', applyMode: 'multiply',
    totals: [1.10, 1.20, 1.30, 1.40, 1.50],
    labels: ['+10%', '+20%', '+30%', '+40%', '+50%'],
    costs: BASE_COSTS,
  },
  {
    id: 'moveSpeed', name: '이동 속도', icon: '👟',
    description: '트레이너 이동 속도 증가',
    color: 0x40b040, statKey: 'moveSpeed', applyMode: 'add',
    totals: [10, 20, 30, 42, 55],
    labels: ['+10', '+20', '+30', '+42', '+55'],
    costs: BASE_COSTS,
  },
  {
    id: 'cooldownReduction', name: '쿨타임 감소', icon: '⏰',
    description: '기술 재사용 대기시간 단축',
    color: 0x4080e8, statKey: 'cooldownReduction', applyMode: 'add',
    totals: [0.05, 0.10, 0.15, 0.20, 0.25],
    labels: ['-5%', '-10%', '-15%', '-20%', '-25%'],
    costs: BASE_COSTS,
  },
  {
    id: 'maxHp', name: '최대 체력', icon: '♥',
    description: '트레이너 최대 HP 증가',
    color: 0xe060a0, statKey: 'maxHp', applyMode: 'add',
    totals: [20, 40, 60, 90, 120],
    labels: ['+20', '+40', '+60', '+90', '+120'],
    costs: BASE_COSTS,
  },
  {
    id: 'defense', name: '방어력', icon: '🛡',
    description: '받는 피해량 감소',
    color: 0x8060c0, statKey: 'defense', applyMode: 'add',
    totals: [1, 2, 4, 6, 8],
    labels: ['+1', '+2', '+4', '+6', '+8'],
    costs: BASE_COSTS,
  },
  {
    id: 'hpRegen', name: '체력 재생', icon: '+',
    description: '초당 HP 자동 회복',
    color: 0x40c888, statKey: 'hpRegen', applyMode: 'add',
    totals: [1, 2, 3, 5, 7],
    labels: ['+1/s', '+2/s', '+3/s', '+5/s', '+7/s'],
    costs: BASE_COSTS,
  },
  {
    id: 'expGain', name: '경험치 획득', icon: '★',
    description: '경험치 획득량 증가',
    color: 0xe8c040, statKey: 'expGain', applyMode: 'multiply',
    totals: [1.10, 1.20, 1.30, 1.45, 1.60],
    labels: ['+10%', '+20%', '+30%', '+45%', '+60%'],
    costs: BASE_COSTS,
  },
  {
    id: 'critChance', name: '치명타 확률', icon: '！',
    description: '치명타 발생 확률 증가',
    color: 0xf08020, statKey: 'critChance', applyMode: 'add',
    totals: [0.03, 0.06, 0.10, 0.14, 0.20],
    labels: ['+3%', '+6%', '+10%', '+14%', '+20%'],
    costs: BASE_COSTS,
  },
];

// ===== localStorage 헬퍼 =====
const PREFIX = 'upg_';

export function getUpgradeLevel(id: string): number {
  return parseInt(localStorage.getItem(PREFIX + id) ?? '0', 10);
}

export function setUpgradeLevel(id: string, level: number): void {
  localStorage.setItem(PREFIX + id, String(level));
}

export function getTotalGold(): number {
  return parseInt(localStorage.getItem('totalGold') ?? '0', 10);
}

export function setTotalGold(amount: number): void {
  localStorage.setItem('totalGold', String(amount));
}

// ===== 게임 시작 시 영구 업그레이드 스탯 적용 =====
export function applyPermanentUpgrades(stats: PlayerStats): void {
  UPGRADES.forEach(upg => {
    const level = getUpgradeLevel(upg.id);
    if (level === 0) return;

    const bonus = upg.totals[level - 1];
    const key   = upg.statKey;

    if (upg.applyMode === 'multiply') {
      // 기본값에 배율 적용 (누적 총 배율)
      (stats as any)[key] = Math.round((DEFAULT_STATS as any)[key] * bonus);
    } else {
      // 기본값에 절대값 덧셈
      (stats as any)[key] = (DEFAULT_STATS as any)[key] + bonus;
    }
  });

  // maxHp 증가 시 현재 HP도 같이 채움
  stats.hp = stats.maxHp;
}
