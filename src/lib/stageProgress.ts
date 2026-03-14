/** 스테이지 진행 상황 관리 (클리어/해금) */

export function getClearedStages(): number[] {
  try {
    return JSON.parse(localStorage.getItem('clearedStages') ?? '[]') as number[];
  } catch {
    return [];
  }
}

export function isStageCleared(stageId: number): boolean {
  return getClearedStages().includes(stageId);
}

/** Stage 1은 항상 해금, 그 외는 이전 스테이지 클리어 필요 */
export function isStageUnlocked(stageId: number): boolean {
  if (stageId <= 1) return true;
  return isStageCleared(stageId - 1);
}

/** 스테이지 클리어 처리: clearedStages 배열 + bestStage 갱신 */
export function clearStage(stageId: number): void {
  const cleared = getClearedStages();
  if (!cleared.includes(stageId)) {
    cleared.push(stageId);
    localStorage.setItem('clearedStages', JSON.stringify(cleared));
  }
  const prev = parseInt(localStorage.getItem('bestStage') ?? '0', 10);
  if (stageId > prev) {
    localStorage.setItem('bestStage', String(stageId));
  }
}
