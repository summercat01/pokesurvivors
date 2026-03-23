import Phaser from 'phaser';
import { TOP_H, BOT_H } from '../constants/layout';
import type { Player } from '../entities/Player';

/** 웨이브 번호 알림 */
export function showWaveAnnouncement(
  scene: Phaser.Scene,
  gameCam: Phaser.Cameras.Scene2D.Camera,
  waveNumber: number,
) {
  if (waveNumber === 30) return; // 다크라이 웨이브는 별도 연출

  const W  = scene.scale.width;
  const cy = TOP_H + (scene.scale.height - TOP_H - BOT_H) / 2;
  const isBossWave  = waveNumber === 5 || waveNumber === 10;
  const displayWave = waveNumber + 1;
  const label = isBossWave
    ? `WAVE ${displayWave}  ★ BOSS WAVE ★`
    : `WAVE ${displayWave}`;
  const color = isBossWave ? '#ff4444' : '#ffffff';

  const txt = scene.add.text(W / 2, cy, label, {
    fontSize: '24px', color, fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 5,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setAlpha(0);
  gameCam.ignore(txt);

  scene.tweens.add({
    targets: txt,
    alpha: 1,
    duration: 300,
    yoyo: true,
    hold: 1200,
    onComplete: () => txt.destroy(),
  });
}

/** 보스 등장 경고 배너 */
export function showBossAlert(
  scene: Phaser.Scene,
  gameCam: Phaser.Cameras.Scene2D.Camera,
) {
  const W  = scene.scale.width;
  const cy = TOP_H + (scene.scale.height - TOP_H - BOT_H) / 2;
  const bg = scene.add.rectangle(W / 2, cy, W, 60, 0x880000, 0.85)
    .setScrollFactor(0).setDepth(90);
  const txt = scene.add.text(W / 2, cy, `⚠  BOSS 등장!  ⚠`, {
    fontSize: '22px', color: '#ffdd00', fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(91);
  gameCam.ignore([bg, txt]);

  scene.tweens.add({
    targets: [bg, txt],
    alpha: 0,
    duration: 600,
    delay: 1800,
    onComplete: () => { bg.destroy(); txt.destroy(); },
  });
}

/** 다크라이 등장 연출 */
export function showDarkraiAlert(
  scene: Phaser.Scene,
  gameCam: Phaser.Cameras.Scene2D.Camera,
) {
  const W  = scene.scale.width;
  const cy = TOP_H + (scene.scale.height - TOP_H - BOT_H) / 2;

  const flash = scene.add.rectangle(W / 2, scene.scale.height / 2, W, scene.scale.height, 0x000000, 0)
    .setScrollFactor(0).setDepth(95);
  gameCam.ignore(flash);
  scene.tweens.add({
    targets: flash,
    alpha: 0.85,
    duration: 400,
    yoyo: true,
    hold: 600,
    onComplete: () => flash.destroy(),
  });

  const bg = scene.add.rectangle(W / 2, cy, W, 80, 0x110022, 0.95)
    .setScrollFactor(0).setDepth(96);
  const title = scene.add.text(W / 2, cy - 18, '⚠  다크라이가 나타났다!  ⚠', {
    fontSize: '20px', color: '#cc88ff', fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 5,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(97).setAlpha(0);
  const sub = scene.add.text(W / 2, cy + 14, '도망쳐라, 트레이너!', {
    fontSize: '14px', color: '#ff8888',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(97).setAlpha(0);
  gameCam.ignore([bg, title, sub]);

  scene.tweens.add({
    targets: [title, sub],
    alpha: 1,
    duration: 300,
    yoyo: true,
    hold: 2000,
    onComplete: () => { title.destroy(); sub.destroy(); },
  });
  scene.tweens.add({
    targets: bg,
    alpha: 0,
    duration: 400,
    delay: 2300,
    onComplete: () => bg.destroy(),
  });
}

/** 보스 처치 배너 */
export function showBossDefeated(
  scene: Phaser.Scene,
  gameCam: Phaser.Cameras.Scene2D.Camera,
  bossName?: string,
) {
  const W  = scene.scale.width;
  const cy = TOP_H + (scene.scale.height - TOP_H - BOT_H) / 2;
  gameCam.shake(300, 0.012);

  const bg = scene.add.rectangle(W / 2, cy, W, 70, 0x004400, 0.9)
    .setScrollFactor(0).setDepth(92);
  const txt = scene.add.text(W / 2, cy - 10, 'BOSS DEFEATED!', {
    fontSize: '26px', color: '#ffdd00', fontStyle: 'bold',
    stroke: '#003300', strokeThickness: 5,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(93).setAlpha(0);
  const sub = scene.add.text(W / 2, cy + 20, `${bossName ?? 'BOSS'} 처치!`, {
    fontSize: '14px', color: '#aaffaa',
    stroke: '#003300', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(93).setAlpha(0);
  gameCam.ignore([bg, txt, sub]);

  scene.tweens.add({
    targets: txt,
    alpha: 1, duration: 200, yoyo: true, hold: 1500,
    onComplete: () => txt.destroy(),
  });
  scene.tweens.add({
    targets: sub,
    alpha: 1, duration: 200, delay: 100, yoyo: true, hold: 1300,
    onComplete: () => sub.destroy(),
  });
  scene.tweens.add({
    targets: bg,
    alpha: 0, duration: 400, delay: 1600,
    onComplete: () => bg.destroy(),
  });
}

/** 마일스톤 알림 (킬/레벨 달성 등) */
export function showMilestone(
  scene: Phaser.Scene,
  gameCam: Phaser.Cameras.Scene2D.Camera,
  message: string,
  color: string,
) {
  const W     = scene.scale.width;
  const gameH = scene.scale.height - TOP_H - BOT_H;
  const y     = TOP_H + gameH * 0.2;

  const bg = scene.add.rectangle(W / 2, y, W - 30, 30, 0x000000, 0.65)
    .setScrollFactor(0).setDepth(88).setAlpha(0);
  const txt = scene.add.text(W / 2, y, `🏆 ${message}`, {
    fontSize: '13px', color, fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(89).setAlpha(0);
  gameCam.ignore([bg, txt]);

  scene.tweens.add({
    targets: [bg, txt],
    alpha: 1, duration: 200, yoyo: true, hold: 1200,
    onComplete: () => { bg.destroy(); txt.destroy(); },
  });
}

/** 부활 연출 */
export function showReviveEffect(
  scene: Phaser.Scene,
  gameCam: Phaser.Cameras.Scene2D.Camera,
  player: Player,
) {
  const W  = scene.scale.width;
  const cy = TOP_H + (scene.scale.height - TOP_H - BOT_H) / 2;
  const flash = scene.add.rectangle(W / 2, scene.scale.height / 2, W, scene.scale.height, 0xffffff, 0.85)
    .setScrollFactor(0).setDepth(95);
  const txt = scene.add.text(W / 2, cy, '부활!', {
    fontSize: '36px', color: '#ffdd00', fontStyle: 'bold',
    stroke: '#aa4400', strokeThickness: 6,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setAlpha(0);
  gameCam.ignore([flash, txt]);

  scene.tweens.add({
    targets: flash,
    alpha: 0, duration: 500,
    onComplete: () => flash.destroy(),
  });
  scene.tweens.add({
    targets: txt,
    alpha: 1, duration: 200, yoyo: true, hold: 800,
    onComplete: () => txt.destroy(),
  });
  player.startInvincible(2000);
}
