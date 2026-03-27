import Phaser from 'phaser';
import type { LevelUpOption } from '../types';
import { TYPE_COLORS, getWeaponByPokemonId } from '../data/weapons';
import type { GameScene } from './GameScene';
import { TYPE_KR } from '../constants/typeLabels';
import { PokeUI, POKE_FONT, PokePalette } from '../ui/PokeUI';

export class LevelUpScene extends Phaser.Scene {
  private CARD_W = 360;
  private CARD_H = 100;
  private CARD_GAP = 14;

  constructor() {
    super({ key: 'LevelUpScene' });
  }

  create(data: { options: LevelUpOption[] }) {
    const W = this.scale.width;
    const H = this.scale.height;
    const { options } = data;

    this.CARD_W   = W - 20;
    this.CARD_H   = Math.round(Math.max(90, H * 0.115));
    this.CARD_GAP = Math.round(H * 0.016);

    // ── 어두운 반투명 오버레이 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);

    // ── 포켓몬 스타일 헤더 패널 ──
    const headerPanelH = 52;
    const headerY = Math.round(H * 0.065);
    PokeUI.panel(this, W / 2, headerY, W - 20, headerPanelH, PokePalette.headerBg);
    this.add.text(W / 2, headerY - 4, '레벨이 올랐다!', {
      fontFamily: POKE_FONT,
      fontSize: '20px',
      color: PokePalette.textWhite,
      stroke: '#101840',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ── 서브 패널 ──
    const subY = Math.round(H * 0.13);
    PokeUI.panel(this, W / 2, subY, W - 20, 30);
    this.add.text(W / 2, subY, '강화할 능력을 고르세요', {
      fontFamily: POKE_FONT,
      fontSize: '11px',
      color: PokePalette.textDark,
    }).setOrigin(0.5);

    // ── 카드 ──
    const CARD_START = Math.round(H * 0.175);
    options.forEach((opt, i) => {
      const cy = CARD_START + i * (this.CARD_H + this.CARD_GAP) + this.CARD_H / 2;
      this.createCard(opt, W / 2, cy);
    });
  }

  // ─────────────────────────────────────────
  private createCard(opt: LevelUpOption, cx: number, cy: number) {
    if (opt.type === 'goldBonus') {
      this.createGoldCard(cx, cy);
      return;
    }
    const typeColor = this.resolveTypeColor(opt);
    const isNew     = opt.type === 'newPokemon' || opt.type === 'newPassive';
    const sprKey    = this.resolveSprite(opt);

    const CARD_W = this.CARD_W;
    const CARD_H = this.CARD_H;

    // ── 포켓몬 스타일 카드 패널 ──
    PokeUI.panel(this, cx, cy, CARD_W, CARD_H);

    // 인터랙션용 투명 레이어
    const cardBg = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // ── 좌측 타입 컬러 영역 ──
    const STRIPE_W = 80;
    const stripeX  = cx - CARD_W / 2 + STRIPE_W / 2;
    // 타입 스트라이프 (검정 테두리 안쪽에 맞게)
    const sg = this.add.graphics();
    sg.fillStyle(typeColor, 1);
    sg.fillRect(cx - CARD_W / 2 + 3, cy - CARD_H / 2 + 3, STRIPE_W - 3, CARD_H - 6);
    // 스트라이프 우측 구분선
    sg.fillStyle(0x282018, 0.4);
    sg.fillRect(cx - CARD_W / 2 + STRIPE_W, cy - CARD_H / 2 + 3, 2, CARD_H - 6);

    // 포켓몬 스프라이트 or 타입 심볼
    if (sprKey && this.textures.exists(sprKey)) {
      this.add.image(stripeX, cy - 6, sprKey).setDisplaySize(56, 56);
      // 무기 타입 텍스트 (스프라이트 아래)
      if (opt.pokemonId != null) {
        const w = getWeaponByPokemonId(opt.pokemonId);
        if (w) {
          this.add.text(stripeX, cy + 30, `[${TYPE_KR[w.type] ?? w.type}]`, {
            fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5);
        }
      }
    } else if (opt.passiveType) {
      // 타입 이름 심볼 (한글 타입명)
      this.add.text(stripeX, cy - 8, '💎', { fontSize: '28px' }).setOrigin(0.5);
      this.add.text(stripeX, cy + 20, TYPE_KR[opt.passiveType] ?? opt.passiveType, {
        fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // ── 배지 (NEW / Lv.X→Y) — 포켓몬 스타일 태그 ──
    const badgeLabel = isNew ? 'NEW' : `Lv.${opt.levelFrom ?? 1}→${opt.levelTo ?? 2}`;
    const badgeColor = isNew ? 0xcc3311 : 0x2255aa;
    const badgeW     = isNew ? 42 : 74;
    const badgeX     = cx + CARD_W / 2 - badgeW / 2 - 8;
    const badgeY     = cy - CARD_H / 2 + 14;
    const bg = this.add.graphics();
    bg.fillStyle(0x181810); bg.fillRect(badgeX - badgeW/2 + 1, badgeY - 9 + 1, badgeW, 18);
    bg.fillStyle(badgeColor); bg.fillRect(badgeX - badgeW/2, badgeY - 9, badgeW, 18);
    bg.fillStyle(0xffffff, 0.3); bg.fillRect(badgeX - badgeW/2, badgeY - 9, badgeW, 3);
    this.add.text(badgeX, badgeY, badgeLabel, {
      fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── 추천/비추천 배지 ──
    if (opt.recommendation === 'good') {
      const rx = cx - CARD_W / 2 + STRIPE_W + 8;
      const ry = cy + CARD_H / 2 - 13;
      const rbg = this.add.graphics();
      rbg.fillStyle(0x181810); rbg.fillRect(rx + 1, ry - 8, 48, 16);
      rbg.fillStyle(0x116633); rbg.fillRect(rx, ry - 9, 48, 16);
      this.add.text(rx + 24, ry - 1, '★ 추천', { fontSize: '9px', color: '#aaffcc', fontStyle: 'bold' }).setOrigin(0.5);
    } else if (opt.recommendation === 'bad') {
      const rx = cx - CARD_W / 2 + STRIPE_W + 8;
      const ry = cy + CARD_H / 2 - 13;
      const rbg = this.add.graphics();
      rbg.fillStyle(0x181810); rbg.fillRect(rx + 1, ry - 8, 54, 16);
      rbg.fillStyle(0x662222); rbg.fillRect(rx, ry - 9, 54, 16);
      this.add.text(rx + 27, ry - 1, '▼ 비추천', { fontSize: '9px', color: '#ffaaaa', fontStyle: 'bold' }).setOrigin(0.5);
    }

    // ── 이름 텍스트 (어두운 색으로) ──
    const textX = cx - CARD_W / 2 + STRIPE_W + 12;
    this.add.text(textX, cy - 20, opt.label, {
      fontSize: '19px',
      color: '#181810',
      fontStyle: 'bold',
      padding: { top: 4 },
    }).setOrigin(0, 0.5);

    // 구분선
    const dl = this.add.graphics();
    dl.lineStyle(1, 0x989880, 0.6);
    dl.lineBetween(textX, cy, cx + CARD_W / 2 - 10, cy);

    // ── 설명 텍스트 ──
    this.add.text(textX, cy + 18, opt.description, {
      fontSize: '11px',
      color: '#484838',
      wordWrap: { width: CARD_W - STRIPE_W - 60 },
      lineSpacing: 3,
    }).setOrigin(0, 0.5);

    // ── 호버 (포켓몬 스타일 하이라이트) ──
    const hoverG = this.add.graphics();
    cardBg.on('pointerover', () => {
      hoverG.clear();
      hoverG.fillStyle(0x3050a0, 0.12);
      hoverG.fillRect(cx - CARD_W / 2 + 3, cy - CARD_H / 2 + 3, CARD_W - 6, CARD_H - 6);
    });
    cardBg.on('pointerout', () => hoverG.clear());

    cardBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as unknown as GameScene;
      gameScene.applyLevelUpChoice(opt);
      this.scene.stop('LevelUpScene');
      this.scene.resume('GameScene');
    });
  }

  // ─────────────────────────────────────────
  private createGoldCard(cx: number, cy: number) {
    const CARD_W = this.CARD_W;
    const CARD_H = this.CARD_H;
    const GOLD = 0xf0a800;

    // 골드 카드 - 포켓몬 스타일 패널
    PokeUI.panel(this, cx, cy, CARD_W, CARD_H, 0xf8f0d0);

    const cardBg = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const STRIPE_W = 80;
    const sg = this.add.graphics();
    sg.fillStyle(GOLD, 1);
    sg.fillRect(cx - CARD_W / 2 + 3, cy - CARD_H / 2 + 3, STRIPE_W - 3, CARD_H - 6);
    sg.fillStyle(0x282018, 0.4);
    sg.fillRect(cx - CARD_W / 2 + STRIPE_W, cy - CARD_H / 2 + 3, 2, CARD_H - 6);

    const stripeX = cx - CARD_W / 2 + STRIPE_W / 2;
    this.add.text(stripeX, cy, '💰', { fontSize: '36px' }).setOrigin(0.5);

    const textX = cx - CARD_W / 2 + STRIPE_W + 12;
    this.add.text(textX, cy - 16, '+50 골드', {
      fontSize: '21px', color: '#8a6000', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(textX, cy + 14, '골드 50개를 획득합니다.', {
      fontSize: '11px', color: '#606040',
    }).setOrigin(0, 0.5);

    const hoverG = this.add.graphics();
    cardBg.on('pointerover', () => {
      hoverG.clear();
      hoverG.fillStyle(GOLD, 0.1);
      hoverG.fillRect(cx - CARD_W / 2 + 3, cy - CARD_H / 2 + 3, CARD_W - 6, CARD_H - 6);
    });
    cardBg.on('pointerout', () => hoverG.clear());
    cardBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as unknown as GameScene;
      gameScene.applyLevelUpChoice({ type: 'goldBonus', label: '', description: '' });
      this.scene.stop('LevelUpScene');
      this.scene.resume('GameScene');
    });
  }

  // ─────────────────────────────────────────
  private resolveTypeColor(opt: LevelUpOption): number {
    if (opt.passiveType) return TYPE_COLORS[opt.passiveType] ?? 0x888888;
    if (opt.pokemonId != null) {
      const w = getWeaponByPokemonId(opt.pokemonId);
      if (w) return TYPE_COLORS[w.type];
    }
    return 0x888888;
  }

  private resolveSprite(opt: LevelUpOption): string | null {
    // 무기 카드만 포켓몬 스프라이트 표시
    if (opt.pokemonId != null) {
      return `pokemon_${String(opt.pokemonId).padStart(3, '0')}`;
    }
    return null;
  }
}
