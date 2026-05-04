import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { getTypeMultiplier, TYPE_COLORS } from '../data/weapons';
import type { PokemonType } from '../types';

export interface DamageContext {
  scene: Phaser.Scene;
  player: Player;
  onEnemyKilled: (enemy: Enemy) => void;
}

export class DamageCalculator {
  private ctx: DamageContext;

  /** 현재 데미지를 가하고 있는 무기 이름 (딜 로그용) */
  currentSource = '';
  readonly damageLog: Map<string, number> = new Map();

  constructor(ctx: DamageContext) {
    this.ctx = ctx;
  }

  /**
   * 적에게 데미지를 적용한다.
   * 크리티컬, 타입 상성, 넉백, 데미지 텍스트 모두 처리.
   */
  apply(
    enemy: Enemy,
    baseDmg: number,
    attackType: PokemonType,
    knockbackSrc?: { x: number; y: number },
    kbMult: number = 1,
  ) {
    if (!enemy.active || enemy.isDead()) return;

    const isCrit   = Math.random() < this.ctx.player.stats.critChance;
    const typeMult = getTypeMultiplier(attackType, enemy.pokemonTypes);

    let dmg = isCrit
      ? Math.floor(baseDmg * this.ctx.player.stats.critDamage)
      : baseDmg;
    if (typeMult !== 1) dmg = Math.floor(dmg * typeMult);

    if (typeMult === 0) {
      this.showText(enemy.x, enemy.y, '무효', '#888888', '12px');
      return;
    }

    // 딜 로그 누적
    if (this.currentSource) {
      this.damageLog.set(
        this.currentSource,
        (this.damageLog.get(this.currentSource) ?? 0) + dmg,
      );
    }

    enemy.takeDamage(dmg);

    // 넉백
    if (knockbackSrc && enemy.active && !enemy.isDead() && !enemy.ignoreKnockback) {
      const kbAngle = Phaser.Math.Angle.Between(knockbackSrc.x, knockbackSrc.y, enemy.x, enemy.y);
      const kb = this.ctx.player.stats.knockback * kbMult * (1 - enemy.knockbackResist);
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.velocity.x += Math.cos(kbAngle) * kb;
      body.velocity.y += Math.sin(kbAngle) * kb;
    }

    // 데미지 텍스트
    const superEff = typeMult >= 2;
    const notEff   = typeMult <= 0.5;
    const color  = isCrit ? '#ffdd00' : superEff ? '#ff6600' : notEff ? '#aaaaaa' : '#ffffff';
    const suffix = typeMult === 4 ? '▲▲' : superEff ? '▲' : notEff ? '▼' : '';
    const label  = isCrit ? `${dmg}!` : `${dmg}${suffix}`;
    const size   = isCrit ? '16px' : superEff ? '15px' : '13px';
    this.showText(enemy.x, enemy.y, label, color, size);

    if (enemy.isDead()) this.ctx.onEnemyKilled(enemy);
  }

  /** 스탯 기반 최종 데미지 계산 (무기 기본 데미지 → 공격력 반영) */
  calcWeaponDamage(weaponDamage: number): number {
    return Math.floor(weaponDamage * this.ctx.player.stats.attackPower / 10);
  }

  reset() {
    this.currentSource = '';
    this.damageLog.clear();
  }

  private showText(x: number, y: number, text: string, color: string, fontSize: string) {
    const txt = this.ctx.scene.add.text(x, y - 20, text, {
      fontSize, color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);
    this.ctx.scene.cameras.main.ignore(txt);
    this.ctx.scene.tweens.add({
      targets: txt,
      y: txt.y - (fontSize === '12px' ? 20 : 25),
      alpha: 0,
      duration: fontSize === '12px' ? 600 : 700,
      onComplete: () => txt.destroy(),
    });
  }
}
