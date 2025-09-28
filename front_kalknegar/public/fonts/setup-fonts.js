const https = require('https');
const fs = require('fs');
const path = require('path');

// Font URLs from a reliable source
const fonts = [
  {
    name: 'Yekan.woff2',
    url: 'https://github.com/rastikerdar/vazir-font/releases/download/v30.1.0/vazir-font-v30.1.0.zip'
  }
];

// Simple download function
function downloadFont(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ ${filename} downloaded successfully`);
          resolve();
        });
      } else {
        console.log(`✗ Failed to download ${filename}: HTTP ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filename, () => {}); // Delete incomplete file
      console.log(`✗ Error downloading ${filename}: ${err.message}`);
      reject(err);
    });
  });
}

// Create simple font files as placeholders
console.log('Creating B-Yekan font placeholders...');

// Create empty font files that can be replaced later
const fontFiles = ['Yekan.woff2', 'Yekan.woff', 'Yekan-Bold.woff2', 'Yekan-Bold.woff'];

fontFiles.forEach(filename => {
  const content = Buffer.from(''); // Empty file for now
  fs.writeFileSync(filename, content);
  console.log(`✓ Created placeholder: ${filename}`);
});

console.log('Font setup completed. Replace these files with actual B-Yekan fonts when available.');