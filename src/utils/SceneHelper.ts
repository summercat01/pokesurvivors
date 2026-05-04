import Phaser from 'phaser';
import { getBgmVolume } from '../lib/storage';

/**
 * 씬 공통 유틸리티
 */
export class SceneHelper {
  /**
   * 페이드아웃 후 씬 전환
   * @param duration 페이드 시간 (ms), 기본 200
   * @param r,g,b 페이드 색상, 기본 검정
   */
  static transitionTo(
    scene: Phaser.Scene,
    targetScene: string,
    options?: {
      duration?: number;
      r?: number; g?: number; b?: number;
      data?: object;
      /** 전환 전 추가 작업 (예: scene.stop 등) */
      before?: () => void;
    },
  ) {
    const { duration = 200, r = 0, g = 0, b = 0, data, before } = options ?? {};
    scene.cameras.main.fadeOut(duration, r, g, b);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      before?.();
      scene.scene.start(targetScene, data);
    });
  }

  /**
   * BGM 재생 (locked 상태 자동 처리, 중복 재생 방지)
   * @param stopOthers 다른 사운드 정지 여부, 기본 true
   */
  static playBGM(
    scene: Phaser.Scene,
    key: string,
    options?: { loop?: boolean; volumeScale?: number; stopOthers?: boolean },
  ) {
    const { loop = true, volumeScale = 0.5, stopOthers = true } = options ?? {};
    if (!scene.cache.audio.exists(key)) return;
    if (scene.sound.get(key)?.isPlaying) return;

    const play = () => {
      if (!scene.cache.audio.exists(key)) return;
      if (stopOthers) scene.sound.stopAll();
      scene.sound.play(key, { loop, volume: getBgmVolume() * volumeScale });
    };

    if ((scene.sound as Phaser.Sound.WebAudioSoundManager & { locked?: boolean }).locked) {
      scene.sound.once('unlocked', play);
    } else {
      play();
    }
  }
}
