const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', '..', 'frontend', 'src');

const getFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
};

const targetContent = `const getBaseUrl = () => {
  const hostname = window.location.hostname;
  return \`http://\${hostname === 'localhost' ? '127.0.0.1' : hostname}:5000\`;
};`;

const replacementContent = `const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return \`http://\${hostname === 'localhost' ? '127.0.0.1' : hostname}:5000\`;
};`;

const run = () => {
  const files = getFiles(targetDir);
  let updatedCount = 0;

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(targetContent)) {
      const updated = content.replace(targetContent, replacementContent);
      fs.writeFileSync(filePath, updated, 'utf8');
      updatedCount++;
    }
  });

  console.log(`Updated ${updatedCount} files with production API support.`);
};

run();
