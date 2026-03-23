import Phaser from 'phaser';
import { PokeballItem, type PokeballType } from '../entities/PokeballItem';
import {
  MAX_WEAPON_LEVEL, WEAPON_EVOLUTIONS,
  getUpgradedWeapon, buildEvolvedWeapon,
  type WeaponConfig,
} from '../data/weapons';
import { getPassiveItem } from '../data/passiveItems';
import { getBgmVolume } from '../lib/storage';
import { TOP_H, BOT_H } from '../constants/layout';
import { applyPassiveBonus } from '../lib/progressionUtils';
import type { Player } from '../entities/Player';
import type { PokemonType } from '../types';

export interface PokeballContext {
  scene: Phaser.Scene;
  gameCam: Phaser.Cameras.Scene2D.Camera;
  player: Player;
  getWeapons: () => WeaponConfig[];
  getWeaponLevels: () => number[];
  getEquippedPassives: () => Map<PokemonType, number>;
  addGold: (amount: number) => void;
  onSlotsChanged: () => void;
  onPause: () => void;
  onResume: (fromEvolution?: boolean) => void;
}

export class PokeballSystem {
  private ctx: PokeballContext;
  private pokeballs: PokeballItem[] = [];
  private pokeballArrows: Map<PokeballItem, Phaser.GameObjects.Text> = new Map();

  constructor(ctx: PokeballContext) {
    this.ctx = ctx;
  }

  spawn(x: number, y: number, type: PokeballType, count: number) {
    const { scene, gameCam } = this.ctx;
    for (let i = 0; i < count; i++) {
      const ox = x + Phaser.Math.Between(-40, 40);
      const oy = y + Phaser.Math.Between(-40, 40);
      const ball = new PokeballItem(scene, ox, oy, type);
      scene.cameras.main.ignore(ball);
      this.pokeballs.push(ball);

      const arrow = scene.add.text(0, 0, '▲', {
        fontSize: '18px', color: '#ffdd44',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(84).setVisible(false);
      gameCam.ignore(arrow);
      this.pokeballArrows.set(ball, arrow);
    }
  }

  checkAndPickup() {
    const { player } = this.ctx;
    const px = player.x;
    const py = player.y;
    for (let i = this.pokeballs.length - 1; i >= 0; i--) {
      const ball = this.pokeballs[i];
      if (!ball.active || !ball.canCollect()) continue;
      if (Phaser.Math.Distance.Between(px, py, ball.x, ball.y) <= 40) {
        ball.collect();
        this.applyEffect(ball.ballType, ball.x, ball.y);
        this.pokeballArrows.get(ball)?.destroy();
        this.pokeballArrows.delete(ball);
        ball.destroy();
        this.pokeballs.splice(i, 1);
      }
    }
  }

  updateArrows() {
    const { scene, gameCam, player } = this.ctx;
    const margin = 28;
    const minY   = TOP_H  + margin;
    const maxY   = scene.scale.height - BOT_H - margin;
    const minX   = margin;
    const maxX   = scene.scale.width  - margin;
    const cx     = scene.scale.width  / 2;
    const cy     = scene.scale.height / 2;

    const camLeft   = gameCam.scrollX;
    const camTop    = gameCam.scrollY;
    const camRight  = camLeft + gameCam.width;
    const camBottom = camTop  + gameCam.height;

    this.pokeballArrows.forEach((arrow, ball) => {
      if (!ball.active) { arrow.setVisible(false); return; }

      if (ball.x >= camLeft && ball.x <= camRight && ball.y >= camTop && ball.y <= camBottom) {
        arrow.setVisible(false);
        return;
      }

      const angle = Phaser.Math.Angle.Between(player.x, player.y, ball.x, ball.y);
      const cos   = Math.cos(angle);
      const sin   = Math.sin(angle);
      let ax: number, ay: number;
      if (Math.abs(cos) > 1e-6) {
        const tx = cos > 0 ? maxX : minX;
        const t  = (tx - cx) / cos;
        ay = cy + sin * t;
        if (ay >= minY && ay <= maxY) {
          ax = tx; ay = Phaser.Math.Clamp(ay, minY, maxY);
        } else {
          const ty = sin > 0 ? maxY : minY;
          const t2 = (ty - cy) / (sin || 1e-6);
          ax = Phaser.Math.Clamp(cx + cos * t2, minX, maxX);
          ay = ty;
        }
      } else {
        ay = sin > 0 ? maxY : minY;
        ax = Phaser.Math.Clamp(cx, minX, maxX);
      }

      arrow.setPosition(ax, ay);
      arrow.setRotation(angle - Math.PI / 2);
      arrow.setVisible(true);
    });
  }

  reset() {
    this.pokeballs.forEach(b => { if (b.active) b.destroy(); });
    this.pokeballs = [];
    this.pokeballArrows.forEach(a => a.destroy());
    this.pokeballArrows.clear();
  }

  // ──────────────────────────────────────────────────────────

  /** 진화 가능한 무기 확인 후 진화 처리. 진화 발생 시 true 반환 */
  private checkAndApplyEvolution(x: number, y: number): boolean {
    const weapons      = this.ctx.getWeapons();
    const weaponLevels = this.ctx.getWeaponLevels();
    const equippedPassives = this.ctx.getEquippedPassives();
    const evolvable: Array<{ idx: number; evo: (typeof WEAPON_EVOLUTIONS)[number] }> = [];

    weapons.forEach((weapon, idx) => {
      const lv = weaponLevels[idx] ?? 1;
      if (lv < MAX_WEAPON_LEVEL) return;
      const evo = WEAPON_EVOLUTIONS[weapon.pokemonId];
      if (!evo) return;
      const stoneLv = equippedPassives.get(weapon.type) ?? 0;
      if (stoneLv < evo.requireStoneLv) return;
      evolvable.push({ idx, evo });
    });

    if (evolvable.length === 0) return false;

    const { idx, evo } = evolvable[0];
    const base = weapons[idx];
    const evolvedBase = buildEvolvedWeapon(base, evo);
    weapons[idx]      = getUpgradedWeapon(evolvedBase, 1);
    weaponLevels[idx] = 1;

    this.ctx.onSlotsChanged();
    this.showEvolutionEffect(x, y, base.name, evo.toName, base.pokemonId, evo.toId);
    return true;
  }

  /** 진화 연출 — 게임 일시정지 + 터치하여 계속 */
  private showEvolutionEffect(
    x: number, y: number,
    fromName: string, toName: string,
    fromId: number, toId: number,
  ) {
    const { scene, gameCam } = this.ctx;
    const W  = scene.scale.width;
    const H  = scene.scale.height;
    const CX = W / 2;
    const CY = H / 2;

    this.ctx.onPause();

    const vol = getBgmVolume() * 0.5;
    scene.sound.stopAll();
    if (scene.cache.audio.exists('bgm_evolution')) {
      scene.sound.play('bgm_evolution', { loop: false, volume: vol });
    }

    scene.cameras.main.flash(700, 255, 255, 200, false);
    gameCam.shake(500, 0.022);

    const overlay = scene.add.rectangle(CX, CY, W, H, 0x000011, 0.85)
      .setDepth(60).setScrollFactor(0);

    const glow = scene.add.circle(CX, CY - 20, 88, 0xffffaa, 0.13)
      .setDepth(61).setScrollFactor(0);
    scene.tweens.add({
      targets: glow, scaleX: 1.45, scaleY: 1.45, alpha: 0.04,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const titleTxt = scene.add.text(CX, CY - 120, '✦  진  화  !  ✦', {
      fontSize: '24px', color: '#ffee00', fontStyle: 'bold',
      stroke: '#664400', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0).setScale(0);
    scene.tweens.add({ targets: titleTxt, scaleX: 1, scaleY: 1, duration: 450, ease: 'Back.easeOut' });

    const nameTxt = scene.add.text(CX, CY + 52, `${fromName}  →  ${toName}`, {
      fontSize: '14px', color: '#aaddff', fontStyle: 'bold',
      stroke: '#001133', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0);

    const arrowTxt = scene.add.text(CX, CY - 20, '▶', {
      fontSize: '22px', color: '#ffdd00',
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0);
    scene.tweens.add({
      targets: arrowTxt, x: CX + 6,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const allItems: Phaser.GameObjects.GameObject[] = [overlay, glow, titleTxt, nameTxt, arrowTxt];

    const fromKey = `pokemon_${String(fromId).padStart(3, '0')}`;
    if (scene.textures.exists(fromKey)) {
      const fromImg = scene.add.image(CX - 72, CY - 20, fromKey)
        .setDisplaySize(68, 68).setDepth(62).setScrollFactor(0).setAlpha(0.45);
      scene.tweens.add({ targets: fromImg, alpha: 0, duration: 700, delay: 300 });
      allItems.push(fromImg);
    }

    const toKey = `pokemon_${String(toId).padStart(3, '0')}`;
    if (scene.textures.exists(toKey)) {
      const toImg = scene.add.image(CX + 72, CY - 20, toKey)
        .setDisplaySize(84, 84).setDepth(62).setScrollFactor(0).setScale(0).setAlpha(0);
      scene.tweens.add({
        targets: toImg, scaleX: 1, scaleY: 1, alpha: 1,
        duration: 550, delay: 450, ease: 'Back.easeOut',
      });
      allItems.push(toImg);
    }

    const btnY = CY + 96;
    const btnBg = scene.add.rectangle(CX, btnY, 190, 36, 0x113355)
      .setDepth(62).setScrollFactor(0).setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x4488bb);
    const btnTxt = scene.add.text(CX, btnY, '터치하여 계속', {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(63).setScrollFactor(0);
    allItems.push(btnBg, btnTxt);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x1a4a77));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x113355));
    btnBg.on('pointerdown', () => {
      allItems.forEach(o => o.destroy());
      this.ctx.onResume(true);
    });

    // 수집 위치 파티클
    const burst = scene.add.circle(x, y, 30, 0xffffff, 0.9).setDepth(30);
    scene.tweens.add({
      targets: burst, scale: 5, alpha: 0, duration: 600,
      onComplete: () => burst.destroy(),
    });
  }

  private applyEffect(type: PokeballType, x: number, y: number) {
    // ── 진화 체크: 조건 충족 무기 있으면 진화 우선 ──
    const evolved = this.checkAndApplyEvolution(x, y);
    if (evolved) return;

    const { scene } = this.ctx;

    // 몬스터볼 픽업 BGM (진화가 아닌 경우)
    const vol = getBgmVolume() * 0.6;
    if (scene.cache.audio.exists('bgm_pokeball')) {
      scene.sound.add('bgm_pokeball', { loop: false, volume: vol }).play();
    }

    const upgradeCount = type === 'hyperball' ? 5 : type === 'superball' ? 3 : 1;
    const goldBonus    = type === 'hyperball' ? 60 : type === 'superball' ? 30 : 10;
    const ballLabel    = type === 'hyperball' ? '하이퍼볼' : type === 'superball' ? '슈퍼볼' : '몬스터볼';
    const ballColor    = type === 'hyperball' ? 0xddaa00 : type === 'superball' ? 0x2244ee : 0xee2222;
    const ballColorHex = type === 'hyperball' ? '#ddaa00' : type === 'superball' ? '#5577ff' : '#ff5555';

    const weapons      = this.ctx.getWeapons();
    const weaponLevels = this.ctx.getWeaponLevels();
    const equippedPassives = this.ctx.getEquippedPassives();

    // 강화 가능한 무기/패시브 목록 수집
    const upgradable: Array<{ upgrade: () => string }> = [];

    weapons.forEach((w, idx) => {
      const curLv = weaponLevels[idx] ?? 1;
      if (curLv < 5) {
        upgradable.push({
          upgrade: () => {
            const newLv = curLv + 1;
            weapons[idx]      = getUpgradedWeapon(w, newLv);
            weaponLevels[idx] = newLv;
            return `${w.name}  Lv${newLv}`;
          },
        });
      }
    });

    equippedPassives.forEach((lv, pType) => {
      if (lv < 5) {
        const item = getPassiveItem(pType);
        if (item) {
          upgradable.push({
            upgrade: () => {
              const newLv = lv + 1;
              equippedPassives.set(pType, newLv);
              applyPassiveBonus(this.ctx.player.stats, pType, lv, newLv);
              return `${item.name}  Lv${newLv}`;
            },
          });
        }
      }
    });

    // 랜덤 셔플 후 upgradeCount만큼 강화
    Phaser.Utils.Array.Shuffle(upgradable);
    const picked = upgradable.slice(0, upgradeCount);
    const obtainedLabels = picked.map(u => u.upgrade());

    this.ctx.addGold(goldBonus);
    this.ctx.onSlotsChanged();

    // 수집 파티클
    const burst = scene.add.circle(x, y, 20, ballColor, 0.8).setDepth(25);
    scene.tweens.add({
      targets: burst, scale: 3, alpha: 0, duration: 350,
      onComplete: () => burst.destroy(),
    });

    // ── 결과 패널 (게임 일시정지) ──
    this.ctx.onPause();

    const W   = scene.scale.width;
    const H   = scene.scale.height;
    const CX  = W / 2;
    const CY  = H / 2;
    const rowH = 26;
    const panelH = 76 + obtainedLabels.length * rowH + 46;
    const panelW = 250;

    const overlay = scene.add.rectangle(CX, CY, W, H, 0x000000, 0.55)
      .setDepth(60).setScrollFactor(0);

    const panel = scene.add.rectangle(CX, CY - 10, panelW, panelH, 0x001133, 0.96)
      .setDepth(61).setScrollFactor(0).setStrokeStyle(2, ballColor);

    const titleTxt = scene.add.text(CX, CY - panelH / 2 + 20, `✦ ${ballLabel} 획득! ✦`, {
      fontSize: '15px', color: ballColorHex, fontStyle: 'bold',
      stroke: '#000033', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0);

    const allItems: Phaser.GameObjects.GameObject[] = [overlay, panel, titleTxt];

    const listY0 = CY - panelH / 2 + 50;
    if (obtainedLabels.length === 0) {
      const maxTxt = scene.add.text(CX, listY0, '이미 최대 레벨!', {
        fontSize: '13px', color: '#888888',
      }).setOrigin(0.5).setDepth(62).setScrollFactor(0);
      allItems.push(maxTxt);
    } else {
      obtainedLabels.forEach((lbl, i) => {
        const txt = scene.add.text(CX, listY0 + i * rowH, `▸ ${lbl}`, {
          fontSize: '13px', color: '#aaddff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0);
        allItems.push(txt);
      });
    }

    const goldTxt = scene.add.text(CX, listY0 + obtainedLabels.length * rowH, `+ ${goldBonus} G`, {
      fontSize: '13px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0);
    allItems.push(goldTxt);

    // "터치하여 계속" 버튼
    const btnY = CY + panelH / 2 - 20;
    const btnBg = scene.add.rectangle(CX, btnY, panelW - 20, 32, 0x223355)
      .setDepth(62).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const btnTxt = scene.add.text(CX, btnY, '터치하여 계속', {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(63).setScrollFactor(0);
    allItems.push(btnBg, btnTxt);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x335577));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x223355));
    btnBg.on('pointerdown', () => {
      allItems.forEach(o => o.destroy());
      this.ctx.onResume(false);
    });
  }
}
