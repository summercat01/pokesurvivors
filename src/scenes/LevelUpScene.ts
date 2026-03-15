import Phaser from 'phaser';
import type { LevelUpOption } from '../types';
import { TYPE_COLORS, getWeaponByPokemonId } from '../data/weapons';
import type { GameScene } from './GameScene';

const TYPE_KR: Record<string, string> = {
  normal: '노말', fire: '불꽃', water: '물', grass: '풀',
  electric: '전기', ice: '얼음', fighting: '격투', poison: '독',
  ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
  rock: '바위', ghost: '고스트', dragon: '드래곤', dark: '악', steel: '강철',
};

const CARD_H   = 100;
const CARD_GAP = 14;


export class LevelUpScene extends Phaser.Scene {
  private CARD_W = 360;

  constructor() {
    super({ key: 'LevelUpScene' });
  }

  create(data: { options: LevelUpOption[] }) {
    const W = this.scale.width;
    const H = this.scale.height;
    const { options } = data;

    this.CARD_W = W - 20;

    // ── 어두운 반투명 오버레이 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);

    // ── 헤더 ──
    this.add.text(W / 2, Math.round(H * 0.08), '레벨이 올랐다!', {
      fontSize: '30px',
      color: '#ffdd00',
      fontStyle: 'bold',
      stroke: '#302010',
      strokeThickness: 5,
      padding: { top: 8 },
    }).setOrigin(0.5);

    this.add.text(W / 2, Math.round(H * 0.14), '강화할 능력을 고르세요', {
      fontSize: '15px',
      color: '#ccccbb',
      stroke: '#000000',
      strokeThickness: 2,
      padding: { top: 4 },
    }).setOrigin(0.5);

    // ── 카드 ──
    const CARD_START = Math.round(H * 0.18);
    options.forEach((opt, i) => {
      const cy = CARD_START + i * (CARD_H + CARD_GAP) + CARD_H / 2;
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
    // 그림자
    this.add.rectangle(cx + 2, cy + 3, CARD_W + 4, CARD_H + 4, 0x000000, 0.5);

    // 카드 배경
    const cardBg = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0x1a1a2e)
      .setInteractive({ useHandCursor: true });

    // 외곽선
    const outline = this.add.graphics();
    outline.lineStyle(2, 0x555566, 1);
    outline.strokeRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H);

    // ── 좌측 타입 컬러 영역 (스프라이트 배경) ──
    const STRIPE_W = 80;
    const stripeX  = cx - CARD_W / 2 + STRIPE_W / 2;
    this.add.rectangle(stripeX, cy, STRIPE_W, CARD_H, typeColor, 0.85);

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

    // ── 배지 (NEW / Lv.X→Y) ──
    const badgeLabel = isNew
      ? 'NEW'
      : `Lv.${opt.levelFrom ?? 1}→${opt.levelTo ?? 2}`;
    const badgeColor = isNew ? 0xee5522 : 0x3377cc;
    const badgeW     = isNew ? 44 : 76;
    const badgeX     = cx + CARD_W / 2 - badgeW / 2 - 6;
    const badgeY     = cy - CARD_H / 2 + 14;
    this.add.rectangle(badgeX, badgeY, badgeW, 22, badgeColor);
    this.add.text(badgeX, badgeY, badgeLabel, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── 추천/비추천 배지 ──
    if (opt.recommendation === 'good') {
      const recBadgeX = cx - CARD_W / 2 + STRIPE_W + 8;
      const recBadgeY = cy + CARD_H / 2 - 12;
      this.add.rectangle(recBadgeX + 20, recBadgeY, 44, 18, 0x227744);
      this.add.text(recBadgeX + 20, recBadgeY, '★ 추천', {
        fontSize: '10px', color: '#aaffcc', fontStyle: 'bold',
      }).setOrigin(0.5);
    } else if (opt.recommendation === 'bad') {
      const recBadgeX = cx - CARD_W / 2 + STRIPE_W + 8;
      const recBadgeY = cy + CARD_H / 2 - 12;
      this.add.rectangle(recBadgeX + 24, recBadgeY, 52, 18, 0x553333);
      this.add.text(recBadgeX + 24, recBadgeY, '▼ 비추천', {
        fontSize: '10px', color: '#ffaaaa', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // ── 이름 텍스트 ──
    const textX = cx - CARD_W / 2 + STRIPE_W + 12;
    this.add.text(textX, cy - 22, opt.label, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { top: 6 },
    }).setOrigin(0, 0.5);

    // ── 설명 텍스트 ──
    this.add.text(textX, cy + 14, opt.description, {
      fontSize: '11px',
      color: '#aaaaaa',
      wordWrap: { width: CARD_W - STRIPE_W - 60 },
      lineSpacing: 3,
    }).setOrigin(0, 0.5);

    // ── 호버 / 탭 인터랙션 ──
    cardBg.on('pointerover', () => cardBg.setFillStyle(0x2e2e50));
    cardBg.on('pointerout',  () => cardBg.setFillStyle(0x1a1a2e));

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
    const GOLD = 0xf0a800;

    this.add.rectangle(cx + 2, cy + 3, CARD_W + 4, CARD_H + 4, 0x000000, 0.5);

    const cardBg = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0x1a1a2e)
      .setInteractive({ useHandCursor: true });

    const outline = this.add.graphics();
    outline.lineStyle(2, GOLD, 0.8);
    outline.strokeRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H);

    const STRIPE_W = 80;
    const stripeX  = cx - CARD_W / 2 + STRIPE_W / 2;
    this.add.rectangle(stripeX, cy, STRIPE_W, CARD_H, GOLD, 0.85);
    this.add.text(stripeX, cy, '💰', { fontSize: '36px' }).setOrigin(0.5);

    const textX = cx - CARD_W / 2 + STRIPE_W + 12;
    this.add.text(textX, cy - 14, '+50 골드', {
      fontSize: '22px', color: '#ffdd00', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0, 0.5);
    this.add.text(textX, cy + 18, '골드 50개를 획득합니다.', {
      fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    cardBg.on('pointerover', () => { cardBg.setFillStyle(0x2e2e10); outline.clear(); outline.lineStyle(2, GOLD, 1); outline.strokeRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H); });
    cardBg.on('pointerout',  () => { cardBg.setFillStyle(0x1a1a2e); outline.clear(); outline.lineStyle(2, GOLD, 0.8); outline.strokeRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H); });
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
