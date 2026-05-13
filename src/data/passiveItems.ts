import { PokemonType } from '../types';
import { getLang } from '../i18n';

// 패시브 아이템 레벨별 수치 (임시 수치 - 플레이테스트 후 조정)
export interface PassiveStatBonus {
  type: PokemonType;
  name: string;
  nameEn: string;
  statKey: string;
  // 레벨 1~5 수치 배열
  values: [number, number, number, number, number];
  description: string;
  descriptionEn: string;
}

export const PASSIVE_ITEMS: PassiveStatBonus[] = [
  {
    type: 'normal',
    name: '노말의 돌', nameEn: 'Normal Stone',
    statKey: 'expGain',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],  // +10% ~ +60%
    description: '경험치 획득량 증가', descriptionEn: 'Increases EXP gain',
  },
  {
    type: 'fire',
    name: '불꽃의 돌', nameEn: 'Fire Stone',
    statKey: 'attackPower',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '공격력 증가', descriptionEn: 'Increases attack power',
  },
  {
    type: 'water',
    name: '물의 돌', nameEn: 'Water Stone',
    statKey: 'projectileRange',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '투사체 범위 증가', descriptionEn: 'Increases projectile range',
  },
  {
    type: 'grass',
    name: '풀의 돌', nameEn: 'Leaf Stone',
    statKey: 'hpRegen',
    values: [0.5, 1.0, 1.5, 2.5, 4.0],   // 초당 HP 재생
    description: '체력 재생 증가', descriptionEn: 'Increases HP regen',
  },
  {
    type: 'electric',
    name: '전기의 돌', nameEn: 'Thunder Stone',
    statKey: 'projectileSpeed',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '투사체 속도 증가', descriptionEn: 'Increases projectile speed',
  },
  {
    type: 'ice',
    name: '얼음의 돌', nameEn: 'Ice Stone',
    statKey: 'cooldownReduction',
    values: [0.04, 0.09, 0.13, 0.19, 0.26], // 쿨다운 4% ~ 26% 감소 (너프)
    description: '쿨다운 감소', descriptionEn: 'Reduces cooldown',
  },
  {
    type: 'fighting',
    name: '격투의 돌', nameEn: 'Fist Stone',
    statKey: 'critDamage',
    values: [0.17, 0.34, 0.51, 0.77, 1.02],   // 치명타 데미지 배율 추가 (너프)
    description: '치명타 데미지 증가', descriptionEn: 'Increases crit damage',
  },
  {
    type: 'poison',
    name: '독의 돌', nameEn: 'Poison Stone',
    statKey: 'projectileDuration',
    values: [0.5, 1.0, 1.5, 2.0, 3.0],   // 초 단위 추가
    description: '투사체 지속시간 증가', descriptionEn: 'Increases projectile duration',
  },
  {
    type: 'ground',
    name: '땅의 돌', nameEn: 'Earth Stone',
    statKey: 'maxHp',
    values: [20, 40, 70, 100, 150],        // HP 추가
    description: '최대 체력 증가', descriptionEn: 'Increases max HP',
  },
  {
    type: 'flying',
    name: '비행의 돌', nameEn: 'Sky Stone',
    statKey: 'moveSpeed',
    values: [0.04, 0.09, 0.13, 0.19, 0.26],
    description: '이동속도 증가', descriptionEn: 'Increases move speed',
  },
  {
    type: 'psychic',
    name: '에스퍼의 돌', nameEn: 'Psychic Stone',
    statKey: 'knockback',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '넉백 증가', descriptionEn: 'Increases knockback',
  },
  {
    type: 'bug',
    name: '벌레의 돌', nameEn: 'Bug Stone',
    statKey: 'evasion',
    values: [0.025, 0.05, 0.085, 0.13, 0.17], // 회피율 2.5% ~ 17% (너프)
    description: '회피율 증가', descriptionEn: 'Increases evasion',
  },
  {
    type: 'rock',
    name: '바위의 돌', nameEn: 'Rock Stone',
    statKey: 'critChance',
    values: [0.05, 0.1, 0.15, 0.22, 0.3],
    description: '치명타 확률 증가', descriptionEn: 'Increases crit chance',
  },
  {
    type: 'ghost',
    name: '고스트의 돌', nameEn: 'Ghost Stone',
    statKey: 'revives',
    values: [1, 1, 2, 2, 3],               // 부활 횟수
    description: '부활 횟수 증가', descriptionEn: 'Increases revive count',
  },
  {
    type: 'dragon',
    name: '드래곤의 돌', nameEn: 'Dragon Stone',
    statKey: 'projectileCount',
    values: [1, 1, 2, 2, 3],               // 투사체 개수 추가
    description: '투사체 개수 증가', descriptionEn: 'Increases projectile count',
  },
  {
    type: 'dark',
    name: '악의 돌', nameEn: 'Dark Stone',
    statKey: 'goldGain',
    values: [0.1, 0.2, 0.3, 0.5, 0.75],
    description: '골드 획득량 증가', descriptionEn: 'Increases gold gain',
  },
  {
    type: 'steel',
    name: '강철의 돌', nameEn: 'Steel Stone',
    statKey: 'defense',
    values: [3, 6, 10, 15, 22],            // 방어력 추가
    description: '방어력 증가', descriptionEn: 'Increases defense',
  },
];

export const getPassiveItem = (type: PokemonType) =>
  PASSIVE_ITEMS.find(p => p.type === type);

/** 현재 언어에 맞는 패시브 이름 */
export function getPassiveDisplayName(p: PassiveStatBonus): string {
  return getLang() === 'ko' ? p.name : p.nameEn;
}

/** 현재 언어에 맞는 패시브 설명 */
export function getPassiveDisplayDesc(p: PassiveStatBonus): string {
  return getLang() === 'ko' ? p.description : p.descriptionEn;
}

// 퍼센트로 표시할 statKey 목록 (소수점 배율 → ×100하여 % 표기)
const PERCENT_DISPLAY_STATS = new Set([
  'expGain', 'attackPower', 'projectileRange', 'projectileSpeed',
  'cooldownReduction', 'critDamage', 'moveSpeed', 'knockback',
  'evasion', 'critChance', 'goldGain',
]);

/** 패시브 수치를 UI 표시용 문자열로 변환 */
export function formatPassiveValue(statKey: string, value: number): string {
  if (PERCENT_DISPLAY_STATS.has(statKey)) {
    return `+${Math.round(value * 100)}%`;
  }
  return `+${value}`;
}
