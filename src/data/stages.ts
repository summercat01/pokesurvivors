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
  /** 적 HP / 보스 HP 배율. Stage 1=1.0 기준, 스테이지당 +0.2 */
  difficulty: number;
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
    difficulty: 1.0,
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
    boss10: { id: '040', name: '푸크린',  types: ['normal'],            hp: 5000,  moveSpeed: 45, exp: 60,  goldValue: 40  },
    boss20: { id: '115', name: '캥카',    types: ['normal'],            hp: 10000, moveSpeed: 55, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════
  // STAGE 2 — 벌레
  // ══════════════════════════════════════════
  {
    id: 2,
    stageType: 'bug',
    difficulty: 1.2,
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
    boss10: { id: '267', name: '뷰티플라이', types: ['bug'],             hp: 5000,  moveSpeed: 45, exp: 60,  goldValue: 40  },
    boss20: { id: '214', name: '헤라크로스', types: ['bug', 'fighting'], hp: 10000, moveSpeed: 65, exp: 150, goldValue: 100 },
  },
  // ══════════════════════════════════════════
  // STAGE 3 — 풀
  // ══════════════════════════════════════════
  {
    id: 3,
    stageType: 'grass',
    difficulty: 1.4,
    enemyPool: [
      // Wave 0+
      { id: '043', types: ['grass', 'poison'],  minWave: 0 }, // 뚜벅초
      { id: '069', types: ['grass', 'poison'],  minWave: 0 }, // 모다피
      { id: '187', types: ['grass', 'flying'],  minWave: 0 }, // 통통코
      { id: '191', types: ['grass'],            minWave: 0 }, // 해너츠
      { id: '273', types: ['grass'],            minWave: 0 }, // 씨앗꼬
      { id: '387', types: ['grass'],            minWave: 0 }, // 이상해씨(4세대) 나무꼬마
      { id: '406', types: ['grass', 'poison'],  minWave: 0 }, // 꽃봉오리
      { id: '420', types: ['grass'],            minWave: 0 }, // 체리꼬
      // Wave 1+
      { id: '044', types: ['grass', 'poison'],  minWave: 1 }, // 냄새꼬
      { id: '070', types: ['grass', 'poison'],  minWave: 1 }, // 우츠동
      { id: '188', types: ['grass', 'flying'],  minWave: 1 }, // 두코
      { id: '252', types: ['grass'],            minWave: 1 }, // 나무도마뱀
      { id: '274', types: ['grass', 'dark'],    minWave: 1 }, // 잎새코
      { id: '315', types: ['grass', 'poison'],  minWave: 1 }, // 로즈레이드 전단계
      { id: '388', types: ['grass'],            minWave: 1 }, // 하야시가메
      // Wave 2+
      { id: '102', types: ['grass', 'psychic'], minWave: 2 }, // 아라리
      { id: '152', types: ['grass'],            minWave: 2 }, // 치코리타
      { id: '192', types: ['grass'],            minWave: 2 }, // 해루미
      { id: '253', types: ['grass'],            minWave: 2 }, // 잎새도마뱀
      { id: '270', types: ['grass', 'water'],   minWave: 2 }, // 연꽃몬
      { id: '421', types: ['grass'],            minWave: 2 }, // 체리꼬마
      // Wave 3+
      { id: '114', types: ['grass'],            minWave: 3 }, // 덩쿠리
      { id: '189', types: ['grass', 'flying'],  minWave: 3 }, // 솜솜코
      { id: '271', types: ['grass', 'water'],   minWave: 3 }, // 연꽃마
      { id: '331', types: ['grass'],            minWave: 3 }, // 선인왕
      { id: '459', types: ['grass', 'ice'],     minWave: 3 }, // 눈쓰개
      // Wave 4+
      { id: '045', types: ['grass', 'poison'],  minWave: 4 }, // 라플레시아
      { id: '153', types: ['grass'],            minWave: 4 }, // 베이리프
      { id: '275', types: ['grass', 'dark'],    minWave: 4 }, // 다크나이
      { id: '357', types: ['grass', 'flying'],  minWave: 4 }, // 트로피우스
      { id: '407', types: ['grass', 'poison'],  minWave: 4 }, // 로즈레이드
      // Wave 7+
      { id: '071', types: ['grass', 'poison'],  minWave: 7 }, // 우츠보트
      { id: '103', types: ['grass', 'psychic'], minWave: 7 }, // 나시
      { id: '254', types: ['grass'],            minWave: 7 }, // 나무킹
      { id: '272', types: ['grass', 'water'],   minWave: 7 }, // 루디콜로
      { id: '332', types: ['grass', 'dark'],    minWave: 7 }, // 선인장왕
      { id: '460', types: ['grass', 'ice'],     minWave: 7 }, // 눈설왕
      { id: '465', types: ['grass'],            minWave: 7 }, // 덩쿠림보
      { id: '470', types: ['grass'],            minWave: 7 }, // 리피아
    ],
    elitePool: [
      { id: '045', types: ['grass', 'poison'] },  // 라플레시아
      { id: '071', types: ['grass', 'poison'] },  // 우츠보트
      { id: '103', types: ['grass', 'psychic'] }, // 나시
      { id: '114', types: ['grass'] },            // 덩쿠리
      { id: '189', types: ['grass', 'flying'] },  // 솜솜코
      { id: '254', types: ['grass'] },            // 나무킹
      { id: '272', types: ['grass', 'water'] },   // 루디콜로
      { id: '357', types: ['grass', 'flying'] },  // 트로피우스
      { id: '389', types: ['grass', 'ground'] },  // 토대부기
      { id: '407', types: ['grass', 'poison'] },  // 로즈레이드
      { id: '465', types: ['grass'] },            // 덩쿠림보
    ],
    boss10: { id: '254', name: '나무킹',   types: ['grass'],           hp: 5000, moveSpeed: 50, exp: 60,  goldValue: 40  },
    boss20: { id: '389', name: '토대부기', types: ['grass', 'ground'], hp: 10000, moveSpeed: 35, exp: 150, goldValue: 100 },
  },
  // ══════════════════════════════════════════
  // STAGE 4 — 불꽃
  // ══════════════════════════════════════════
  {
    id: 4,
    stageType: 'fire',
    difficulty: 1.6,
    enemyPool: [
      // Wave 0+
      { id: '004', types: ['fire'],             minWave: 0 }, // 파이리
      { id: '037', types: ['fire'],             minWave: 0 }, // 식스테일
      { id: '058', types: ['fire'],             minWave: 0 }, // 가디
      { id: '155', types: ['fire'],             minWave: 0 }, // 브케인
      { id: '218', types: ['fire', 'rock'],     minWave: 0 }, // 마그마그
      { id: '228', types: ['fire', 'dark'],     minWave: 0 }, // 델빌
      { id: '255', types: ['fire'],             minWave: 0 }, // 아차모
      { id: '390', types: ['fire'],             minWave: 0 }, // 불꽃숭이
      // Wave 1+
      { id: '005', types: ['fire'],             minWave: 1 }, // 리자드
      { id: '077', types: ['fire'],             minWave: 1 }, // 포니타
      { id: '156', types: ['fire'],             minWave: 1 }, // 마그케인
      { id: '219', types: ['fire', 'rock'],     minWave: 1 }, // 마그카르고
      { id: '229', types: ['fire', 'dark'],     minWave: 1 }, // 헬가
      { id: '256', types: ['fire', 'fighting'], minWave: 1 }, // 영치코
      { id: '391', types: ['fire', 'fighting'], minWave: 1 }, // 파이몬
      // Wave 2+
      { id: '038', types: ['fire'],             minWave: 2 }, // 나인테일
      { id: '078', types: ['fire'],             minWave: 2 }, // 날쌩마
      { id: '126', types: ['fire'],             minWave: 2 }, // 마그마
      { id: '240', types: ['fire'],             minWave: 2 }, // 마그비
      { id: '322', types: ['fire', 'ground'],   minWave: 2 }, // 깜놀
      // Wave 3+
      { id: '136', types: ['fire'],             minWave: 3 }, // 부스터
      { id: '157', types: ['fire'],             minWave: 3 }, // 블레이범
      { id: '257', types: ['fire', 'fighting'], minWave: 3 }, // 번치코
      { id: '324', types: ['fire'],             minWave: 3 }, // 코터스
      // Wave 4+
      { id: '323', types: ['fire', 'ground'],   minWave: 4 }, // 폭발메기
      { id: '392', types: ['fire', 'fighting'], minWave: 4 }, // infernape 초염몽
      // Wave 7+
      { id: '059', types: ['fire'],             minWave: 7 }, // 윈디
      { id: '467', types: ['fire'],             minWave: 7 }, // 마그마번
    ],
    elitePool: [
      { id: '038', types: ['fire'] },
      { id: '059', types: ['fire'] },
      { id: '078', types: ['fire'] },
      { id: '157', types: ['fire'] },
      { id: '229', types: ['fire', 'dark'] },
      { id: '257', types: ['fire', 'fighting'] },
      { id: '323', types: ['fire', 'ground'] },
      { id: '392', types: ['fire', 'fighting'] },
      { id: '467', types: ['fire'] },
    ],
    boss10: { id: '006', name: '리자몽', types: ['fire', 'flying'], hp: 5000,  moveSpeed: 55, exp: 60,  goldValue: 40  },
    boss20: { id: '006', name: '리자몽', types: ['fire', 'flying'], hp: 10000, moveSpeed: 60, exp: 150, goldValue: 100 },
  },
  // ══════════════════════════════════════════
  // STAGE 5 — 물
  // ══════════════════════════════════════════
  {
    id: 5,
    stageType: 'water',
    difficulty: 1.8,
    enemyPool: [
      // Wave 0+
      { id: '007', types: ['water'],            minWave: 0 }, // 꼬부기
      { id: '060', types: ['water'],            minWave: 0 }, // 발챙이
      { id: '072', types: ['water', 'poison'],  minWave: 0 }, // 왕눈해
      { id: '116', types: ['water'],            minWave: 0 }, // 쏙독새
      { id: '129', types: ['water'],            minWave: 0 }, // 잉어킹
      { id: '158', types: ['water'],            minWave: 0 }, // 리아코
      { id: '258', types: ['water'],            minWave: 0 }, // 물짱이
      { id: '393', types: ['water'],            minWave: 0 }, // 팽도리
      // Wave 1+
      { id: '008', types: ['water'],            minWave: 1 }, // 어니부기
      { id: '086', types: ['water'],            minWave: 1 }, // 쥬쥬
      { id: '118', types: ['water'],            minWave: 1 }, // 콘치
      { id: '159', types: ['water'],            minWave: 1 }, // 엘리게이
      { id: '183', types: ['water'],            minWave: 1 }, // 마릴
      { id: '259', types: ['water', 'ground'],  minWave: 1 }, // 늪짱이
      { id: '394', types: ['water'],            minWave: 1 }, // 팽태자
      { id: '418', types: ['water'],            minWave: 1 }, // 브이젤
      // Wave 2+
      { id: '054', types: ['water', 'psychic'], minWave: 2 }, // 고라파덕
      { id: '090', types: ['water'],            minWave: 2 }, // 셀러
      { id: '098', types: ['water'],            minWave: 2 }, // 크랩
      { id: '194', types: ['water', 'ground'],  minWave: 2 }, // 우파
      { id: '278', types: ['water', 'flying'],  minWave: 2 }, // 갈모매
      { id: '341', types: ['water'],            minWave: 2 }, // 가재군
      { id: '422', types: ['water', 'ground'],  minWave: 2 }, // 깝질무
      // Wave 3+
      { id: '055', types: ['water', 'psychic'], minWave: 3 }, // 골덕
      { id: '061', types: ['water'],            minWave: 3 }, // 슈륙챙이
      { id: '073', types: ['water', 'poison'],  minWave: 3 }, // 독파리
      { id: '117', types: ['water'],            minWave: 3 }, // 아쿠스타
      { id: '170', types: ['water', 'electric'],minWave: 3 }, // 랜턴(전단계)
      { id: '279', types: ['water', 'flying'],  minWave: 3 }, // 페리퍼
      { id: '419', types: ['water'],            minWave: 3 }, // 플로젤
      // Wave 4+
      { id: '079', types: ['water', 'psychic'], minWave: 4 }, // 야돈
      { id: '087', types: ['water', 'ice'],     minWave: 4 }, // 쥬레곤
      { id: '091', types: ['water', 'ice'],     minWave: 4 }, // 파르셀
      { id: '184', types: ['water'],            minWave: 4 }, // 마릴리
      { id: '342', types: ['water', 'dark'],    minWave: 4 }, // 샤크니아
      { id: '363', types: ['water', 'ice'],     minWave: 4 }, // 구슬눈
      // Wave 7+
      { id: '062', types: ['water', 'fighting'],minWave: 7 }, // 강챙이
      { id: '134', types: ['water'],            minWave: 7 }, // 샤워스
      { id: '160', types: ['water'],            minWave: 7 }, // 장크로다일
      { id: '260', types: ['water', 'ground'],  minWave: 7 }, // 대짱이
      { id: '350', types: ['water'],            minWave: 7 }, // 밀로틱
      { id: '365', types: ['water', 'ice'],     minWave: 7 }, // 씨카이저
      { id: '395', types: ['water', 'steel'],   minWave: 7 }, // 엠페르트
    ],
    elitePool: [
      { id: '055', types: ['water', 'psychic'] },
      { id: '073', types: ['water', 'poison'] },
      { id: '091', types: ['water', 'ice'] },
      { id: '099', types: ['water'] },
      { id: '130', types: ['water', 'flying'] },
      { id: '134', types: ['water'] },
      { id: '160', types: ['water'] },
      { id: '184', types: ['water'] },
      { id: '260', types: ['water', 'ground'] },
      { id: '342', types: ['water', 'dark'] },
      { id: '350', types: ['water'] },
      { id: '395', types: ['water', 'steel'] },
    ],
    boss10: { id: '395', name: '엠페르트', types: ['water', 'steel'],  hp: 5000,  moveSpeed: 45, exp: 60,  goldValue: 40  },
    boss20: { id: '009', name: '거북왕',   types: ['water'],           hp: 10000, moveSpeed: 45, exp: 150, goldValue: 100 },
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
