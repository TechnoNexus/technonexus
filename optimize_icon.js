const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Install sharp temporarily
  execSync('npm install sharp --no-save --legacy-peer-deps', { stdio: 'inherit' });
  const sharp = require('sharp');

  const files = ['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'favicon.png'];
  
  files.forEach(file => {
    const filePath = `./apps/nexus-mobile/assets/${file}`;
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      
      let transform = sharp(buffer);
      
      // We process icon.png to remove alpha since Google Play Store requires an opaque background for the main launcher icon
      if (file === 'icon.png') {
         transform = transform.resize(1024, 1024).flatten({ background: '#0A0A0A' });
      } else if (file === 'favicon.png') {
         transform = transform.resize(192, 192);
      }
      
      transform.png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
        .toBuffer()
        .then(data => {
            fs.writeFileSync(filePath, data);
            console.log(`Optimized ${file}: ${data.length} bytes`);
        })
        .catch(err => console.error(`Error processing ${file}:`, err));
    }
  });

} catch (e) {
  console.error(e);
}
