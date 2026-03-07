const fs = require('fs');
const https = require('https');
const path = require('path');

// 다운로드 폴더 생성
const downloadDir = './pokemon_gen4_sprites';
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

// 이미지 다운로드 함수
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// 포켓몬 스프라이트 다운로드
async function downloadPokemonSprites() {
  for (let i = 1; i <= 493; i++) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const data = await response.json();
      
      // 4세대 Diamond-Pearl 스프라이트
      const sprite = data.sprites.versions['generation-iv']['diamond-pearl'].front_default;
      
      if (sprite) {
        const filename = `${String(i).padStart(3, '0')}_${data.name}.png`;
        const filepath = path.join(downloadDir, filename);
        
        await downloadImage(sprite, filepath);
        console.log(`Downloaded: ${filename}`);
      } else {
        console.log(`No sprite for #${i}`);
      }
      
      // API 부하 방지를 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error downloading #${i}:`, error.message);
    }
  }
  
  console.log('모든 다운로드 완료!');
}

downloadPokemonSprites();