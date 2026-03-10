import type { PokemonType } from '../types';

export interface EnemyPoolEntry {
  id: string;
  types: PokemonType[];
  minWave: number;
}

export interface BossConfig {
  id: string;
  name: string;
  types: PokemonType[];
  hp: number;
  moveSpeed: number;
  exp: number;
  goldValue: number;
}

export interface StageData {
  id: number;
  stageType: PokemonType;
  enemyPool: EnemyPoolEntry[];
  elitePool: Array<{ id: string; types: PokemonType[] }>;
  boss10: BossConfig;
  boss20: BossConfig;
}

export const STAGE_DATA: StageData[] = [
  // ══════════════════════════════════════════
  // STAGE 1 — 노말
  // ══════════════════════════════════════════
  {
    id: 1,
    stageType: 'normal',
    enemyPool: [
      // Wave 0+
      { id: '019', types: ['normal'],            minWave: 0 }, // 라타타
      { id: '016', types: ['normal', 'flying'],  minWave: 0 }, // 구구
      { id: '052', types: ['normal'],            minWave: 0 }, // 나옹
      { id: '161', types: ['normal'],            minWave: 0 }, // 센쟁이
      { id: '263', types: ['normal'],            minWave: 0 }, // 지그제구리
      { id: '399', types: ['normal'],            minWave: 0 }, // 꼬마돌 (비버통)
      // Wave 1+
      { id: '021', types: ['normal', 'flying'],  minWave: 1 }, // 깨비참
      { id: '039', types: ['normal'],            minWave: 1 }, // 푸린
      { id: '162', types: ['normal'],            minWave: 1 }, // 다람쥐
      { id: '264', types: ['normal'],            minWave: 1 }, // 선두리
      { id: '400', types: ['normal', 'water'],   minWave: 1 }, // 비버통
      // Wave 2+
      { id: '020', types: ['normal'],            minWave: 2 }, // 라타이트
      { id: '017', types: ['normal', 'flying'],  minWave: 2 }, // 피죤
      { id: '053', types: ['normal'],            minWave: 2 }, // 페르시온
      { id: '175', types: ['normal'],            minWave: 2 }, // 토게피
      { id: '300', types: ['normal'],            minWave: 2 }, // 엔테이 (스키티)
      { id: '427', types: ['normal'],            minWave: 2 }, // 이어롤
      // Wave 3+
      { id: '022', types: ['normal', 'flying'],  minWave: 3 }, // 깃털왕관
      { id: '035', types: ['normal'],            minWave: 3 }, // 삐삐
      { id: '084', types: ['normal', 'flying'],  minWave: 3 }, // 두두
      { id: '216', types: ['normal'],            minWave: 3 }, // 깜지곰
      { id: '431', types: ['normal'],            minWave: 3 }, // 야옹꼬
      // Wave 4+
      { id: '036', types: ['normal'],            minWave: 4 }, // 픽시
      { id: '040', types: ['normal'],            minWave: 4 }, // 푸크린
      { id: '085', types: ['normal', 'flying'],  minWave: 4 }, // 두트리오
      { id: '133', types: ['normal'],            minWave: 4 }, // 이브이
      { id: '241', types: ['normal'],            minWave: 4 }, // 밀탱크
      { id: '432', types: ['normal'],            minWave: 4 }, // 얌냥이
      // Wave 7+
      { id: '108', types: ['normal'],            minWave: 7 }, // 내루미
      { id: '113', types: ['normal'],            minWave: 7 }, // 럭키
      { id: '128', types: ['normal'],            minWave: 7 }, // 켄타로스
      { id: '137', types: ['normal'],            minWave: 7 }, // 폴리곤
      { id: '203', types: ['normal', 'psychic'], minWave: 7 }, // 기린꼬
      { id: '217', types: ['normal'],            minWave: 7 }, // 링곰
      { id: '234', types: ['normal'],            minWave: 7 }, // 노라키
      { id: '428', types: ['normal'],            minWave: 7 }, // 이어롤
    ],
    elitePool: [
      { id: '020', types: ['normal'] },
      { id: '053', types: ['normal'] },
      { id: '036', types: ['normal'] },
      { id: '040', types: ['normal'] },
      { id: '085', types: ['normal', 'flying'] },
      { id: '113', types: ['normal'] },
      { id: '128', types: ['normal'] },
      { id: '217', types: ['normal'] },
      { id: '241', types: ['normal'] },
      { id: '432', types: ['normal'] },
    ],
    boss10: { id: '143', name: '잠만보',  types: ['normal'],            hp: 5000,  moveSpeed: 35, exp: 60,  goldValue: 40  },
    boss20: { id: '115', name: '캥카',    types: ['normal'],            hp: 10000, moveSpeed: 55, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════
  // STAGE 2 — 벌레
  // ══════════════════════════════════════════
  {
    id: 2,
    stageType: 'bug',
    enemyPool: [
      // Wave 0+
      { id: '010', types: ['bug'],             minWave: 0 }, // 캐터피
      { id: '013', types: ['bug', 'poison'],   minWave: 0 }, // 뿔충이
      { id: '046', types: ['bug', 'grass'],    minWave: 0 }, // 파라스
      { id: '165', types: ['bug', 'flying'],   minWave: 0 }, // 레디바
      { id: '265', types: ['bug'],             minWave: 0 }, // 굼케이
      { id: '401', types: ['bug'],             minWave: 0 }, // 귀뚤뚝이
      // Wave 1+
      { id: '011', types: ['bug'],             minWave: 1 }, // 단데기
      { id: '014', types: ['bug', 'poison'],   minWave: 1 }, // 딱충이
      { id: '167', types: ['bug', 'poison'],   minWave: 1 }, // 냇살무
      { id: '266', types: ['bug'],             minWave: 1 }, // 실쿤
      { id: '268', types: ['bug'],             minWave: 1 }, // 카스쿤
      { id: '415', types: ['bug', 'flying'],   minWave: 1 }, // 비구술
      // Wave 2+
      { id: '012', types: ['bug', 'flying'],   minWave: 2 }, // 버터플
      { id: '015', types: ['bug', 'poison'],   minWave: 2 }, // 독침붕
      { id: '048', types: ['bug', 'poison'],   minWave: 2 }, // 콘팡
      { id: '168', types: ['bug', 'poison'],   minWave: 2 }, // 아리아도스
      { id: '267', types: ['bug', 'flying'],   minWave: 2 }, // 뷰티플라이
      { id: '269', types: ['bug', 'poison'],   minWave: 2 }, // 독케일
      // Wave 3+
      { id: '047', types: ['bug', 'grass'],    minWave: 3 }, // 파라섹트
      { id: '193', types: ['bug', 'flying'],   minWave: 3 }, // 왕자리
      { id: '283', types: ['bug', 'water'],    minWave: 3 }, // 물거미
      { id: '313', types: ['bug'],             minWave: 3 }, // 개무소
      { id: '314', types: ['bug'],             minWave: 3 }, // 네오비트
      { id: '412', types: ['bug', 'grass'],    minWave: 3 }, // 도롱마담
      // Wave 4+
      { id: '049', types: ['bug', 'poison'],   minWave: 4 }, // 도나리
      { id: '166', types: ['bug', 'flying'],   minWave: 4 }, // 레디안
      { id: '284', types: ['bug', 'flying'],   minWave: 4 }, // 마스킹
      { id: '290', types: ['bug', 'ground'],   minWave: 4 }, // 토중몬
      { id: '402', types: ['bug'],             minWave: 4 }, // 귀뚤레기
      // Wave 7+
      { id: '123', types: ['bug', 'flying'],   minWave: 7 }, // 스라크
      { id: '204', types: ['bug', 'grass'],    minWave: 7 }, // 피콘
      { id: '205', types: ['bug', 'steel'],    minWave: 7 }, // 쐐기벌레
      { id: '213', types: ['bug', 'rock'],     minWave: 7 }, // 단단지
      { id: '291', types: ['bug', 'flying'],   minWave: 7 }, // 아이스킬
      { id: '413', types: ['bug', 'grass'],    minWave: 7 }, // 도롱마담(사)
      { id: '414', types: ['bug', 'flying'],   minWave: 7 }, // 나방울
      { id: '416', types: ['bug', 'flying'],   minWave: 7 }, // 비퀸
    ],
    elitePool: [
      { id: '123', types: ['bug', 'flying'] },
      { id: '127', types: ['bug'] },
      { id: '205', types: ['bug', 'steel'] },
      { id: '213', types: ['bug', 'rock'] },
      { id: '214', types: ['bug', 'fighting'] },
      { id: '284', types: ['bug', 'flying'] },
      { id: '402', types: ['bug'] },
      { id: '416', types: ['bug', 'flying'] },
    ],
    boss10: { id: '127', name: '쁘사이저',   types: ['bug'],             hp: 5000,  moveSpeed: 55, exp: 60,  goldValue: 40  },
    boss20: { id: '214', name: '헤라크로스', types: ['bug', 'fighting'], hp: 10000, moveSpeed: 65, exp: 150, goldValue: 100 },
  },
];

export function getStageData(stageId: number): StageData {
  return STAGE_DATA.find(s => s.id === stageId) ?? STAGE_DATA[0];
}

export function getActiveEnemyPool(stageId: number, wave: number): Array<{ id: string; types: PokemonType[] }> {
  const stage = getStageData(stageId);
  return stage.enemyPool
    .filter(e => wave >= e.minWave)
    .map(e => ({ id: e.id, types: e.types }));
}

export function getElitePool(stageId: number): Array<{ id: string; types: PokemonType[] }> {
  return getStageData(stageId).elitePool;
}
