import Phaser from 'phaser';
import {
  ALL_WEAPONS, MAX_WEAPON_LEVEL, MAX_WEAPON_SLOTS, MAX_PASSIVE_SLOTS,
  getWeaponByPokemonId, getUpgradeDescription, isSuperEffective,
  type WeaponConfig,
} from '../data/weapons';
import { PASSIVE_ITEMS, getPassiveItem, formatPassiveValue } from '../data/passiveItems';
import { getStageData } from '../data/stages';
import type { PokemonType, PlayerStats, LevelUpOption } from '../types';

/** 퍼센트 기반 배율로 적용되는 스탯 목록 */
export const PERCENT_STATS = new Set([
  'attackPower', 'moveSpeed', 'projectileSpeed', 'knockback', 'projectileRange', 'critDamage',
]);

/** 레벨업 선택지 생성 (순수 함수) */
export function generateLevelUpOptions(
  weapons: WeaponConfig[],
  weaponLevels: number[],
  equippedPassives: Map<PokemonType, number>,
  stageId: number,
): LevelUpOption[] {
  const pool: LevelUpOption[] = [];
  const equippedIds   = weapons.map(w => w.pokemonId);
  const equippedTypes = Array.from(equippedPassives.keys());
  const stageType = getStageData(stageId).stageType;

  const getWeaponRec = (wType: PokemonType): 'good' | 'bad' | undefined => {
    if (isSuperEffective(wType, stageType)) return 'good';
    if (isSuperEffective(stageType, wType)) return 'bad';
    return undefined;
  };

  // ① 신규 무기 (슬롯 여유 있을 때)
  if (weapons.length < MAX_WEAPON_SLOTS) {
    ALL_WEAPONS.forEach(w => {
      if (!equippedIds.includes(w.pokemonId)) {
        pool.push({
          type: 'newPokemon',
          pokemonId: w.pokemonId,
          label: w.name,
          description: w.description ?? `새로운 포켓몬! ${w.type} 타입`,
          levelTo: 1,
          recommendation: getWeaponRec(w.type),
        });
      }
    });
  }

  // ② 무기 강화
  weapons.forEach((w, idx) => {
    const curLv = weaponLevels[idx] ?? 1;
    if (curLv < MAX_WEAPON_LEVEL) {
      const nextLv = curLv + 1;
      const base   = getWeaponByPokemonId(w.pokemonId) ?? w;
      pool.push({
        type: 'upgradePokemon',
        pokemonId: w.pokemonId,
        label: base.name,
        description: getUpgradeDescription(base, curLv, nextLv),
        levelFrom: curLv,
        levelTo: nextLv,
        recommendation: getWeaponRec(w.type),
      });
    }
  });

  // ③ 신규 패시브 (슬롯 여유 있을 때)
  if (equippedTypes.length < MAX_PASSIVE_SLOTS) {
    PASSIVE_ITEMS.forEach(p => {
      if (!equippedTypes.includes(p.type)) {
        pool.push({
          type: 'newPassive',
          passiveType: p.type,
          label: p.name,
          description: `${p.description} ${formatPassiveValue(p.statKey, p.values[0])}`,
          levelTo: 1,
        });
      }
    });
  }

  // ④ 패시브 강화
  equippedTypes.forEach(type => {
    const curLv = equippedPassives.get(type) ?? 1;
    if (curLv < 5) {
      const nextLv = curLv + 1;
      const item   = getPassiveItem(type);
      if (item) {
        pool.push({
          type: 'upgradePassive',
          passiveType: type,
          label: item.name,
          description: `${item.description} → ${formatPassiveValue(item.statKey, item.values[nextLv - 1])}`,
          levelFrom: curLv,
          levelTo: nextLv,
        });
      }
    }
  });

  Phaser.Utils.Array.Shuffle(pool);
  const result = pool.slice(0, 3);

  // 선택지가 3개 미만이면 +50골드로 채움
  while (result.length < 3) {
    result.push({
      type: 'goldBonus',
      label: '+50 골드',
      description: '골드 50개를 획득합니다.',
    });
  }
  return result;
}

/** 패시브 스탯 적용 */
export function applyPassiveBonus(
  stats: PlayerStats,
  type: PokemonType,
  fromLevel: number,
  toLevel: number,
): void {
  const item = getPassiveItem(type);
  if (!item) return;

  const key    = item.statKey as keyof PlayerStats;
  const oldVal = fromLevel > 0 ? item.values[fromLevel - 1] : 0;
  const newVal = item.values[toLevel - 1];

  if (PERCENT_STATS.has(item.statKey)) {
    const oldMult = 1 + oldVal;
    const newMult = 1 + newVal;
    (stats as any)[key] = Math.round((stats as any)[key] / oldMult * newMult);
  } else if (key === 'maxHp') {
    const delta = newVal - oldVal;
    stats.maxHp += delta;
    stats.hp     = Math.min(stats.hp + delta, stats.maxHp);
  } else {
    const delta = newVal - oldVal;
    (stats as any)[key] += delta;
  }
}
