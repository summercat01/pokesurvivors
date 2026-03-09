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
  scene: [BootScene, TitleScene, OakGuideScene, StageSelectScene, CharacterSelectScene, UpgradeScene, GameScene, GameOverScene, LevelUpScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
  },
};

new Phaser.Game(config);
