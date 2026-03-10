import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 로딩 바 배경
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x333333);
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 20, 0xffcc00);
    bar.setOrigin(0, 0.5);

    const loadText = this.add.text(width / 2, height / 2 - 30, '로딩 중...', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 300 * value;
    });

    // 로드 에러 무시 목록 (없는 에셋 폴백 처리)
    const OPTIONAL_KEYS = new Set(['rare_candy', 'prof_oak', 'bgm_title', 'bgm_game', 'icon_github']);
    this.load.on('loaderror', (file: { key: string }) => {
      if (OPTIONAL_KEYS.has(file.key)) { /* 옵셔널 에셋, 폴백으로 처리 */ }
    });

    // 스테이지 배경
    this.load.image('stage1', '/stage1.png');

    // 오박사 초상화 (없으면 폴백)
    this.load.image('prof_oak', '/Spr_DP_Oak.png');

    // BGM (파일이 없으면 무시 — 추후 추가)
    this.load.audio('bgm_title', ['/audio/bgm_title.mp3']);
    this.load.audio('bgm_game',  ['/audio/bgm_game.mp3']);

    // GitHub 아이콘 (Simple Icons CDN — 실패 시 폴백)
    this.load.image('icon_github', 'https://cdn.simpleicons.org/github/88bbff');

    // 트레이너 스프라이트
    this.load.image('trainer', '/Spr_DP_Lucas.png');

    // 이상한사탕 (경험치 구슬) — 파일이 없으면 로드 에러는 무시하고 폴백 텍스처 사용
    this.load.image('rare_candy', '/rare_candy.png');

    // 포켓몬 스프라이트 — 적 + 무기 + 보스
    const POKEMON_NAMES: Record<string, string> = {
      // 무기 포켓몬 + 타이틀 배경 포켓몬
      '001': 'bulbasaur',  '002': 'ivysaur',    '003': 'venusaur',
      '004': 'charmander', '005': 'charmeleon',  '006': 'charizard',
      '007': 'squirtle',   '008': 'wartortle',   '009': 'blastoise',
      '025': 'pikachu',    '054': 'psyduck',     '074': 'geodude',
      '041': 'zubat',      '092': 'gastly',      '066': 'machop',
      // Stage 1 일반 적 (노말 타입)
      '016': 'pidgey',     '017': 'pidgeotto',   '018': 'pidgeot',
      '019': 'rattata',    '020': 'raticate',
      '021': 'spearow',    '022': 'fearow',
      '035': 'clefairy',   '036': 'clefable',
      '039': 'jigglypuff', '040': 'wigglytuff',
      '052': 'meowth',     '053': 'persian',
      '084': 'doduo',      '085': 'dodrio',
      '108': 'lickitung',  '113': 'chansey',
      '115': 'kangaskhan', '128': 'tauros',
      '133': 'eevee',      '137': 'porygon',
      // Stage 1 보스
      '143': 'snorlax',
      // 다크라이 (15분 사신)
      '491': 'darkrai',
      // 새 무기 포켓몬 (9개 추가)
      '015': 'beedrill',  '046': 'paras',     '050': 'diglett',
      '095': 'onix',      '109': 'koffing',   '124': 'jynx',
      '127': 'pinsir',    '443': 'gible',
      // 악/강철 무기 포켓몬
      '261': 'poochyena', '374': 'beldum',
    };
    Object.entries(POKEMON_NAMES).forEach(([id, name]) => {
      this.load.image(`pokemon_${id}`, `/pokemon_gen4_sprites/${id}_${name}.png`);
    });
  }

  create() {
    const session = localStorage.getItem('pkmn_session');
    this.scene.start(session ? 'TitleScene' : 'LoginScene');
  }
}
