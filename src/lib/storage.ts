// localStorage 접근 헬퍼 — 분산된 parseInt/parseFloat 패턴 통합

export function getStoredInt(key: string, fallback = 0): number {
  return parseInt(localStorage.getItem(key) ?? String(fallback), 10);
}

export function getStoredFloat(key: string, fallback = 0): number {
  return parseFloat(localStorage.getItem(key) ?? String(fallback));
}

/** 저장된 BGM 볼륨 (0~1). 사용처에서 원하는 배율을 곱해 사용 */
export function getBgmVolume(): number {
  return getStoredFloat('bgmVolume', 1);
}
