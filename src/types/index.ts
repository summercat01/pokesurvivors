// ===== 포켓몬 타입 =====
export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel';

// ===== 플레이어 스탯 =====
export interface PlayerStats {
  hp: number;
  maxHp: number;
  hpRegen: number;       // 초당 HP 재생
  defense: number;
  moveSpeed: number;
  attackPower: number;
  projectileSpeed: number;
  cooldownReduction: number; // 0~1 (0.3 = 30% 감소)
  evasion: number;           // 0~1
  projectileDuration: number; // 초
  critChance: number;        // 0~1
  critDamage: number;        // 배율 (2.0 = 200%)
  projectileCount: number;
  revives: number;
  goldGain: number;          // 배율
  expGain: number;           // 배율
  knockback: number;
  projectileRange: number;
}

// ===== 포켓몬 (무기) =====
export interface PokemonWeapon {
  id: number;           // 도감번호
  name: string;
  type1: PokemonType;
  type2?: PokemonType;
  level: number;        // 1~8 (8이 만렙)
  evolutionId?: number; // 진화 후 포켓몬 도감번호
}

// ===== 패시브 아이템 =====
export interface PassiveItem {
  type: PokemonType;
  level: number; // 1~5
}

// ===== 적 =====
export interface EnemyData {
  id: number;
  spriteId: number;   // 포켓몬 도감번호 (스프라이트용)
  hp: number;
  maxHp: number;
  moveSpeed: number;
  exp: number;
  isBoss: boolean;
}

// ===== 레벨업 선택지 =====
export type LevelUpOptionType = 'newPokemon' | 'upgradePokemon' | 'newPassive' | 'upgradePassive' | 'goldBonus';

export interface LevelUpOption {
  type: LevelUpOptionType;
  pokemonId?: number;
  passiveType?: PokemonType;
  label: string;
  description: string;
  levelFrom?: number;   // 업그레이드 시 현재 레벨
  levelTo?: number;     // 적용 후 레벨 (신규=1)
}
