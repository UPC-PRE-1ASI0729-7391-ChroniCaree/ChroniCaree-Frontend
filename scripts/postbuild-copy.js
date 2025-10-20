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

// If there is a browser/ folder with assets, copy its contents into the dist root
try {
  const browserDir = path.join(dir, 'browser');
  if (fs.existsSync(browserDir)) {
    try {
      // Node 16+ supports fs.cpSync
      if (fs.cpSync) {
        fs.cpSync(browserDir, dir, { recursive: true, force: true });
      } else {
        // fallback: simple recursive copy
        const copyRecursive = (src, dest) => {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) copyRecursive(srcPath, destPath);
            else fs.copyFileSync(srcPath, destPath);
          }
        };
        copyRecursive(browserDir, dir);
      }
      console.log('browser/ contents copied into', dir);
    } catch (e) {
      console.warn('failed to copy browser contents to root:', e && e.message);
    }
  }
} catch (e) {
  // ignore
}
