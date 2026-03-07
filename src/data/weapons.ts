import type { PokemonType } from '../types';

export interface WeaponConfig {
  pokemonId: number;
  name: string;
  type: PokemonType;
  damage: number;
  cooldown: number;       // 밀리초
  projectileSpeed: number;
  projectileCount: number;
  duration: number;       // 투사체 유지 시간 (밀리초)
  textureKey: string;     // 투사체 텍스처 키
  spreadAngle: number;    // 다중 투사체일 때 퍼짐 각도 (라디안)
}

// ===== 무기 상수 =====
export const MAX_WEAPON_LEVEL  = 5;
export const MAX_WEAPON_SLOTS  = 6;
export const MAX_PASSIVE_SLOTS = 6;

// ===== 레벨별 배율 (인덱스 0 = Lv1) =====
const LV_DAMAGE_MULT:   readonly number[] = [1.0, 1.3, 1.7, 2.2, 3.0];
const LV_COOLDOWN_MULT: readonly number[] = [1.0, 0.90, 0.82, 0.75, 0.65];
const LV_COUNT_BONUS:   readonly number[] = [0,   0,    1,    1,    2];

// ===== 전체 무기 풀 (레벨 1 기준치) =====
export const ALL_WEAPONS: WeaponConfig[] = [
  {
    pokemonId: 1,
    name: '이상해씨',
    type: 'grass',
    damage: 8,
    cooldown: 1200,
    projectileSpeed: 280,
    projectileCount: 1,
    duration: 1800,
    textureKey: 'proj_grass',
    spreadAngle: 0,
  },
  {
    pokemonId: 4,
    name: '파이리',
    type: 'fire',
    damage: 12,
    cooldown: 1600,
    projectileSpeed: 340,
    projectileCount: 3,
    duration: 1200,
    textureKey: 'proj_fire',
    spreadAngle: 0.45,
  },
  {
    pokemonId: 7,
    name: '꼬부기',
    type: 'water',
    damage: 10,
    cooldown: 1000,
    projectileSpeed: 200,
    projectileCount: 1,
    duration: 3500,
    textureKey: 'proj_water',
    spreadAngle: 0,
  },
  {
    pokemonId: 25,
    name: '피카츄',
    type: 'electric',
    damage: 6,
    cooldown: 550,
    projectileSpeed: 460,
    projectileCount: 1,
    duration: 700,
    textureKey: 'proj_electric',
    spreadAngle: 0,
  },
  {
    pokemonId: 54,
    name: '고라파덕',
    type: 'psychic',
    damage: 15,
    cooldown: 2200,
    projectileSpeed: 170,
    projectileCount: 1,
    duration: 4200,
    textureKey: 'proj_psychic',
    spreadAngle: 0,
  },
];

// 하위 호환성 alias
export const BULBASAUR_WEAPON = ALL_WEAPONS[0];

// ===== 유틸 함수 =====
export function getWeaponByPokemonId(id: number): WeaponConfig | undefined {
  return ALL_WEAPONS.find(w => w.pokemonId === id);
}

/** 레벨 적용된 WeaponConfig 반환 (level: 1~MAX_WEAPON_LEVEL) */
export function getUpgradedWeapon(base: WeaponConfig, level: number): WeaponConfig {
  const l = Math.max(1, Math.min(level, MAX_WEAPON_LEVEL)) - 1; // 0-index
  return {
    ...base,
    damage:         Math.round(base.damage * LV_DAMAGE_MULT[l]),
    cooldown:       Math.round(base.cooldown * LV_COOLDOWN_MULT[l]),
    projectileCount: base.projectileCount + LV_COUNT_BONUS[l],
  };
}

/** 레벨업 후 스탯 설명 문자열 */
export function getUpgradeDescription(base: WeaponConfig, toLevel: number): string {
  const upgraded = getUpgradedWeapon(base, toLevel);
  return `공격력 ${upgraded.damage} / 쿨다운 ${(upgraded.cooldown / 1000).toFixed(1)}s / 투사체 ×${upgraded.projectileCount}`;
}

// ===== 타입별 투사체 색상 =====
export const TYPE_COLORS: Record<PokemonType, number> = {
  normal:   0xaaaaaa,
  fire:     0xff6600,
  water:    0x3399ff,
  grass:    0x44cc44,
  electric: 0xffdd00,
  ice:      0x99eeff,
  fighting: 0xcc3300,
  poison:   0xaa44aa,
  ground:   0xddaa55,
  flying:   0x88aaff,
  psychic:  0xff4499,
  bug:      0x99cc00,
  rock:     0xbbaa66,
  ghost:    0x664488,
  dragon:   0x6633ff,
  dark:     0x443344,
  steel:    0xaaaacc,
};
