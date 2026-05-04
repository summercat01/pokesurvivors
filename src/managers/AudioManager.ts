import Phaser from 'phaser';
import { getBgmVolume } from '../lib/storage';

const STAGE_BGM: Record<number, string> = {
   1: 'bgm_stage_1',
   2: 'bgm_stage_2',
   3: 'bgm_stage_3',
   4: 'bgm_stage_4',
   5: 'bgm_stage_5',
   6: 'bgm_stage_6',
   7: 'bgm_stage_7',
   8: 'bgm_stage_8',
   9: 'bgm_stage_9',
  10: 'bgm_stage_10',
  11: 'bgm_stage_11',
  12: 'bgm_stage_12',
  13: 'bgm_stage_13',
  14: 'bgm_stage_14',
  15: 'bgm_stage_15',
  16: 'bgm_stage_16',
  17: 'bgm_stage_17',
};

export class AudioManager {
  private scene: Phaser.Scene;
  stageBgmKey = '';
  bossBgmActive = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(stageId: number) {
    this.stageBgmKey   = STAGE_BGM[stageId] ?? 'bgm_stage_1';
    this.bossBgmActive = false;
    this.scene.sound.setMute(localStorage.getItem('bgmMuted') === '1');
    this.play(this.stageBgmKey);
  }

  play(key: string) {
    const vol = getBgmVolume() * 0.45;
    this.scene.sound.stopAll();
    if (!this.scene.cache.audio.exists(key)) return;
    if ((this.scene.sound as any).locked) {
      this.scene.sound.once('unlocked', () => {
        this.scene.sound.stopAll();
        if (this.scene.cache.audio.exists(key)) {
          this.scene.sound.play(key, { loop: true, volume: vol });
        }
      });
    } else {
      this.scene.sound.play(key, { loop: true, volume: vol });
    }
  }

  startBossBgm() {
    this.bossBgmActive = true;
    const stageSnd = this.scene.sound.get(this.stageBgmKey);
    if (stageSnd?.isPlaying) stageSnd.stop();
    const vol = getBgmVolume() * 0.45;
    if (this.scene.cache.audio.exists('bgm_boss')) {
      this.scene.sound.play('bgm_boss', { loop: true, volume: vol });
    }
  }

  stopBossBgm() {
    this.bossBgmActive = false;
    this.scene.sound.stopByKey('bgm_boss');
    this.play(this.stageBgmKey);
  }

  pauseCurrent() {
    this.scene.sound.get(this.stageBgmKey)?.pause();
    this.scene.sound.get('bgm_boss')?.pause();
  }

  resumeCurrent() {
    if (this.bossBgmActive) {
      this.scene.sound.get('bgm_boss')?.resume();
    } else {
      this.scene.sound.get(this.stageBgmKey)?.resume();
    }
  }

  stopAll() {
    this.scene.sound.stopAll();
  }
}
