import { PokemonType } from '../types';

// 패시브 아이템 레벨별 수치 (임시 수치 - 플레이테스트 후 조정)
export interface PassiveStatBonus {
  type: PokemonType;
  name: string;
  statKey: string;
  // 레벨 1~5 수치 배열
  values: [number, number, number, number, number];
  description: string;
}

export const PASSIVE_ITEMS: PassiveStatBonus[] = [
  {
    type: 'normal',
    name: '노말의 돌',
    statKey: 'expGain',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],  // +10% ~ +60%
    description: '경험치 획득량 증가',
  },
  {
    type: 'fire',
    name: '불꽃의 돌',
    statKey: 'attackPower',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '공격력 증가',
  },
  {
    type: 'water',
    name: '물의 돌',
    statKey: 'projectileRange',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '투사체 범위 증가',
  },
  {
    type: 'grass',
    name: '풀의 돌',
    statKey: 'hpRegen',
    values: [0.5, 1.0, 1.5, 2.5, 4.0],   // 초당 HP 재생
    description: '체력 재생 증가',
  },
  {
    type: 'electric',
    name: '전기의 돌',
    statKey: 'projectileSpeed',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '투사체 속도 증가',
  },
  {
    type: 'ice',
    name: '얼음의 돌',
    statKey: 'cooldownReduction',
    values: [0.05, 0.1, 0.15, 0.22, 0.3], // 쿨다운 5% ~ 30% 감소
    description: '쿨다운 감소',
  },
  {
    type: 'fighting',
    name: '격투의 돌',
    statKey: 'critDamage',
    values: [0.2, 0.4, 0.6, 0.9, 1.2],   // 치명타 데미지 배율 추가
    description: '치명타 데미지 증가',
  },
  {
    type: 'poison',
    name: '독의 돌',
    statKey: 'projectileDuration',
    values: [0.5, 1.0, 1.5, 2.0, 3.0],   // 초 단위 추가
    description: '투사체 지속시간 증가',
  },
  {
    type: 'ground',
    name: '땅의 돌',
    statKey: 'maxHp',
    values: [20, 40, 70, 100, 150],        // HP 추가
    description: '최대 체력 증가',
  },
  {
    type: 'flying',
    name: '비행의 돌',
    statKey: 'moveSpeed',
    values: [0.05, 0.1, 0.15, 0.22, 0.3],
    description: '이동속도 증가',
  },
  {
    type: 'psychic',
    name: '에스퍼의 돌',
    statKey: 'knockback',
    values: [0.1, 0.2, 0.3, 0.45, 0.6],
    description: '넉백 증가',
  },
  {
    type: 'bug',
    name: '벌레의 돌',
    statKey: 'evasion',
    values: [0.03, 0.06, 0.1, 0.15, 0.2], // 회피율 3% ~ 20%
    description: '회피율 증가',
  },
  {
    type: 'rock',
    name: '바위의 돌',
    statKey: 'critChance',
    values: [0.05, 0.1, 0.15, 0.22, 0.3],
    description: '치명타 확률 증가',
  },
  {
    type: 'ghost',
    name: '고스트의 돌',
    statKey: 'revives',
    values: [1, 1, 2, 2, 3],               // 부활 횟수
    description: '부활 횟수 증가',
  },
  {
    type: 'dragon',
    name: '드래곤의 돌',
    statKey: 'projectileCount',
    values: [1, 1, 2, 2, 3],               // 투사체 개수 추가
    description: '투사체 개수 증가',
  },
  {
    type: 'dark',
    name: '악의 돌',
    statKey: 'goldGain',
    values: [0.1, 0.2, 0.3, 0.5, 0.75],
    description: '골드 획득량 증가',
  },
  {
    type: 'steel',
    name: '강철의 돌',
    statKey: 'defense',
    values: [3, 6, 10, 15, 22],            // 방어력 추가
    description: '방어력 증가',
  },
];

export const getPassiveItem = (type: PokemonType) =>
  PASSIVE_ITEMS.find(p => p.type === type);
