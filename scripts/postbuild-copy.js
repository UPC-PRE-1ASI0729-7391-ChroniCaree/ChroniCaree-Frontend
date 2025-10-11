const fs = require('fs');
const path = require('path');

const dir = path.join('dist', 'ChroniCaree-Frontend');
const candidates = [
  path.join(dir, 'index.html'),
  path.join(dir, 'browser', 'index.html'),
  path.join(dir, 'index.htm'),
];

let found = false;
for (const inFile of candidates) {
  if (fs.existsSync(inFile)) {
    try {
      fs.copyFileSync(inFile, path.join(dir, '200.html'));
      console.log('200.html created at', path.join(dir, '200.html'));
    } catch (e) {}

    try {
      const browserOut = path.join(dir, 'browser', '200.html');
      if (fs.existsSync(path.join(dir, 'browser')) || inFile.includes(path.join('browser', 'index.html')) || inFile.includes('/browser/')) {
        fs.copyFileSync(inFile, browserOut);
        console.log('200.html also created at', browserOut);
      }
    } catch (e) {}

    if (inFile.includes(path.join('browser', 'index.html')) || inFile.includes('/browser/')) {
      try {
        if (!fs.existsSync(path.join(dir, 'index.html'))) {
          fs.copyFileSync(inFile, path.join(dir, 'index.html'));
          console.log('index.html copied to', path.join(dir, 'index.html'));
        }
      } catch (e) {}
    }

    found = true;
    break;
  }
}

if (!found) {
  console.warn('index.html not found at', JSON.stringify(candidates));
}
