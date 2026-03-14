import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { OakGuideScene } from './scenes/OakGuideScene';
import { TitleScene } from './scenes/TitleScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { DevScene } from './scenes/DevScene';
import { LoginScene } from './scenes/LoginScene';
import { RankingScene } from './scenes/RankingScene';
import { PokedexScene } from './scenes/PokedexScene';

// URL에 /dev 포함되거나 ?dev 쿼리파라미터가 있으면 개발자 모드
export const IS_DEV_MODE =
  window.location.pathname.includes('/dev') ||
  new URLSearchParams(window.location.search).has('dev');

// ── 전역 기본 폰트 주입 ──
// 모든 씬의 this.add.text() 호출에 fontFamily가 없으면 Noto Sans KR을 자동 적용.
// fontFamily를 직접 지정한 호출은 그대로 유지됨.
const _origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  x: number, y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  const merged: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: '"Noto Sans KR", "Malgun Gothic", Arial, sans-serif',
    ...style,
  };
  return _origText.call(this, x, y, text, merged);
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  render: {
    roundPixels: true,  // 텍스트·스프라이트를 정수 픽셀에 배치 → 미세한 흐림 감소
    antialias: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, LoginScene, TitleScene, OakGuideScene, StageSelectScene, CharacterSelectScene, UpgradeScene, GameScene, GameOverScene, LevelUpScene, DevScene, RankingScene, PokedexScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
