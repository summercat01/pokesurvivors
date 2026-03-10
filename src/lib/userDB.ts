import { supabase } from './supabase';
import { UPGRADES, getUpgradeLevel, setUpgradeLevel } from '../data/upgrades';

export interface UserRecord {
  user_id:    string;
  total_gold: number;
  best_wave:  number;
  best_kills: number;
  best_time:  number;
  upgrades:   Record<string, number>;
}

export async function loadUserRecord(userId: string): Promise<UserRecord | null> {
  const { data, error } = await supabase.rpc('get_user_records', { p_user_id: userId });
  if (error || !data) return null;
  return data as UserRecord;
}

export async function saveUserRecord(userId: string, record: Partial<UserRecord>) {
  const { error } = await supabase.rpc('save_user_records', {
    p_user_id:    userId,
    p_total_gold: record.total_gold ?? 0,
    p_best_wave:  record.best_wave  ?? 0,
    p_best_kills: record.best_kills ?? 0,
    p_best_time:  record.best_time  ?? 0,
    p_upgrades:   record.upgrades   ?? {},
  });
  if (error) console.error('[userDB] save error:', error.message);
}

function getLocalUpgrades(): Record<string, number> {
  const result: Record<string, number> = {};
  UPGRADES.forEach(upg => {
    result[upg.id] = getUpgradeLevel(upg.id);
  });
  return result;
}

function applyCloudUpgrades(cloud: Record<string, number>) {
  UPGRADES.forEach(upg => {
    const local = getUpgradeLevel(upg.id);
    const merged = Math.max(local, cloud[upg.id] ?? 0);
    setUpgradeLevel(upg.id, merged);
  });
}

/** 회원가입 시: 클라우드 데이터를 로컬에 덮어씀 (새 계정은 초기화) */
export async function overwriteLocalWithCloud(userId: string) {
  const cloud = await loadUserRecord(userId);
  const upgrades = cloud?.upgrades ?? {};
  UPGRADES.forEach(upg => setUpgradeLevel(upg.id, upgrades[upg.id] ?? 0));
  localStorage.setItem('totalGold',  String(cloud?.total_gold ?? 0));
  localStorage.setItem('bestWave',   String(cloud?.best_wave  ?? 0));
  localStorage.setItem('bestKills',  String(cloud?.best_kills ?? 0));
  localStorage.setItem('bestTime',   String(cloud?.best_time  ?? 0));
}

/** 로그인 시: 클라우드↔로컬 병합 (더 높은 값 유지) */
export async function syncLocalWithCloud(userId: string) {
  const cloud = await loadUserRecord(userId);

  const localGold  = parseInt(localStorage.getItem('totalGold')  ?? '0', 10);
  const localWave  = parseInt(localStorage.getItem('bestWave')   ?? '0', 10);
  const localKills = parseInt(localStorage.getItem('bestKills')  ?? '0', 10);
  const localTime  = parseInt(localStorage.getItem('bestTime')   ?? '0', 10);

  const cloudUpgrades = cloud?.upgrades ?? {};
  applyCloudUpgrades(cloudUpgrades);

  const merged: UserRecord = {
    user_id:    userId,
    total_gold: Math.max(localGold,  cloud?.total_gold ?? 0),
    best_wave:  Math.max(localWave,  cloud?.best_wave  ?? 0),
    best_kills: Math.max(localKills, cloud?.best_kills ?? 0),
    best_time:  Math.max(localTime,  cloud?.best_time  ?? 0),
    upgrades:   getLocalUpgrades(),
  };

  localStorage.setItem('totalGold',  String(merged.total_gold));
  localStorage.setItem('bestWave',   String(merged.best_wave));
  localStorage.setItem('bestKills',  String(merged.best_kills));
  localStorage.setItem('bestTime',   String(merged.best_time));

  await saveUserRecord(userId, merged);
  return merged;
}

/** 게임 종료 후 또는 업그레이드 구매 후 localStorage → 클라우드 업로드 */
export async function pushLocalToCloud(userId: string) {
  await saveUserRecord(userId, {
    total_gold: parseInt(localStorage.getItem('totalGold')  ?? '0', 10),
    best_wave:  parseInt(localStorage.getItem('bestWave')   ?? '0', 10),
    best_kills: parseInt(localStorage.getItem('bestKills')  ?? '0', 10),
    best_time:  parseInt(localStorage.getItem('bestTime')   ?? '0', 10),
    upgrades:   getLocalUpgrades(),
  });
}
