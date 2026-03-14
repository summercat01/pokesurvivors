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
      // 무기 기본진화 교체분
      '032': 'nidoran-m',  '063': 'abra',        '172': 'pichu',
      '174': 'igglybuff',  '220': 'swinub',      '246': 'larvitar',
      '396': 'starly',
      // 진화형 (1차) — 기존 목록에 없는 것만
      '033': 'nidorino',
      '064': 'kadabra',    '067': 'machoke',
      '075': 'graveler',   '093': 'haunter',     '221': 'piloswine',
      '247': 'pupitar',
      '397': 'staravia',   '444': 'gabite',      '262': 'mightyena',
      // 진화형 (2차 / 최종) — 기존 목록에 없는 것만
      '034': 'nidoking',   '065': 'alakazam',    '068': 'machamp',
      '076': 'golem',      '094': 'gengar',      '248': 'tyranitar',
      '376': 'metagross',  '398': 'staraptor',   '445': 'garchomp',
      '473': 'mamoswine',
      // Stage 6 — Gen1~4 전기
      '026': 'raichu',     '081': 'magnemite',  '082': 'magneton',
      '100': 'voltorb',    '101': 'electrode',  '125': 'electabuzz',
      '135': 'jolteon',    '179': 'mareep',     '180': 'flaaffy',
      '181': 'ampharos',   '239': 'elekid',
      '309': 'electrike',  '310': 'manectric',  '311': 'plusle',
      '312': 'minun',      '403': 'shinx',      '404': 'luxio',
      '405': 'luxray',     '417': 'pachirisu',  '462': 'magnezone',
      '466': 'electivire',
      // Stage 1 일반 적 — Gen1 노말
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
      // 무기 포켓몬
      '015': 'beedrill',  '046': 'paras',     '050': 'diglett',
      '095': 'onix',      '127': 'pinsir',    '443': 'gible',
      '261': 'poochyena', '374': 'beldum',
      // Stage 1 확장 — Gen2 노말
      '161': 'sentret',   '162': 'furret',
      '175': 'togepi',    '176': 'togetic',
      '203': 'girafarig', '216': 'teddiursa', '217': 'ursaring',
      '234': 'stantler',  '241': 'miltank',
      // Stage 1 확장 — Gen3 노말
      '263': 'zigzagoon', '264': 'linoone',
      '300': 'skitty',    '301': 'delcatty',
      '427': 'buneary',   '428': 'lopunny',
      '431': 'glameow',   '432': 'purugly',
      // Stage 1 확장 — Gen4 노말
      '399': 'bidoof',    '400': 'bibarel',
      // Stage 2 — Gen1 벌레
      '010': 'caterpie',  '011': 'metapod',   '012': 'butterfree',
      '013': 'weedle',    '014': 'kakuna',
      '047': 'parasect',  '048': 'venonat',   '049': 'venomoth',
      '123': 'scyther',
      // Stage 2 — Gen2 벌레
      '165': 'ledyba',    '166': 'ledian',
      '167': 'spinarak',  '168': 'ariados',
      '193': 'yanma',
      '204': 'pineco',    '205': 'forretress',
      '213': 'shuckle',   '214': 'heracross',
      // Stage 2 — Gen3 벌레
      '265': 'wurmple',   '266': 'silcoon',   '267': 'beautifly',
      '268': 'cascoon',   '269': 'dustox',
      '283': 'surskit',   '284': 'masquerain',
      '290': 'nincada',   '291': 'ninjask',
      '313': 'volbeat',   '314': 'illumise',
      // Stage 2 — Gen4 벌레
      '401': 'kricketot', '402': 'kricketune',
      '412': 'burmy',     '413': 'wormadam',  '414': 'mothim',
      '415': 'combee',    '416': 'vespiquen',
      // Stage 3 — Gen1 풀
      '043': 'oddish',    '044': 'gloom',     '045': 'vileplume',
      '069': 'bellsprout','070': 'weepinbell','071': 'victreebel',
      '102': 'exeggcute', '103': 'exeggutor', '114': 'tangela',
      // Stage 3 — Gen2 풀
      '152': 'chikorita', '153': 'bayleef',
      '187': 'hoppip',    '188': 'skiploom',  '189': 'jumpluff',
      '191': 'sunkern',   '192': 'sunflora',
      // Stage 3 — Gen3 풀
      '252': 'treecko',   '253': 'grovyle',   '254': 'sceptile',
      '270': 'lotad',     '271': 'lombre',    '272': 'ludicolo',
      '273': 'seedot',    '274': 'nuzleaf',   '275': 'shiftry',
      '315': 'roselia',
      '331': 'cacnea',    '332': 'cacturne',
      '357': 'tropius',
      // Stage 3 — Gen4 풀
      '387': 'turtwig',   '388': 'grotle',    '389': 'torterra',
      '406': 'budew',     '407': 'roserade',
      '420': 'cherubi',   '421': 'cherrim',
      '459': 'snover',    '460': 'abomasnow',
      '465': 'tangrowth', '470': 'leafeon',
      // Stage 4 — Gen1 불꽃
      '037': 'vulpix',    '038': 'ninetales',
      '058': 'growlithe', '059': 'arcanine',
      '077': 'ponyta',    '078': 'rapidash',
      '126': 'magmar',    '136': 'flareon',
      // Stage 4 — Gen2 불꽃
      '155': 'cyndaquil', '156': 'quilava',   '157': 'typhlosion',
      '218': 'slugma',    '219': 'magcargo',
      '228': 'houndour',  '229': 'houndoom',
      '240': 'magby',
      // Stage 4 — Gen3 불꽃
      '255': 'torchic',   '256': 'combusken', '257': 'blaziken',
      '322': 'numel',     '323': 'camerupt',  '324': 'torkoal',
      // Stage 4 — Gen4 불꽃
      '390': 'chimchar',  '391': 'monferno',  '392': 'infernape',
      '467': 'magmortar',
      // Stage 5 — Gen1 물
      '055': 'golduck',
      '060': 'poliwag',   '061': 'poliwhirl', '062': 'poliwrath',
      '072': 'tentacool', '073': 'tentacruel',
      '079': 'slowpoke',  '080': 'slowbro',
      '086': 'seel',      '087': 'dewgong',
      '090': 'shellder',  '091': 'cloyster',
      '098': 'krabby',    '099': 'kingler',
      '116': 'horsea',    '117': 'seadra',
      '118': 'goldeen',
      '129': 'magikarp',  '130': 'gyarados',
      '134': 'vaporeon',
      // Stage 5 — Gen2 물
      '158': 'totodile',  '159': 'croconaw',  '160': 'feraligatr',
      '170': 'chinchou',
      '183': 'marill',    '184': 'azumarill',
      '194': 'wooper',
      // Stage 5 — Gen3 물
      '258': 'mudkip',    '259': 'marshtomp', '260': 'swampert',
      '278': 'wingull',   '279': 'pelipper',
      '341': 'corphish',  '342': 'crawdaunt',
      '350': 'milotic',
      '363': 'spheal',    '365': 'walrein',
      // Stage 5 — Gen4 물
      '393': 'piplup',    '394': 'prinplup',  '395': 'empoleon',
      '418': 'buizel',    '419': 'floatzel',
      '422': 'shellos',
      // Stage 7 — 비행
      '083': 'farfetchd', '142': 'aerodactyl',
      '163': 'hoothoot',  '164': 'noctowl',
      '169': 'crobat',    '178': 'xatu',
      '198': 'murkrow',   '207': 'gligar',
      '227': 'skarmory',  '276': 'taillow',
      '277': 'swellow',   '333': 'swablu',
      '334': 'altaria',   '430': 'honchkrow',
      '441': 'chatot',    '468': 'togekiss',
      '469': 'yanmega',   '472': 'gliscor',
      // Stage 8 — 독
      '023': 'ekans',     '024': 'arbok',
      '029': 'nidoran-f', '030': 'nidorina',  '031': 'nidoqueen',
      '042': 'golbat',
      '088': 'grimer',    '089': 'muk',
      '109': 'koffing',   '110': 'weezing',
      '211': 'qwilfish',
      '316': 'gulpin',    '317': 'swalot',
      '336': 'seviper',
      '434': 'stunky',    '435': 'skuntank',
      '451': 'skorupi',   '452': 'drapion',
      '453': 'croagunk',  '454': 'toxicroak',
      // Stage 9 — 땅
      '027': 'sandshrew', '028': 'sandslash',
      '051': 'dugtrio',
      '104': 'cubone',    '105': 'marowak',
      '111': 'rhyhorn',   '112': 'rhydon',
      '195': 'quagsire',
      '208': 'steelix',
      '231': 'phanpy',    '232': 'donphan',
      '339': 'barboach',  '340': 'whiscash',
      '343': 'baltoy',    '344': 'claydol',
      '449': 'hippopotas','450': 'hippowdon',
      '464': 'rhyperior',
      // Stage 10 — 바위
      '138': 'omanyte',   '139': 'omastar',
      '140': 'kabuto',    '141': 'kabutops',
      '185': 'sudowoodo',
      '299': 'nosepass',
      '304': 'aron',      '305': 'lairon',    '306': 'aggron',
      '337': 'lunatone',  '338': 'solrock',
      '345': 'lileep',    '346': 'cradily',
      '347': 'anorith',   '348': 'armaldo',
      '408': 'cranidos',  '409': 'rampardos',
      '410': 'shieldon',  '411': 'bastiodon',
      '476': 'probopass',
      // Stage 11 — 격투
      '056': 'mankey',    '057': 'primeape',
      '106': 'hitmonlee', '107': 'hitmonchan',
      '236': 'tyrogue',   '237': 'hitmontop',
      '296': 'makuhita',  '297': 'hariyama',
      '307': 'meditite',  '308': 'medicham',
      '447': 'riolu',     '448': 'lucario',
      '475': 'gallade',
      // Stage 12 — 에스퍼
      '096': 'drowzee',   '097': 'hypno',
      '122': 'mr-mime',
      '177': 'natu',
      '196': 'espeon',
      '199': 'slowking',
      '202': 'wobbuffet',
      '280': 'ralts',     '281': 'kirlia',    '282': 'gardevoir',
      '325': 'spoink',    '326': 'grumpig',
      '360': 'wynaut',
      '433': 'chingling',
      '436': 'bronzor',   '437': 'bronzong',
      '439': 'mime-jr',
      // Stage 13 — 고스트
      '200': 'misdreavus',
      '292': 'shedinja',
      '302': 'sableye',
      '355': 'duskull',   '356': 'dusclops',
      '425': 'drifloon',  '426': 'drifblim',
      '429': 'mismagius',
      '442': 'spiritomb',
      '477': 'dusknoir',
      '478': 'froslass',
      // Stage 14 — 강철
      '212': 'scizor',
      // Stage 15 — 드래곤
      '147': 'dratini',   '148': 'dragonair', '149': 'dragonite',
      '230': 'kingdra',
      '329': 'vibrava',   '330': 'flygon',
      '371': 'bagon',     '372': 'shelgon',   '373': 'salamence',
      // Stage 16 — 얼음
      '124': 'jynx',
      '131': 'lapras',
      '215': 'sneasel',
      '225': 'delibird',
      '238': 'smoochum',
      '364': 'sealeo',
      '461': 'weavile',
      '471': 'glaceon',
      // Stage 17 — 악
      '197': 'umbreon',
      '318': 'carvanha',  '319': 'sharpedo',
      '359': 'absol',
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
