import type { PokemonType } from '../types';

export type WeaponBehavior = 'projectile' | 'melee' | 'beam' | 'orbit' | 'zone' | 'lightning' | 'homing' | 'explosion' | 'rotating_beam' | 'falling' | 'nova' | 'boomerang' | 'scatter' | 'trap';

export interface WeaponConfig {
  pokemonId: number;
  name: string;
  type: PokemonType;
  basePokemonId?: number;  // 진화 전 원본 pokemonId (진화 무기에만 설정)
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
  lightningChainCount?: number;    // 체인 횟수
  lightningRange?: number;         // 체인 최대 거리 px
  chainCountPerLevel?: number;     // 레벨당 체인 증가량 (미설정 시 LV_COUNT_BONUS 사용)
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
    pokemonId: 252,
    name: '나무지기',
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
    meleeRange: 45,
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
    beamWidth: 13,
    beamLength: 85,
    rotateSpeed: 1.2,
  },
  {
    pokemonId: 393,
    name: '팽도리',
    type: 'water',
    description: '물 투사체를 발사합니다.\n느리지만 꾸준히 적을 압박합니다.',
    damage: 24,
    cooldown: 1600,
    projectileSpeed: 200,
    projectileCount: 1,
    duration: 2000,
    textureKey: 'proj_water',
    spreadAngle: 0,
    pierce: 2,
    behavior: 'projectile',
  },
  {
    pokemonId: 172,
    name: '피츄',
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
    lightningRange: 75,
    chainCountPerLevel: 0,
  },
  {
    pokemonId: 63,
    name: '캐이시',
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
    orbitRadius: 40,
    orbitSpeed: 2.8,
    orbitCount: 2,
  },
  {
    pokemonId: 246,
    name: '애버라스',
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
    explosionRadius: 33,
  },
  {
    pokemonId: 396,
    name: '찌르꼬',
    type: 'flying',
    description: '초음파를 부채꼴로 3발 발사합니다.\n빠른 속도로 전방의 적을 공격합니다.',
    damage: 15,
    cooldown: 1800,
    projectileSpeed: 520,
    projectileCount: 3,
    duration: 500,
    textureKey: 'proj_flying',
    spreadAngle: 0.9,
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
    damage: 28,
    cooldown: 2400,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_fighting',
    spreadAngle: 0,
    behavior: 'nova',
    meleeRange: 60,
  },
  {
    pokemonId: 74,
    name: '꼬마돌',
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
    meleeRange: 55,
    meleeAngle: Math.PI * 2,
  },
  {
    pokemonId: 265,
    name: '개무소',
    type: 'bug',
    description: '포자 함정을 주변에 설치합니다.\n적이 밟으면 폭발하며 범위 피해를 줍니다.',
    damage: 22,
    cooldown: 3000,
    projectileSpeed: 0,
    projectileCount: 2,
    duration: 0,
    textureKey: 'proj_bug',
    spreadAngle: 0,
    behavior: 'trap',
    meleeRange: 30,
  },
  {
    pokemonId: 220,
    name: '꾸꾸리',
    type: 'ice',
    description: '얼음 덩어리 3개가 무작위 위치에\n떨어져 범위 피해를 줍니다.',
    damage: 24,
    cooldown: 2800,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_ice',
    spreadAngle: 0,
    behavior: 'falling',
    fallingCount: 2,
    fallingRadius: 25,
  },
  {
    pokemonId: 443,
    name: '딥상어동',
    type: 'dragon',
    description: '용의 파동이 적을 연쇄로 튕기며\n각 지점마다 범위 폭발을 일으킵니다.',
    damage: 28,
    cooldown: 1800,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_dragon',
    spreadAngle: 0,
    pierce: 0,
    behavior: 'lightning',
    lightningChainCount: 2,
    lightningRange: 90,
    explosionRadius: 30,
    chainCountPerLevel: 1,
  },
  {
    pokemonId: 32,
    name: '니드런♂',
    type: 'poison',
    description: '독가스 장판을 주변에 생성합니다.\n범위 내 모든 적에게 지속 피해를 줍니다.',
    damage: 14,
    cooldown: 1400,
    projectileSpeed: 0,
    projectileCount: 1,
    duration: 0,
    textureKey: 'proj_poison',
    spreadAngle: 0,
    behavior: 'zone',
    zoneRadius: 70,
    zoneDamageInterval: 500,
  },
  {
    pokemonId: 174,
    name: '푸푸린',
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
    name: '메탕',
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
    beamWidth: 35,
    beamLength: 55,
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
    meleeRange: 70,
  },
];

// 하위 호환성 alias
export const STARTER_WEAPON = ALL_WEAPONS[0];

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
    meleeRange:           base.meleeRange  != null  ? base.meleeRange  + (behavior === 'trap' ? Math.round(rangeBonus * 0.35) : rangeBonus) : undefined,
    beamLength:           base.beamLength  != null  ? base.beamLength  + rangeBonus : undefined,
    beamWidth:            base.beamWidth   != null  ? base.beamWidth   + Math.round(rangeBonus * 0.2) : undefined,
    zoneRadius:           base.zoneRadius  != null  ? base.zoneRadius  + rangeBonus : undefined,
    orbitCount:           base.orbitCount  != null  ? base.orbitCount  + LV_COUNT_BONUS[l] : undefined,
    lightningChainCount:  base.lightningChainCount != null ? base.lightningChainCount + (base.chainCountPerLevel !== undefined ? base.chainCountPerLevel * l : LV_COUNT_BONUS[l]) : undefined,
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
      return `${dmg} / ${cd} / 범위 ${before.meleeRange ?? 45}→${after.meleeRange ?? 45}px`;
    case 'zone':
      return `${dmg} / ${cd} / 반경 ${before.zoneRadius ?? 60}→${after.zoneRadius ?? 60}px`;
    case 'beam':
      return `${dmg} / ${cd} / 길이 ${before.beamLength ?? 55}→${after.beamLength ?? 55}px`;
    case 'rotating_beam':
      return `${dmg} / 회전속도 ${before.rotateSpeed?.toFixed(1) ?? 1.2}→${after.rotateSpeed?.toFixed(1) ?? 1.2}rad/s`;
    case 'explosion':
      return `${dmg} / ${cd} / 폭발반경 ${before.explosionRadius ?? 90}→${after.explosionRadius ?? 90}px`;
    case 'homing':
      return `${dmg} / ${cd}`;
    case 'falling':
      return `${dmg} / ${cd} / 낙하 ${before.fallingCount ?? 3}→${after.fallingCount ?? 3}개`;
    case 'nova':
      return `${dmg} / ${cd} / 반경 ${before.meleeRange ?? 60}→${after.meleeRange ?? 60}px`;
    case 'boomerang':
      return `${dmg} / ${cd} / 사거리 ${before.meleeRange ?? 70}→${after.meleeRange ?? 70}px`;
    case 'scatter':
      return `${dmg} / ${cd} / ${before.projectileCount ?? 8}→${after.projectileCount ?? 8}발`;
    case 'trap':
      return `${dmg} / ${cd} / 함정 ${before.projectileCount ?? 2}→${after.projectileCount ?? 2}개`;
    default:
      return `${dmg} / ${cd} / 투사체 ×${before.projectileCount}→×${after.projectileCount}`;
  }
}

// ===== 타입 상성표 (공격타입 → 방어타입 → 배율, 1배는 생략) =====
type TypeChart = Partial<Record<PokemonType, Partial<Record<PokemonType, 0 | 0.5 | 2>>>>;
const TYPE_CHART: TypeChart = {
  normal:   { rock: 0.5, steel: 0.5, ghost: 0 },
  fire:     { fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5, grass: 2, ice: 2, bug: 2, steel: 2 },
  water:    { water: 0.5, grass: 0.5, dragon: 0.5, fire: 2, ground: 2, rock: 2 },
  grass:    { fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5, water: 2, ground: 2, rock: 2 },
  electric: { grass: 0.5, electric: 0.5, dragon: 0.5, ground: 0, water: 2, flying: 2 },
  ice:      { water: 0.5, ice: 0.5, steel: 0.5, fire: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2 },
  fighting: { poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, ghost: 0, normal: 2, rock: 2, steel: 2, ice: 2, dark: 2 },
  poison:   { poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, grass: 2 },
  ground:   { grass: 0.5, bug: 0.5, flying: 0, fire: 2, electric: 2, poison: 2, rock: 2, steel: 2 },
  flying:   { electric: 0.5, rock: 0.5, steel: 0.5, grass: 2, fighting: 2, bug: 2 },
  psychic:  { psychic: 0.5, steel: 0.5, dark: 0, fighting: 2, poison: 2 },
  bug:      { fire: 0.5, fighting: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, grass: 2, psychic: 2, dark: 2 },
  rock:     { fighting: 0.5, ground: 0.5, steel: 0.5, fire: 2, ice: 2, flying: 2, bug: 2 },
  ghost:    { normal: 0, dark: 0.5, ghost: 2, psychic: 2 },
  dragon:   { steel: 0.5, dragon: 2 },
  dark:     { fighting: 0.5, dark: 0.5, ghost: 2, psychic: 2 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5, ice: 2, rock: 2 },
};

/**
 * 공격 타입 vs 방어 타입 배열의 최종 배율을 반환.
 * 포켓몬 정식 규칙: 각 방어 타입 배율을 곱함 (×4, ×2, ×1, ×0.5, ×0.25, ×0)
 */
export function getTypeMultiplier(attackType: PokemonType, defenderTypes: PokemonType[]): number {
  return defenderTypes.reduce((mult, defType) => {
    return mult * (TYPE_CHART[attackType]?.[defType] ?? 1);
  }, 1);
}

/** 하위 호환용 — WeaponSystem / progressionUtils 에서 참조 */
export function isSuperEffective(attackType: PokemonType, defenderType: PokemonType): boolean {
  return (TYPE_CHART[attackType]?.[defenderType] ?? 1) >= 2;
}

/** @deprecated getTypeMultiplier 사용 권장 */
export const SUPER_EFFECTIVE: Partial<Record<PokemonType, PokemonType[]>> = {} as any;

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

// ===== 진화 시스템 =====
export interface WeaponEvolution {
  fromId: number;          // 현재 pokemonId
  toId: number;            // 진화 후 pokemonId
  toName: string;          // 진화 후 이름
  requireStoneLv: number;  // 필요 돌 레벨 (1차=1, 2차=5)
  damageMult: number;      // 원본 Lv1 대비 배율
  cooldownMult: number;    // 원본 Lv1 대비 배율
}

/** pokemonId → 진화 정보 맵 */
export const WEAPON_EVOLUTIONS: Record<number, WeaponEvolution> = {};
const _evo = (
  fromId: number, toId: number, toName: string,
  requireStoneLv: number, damageMult: number, cooldownMult: number,
) => { WEAPON_EVOLUTIONS[fromId] = { fromId, toId, toName, requireStoneLv, damageMult, cooldownMult }; };

// ── 1차 진화 (해당 타입 돌 Lv1+) ──
// 진화 직후 Lv1이 원본 Lv5(×3.0)보다 강하도록: damageMult 3.5, cooldownMult 0.60
_evo(174, 39,  '푸린',     1, 3.5, 0.60);  // 노말: 푸푸린→푸린
_evo(4,   5,   '리자드',   1, 3.5, 0.60);  // 불꽃: 파이리→리자드
_evo(393, 394, '팽태자',   1, 3.5, 0.60);  // 물:   팽도리→팽태자
_evo(252, 253, '나무돌이', 1, 3.5, 0.60);  // 풀:   나무지기→나무돌이
_evo(265, 266, '실쿤',     1, 3.5, 0.60);  // 벌레: 개무소→실쿤
_evo(172, 25,  '피카츄',   1, 3.5, 0.60);  // 전기: 피츄→피카츄
_evo(66,  67,  '근육몬',   1, 3.5, 0.60);  // 격투: 알통몬→근육몬
_evo(246, 247, '데기라스', 1, 3.5, 0.60);  // 바위: 애버라스→데기라스
_evo(74,  75,  '데구리',   1, 3.5, 0.60);  // 땅:   꼬마돌→데구리
_evo(63,  64,  '윤겔라',   1, 3.5, 0.60);  // 에스퍼: 캐이시→윤겔라
_evo(220, 221, '메꾸리',   1, 3.5, 0.60);  // 얼음: 꾸꾸리→메꾸리
_evo(32,  33,  '니드리노', 1, 3.5, 0.60);  // 독:   니드런♂→니드리노
_evo(396, 397, '찌르버드', 1, 3.5, 0.60);  // 비행: 찌르꼬→찌르버드
_evo(92,  93,  '고우스트', 1, 3.5, 0.60);  // 고스트: 고오스→고우스트
_evo(374, 375, '메탕구',   1, 3.5, 0.60);  // 강철: 메탕→메탕구
_evo(443, 444, '한바이트', 1, 3.5, 0.60);  // 드래곤: 딥상어동→한바이트
_evo(261, 262, '그라에나', 1, 3.5, 0.60);  // 악:   포치에나→그라에나

// ── 2차 진화 (해당 타입 돌 Lv5) ──
// 1차 Lv5 = origBase × 10.5, 진화 직후가 더 강하도록: damageMult 11.5, cooldownMult 0.36
_evo(39,  40,  '푸크린',    5, 11.5, 0.36);  // 노말: 푸린→푸크린
_evo(5,   6,   '리자몽',    5, 11.5, 0.36);  // 불꽃: 리자드→리자몽
_evo(394, 395, '엠페르트',  5, 11.5, 0.36);  // 물:   팽태자→엠페르트
_evo(253, 254, '나무킹',    5, 11.5, 0.36);  // 풀:   나무돌이→나무킹
_evo(266, 267, '뷰티플라이',5, 11.5, 0.36);  // 벌레: 실쿤→뷰티플라이
_evo(25,  26,  '라이츄',    5, 11.5, 0.36);  // 전기: 피카츄→라이츄
_evo(67,  68,  '괴력몬',    5, 11.5, 0.36);  // 격투: 근육몬→괴력몬
_evo(247, 248, '마기라스',  5, 11.5, 0.36);  // 바위: 데기라스→마기라스
_evo(75,  76,  '딱구리',    5, 11.5, 0.36);  // 땅:   데구리→딱구리
_evo(64,  65,  '후딘',      5, 11.5, 0.36);  // 에스퍼: 윤겔라→후딘
_evo(221, 473, '맘모꾸리',  5, 11.5, 0.36);  // 얼음: 메꾸리→맘모꾸리
_evo(33,  34,  '니드킹',    5, 11.5, 0.36);  // 독:   니드리노→니드킹
_evo(397, 398, '찌르호크',  5, 11.5, 0.36);  // 비행: 찌르버드→찌르호크
_evo(93,  94,  '팬텀',      5, 11.5, 0.36);  // 고스트: 고우스트→팬텀
_evo(375, 376, '메타그로스', 5, 11.5, 0.36); // 강철: 메탕구→메타그로스
_evo(444, 445, '한카리아스', 5, 11.5, 0.36); // 드래곤: 한바이트→한카리아스
// 그라에나는 최종형 — 2차 진화 없음

/** 진화 무기 생성: 원본 Lv1 스탯 기반으로 배율 적용, Lv1로 초기화 */
export function buildEvolvedWeapon(
  currentWeapon: WeaponConfig,
  evo: WeaponEvolution,
): WeaponConfig {
  // 원본 Lv1 스탯: basePokemonId가 있으면 그것, 없으면 currentWeapon 자체
  const origId = currentWeapon.basePokemonId ?? currentWeapon.pokemonId;
  const base   = ALL_WEAPONS.find(w => w.pokemonId === origId) ?? currentWeapon;
  return {
    ...base,
    pokemonId:    evo.toId,
    name:         evo.toName,
    damage:       Math.round(base.damage * evo.damageMult),
    cooldown:     Math.round(base.cooldown * evo.cooldownMult),
    basePokemonId: origId,
  };
}
