const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Install sharp temporarily
  execSync('npm install sharp --no-save --legacy-peer-deps', { stdio: 'inherit' });
  const sharp = require('sharp');

  const svgBuffer = fs.readFileSync('./apps/nexus-mobile/assets/icon_source.svg');

  // Generate icon.png (1024x1024, no transparency)
  sharp(svgBuffer)
    .resize(1024, 1024)
    .flatten({ background: '#0A0A0A' })
    .png()
    .toFile('./apps/nexus-mobile/assets/icon.png')
    .then(info => console.log('Generated icon.png', info));

  // Generate adaptive-icon.png (1024x1024, transparency allowed but we'll use solid to be safe)
  sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('./apps/nexus-mobile/assets/adaptive-icon.png')
    .then(info => console.log('Generated adaptive-icon.png', info));

  // Generate splash-icon.png (1024x1024)
  sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('./apps/nexus-mobile/assets/splash-icon.png')
    .then(info => console.log('Generated splash-icon.png', info));

  // Generate favicon.png (192x192)
  sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('./apps/nexus-mobile/assets/favicon.png')
    .then(info => console.log('Generated favicon.png', info));

} catch (e) {
  console.error(e);
}
