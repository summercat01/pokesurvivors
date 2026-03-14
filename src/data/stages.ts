import type { PokemonType } from '../types';

export interface EnemyPoolEntry {
  id: string;
  types: PokemonType[];
  minWave: number;
  /** 포켓몬 고유 체력. 미설정 시 minWave 기반 임시값 사용 */
  baseHp?: number;
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
  difficulty: number;
  enemyPool: EnemyPoolEntry[];
  elitePool: Array<{ id: string; types: PokemonType[]; baseHp?: number }>;
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
    boss10: { id: '143', name: '잠만보',  types: ['normal'],            hp: 5000,  moveSpeed: 35, exp: 60,  goldValue: 40  },
    boss20: { id: '040', name: '푸크린', types: ['normal'],            hp: 10000, moveSpeed: 50, exp: 150, goldValue: 100 },
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
    boss10: { id: '127', name: '쁘사이저',   types: ['bug'],             hp: 5000,  moveSpeed: 55, exp: 60,  goldValue: 40  },
    boss20: { id: '267', name: '뷰티플라이', types: ['bug'],             hp: 10000, moveSpeed: 50, exp: 150, goldValue: 100 },
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
    boss10: { id: '003', name: '이상해꽃', types: ['grass', 'poison'], hp: 5000,  moveSpeed: 40, exp: 60,  goldValue: 40  },
    boss20: { id: '254', name: '나무킹',   types: ['grass'],           hp: 10000, moveSpeed: 50, exp: 150, goldValue: 100 },
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
    boss10: { id: '059', name: '윈디',   types: ['fire'],           hp: 5000,  moveSpeed: 65, exp: 60,  goldValue: 40  },
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
    boss10: { id: '130', name: '갸라도스', types: ['water', 'flying'], hp: 5000,  moveSpeed: 50, exp: 60,  goldValue: 40  },
    boss20: { id: '395', name: '엠페르트', types: ['water', 'steel'],  hp: 10000, moveSpeed: 45, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 6 — 전기 평원 (Electric Plains)
  // ══════════════════════════════════════════════
  {
    id: 6,
    stageType: 'electric',
    difficulty: 2.0,
    enemyPool: [
      // Wave 0+ — 기본 전기 포켓몬
      { id: '025', types: ['electric'],          minWave: 0 },  // 피카츄
      { id: '172', types: ['electric'],          minWave: 0 },  // 피츄
      { id: '081', types: ['electric', 'steel'], minWave: 0 },  // 코일
      { id: '100', types: ['electric'],          minWave: 0 },  // 찌리리공
      { id: '179', types: ['electric'],          minWave: 0 },  // 메리프
      { id: '311', types: ['electric'],          minWave: 0 },  // 플러레
      { id: '312', types: ['electric'],          minWave: 0 },  // 마이농
      { id: '309', types: ['electric'],          minWave: 0 },  // 썬더
      { id: '403', types: ['electric'],          minWave: 0 },  // 꼬링
      { id: '417', types: ['electric'],          minWave: 0 },  // 파치리스
      // Wave 3+ — 중급
      { id: '026', types: ['electric'],          minWave: 3 },  // 라이츄
      { id: '082', types: ['electric', 'steel'], minWave: 3 },  // 레어코일
      { id: '101', types: ['electric'],          minWave: 3 },  // 붐볼
      { id: '180', types: ['electric'],          minWave: 3 },  // 보송송
      { id: '310', types: ['electric'],          minWave: 3 },  // 썬더볼트
      { id: '404', types: ['electric'],          minWave: 3 },  // 럭시오
      // Wave 5+ — 상급
      { id: '125', types: ['electric'],          minWave: 5 },  // 에레브
      { id: '181', types: ['electric'],          minWave: 5 },  // 전룡
      { id: '239', types: ['electric'],          minWave: 5 },  // 에레키드
      { id: '405', types: ['electric'],          minWave: 5 },  // 렉시오라
      // Wave 7+ — 정예급
      { id: '135', types: ['electric'],          minWave: 7 },  // 쥬피썬더
      { id: '462', types: ['electric', 'steel'], minWave: 7 },  // 자포코일
    ],
    elitePool: [
      { id: '026', types: ['electric'] },
      { id: '101', types: ['electric'] },
      { id: '181', types: ['electric'] },
      { id: '310', types: ['electric'] },
      { id: '405', types: ['electric'] },
      { id: '462', types: ['electric', 'steel'] },
      { id: '466', types: ['electric'] },
    ],
    boss10: { id: '466', name: '에레키블', types: ['electric'],           hp: 5000,  moveSpeed: 60, exp: 60,  goldValue: 40  },
    boss20: { id: '026', name: '라이츄',   types: ['electric'],           hp: 10000, moveSpeed: 55, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 7 — 구름 위 (Sky Ruins)
  // ══════════════════════════════════════════════
  {
    id: 7,
    stageType: 'flying',
    difficulty: 2.2,
    enemyPool: [
      // Wave 0+
      { id: '016', types: ['normal', 'flying'],  minWave: 0 }, // 구구
      { id: '021', types: ['normal', 'flying'],  minWave: 0 }, // 깨비참
      { id: '084', types: ['normal', 'flying'],  minWave: 0 }, // 두두
      { id: '163', types: ['normal', 'flying'],  minWave: 0 }, // 부우부
      { id: '276', types: ['normal', 'flying'],  minWave: 0 }, // 테일로
      { id: '396', types: ['normal', 'flying'],  minWave: 0 }, // 찌르꼬
      // Wave 1+
      { id: '017', types: ['normal', 'flying'],  minWave: 1 }, // 피죤
      { id: '022', types: ['normal', 'flying'],  minWave: 1 }, // 깃털왕관
      { id: '164', types: ['normal', 'flying'],  minWave: 1 }, // 야부엉
      { id: '277', types: ['normal', 'flying'],  minWave: 1 }, // 스왈로
      { id: '397', types: ['normal', 'flying'],  minWave: 1 }, // 찌르버드
      { id: '441', types: ['normal', 'flying'],  minWave: 1 }, // 채채영
      // Wave 2+
      { id: '018', types: ['normal', 'flying'],  minWave: 2 }, // 피죤투
      { id: '085', types: ['normal', 'flying'],  minWave: 2 }, // 두트리오
      { id: '176', types: ['normal', 'flying'],  minWave: 2 }, // 토게틱
      { id: '198', types: ['dark', 'flying'],    minWave: 2 }, // 니로왕
      { id: '278', types: ['water', 'flying'],   minWave: 2 }, // 갈모매
      { id: '333', types: ['normal', 'flying'],  minWave: 2 }, // 파비코
      // Wave 3+
      { id: '083', types: ['normal', 'flying'],  minWave: 3 }, // 파오리
      { id: '169', types: ['poison', 'flying'],  minWave: 3 }, // 크로뱃
      { id: '178', types: ['psychic', 'flying'], minWave: 3 }, // 야느와르몽
      { id: '207', types: ['ground', 'flying'],  minWave: 3 }, // 글라이거
      { id: '279', types: ['water', 'flying'],   minWave: 3 }, // 페리퍼
      { id: '334', types: ['dragon', 'flying'],  minWave: 3 }, // 알타리아
      // Wave 4+
      { id: '142', types: ['rock', 'flying'],    minWave: 4 }, // 프테라
      { id: '227', types: ['steel', 'flying'],   minWave: 4 }, // 에어암드
      { id: '357', types: ['grass', 'flying'],   minWave: 4 }, // 트로피우스
      { id: '430', types: ['dark', 'flying'],    minWave: 4 }, // 돈크로우
      { id: '468', types: ['normal', 'flying'],  minWave: 4 }, // 토게키스
      // Wave 7+
      { id: '398', types: ['normal', 'flying'],  minWave: 7 }, // 찌르호크
      { id: '469', types: ['bug', 'flying'],     minWave: 7 }, // 왕자리메가
      { id: '472', types: ['ground', 'flying'],  minWave: 7 }, // 글라이온
    ],
    elitePool: [
      { id: '018', types: ['normal', 'flying'] },  // 피죤투
      { id: '085', types: ['normal', 'flying'] },  // 두트리오
      { id: '142', types: ['rock', 'flying'] },    // 프테라
      { id: '169', types: ['poison', 'flying'] },  // 크로뱃
      { id: '178', types: ['psychic', 'flying'] }, // 야느와르몽
      { id: '227', types: ['steel', 'flying'] },   // 에어암드
      { id: '334', types: ['dragon', 'flying'] },  // 알타리아
      { id: '398', types: ['normal', 'flying'] },  // 찌르호크
      { id: '430', types: ['dark', 'flying'] },    // 돈크로우
      { id: '468', types: ['normal', 'flying'] },  // 토게키스
      { id: '472', types: ['ground', 'flying'] },  // 글라이온
    ],
    boss10: { id: '142', name: '프테라',   types: ['rock', 'flying'],   hp: 5000,  moveSpeed: 65, exp: 60,  goldValue: 40  },
    boss20: { id: '398', name: '찌르호크', types: ['normal', 'flying'], hp: 10000, moveSpeed: 75, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 8 — 독 늪지 (Poison Marsh)
  // ══════════════════════════════════════════════
  {
    id: 8,
    stageType: 'poison',
    difficulty: 2.4,
    enemyPool: [
      // Wave 0+
      { id: '023', types: ['poison'],           minWave: 0 }, // 아보
      { id: '029', types: ['poison'],           minWave: 0 }, // 니드런♀
      { id: '041', types: ['poison', 'flying'], minWave: 0 }, // 주뱃
      { id: '088', types: ['poison'],           minWave: 0 }, // 질퍽이
      { id: '109', types: ['poison'],           minWave: 0 }, // 독콕
      { id: '316', types: ['poison'],           minWave: 0 }, // 까시보
      // Wave 1+
      { id: '024', types: ['poison'],           minWave: 1 }, // 아보크
      { id: '030', types: ['poison'],           minWave: 1 }, // 니드리나
      { id: '042', types: ['poison', 'flying'], minWave: 1 }, // 골뱃
      { id: '110', types: ['poison'],           minWave: 1 }, // 또가스
      { id: '317', types: ['poison'],           minWave: 1 }, // 삼삼전기
      { id: '453', types: ['poison', 'fighting'], minWave: 1 }, // 독개굴
      // Wave 2+
      { id: '031', types: ['poison', 'ground'], minWave: 2 }, // 니드퀸
      { id: '089', types: ['poison'],           minWave: 2 }, // 질뻐기
      { id: '169', types: ['poison', 'flying'], minWave: 2 }, // 크로뱃
      { id: '211', types: ['water', 'poison'],  minWave: 2 }, // 침바루
      { id: '336', types: ['poison'],           minWave: 2 }, // 세비퍼
      { id: '434', types: ['poison', 'dark'],   minWave: 2 }, // 스컹뿌
      // Wave 3+
      { id: '034', types: ['poison', 'ground'], minWave: 3 }, // 니드킹
      { id: '451', types: ['poison', 'bug'],    minWave: 3 }, // 스콜피
      { id: '454', types: ['poison', 'fighting'], minWave: 3 }, // 독침개굴
      { id: '435', types: ['poison', 'dark'],   minWave: 3 }, // 스컹탱크
      // Wave 4+
      { id: '452', types: ['poison', 'dark'],   minWave: 4 }, // 드래피온
      // Wave 7+
      { id: '089', types: ['poison'],           minWave: 7 }, // 질뻐기 (추가 스폰)
      { id: '452', types: ['poison', 'dark'],   minWave: 7 }, // 드래피온 (추가 스폰)
    ],
    elitePool: [
      { id: '024', types: ['poison'] },            // 아보크
      { id: '031', types: ['poison', 'ground'] },  // 니드퀸
      { id: '089', types: ['poison'] },            // 질뻐기
      { id: '110', types: ['poison'] },            // 또가스
      { id: '169', types: ['poison', 'flying'] },  // 크로뱃
      { id: '317', types: ['poison'] },            // 삼삼전기
      { id: '336', types: ['poison'] },            // 세비퍼
      { id: '435', types: ['poison', 'dark'] },    // 스컹탱크
      { id: '452', types: ['poison', 'dark'] },    // 드래피온
      { id: '454', types: ['poison', 'fighting'] }, // 독침개굴
    ],
    boss10: { id: '089', name: '질뻐기',   types: ['poison'],           hp: 5000,  moveSpeed: 40, exp: 60,  goldValue: 40  },
    boss20: { id: '034', name: '니드킹',   types: ['poison', 'ground'], hp: 10000, moveSpeed: 55, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 9 — 사막 지대 (Desert Sands)
  // ══════════════════════════════════════════════
  {
    id: 9,
    stageType: 'ground',
    difficulty: 2.6,
    enemyPool: [
      // Wave 0+
      { id: '027', types: ['ground'],            minWave: 0 }, // 모래두지
      { id: '050', types: ['ground'],            minWave: 0 }, // 디그다
      { id: '104', types: ['ground'],            minWave: 0 }, // 탕구리
      { id: '231', types: ['ground'],            minWave: 0 }, // 코코도라
      { id: '343', types: ['ground', 'psychic'], minWave: 0 }, // 발챙이
      { id: '449', types: ['ground'],            minWave: 0 }, // 하마돈
      // Wave 1+
      { id: '028', types: ['ground'],            minWave: 1 }, // 모래껍질
      { id: '051', types: ['ground'],            minWave: 1 }, // 닥트리오
      { id: '105', types: ['ground'],            minWave: 1 }, // 텅구리
      { id: '111', types: ['ground', 'rock'],    minWave: 1 }, // 뿔카노
      { id: '232', types: ['ground'],            minWave: 1 }, // 코리갑
      { id: '339', types: ['water', 'ground'],   minWave: 1 }, // 진흙붕어
      // Wave 2+
      { id: '095', types: ['rock', 'ground'],    minWave: 2 }, // 롱스톤
      { id: '112', types: ['ground', 'rock'],    minWave: 2 }, // 뿔카이
      { id: '195', types: ['water', 'ground'],   minWave: 2 }, // 누오
      { id: '340', types: ['water', 'ground'],   minWave: 2 }, // 왕큰붕어
      { id: '344', types: ['ground', 'psychic'], minWave: 2 }, // 크레베이스
      { id: '450', types: ['ground'],            minWave: 2 }, // 하마축마
      // Wave 3+
      { id: '208', types: ['steel', 'ground'],   minWave: 3 }, // 강철톤
      { id: '260', types: ['water', 'ground'],   minWave: 3 }, // 대짱이
      { id: '323', types: ['fire', 'ground'],    minWave: 3 }, // 폭발메기
      { id: '472', types: ['ground', 'flying'],  minWave: 3 }, // 글라이온
      // Wave 4+
      { id: '075', types: ['rock', 'ground'],    minWave: 4 }, // 데구리
      { id: '246', types: ['rock', 'ground'],    minWave: 4 }, // 애버라스
      { id: '247', types: ['rock'],              minWave: 4 }, // 데기라스
      // Wave 7+
      { id: '248', types: ['rock', 'dark'],      minWave: 7 }, // 마기라스
      { id: '464', types: ['ground', 'rock'],    minWave: 7 }, // 뿔황제
    ],
    elitePool: [
      { id: '028', types: ['ground'] },             // 모래껍질
      { id: '051', types: ['ground'] },             // 닥트리오
      { id: '105', types: ['ground'] },             // 텅구리
      { id: '112', types: ['ground', 'rock'] },     // 뿔카이
      { id: '195', types: ['water', 'ground'] },    // 누오
      { id: '208', types: ['steel', 'ground'] },    // 강철톤
      { id: '232', types: ['ground'] },             // 코리갑
      { id: '344', types: ['ground', 'psychic'] },  // 크레베이스
      { id: '450', types: ['ground'] },             // 하마축마
      { id: '464', types: ['ground', 'rock'] },     // 뿔황제
    ],
    boss10: { id: '450', name: '하마축마', types: ['ground'],           hp: 5000,  moveSpeed: 45, exp: 60,  goldValue: 40  },
    boss20: { id: '076', name: '딱구리',   types: ['rock', 'ground'],   hp: 10000, moveSpeed: 50, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 10 — 암석 지대 (Rocky Cavern)
  // ══════════════════════════════════════════════
  {
    id: 10,
    stageType: 'rock',
    difficulty: 2.8,
    enemyPool: [
      // Wave 0+
      { id: '074', types: ['rock', 'ground'],  minWave: 0 }, // 꼬마돌
      { id: '138', types: ['rock', 'water'],   minWave: 0 }, // 암나이트
      { id: '140', types: ['rock', 'water'],   minWave: 0 }, // 투구
      { id: '185', types: ['rock'],            minWave: 0 }, // 꼬지모
      { id: '299', types: ['rock'],            minWave: 0 }, // 코코파스
      { id: '408', types: ['rock'],            minWave: 0 }, // 두개드래
      // Wave 1+
      { id: '095', types: ['rock', 'ground'],  minWave: 1 }, // 롱스톤
      { id: '111', types: ['ground', 'rock'],  minWave: 1 }, // 뿔카노
      { id: '304', types: ['steel', 'rock'],   minWave: 1 }, // 가보리
      { id: '337', types: ['rock', 'psychic'], minWave: 1 }, // 루나톤
      { id: '338', types: ['rock', 'psychic'], minWave: 1 }, // 솔록
      { id: '410', types: ['rock', 'steel'],   minWave: 1 }, // 방패톱스
      // Wave 2+
      { id: '075', types: ['rock', 'ground'],  minWave: 2 }, // 데구리
      { id: '139', types: ['rock', 'water'],   minWave: 2 }, // 암스타
      { id: '141', types: ['rock', 'water'],   minWave: 2 }, // 투구푸스
      { id: '305', types: ['steel', 'rock'],   minWave: 2 }, // 쏘콘
      { id: '345', types: ['rock', 'grass'],   minWave: 2 }, // 릴리요
      { id: '347', types: ['rock', 'bug'],     minWave: 2 }, // 아노딥스
      // Wave 3+
      { id: '112', types: ['ground', 'rock'],  minWave: 3 }, // 뿔카이
      { id: '306', types: ['steel', 'rock'],   minWave: 3 }, // 보스로라
      { id: '346', types: ['rock', 'grass'],   minWave: 3 }, // 크리만
      { id: '348', types: ['rock', 'bug'],     minWave: 3 }, // 아말도
      { id: '409', types: ['rock'],            minWave: 3 }, // 람파르드
      { id: '411', types: ['rock', 'steel'],   minWave: 3 }, // 방패드래
      // Wave 4+
      { id: '076', types: ['rock', 'ground'],  minWave: 4 }, // 딱구리
      { id: '142', types: ['rock', 'flying'],  minWave: 4 }, // 프테라
      { id: '246', types: ['rock', 'ground'],  minWave: 4 }, // 애버라스
      { id: '476', types: ['rock', 'steel'],   minWave: 4 }, // 노즈패스
      // Wave 7+
      { id: '247', types: ['rock'],            minWave: 7 }, // 데기라스
      { id: '464', types: ['ground', 'rock'],  minWave: 7 }, // 뿔황제
    ],
    elitePool: [
      { id: '095', types: ['rock', 'ground'] },   // 롱스톤
      { id: '112', types: ['ground', 'rock'] },   // 뿔카이
      { id: '139', types: ['rock', 'water'] },    // 암스타
      { id: '141', types: ['rock', 'water'] },    // 투구푸스
      { id: '142', types: ['rock', 'flying'] },   // 프테라
      { id: '306', types: ['steel', 'rock'] },    // 보스로라
      { id: '348', types: ['rock', 'bug'] },      // 아말도
      { id: '409', types: ['rock'] },             // 람파르드
      { id: '411', types: ['rock', 'steel'] },    // 방패드래
      { id: '464', types: ['ground', 'rock'] },   // 뿔황제
      { id: '476', types: ['rock', 'steel'] },    // 노즈패스
    ],
    boss10: { id: '409', name: '람파르드', types: ['rock'],            hp: 5000,  moveSpeed: 60, exp: 60,  goldValue: 40  },
    boss20: { id: '248', name: '마기라스', types: ['rock', 'dark'],    hp: 10000, moveSpeed: 50, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 11 — 격투 도장 (Fighting Dojo)
  // ══════════════════════════════════════════════
  {
    id: 11,
    stageType: 'fighting',
    difficulty: 3.0,
    enemyPool: [
      // Wave 0+
      { id: '056', types: ['fighting'],           minWave: 0 }, // 망키
      { id: '066', types: ['fighting'],           minWave: 0 }, // 알통몬
      { id: '236', types: ['fighting'],           minWave: 0 }, // 배루키
      { id: '296', types: ['fighting'],           minWave: 0 }, // 마크탱
      { id: '307', types: ['fighting', 'psychic'],minWave: 0 }, // 메디탱
      { id: '447', types: ['fighting'],           minWave: 0 }, // 리오루
      // Wave 1+
      { id: '057', types: ['fighting'],           minWave: 1 }, // 성원숭
      { id: '067', types: ['fighting'],           minWave: 1 }, // 근육몬
      { id: '106', types: ['fighting'],           minWave: 1 }, // 히트몬리
      { id: '107', types: ['fighting'],           minWave: 1 }, // 히트몬챈
      { id: '237', types: ['fighting'],           minWave: 1 }, // 히트몬톱
      { id: '297', types: ['fighting'],           minWave: 1 }, // 하리테
      // Wave 2+
      { id: '308', types: ['fighting', 'psychic'],minWave: 2 }, // 메디챔
      { id: '453', types: ['poison', 'fighting'], minWave: 2 }, // 독개굴
      { id: '454', types: ['poison', 'fighting'], minWave: 2 }, // 독침개굴
      { id: '448', types: ['fighting', 'steel'],  minWave: 2 }, // 루카리오
      // Wave 3+
      { id: '257', types: ['fire', 'fighting'],   minWave: 3 }, // 번치코
      { id: '392', types: ['fire', 'fighting'],   minWave: 3 }, // 초염몽
      { id: '475', types: ['psychic', 'fighting'],minWave: 3 }, // 엘레이드
      // Wave 4+
      { id: '062', types: ['water', 'fighting'],  minWave: 4 }, // 강챙이
      { id: '068', types: ['fighting'],           minWave: 4 }, // 괴력몬
      // Wave 7+
      { id: '448', types: ['fighting', 'steel'],  minWave: 7 }, // 루카리오 (추가)
    ],
    elitePool: [
      { id: '057', types: ['fighting'] },             // 성원숭
      { id: '068', types: ['fighting'] },             // 괴력몬
      { id: '106', types: ['fighting'] },             // 히트몬리
      { id: '107', types: ['fighting'] },             // 히트몬챈
      { id: '237', types: ['fighting'] },             // 히트몬톱
      { id: '297', types: ['fighting'] },             // 하리테
      { id: '308', types: ['fighting', 'psychic'] },  // 메디챔
      { id: '392', types: ['fire', 'fighting'] },     // 초염몽
      { id: '448', types: ['fighting', 'steel'] },    // 루카리오
      { id: '475', types: ['psychic', 'fighting'] },  // 엘레이드
    ],
    boss10: { id: '297', name: '하리테',   types: ['fighting'],          hp: 5000,  moveSpeed: 50, exp: 60,  goldValue: 40  },
    boss20: { id: '068', name: '괴력몬',   types: ['fighting'],          hp: 10000, moveSpeed: 55, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 12 — 에스퍼 궁전 (Psychic Palace)
  // ══════════════════════════════════════════════
  {
    id: 12,
    stageType: 'psychic',
    difficulty: 3.2,
    enemyPool: [
      // Wave 0+
      { id: '063', types: ['psychic'],            minWave: 0 }, // 캐이시
      { id: '096', types: ['psychic'],            minWave: 0 }, // 몽크
      { id: '177', types: ['psychic', 'flying'],  minWave: 0 }, // 네이티
      { id: '280', types: ['psychic'],            minWave: 0 }, // 랄토스
      { id: '325', types: ['psychic'],            minWave: 0 }, // 뱀침보
      { id: '433', types: ['psychic'],            minWave: 0 }, // 링링
      // Wave 1+
      { id: '064', types: ['psychic'],            minWave: 1 }, // 윤겔라
      { id: '097', types: ['psychic'],            minWave: 1 }, // 슬리프
      { id: '178', types: ['psychic', 'flying'],  minWave: 1 }, // 야느와르몽
      { id: '281', types: ['psychic'],            minWave: 1 }, // 킬리아
      { id: '326', types: ['psychic'],            minWave: 1 }, // 그런지
      { id: '436', types: ['steel', 'psychic'],   minWave: 1 }, // 동미러
      // Wave 2+
      { id: '122', types: ['psychic'],            minWave: 2 }, // 마임맨
      { id: '196', types: ['psychic'],            minWave: 2 }, // 에피
      { id: '282', types: ['psychic'],            minWave: 2 }, // 가디안
      { id: '360', types: ['psychic'],            minWave: 2 }, // 배쏘것
      { id: '437', types: ['steel', 'psychic'],   minWave: 2 }, // 동탁군
      { id: '439', types: ['psychic'],            minWave: 2 }, // 흉내내기
      // Wave 3+
      { id: '065', types: ['psychic'],            minWave: 3 }, // 후딘
      { id: '199', types: ['water', 'psychic'],   minWave: 3 }, // 야도킹
      { id: '202', types: ['psychic'],            minWave: 3 }, // 소오콘
      { id: '308', types: ['fighting', 'psychic'],minWave: 3 }, // 메디챔
      { id: '475', types: ['psychic', 'fighting'],minWave: 3 }, // 엘레이드
      // Wave 4+
      { id: '376', types: ['steel', 'psychic'],   minWave: 4 }, // 메타그로스
      // Wave 7+
      { id: '282', types: ['psychic'],            minWave: 7 }, // 가디안 (추가)
      { id: '065', types: ['psychic'],            minWave: 7 }, // 후딘 (추가)
    ],
    elitePool: [
      { id: '065', types: ['psychic'] },             // 후딘
      { id: '097', types: ['psychic'] },             // 슬리프
      { id: '122', types: ['psychic'] },             // 마임맨
      { id: '178', types: ['psychic', 'flying'] },   // 야느와르몽
      { id: '196', types: ['psychic'] },             // 에피
      { id: '199', types: ['water', 'psychic'] },    // 야도킹
      { id: '202', types: ['psychic'] },             // 소오콘
      { id: '282', types: ['psychic'] },             // 가디안
      { id: '376', types: ['steel', 'psychic'] },    // 메타그로스
      { id: '437', types: ['steel', 'psychic'] },    // 동탁군
      { id: '475', types: ['psychic', 'fighting'] }, // 엘레이드
    ],
    boss10: { id: '282', name: '가디안',   types: ['psychic'],           hp: 5000,  moveSpeed: 50, exp: 60,  goldValue: 40  },
    boss20: { id: '065', name: '후딘',     types: ['psychic'],           hp: 10000, moveSpeed: 60, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 13 — 유령 탑 (Ghost Tower)
  // ══════════════════════════════════════════════
  {
    id: 13,
    stageType: 'ghost',
    difficulty: 3.4,
    enemyPool: [
      // Wave 0+
      { id: '092', types: ['ghost', 'poison'],  minWave: 0 }, // 고오스
      { id: '200', types: ['ghost'],            minWave: 0 }, // 무우마
      { id: '355', types: ['ghost'],            minWave: 0 }, // 해골몽
      { id: '425', types: ['ghost', 'flying'],  minWave: 0 }, // 흔들풍손
      // Wave 1+
      { id: '093', types: ['ghost', 'poison'],  minWave: 1 }, // 고우스트
      { id: '302', types: ['dark', 'ghost'],    minWave: 1 }, // 깜까미
      { id: '356', types: ['ghost'],            minWave: 1 }, // 팬텀2
      { id: '426', types: ['ghost', 'flying'],  minWave: 1 }, // 둥실라이드
      // Wave 2+
      { id: '094', types: ['ghost', 'poison'],  minWave: 2 }, // 팬텀
      { id: '292', types: ['bug', 'ghost'],     minWave: 2 }, // 껍질몬
      { id: '429', types: ['ghost'],            minWave: 2 }, // 무우마직
      { id: '442', types: ['ghost', 'dark'],    minWave: 2 }, // 화강돌
      // Wave 3+
      { id: '477', types: ['ghost'],            minWave: 3 }, // 팬텀진화
      { id: '478', types: ['ice', 'ghost'],     minWave: 3 }, // 눈여아
      // Wave 7+
      { id: '094', types: ['ghost', 'poison'],  minWave: 7 }, // 팬텀 (추가)
      { id: '442', types: ['ghost', 'dark'],    minWave: 7 }, // 화강돌 (추가)
    ],
    elitePool: [
      { id: '094', types: ['ghost', 'poison'] }, // 팬텀
      { id: '200', types: ['ghost'] },           // 무우마
      { id: '292', types: ['bug', 'ghost'] },    // 껍질몬
      { id: '302', types: ['dark', 'ghost'] },   // 깜까미
      { id: '356', types: ['ghost'] },           // 팬텀2
      { id: '426', types: ['ghost', 'flying'] }, // 둥실라이드
      { id: '429', types: ['ghost'] },           // 무우마직
      { id: '442', types: ['ghost', 'dark'] },   // 화강돌
      { id: '477', types: ['ghost'] },           // 팬텀진화
      { id: '478', types: ['ice', 'ghost'] },    // 눈여아
    ],
    boss10: { id: '429', name: '무우마직', types: ['ghost'],           hp: 5000,  moveSpeed: 50, exp: 60,  goldValue: 40  },
    boss20: { id: '094', name: '팬텀',     types: ['ghost', 'poison'], hp: 10000, moveSpeed: 55, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 14 — 강철 공장 (Steel Factory)
  // ══════════════════════════════════════════════
  {
    id: 14,
    stageType: 'steel',
    difficulty: 3.6,
    enemyPool: [
      // Wave 0+
      { id: '081', types: ['electric', 'steel'], minWave: 0 }, // 코일
      { id: '304', types: ['steel', 'rock'],     minWave: 0 }, // 가보리
      { id: '374', types: ['steel', 'psychic'],  minWave: 0 }, // 메탕
      { id: '436', types: ['steel', 'psychic'],  minWave: 0 }, // 동미러
      // Wave 1+
      { id: '082', types: ['electric', 'steel'], minWave: 1 }, // 레어코일
      { id: '205', types: ['bug', 'steel'],      minWave: 1 }, // 쐐기벌레
      { id: '305', types: ['steel', 'rock'],     minWave: 1 }, // 쏘콘
      { id: '437', types: ['steel', 'psychic'],  minWave: 1 }, // 동탁군
      // Wave 2+
      { id: '208', types: ['steel', 'ground'],   minWave: 2 }, // 강철톤
      { id: '227', types: ['steel', 'flying'],   minWave: 2 }, // 에어암드
      { id: '306', types: ['steel', 'rock'],     minWave: 2 }, // 보스로라
      { id: '375', types: ['steel', 'psychic'],  minWave: 2 }, // 메탕구
      { id: '462', types: ['electric', 'steel'], minWave: 2 }, // 자포코일
      // Wave 3+
      { id: '212', types: ['bug', 'steel'],      minWave: 3 }, // 핫삼
      { id: '410', types: ['rock', 'steel'],     minWave: 3 }, // 방패톱스
      { id: '411', types: ['rock', 'steel'],     minWave: 3 }, // 방패드래
      { id: '448', types: ['fighting', 'steel'], minWave: 3 }, // 루카리오
      { id: '476', types: ['rock', 'steel'],     minWave: 3 }, // 노즈패스
      // Wave 4+
      { id: '376', types: ['steel', 'psychic'],  minWave: 4 }, // 메타그로스
      // Wave 7+
      { id: '376', types: ['steel', 'psychic'],  minWave: 7 }, // 메타그로스 (추가)
      { id: '212', types: ['bug', 'steel'],      minWave: 7 }, // 핫삼 (추가)
    ],
    elitePool: [
      { id: '205', types: ['bug', 'steel'] },      // 쐐기벌레
      { id: '208', types: ['steel', 'ground'] },   // 강철톤
      { id: '212', types: ['bug', 'steel'] },      // 핫삼
      { id: '227', types: ['steel', 'flying'] },   // 에어암드
      { id: '306', types: ['steel', 'rock'] },     // 보스로라
      { id: '376', types: ['steel', 'psychic'] },  // 메타그로스
      { id: '411', types: ['rock', 'steel'] },     // 방패드래
      { id: '437', types: ['steel', 'psychic'] },  // 동탁군
      { id: '448', types: ['fighting', 'steel'] }, // 루카리오
      { id: '462', types: ['electric', 'steel'] }, // 자포코일
    ],
    boss10: { id: '306', name: '보스로라', types: ['steel', 'rock'],    hp: 5000,  moveSpeed: 45, exp: 60,  goldValue: 40  },
    boss20: { id: '376', name: '메타그로스', types: ['steel', 'psychic'], hp: 10000, moveSpeed: 50, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 15 — 용의 소굴 (Dragon's Den)
  // ══════════════════════════════════════════════
  {
    id: 15,
    stageType: 'dragon',
    difficulty: 3.8,
    enemyPool: [
      // Wave 0+
      { id: '147', types: ['dragon'],           minWave: 0 }, // 미뇽
      { id: '329', types: ['ground', 'dragon'], minWave: 0 }, // 비브라바
      { id: '371', types: ['dragon'],           minWave: 0 }, // 아공이
      { id: '443', types: ['dragon', 'ground'], minWave: 0 }, // 딥상어동
      // Wave 1+
      { id: '148', types: ['dragon'],           minWave: 1 }, // 신뇽
      { id: '330', types: ['ground', 'dragon'], minWave: 1 }, // 플라이곤
      { id: '372', types: ['dragon'],           minWave: 1 }, // 쉘곤
      { id: '334', types: ['dragon', 'flying'], minWave: 1 }, // 알타리아
      { id: '444', types: ['dragon', 'ground'], minWave: 1 }, // 한바이트
      // Wave 2+
      { id: '149', types: ['dragon', 'flying'], minWave: 2 }, // 망나뇽
      { id: '230', types: ['water', 'dragon'],  minWave: 2 }, // 킹드라
      { id: '373', types: ['dragon', 'flying'], minWave: 2 }, // 보만다
      // Wave 3+
      { id: '445', types: ['dragon', 'ground'], minWave: 3 }, // 한카리아스
      // Wave 7+
      { id: '149', types: ['dragon', 'flying'], minWave: 7 }, // 망나뇽 (추가)
      { id: '373', types: ['dragon', 'flying'], minWave: 7 }, // 보만다 (추가)
    ],
    elitePool: [
      { id: '148', types: ['dragon'] },            // 신뇽
      { id: '149', types: ['dragon', 'flying'] },  // 망나뇽
      { id: '230', types: ['water', 'dragon'] },   // 킹드라
      { id: '330', types: ['ground', 'dragon'] },  // 플라이곤
      { id: '334', types: ['dragon', 'flying'] },  // 알타리아
      { id: '372', types: ['dragon'] },            // 쉘곤
      { id: '373', types: ['dragon', 'flying'] },  // 보만다
      { id: '444', types: ['dragon', 'ground'] },  // 한바이트
      { id: '445', types: ['dragon', 'ground'] },  // 한카리아스
    ],
    boss10: { id: '149', name: '망나뇽',   types: ['dragon', 'flying'], hp: 5000,  moveSpeed: 55, exp: 60,  goldValue: 40  },
    boss20: { id: '445', name: '한카리아스', types: ['dragon', 'ground'], hp: 10000, moveSpeed: 65, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 16 — 설산 (Ice Mountain)
  // ══════════════════════════════════════════════
  {
    id: 16,
    stageType: 'ice',
    difficulty: 4.0,
    enemyPool: [
      // Wave 0+
      { id: '086', types: ['water'],            minWave: 0 }, // 쥬쥬
      { id: '220', types: ['ice', 'ground'],    minWave: 0 }, // 꾸꾸리
      { id: '225', types: ['ice', 'flying'],    minWave: 0 }, // 딜리버드
      { id: '238', types: ['ice', 'psychic'],   minWave: 0 }, // 루주라유아
      // Wave 1+
      { id: '087', types: ['water', 'ice'],     minWave: 1 }, // 쥬레곤
      { id: '124', types: ['ice', 'psychic'],   minWave: 1 }, // 루주라
      { id: '221', types: ['ice', 'ground'],    minWave: 1 }, // 메꾸리
      { id: '363', types: ['ice', 'water'],     minWave: 1 }, // 구슬눈
      { id: '459', types: ['grass', 'ice'],     minWave: 1 }, // 눈쓰개
      // Wave 2+
      { id: '091', types: ['water', 'ice'],     minWave: 2 }, // 파르셀
      { id: '131', types: ['water', 'ice'],     minWave: 2 }, // 라프라스
      { id: '215', types: ['dark', 'ice'],      minWave: 2 }, // 포푸니
      { id: '364', types: ['ice', 'water'],     minWave: 2 }, // 씨물개
      { id: '460', types: ['grass', 'ice'],     minWave: 2 }, // 눈설왕
      { id: '478', types: ['ice', 'ghost'],     minWave: 2 }, // 눈여아
      // Wave 3+
      { id: '365', types: ['ice', 'water'],     minWave: 3 }, // 씨카이저
      { id: '461', types: ['dark', 'ice'],      minWave: 3 }, // 포푸니라
      { id: '471', types: ['ice'],              minWave: 3 }, // 글레이시아
      // Wave 4+
      { id: '473', types: ['ice', 'ground'],    minWave: 4 }, // 맘모꾸리
      // Wave 7+
      { id: '473', types: ['ice', 'ground'],    minWave: 7 }, // 맘모꾸리 (추가)
      { id: '461', types: ['dark', 'ice'],      minWave: 7 }, // 포푸니라 (추가)
    ],
    elitePool: [
      { id: '091', types: ['water', 'ice'] },   // 파르셀
      { id: '124', types: ['ice', 'psychic'] },  // 루주라
      { id: '131', types: ['water', 'ice'] },   // 라프라스
      { id: '215', types: ['dark', 'ice'] },    // 포푸니
      { id: '365', types: ['ice', 'water'] },   // 씨카이저
      { id: '460', types: ['grass', 'ice'] },   // 눈설왕
      { id: '461', types: ['dark', 'ice'] },    // 포푸니라
      { id: '471', types: ['ice'] },            // 글레이시아
      { id: '473', types: ['ice', 'ground'] },  // 맘모꾸리
      { id: '478', types: ['ice', 'ghost'] },   // 눈여아
    ],
    boss10: { id: '131', name: '라프라스', types: ['water', 'ice'],    hp: 5000,  moveSpeed: 45, exp: 60,  goldValue: 40  },
    boss20: { id: '473', name: '맘모꾸리', types: ['ice', 'ground'],   hp: 10000, moveSpeed: 50, exp: 150, goldValue: 100 },
  },

  // ══════════════════════════════════════════════
  // STAGE 17 — 어둠의 세계 (Dark World)
  // ══════════════════════════════════════════════
  {
    id: 17,
    stageType: 'dark',
    difficulty: 4.2,
    enemyPool: [
      // Wave 0+
      { id: '198', types: ['dark', 'flying'],   minWave: 0 }, // 니로왕
      { id: '261', types: ['dark'],             minWave: 0 }, // 포챠나
      { id: '302', types: ['dark', 'ghost'],    minWave: 0 }, // 깜까미
      { id: '359', types: ['dark'],             minWave: 0 }, // 앱솔
      // Wave 1+
      { id: '228', types: ['fire', 'dark'],     minWave: 1 }, // 델빌
      { id: '262', types: ['dark'],             minWave: 1 }, // 그라에나
      { id: '318', types: ['water', 'dark'],    minWave: 1 }, // 샤프타
      { id: '434', types: ['poison', 'dark'],   minWave: 1 }, // 스컹뿌
      // Wave 2+
      { id: '197', types: ['dark'],             minWave: 2 }, // 블래키
      { id: '229', types: ['fire', 'dark'],     minWave: 2 }, // 헬가
      { id: '319', types: ['water', 'dark'],    minWave: 2 }, // 샤크니아
      { id: '430', types: ['dark', 'flying'],   minWave: 2 }, // 돈크로우
      { id: '435', types: ['poison', 'dark'],   minWave: 2 }, // 스컹탱크
      // Wave 3+
      { id: '452', types: ['poison', 'dark'],   minWave: 3 }, // 드래피온
      { id: '461', types: ['dark', 'ice'],      minWave: 3 }, // 포푸니라
      { id: '442', types: ['ghost', 'dark'],    minWave: 3 }, // 화강돌
      // Wave 7+
      { id: '442', types: ['ghost', 'dark'],    minWave: 7 }, // 화강돌 (추가)
      { id: '452', types: ['poison', 'dark'],   minWave: 7 }, // 드래피온 (추가)
    ],
    elitePool: [
      { id: '197', types: ['dark'] },            // 블래키
      { id: '229', types: ['fire', 'dark'] },    // 헬가
      { id: '262', types: ['dark'] },            // 그라에나
      { id: '302', types: ['dark', 'ghost'] },   // 깜까미
      { id: '319', types: ['water', 'dark'] },   // 샤크니아
      { id: '359', types: ['dark'] },            // 앱솔
      { id: '430', types: ['dark', 'flying'] },  // 돈크로우
      { id: '435', types: ['poison', 'dark'] },  // 스컹탱크
      { id: '442', types: ['ghost', 'dark'] },   // 화강돌
      { id: '452', types: ['poison', 'dark'] },  // 드래피온
      { id: '461', types: ['dark', 'ice'] },     // 포푸니라
    ],
    boss10: { id: '262', name: '그라에나', types: ['dark'],             hp: 5000,  moveSpeed: 60, exp: 60,  goldValue: 40  },
    boss20: { id: '442', name: '화강돌',   types: ['ghost', 'dark'],   hp: 10000, moveSpeed: 40, exp: 150, goldValue: 100 },
  },
];

export function getStageData(stageId: number): StageData {
  return STAGE_DATA.find(s => s.id === stageId) ?? STAGE_DATA[0];
}

export function getActiveEnemyPool(stageId: number, wave: number): EnemyPoolEntry[] {
  const stage = getStageData(stageId);
  return stage.enemyPool.filter(e => wave >= e.minWave);
}

export function getElitePool(stageId: number): Array<{ id: string; types: PokemonType[]; baseHp?: number }> {
  return getStageData(stageId).elitePool;
}
