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

    // 경험치 양에 따라 구슬 크기 결정
    const orbScale = expValue >= 9 ? 1.5 : expValue >= 5 ? 1.2 : 1.0;
    this.setDepth(12).setScale(0);

    // rare_candy 텍스처는 크기가 크므로 22px 기준으로 목표 scale 계산
    const targetScale = key === 'rare_candy'
      ? (22 / this.width) * orbScale
      : orbScale * 1.1;

    scene.tweens.add({
      targets: this,
      scale: targetScale,
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => this.flyToPlayer(scene, expValue),
    });
  }

  private flyToPlayer(scene: GameScene, expValue: number) {
    const player = scene.player;

    // 플레이어 현재 위치를 onUpdate에서 실시간 추적
    scene.tweens.add({
      targets: this,
      scale: 0.5,
      duration: 280,
      ease: 'Cubic.easeIn',
      onUpdate: () => {
        if (!player?.active) return;
        this.x += (player.x - this.x) * 0.18;
        this.y += (player.y - this.y) * 0.18;
      },
      onComplete: () => {
        const px = player?.x ?? this.x;
        const py = player?.y ?? this.y;

        // 흡수 파티클 효과 (작은 흰 원)
        const burst = scene.add.circle(px, py, 8, 0xffee44, 0.7).setDepth(13);
        scene.cameras.main.ignore(burst);
        scene.tweens.add({
          targets: burst,
          scale: 2,
          alpha: 0,
          duration: 180,
          onComplete: () => burst.destroy(),
        });

        // EXP 획득 텍스트 (3 이상일 때만 표시)
        if (expValue >= 3) {
          const expTxt = scene.add.text(px, py - 12, `+${expValue} EXP`, {
            fontSize: '11px', color: '#ffee44',
            stroke: '#443300', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(14);
          scene.cameras.main.ignore(expTxt);
          scene.tweens.add({
            targets: expTxt,
            y: expTxt.y - 18, alpha: 0,
            duration: 600,
            onComplete: () => expTxt.destroy(),
          });
        }

        scene.gainExp(expValue);
        this.destroy();
      },
    });
  }
}
