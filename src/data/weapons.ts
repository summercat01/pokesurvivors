import type { PokemonType } from '../types';

export type WeaponBehavior = 'projectile' | 'melee' | 'beam' | 'orbit' | 'zone' | 'lightning';

export interface WeaponConfig {
  pokemonId: number;
  name: string;
  type: PokemonType;
  description?: string;   // 무기 행동 설명
  damage: number;
  cooldown: number;       // 밀리초
  projectileSpeed: number;
  projectileCount: number;
  duration: number;       // 투사체 유지 시간 (밀리초)
  textureKey: string;     // 투사체 텍스처 키
  spreadAngle: number;    // 다중 투사체일 때 퍼짐 각도 (라디안)
  behavior?: WeaponBehavior;
  // melee
  meleeRange?: number;    // 사거리 px
  meleeAngle?: number;    // 부채꼴 각도 radian (2π = 360°)
  // beam
  beamWidth?: number;     // 빔 반폭 px
  beamLength?: number;    // 빔 길이 px
  // orbit
  orbitRadius?: number;   // 궤도 반지름 px
  orbitSpeed?: number;    // 회전 속도 rad/s
  orbitCount?: number;    // 구체 개수
  // zone
  zoneRadius?: number;    // 장판 반지름 px
  zoneDamageInterval?: number; // 장판 데미지 간격 ms
  // lightning
  lightningChainCount?: number; // 체인 횟수
  lightningRange?: number;      // 체인 최대 거리 px
}

// ===== 무기 상수 =====
export const MAX_WEAPON_LEVEL  = 5;
export const MAX_WEAPON_SLOTS  = 6;
export const MAX_PASSIVE_SLOTS = 6;

// ===== 레벨별 배율 (인덱스 0 = Lv1) =====
const LV_DAMAGE_MULT:   readonly number[] = [1.0, 1.3, 1.7, 2.2, 3.0];
const LV_COOLDOWN_MULT: readonly number[] = [1.0, 0.90, 0.82, 0.75, 0.65];
const LV_COUNT_BONUS:   readonly number[] = [0,   0,    1,    1,    2];
const LV_RANGE_BONUS:   readonly number[] = [0,   20,   40,   65,   100]; // melee/zone/beam 범위 성장 px

// ===== 전체 무기 풀 (레벨 1 기준치) =====
export const ALL_WEAPONS: WeaponConfig[] = [
  {
    pokemonId: 1,
    name: '이상해씨',
    type: 'grass',
    description: '전방 135° 범위의 덩굴채찍으로\n주변 적을 후려칩니다.',
    damage: 12,
    cooldown: 1000,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_grass',
    spreadAngle: 0,
    behavior: 'melee',
    meleeRange: 130,
    meleeAngle: Math.PI * 0.75,
  },
  {
    pokemonId: 4,
    name: '파이리',
    type: 'fire',
    description: '전방에 화염 빔을 방사합니다.\n범위 내 모든 적에게 피해를 줍니다.',
    damage: 18,
    cooldown: 1400,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_fire',
    spreadAngle: 0,
    behavior: 'beam',
    beamWidth: 26,
    beamLength: 270,
  },
  {
    pokemonId: 7,
    name: '꼬부기',
    type: 'water',
    description: '물 투사체를 발사합니다.\n느리지만 꾸준히 적을 압박합니다.',
    damage: 10,
    cooldown: 1000,
    projectileSpeed: 200,
    projectileCount: 1,
    duration: 3500,
    textureKey: 'proj_water',
    spreadAngle: 0,
    behavior: 'projectile',
  },
  {
    pokemonId: 25,
    name: '피카츄',
    type: 'electric',
    description: '가장 가까운 적부터 번개를\n최대 3마리까지 연쇄시킵니다.',
    damage: 10,
    cooldown: 650,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_electric',
    spreadAngle: 0,
    behavior: 'lightning',
    lightningChainCount: 3,
    lightningRange: 200,
  },
  {
    pokemonId: 54,
    name: '고라파덕',
    type: 'psychic',
    description: '에스퍼 구체가 주위를 공전하며\n닿는 적에게 지속 피해를 줍니다.',
    damage: 18,
    cooldown: 1500,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_psychic',
    spreadAngle: 0,
    behavior: 'orbit',
    orbitRadius: 110,
    orbitSpeed: 2.2,
    orbitCount: 1,
  },
  {
    pokemonId: 74,
    name: '꼬마돌',
    type: 'rock',
    description: '넓고 짧은 바위 빔을 굴립니다.\n전방의 여러 적을 한번에 공격합니다.',
    damage: 28,
    cooldown: 2000,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_rock',
    spreadAngle: 0,
    behavior: 'beam',
    beamWidth: 55,
    beamLength: 185,
  },
  {
    pokemonId: 41,
    name: '주뱃',
    type: 'flying',
    description: '초음파를 부채꼴로 3발 발사합니다.\n빠른 속도로 전방의 적을 공격합니다.',
    damage: 7,
    cooldown: 900,
    projectileSpeed: 520,
    projectileCount: 3,
    duration: 700,
    textureKey: 'proj_flying',
    spreadAngle: 1.4,
    behavior: 'projectile',
  },
  {
    pokemonId: 92,
    name: '고오스',
    type: 'ghost',
    description: '주변에 독기를 발산해 범위 내\n모든 적에게 지속 피해를 줍니다.',
    damage: 14,
    cooldown: 2200,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_ghost',
    spreadAngle: 0,
    behavior: 'zone',
    zoneRadius: 110,
    zoneDamageInterval: 1400,
  },
  {
    pokemonId: 66,
    name: '알통몬',
    type: 'fighting',
    description: '360° 전방위 강타로 주변의\n모든 적을 동시에 공격합니다.',
    damage: 22,
    cooldown: 900,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_fighting',
    spreadAngle: 0,
    behavior: 'melee',
    meleeRange: 95,
    meleeAngle: Math.PI * 2,
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
  const behavior = base.behavior ?? 'projectile';
  const rangeBonus = LV_RANGE_BONUS[l];

  return {
    ...base,
    damage:   Math.round(base.damage * LV_DAMAGE_MULT[l]),
    cooldown: Math.round(base.cooldown * LV_COOLDOWN_MULT[l]),
    // behavior별 스케일링
    projectileCount:      behavior === 'projectile' ? base.projectileCount + LV_COUNT_BONUS[l] : base.projectileCount,
    meleeRange:           base.meleeRange  != null  ? base.meleeRange  + rangeBonus : undefined,
    beamLength:           base.beamLength  != null  ? base.beamLength  + rangeBonus : undefined,
    beamWidth:            base.beamWidth   != null  ? base.beamWidth   + Math.round(rangeBonus * 0.2) : undefined,
    zoneRadius:           base.zoneRadius  != null  ? base.zoneRadius  + rangeBonus : undefined,
    orbitCount:           base.orbitCount  != null  ? base.orbitCount  + LV_COUNT_BONUS[l] : undefined,
    lightningChainCount:  base.lightningChainCount != null ? base.lightningChainCount + LV_COUNT_BONUS[l] : undefined,
  };
}

/** 레벨업 전→후 스탯 설명 문자열 */
export function getUpgradeDescription(base: WeaponConfig, fromLevel: number, toLevel: number): string {
  const before  = getUpgradedWeapon(base, fromLevel);
  const after   = getUpgradedWeapon(base, toLevel);
  const behavior = base.behavior ?? 'projectile';

  const dmg = `공격력 ${before.damage}→${after.damage}`;
  const cd  = `쿨다운 ${(before.cooldown / 1000).toFixed(1)}→${(after.cooldown / 1000).toFixed(1)}s`;

  switch (behavior) {
    case 'orbit':
      return `${dmg} / ${cd} / 구체 ×${before.orbitCount ?? 1}→×${after.orbitCount ?? 1}`;
    case 'lightning':
      return `${dmg} / ${cd} / 체인 ${before.lightningChainCount ?? 3}→${after.lightningChainCount ?? 3}회`;
    case 'melee':
      return `${dmg} / ${cd} / 범위 ${before.meleeRange ?? 120}→${after.meleeRange ?? 120}px`;
    case 'zone':
      return `${dmg} / ${cd} / 반경 ${before.zoneRadius ?? 180}→${after.zoneRadius ?? 180}px`;
    case 'beam':
      return `${dmg} / ${cd} / 길이 ${before.beamLength ?? 270}→${after.beamLength ?? 270}px`;
    default:
      return `${dmg} / ${cd} / 투사체 ×${before.projectileCount}→×${after.projectileCount}`;
  }
}

// ===== 타입 상성 (공격 타입 → 약점 타입 목록) =====
const SUPER_EFFECTIVE: Partial<Record<PokemonType, PokemonType[]>> = {
  fire:     ['grass', 'bug', 'steel', 'ice'],
  water:    ['fire', 'rock', 'ground'],
  grass:    ['water', 'ground', 'rock'],
  electric: ['water', 'flying'],
  ice:      ['grass', 'dragon', 'flying', 'ground'],
  fighting: ['normal', 'rock', 'steel', 'ice', 'dark'],
  ground:   ['fire', 'electric', 'poison', 'rock', 'steel'],
  rock:     ['fire', 'ice', 'flying', 'bug'],
  ghost:    ['ghost', 'psychic'],
  psychic:  ['fighting', 'poison'],
  flying:   ['grass', 'fighting', 'bug'],
  poison:   ['grass'],
  dark:     ['ghost', 'psychic'],
  dragon:   ['dragon'],
};

/** 1.5배 데미지면 true */
export function isSuperEffective(attackType: PokemonType, defenderType: PokemonType): boolean {
  return SUPER_EFFECTIVE[attackType]?.includes(defenderType) ?? false;
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
