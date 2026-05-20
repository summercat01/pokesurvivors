/** 개발자 모드 설정 — IS_DEV_MODE 일 때만 적용 */
export const DEV_CONFIG = {
  initGold:        10000, // 초기 골드
  hpMult:          2.0,   // 기본 체력 배율
  hpRegen:         3,     // 초당 HP 재생 (hp/s)
  projectileRange: 1.5,   // 공격범위 배율
  goldGain:        2.0,   // 골드 획득 배율
  enemyHpMult:     0.8,   // 일반 몹 + 엘리트 HP 배율
  bossHpMult:      0.8,   // 보스 HP 배율
  waveCountMult:   0.8,   // 웨이브 소환 수 배율
  maxEnemies:      80,    // 스폰 제한 (일반과 동일)
  expGain:         1.2,   // 경험치 획득 배율
};
