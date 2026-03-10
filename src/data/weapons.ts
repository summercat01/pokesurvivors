import type { PokemonType } from '../types';

export type WeaponBehavior = 'projectile' | 'melee' | 'beam' | 'orbit' | 'zone' | 'lightning' | 'homing' | 'explosion' | 'rotating_beam' | 'falling' | 'nova' | 'boomerang' | 'scatter' | 'trap';

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
  pierce?: number;      // 관통 횟수
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
  // explosion
  explosionRadius?: number;     // 폭발 반지름 px
  // 넉백 배율 (기본값은 behavior별 상수)
  knockbackMult?: number;
  // rotating_beam
  rotateSpeed?: number;         // 회전 속도 rad/s
  // falling
  fallingCount?: number;        // 낙하 개수
  fallingRadius?: number;       // 낙하 범위 반지름 px
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
    damage: 22,
    cooldown: 1800,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_grass',
    spreadAngle: 0,
    behavior: 'melee',
    meleeRange: 90,
    meleeAngle: Math.PI * 0.75,
  },
  {
    pokemonId: 4,
    name: '파이리',
    type: 'fire',
    description: '화염방사가 플레이어 주위를\n360° 회전하며 적을 태웁니다.',
    damage: 28,
    cooldown: 2200,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_fire',
    spreadAngle: 0,
    behavior: 'rotating_beam',
    beamWidth: 26,
    beamLength: 170,
    rotateSpeed: 1.2,
  },
  {
    pokemonId: 7,
    name: '꼬부기',
    type: 'water',
    description: '물 투사체를 발사합니다.\n느리지만 꾸준히 적을 압박합니다.',
    damage: 22,
    cooldown: 1600,
    projectileSpeed: 200,
    projectileCount: 1,
    duration: 2000,
    textureKey: 'proj_water',
    spreadAngle: 0,
    behavior: 'projectile',
  },
  {
    pokemonId: 25,
    name: '피카츄',
    type: 'electric',
    description: '가장 가까운 적부터 번개를\n최대 3마리까지 연쇄시킵니다.',
    damage: 18,
    cooldown: 1400,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_electric',
    spreadAngle: 0,
    behavior: 'lightning',
    lightningChainCount: 3,
    lightningRange: 150,
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
    orbitRadius: 80,
    orbitSpeed: 2.2,
    orbitCount: 1,
  },
  {
    pokemonId: 74,
    name: '꼬마돌',
    type: 'rock',
    description: '바위를 굴려 착탄 지점에서\n범위 폭발을 일으킵니다.',
    damage: 35,
    cooldown: 2800,
    projectileSpeed: 180,
    projectileCount: 1,
    duration: 2200,
    textureKey: 'proj_rock',
    spreadAngle: 0,
    behavior: 'explosion',
    explosionRadius: 65,
  },
  {
    pokemonId: 41,
    name: '주뱃',
    type: 'flying',
    description: '초음파를 부채꼴로 3발 발사합니다.\n빠른 속도로 전방의 적을 공격합니다.',
    damage: 12,
    cooldown: 1600,
    projectileSpeed: 520,
    projectileCount: 3,
    duration: 500,
    textureKey: 'proj_flying',
    spreadAngle: 1.4,
    behavior: 'projectile',
  },
  {
    pokemonId: 92,
    name: '고오스',
    type: 'ghost',
    description: '저주받은 영혼이 적을 집요하게\n추적해 공격합니다.',
    damage: 22,
    cooldown: 1800,
    projectileSpeed: 150,
    projectileCount: 1,
    duration: 4000,
    textureKey: 'proj_ghost',
    spreadAngle: 0,
    behavior: 'homing',
    pierce: 0,
  },
  {
    pokemonId: 66,
    name: '알통몬',
    type: 'fighting',
    description: '강력한 주먹 충격파를 일으킵니다.\n원형 파동이 주변 모든 적을 강타합니다.',
    damage: 36,
    cooldown: 2000,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_fighting',
    spreadAngle: 0,
    behavior: 'nova',
    meleeRange: 120,
  },
  {
    pokemonId: 50,
    name: '디그다',
    type: 'ground',
    description: '발밑 지진으로 주변의 모든 적을\n동시에 강타합니다.',
    damage: 35,
    cooldown: 2200,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_ground',
    spreadAngle: 0,
    behavior: 'melee',
    meleeRange: 110,
    meleeAngle: Math.PI * 2,
  },
  {
    pokemonId: 46,
    name: '파라스',
    type: 'bug',
    description: '포자 함정을 주변에 설치합니다.\n적이 밟으면 폭발하며 범위 피해를 줍니다.',
    damage: 38,
    cooldown: 3000,
    projectileSpeed: 0,
    projectileCount: 2,
    duration: 0,
    textureKey: 'proj_bug',
    spreadAngle: 0,
    behavior: 'trap',
    meleeRange: 45,
  },
  {
    pokemonId: 124,
    name: '루주라',
    type: 'ice',
    description: '얼음 덩어리 3개가 무작위 위치에\n떨어져 범위 피해를 줍니다.',
    damage: 30,
    cooldown: 3000,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_ice',
    spreadAngle: 0,
    behavior: 'falling',
    fallingCount: 3,
    fallingRadius: 35,
  },
  {
    pokemonId: 443,
    name: '딥상어동',
    type: 'dragon',
    description: '용의 파동이 적을 연쇄로 튕기며\n각 지점마다 범위 폭발을 일으킵니다.',
    damage: 55,
    cooldown: 2600,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_dragon',
    spreadAngle: 0,
    pierce: 0,
    behavior: 'lightning',
    lightningChainCount: 5,
    lightningRange: 180,
    explosionRadius: 55,
  },
  {
    pokemonId: 109,
    name: '또가스',
    type: 'poison',
    description: '독가스 장판을 주변에 생성합니다.\n범위 내 모든 적에게 지속 피해를 줍니다.',
    damage: 6,
    cooldown: 1500,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_poison',
    spreadAngle: 0,
    behavior: 'zone',
    zoneRadius: 75,
    zoneDamageInterval: 600,
  },
  {
    pokemonId: 39,
    name: '푸린',
    type: 'normal',
    description: '노래 에너지가 8방향으로 퍼져나갑니다.\n전방위 동시 공격으로 모든 적을 노립니다.',
    damage: 12,
    cooldown: 2000,
    projectileSpeed: 300,
    projectileCount: 8,
    duration: 650,
    textureKey: 'proj_normal',
    spreadAngle: 0,
    behavior: 'scatter',
  },
  {
    pokemonId: 374,
    name: '메탕구',
    type: 'steel',
    description: '강철 방패를 앞으로 밀어붙입니다.\n범위는 짧지만 강력한 넉백을 줍니다.',
    damage: 30,
    cooldown: 1400,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_steel',
    spreadAngle: 0,
    behavior: 'beam',
    beamWidth: 70,
    beamLength: 110,
    knockbackMult: 3.0,
  },
  {
    pokemonId: 261,
    name: '포챠나',
    type: 'dark',
    description: '예리한 발톱을 던져 적을 할퀴고\n돌아옵니다. 왕복 모두 피해를 줍니다.',
    damage: 28,
    cooldown: 1800,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_dark',
    spreadAngle: 0,
    behavior: 'boomerang',
    meleeRange: 140,
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
    explosionRadius:      base.explosionRadius != null ? base.explosionRadius + rangeBonus : undefined,
    rotateSpeed:          base.rotateSpeed != null ? +(base.rotateSpeed + l * 0.1).toFixed(2) : undefined,
    fallingCount:         base.fallingCount != null ? base.fallingCount + LV_COUNT_BONUS[l] : undefined,
    fallingRadius:        base.fallingRadius != null ? base.fallingRadius + Math.round(rangeBonus * 0.4) : undefined,
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
      return `${dmg} / ${cd} / 반경 ${before.zoneRadius ?? 70}→${after.zoneRadius ?? 70}px`;
    case 'beam':
      return `${dmg} / ${cd} / 길이 ${before.beamLength ?? 270}→${after.beamLength ?? 270}px`;
    case 'rotating_beam':
      return `${dmg} / 회전속도 ${before.rotateSpeed?.toFixed(1) ?? 1.2}→${after.rotateSpeed?.toFixed(1) ?? 1.2}rad/s`;
    case 'explosion':
      return `${dmg} / ${cd} / 폭발반경 ${before.explosionRadius ?? 90}→${after.explosionRadius ?? 90}px`;
    case 'homing':
      return `${dmg} / ${cd}`;
    case 'falling':
      return `${dmg} / ${cd} / 낙하 ${before.fallingCount ?? 3}→${after.fallingCount ?? 3}개`;
    case 'nova':
      return `${dmg} / ${cd} / 반경 ${before.meleeRange ?? 170}→${after.meleeRange ?? 170}px`;
    case 'boomerang':
      return `${dmg} / ${cd} / 사거리 ${before.meleeRange ?? 200}→${after.meleeRange ?? 200}px`;
    case 'scatter':
      return `${dmg} / ${cd} / ${before.projectileCount ?? 8}→${after.projectileCount ?? 8}발`;
    case 'trap':
      return `${dmg} / ${cd} / 함정 ${before.projectileCount ?? 2}→${after.projectileCount ?? 2}개`;
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
