import type { PokemonType } from '../types';
import { getLang } from '../i18n';

export const TYPE_KR: Record<PokemonType, string> = {
  normal: '노말', fire: '불꽃', water: '물', grass: '풀',
  electric: '전기', ice: '얼음', fighting: '격투', poison: '독',
  ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
  rock: '바위', ghost: '고스트', dragon: '드래곤', dark: '악', steel: '강철',
};

export const TYPE_EN: Record<PokemonType, string> = {
  normal: 'Normal', fire: 'Fire', water: 'Water', grass: 'Grass',
  electric: 'Electric', ice: 'Ice', fighting: 'Fighting', poison: 'Poison',
  ground: 'Ground', flying: 'Flying', psychic: 'Psychic', bug: 'Bug',
  rock: 'Rock', ghost: 'Ghost', dragon: 'Dragon', dark: 'Dark', steel: 'Steel',
};

export const TYPE_ABBR_KR: Record<PokemonType, string> = {
  normal: '노', fire: '불', water: '물', grass: '풀',
  electric: '전', ice: '얼', fighting: '격', poison: '독',
  ground: '땅', flying: '비', psychic: '에', bug: '벌',
  rock: '바', ghost: '고', dragon: '드', dark: '악', steel: '강',
};

export const TYPE_ABBR_EN: Record<PokemonType, string> = {
  normal: 'NOR', fire: 'FIR', water: 'WAT', grass: 'GRS',
  electric: 'ELC', ice: 'ICE', fighting: 'FGT', poison: 'PSN',
  ground: 'GND', flying: 'FLY', psychic: 'PSY', bug: 'BUG',
  rock: 'RCK', ghost: 'GHO', dragon: 'DRG', dark: 'DRK', steel: 'STL',
};

export function getTypeName(type: PokemonType): string {
  return getLang() === 'ko' ? TYPE_KR[type] : TYPE_EN[type];
}

export function getTypeAbbr(type: PokemonType): string {
  return getLang() === 'ko' ? TYPE_ABBR_KR[type] : TYPE_ABBR_EN[type];
}
