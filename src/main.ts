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

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
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
