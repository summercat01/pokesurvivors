import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';

/**
 * 경험치 구슬 (이상한사탕)
 * - 적 사망 시 스폰
 * - 자동으로 플레이어에게 날아가 흡수됨 (수동 수집 없음)
 * - rare_candy 텍스처가 로드돼 있으면 이상한사탕 스프라이트 사용,
 *   없으면 프로그래매틱 exp_orb 텍스처 사용
 */
export class ExpOrb extends Phaser.GameObjects.Image {
  constructor(
    scene: GameScene,
    x: number,
    y: number,
    expValue: number,
  ) {
    const key = scene.textures.exists('rare_candy') ? 'rare_candy' : 'exp_orb';
    super(scene, x, y, key);
    scene.add.existing(this);

    this.setDepth(12).setScale(0);
    if (key === 'rare_candy') {
      this.setDisplaySize(22, 22);
    }

    // 팝 애니메이션 → 플레이어 방향으로 날아가기
    // 플레이어 위치는 tween 완료 시점에 캡처 (짧은 duration이라 충분히 정확)
    scene.tweens.add({
      targets: this,
      scale: key === 'rare_candy' ? 1 : 1.1,
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => this.flyToPlayer(scene, expValue),
    });
  }

  private flyToPlayer(scene: GameScene, expValue: number) {
    const player = scene.player;
    const targetX = player?.x ?? this.x;
    const targetY = player?.y ?? this.y;

    scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      scale: 0.5,
      duration: 280,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // 흡수 파티클 효과 (작은 흰 원)
        const burst = scene.add.circle(targetX, targetY, 8, 0xffee44, 0.7).setDepth(13);
        scene.tweens.add({
          targets: burst,
          scale: 2,
          alpha: 0,
          duration: 180,
          onComplete: () => burst.destroy(),
        });

        scene.gainExp(expValue);
        this.destroy();
      },
    });
  }
}
