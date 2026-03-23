import Phaser from 'phaser';

export type PokeballType = 'pokeball' | 'superball' | 'hyperball';

const BALL_CONFIG: Record<PokeballType, { color: number; label: string; size: number }> = {
  pokeball:  { color: 0xee2222, label: '몬스터볼', size: 18 },
  superball: { color: 0x2244ee, label: '슈퍼볼',   size: 22 },
  hyperball: { color: 0xddaa00, label: '하이퍼볼', size: 26 },
};

export class PokeballItem extends Phaser.GameObjects.Container {
  readonly ballType: PokeballType;
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PokeballType) {
    super(scene, x, y);
    this.ballType = type;

    const cfg = BALL_CONFIG[type];

    // 바깥 흰 원
    const outer = scene.add.circle(0, 0, cfg.size, 0xffffff);
    // 타입별 색 반원 (위쪽)
    const inner = scene.add.graphics();
    inner.fillStyle(cfg.color, 1);
    inner.fillCircle(0, 0, cfg.size - 3);
    // 아래 흰 반원 덮기
    const lower = scene.add.graphics();
    lower.fillStyle(0xffffff, 1);
    lower.fillRect(-(cfg.size), 0, cfg.size * 2, cfg.size);
    // 중앙 선
    const line = scene.add.graphics();
    line.lineStyle(2, 0x333333, 1);
    line.lineBetween(-cfg.size, 0, cfg.size, 0);
    // 중앙 버튼
    const btn = scene.add.circle(0, 0, cfg.size * 0.28, 0xffffff);
    const btnBorder = scene.add.graphics();
    btnBorder.lineStyle(2, 0x333333, 1);
    btnBorder.strokeCircle(0, 0, cfg.size * 0.28);

    this.add([outer, inner, lower, line, btn, btnBorder]);
    this.setDepth(13);
    scene.add.existing(this);

    // 등장 애니메이션
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });

    // 두둥실 떠다니는 효과
    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 광채 텍스트
    const glowTxt = scene.add.text(0, -cfg.size - 10, cfg.label, {
      fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(14);
    this.add(glowTxt);
  }

  canCollect(): boolean {
    return !this.collected;
  }

  collect() {
    this.collected = true;
  }
}
