#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Simple JavaScript Obfuscator - Minifies and compresses code
 * Usage: node obfuscate.js [folder]
 */

const obfuscate = (code) => {
  // Remove comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/\/\/.*/g, '');
  
  // Remove extra whitespace
  code = code.replace(/\s+/g, ' ');
  code = code.replace(/\s*([{}();:,])\s*/g, '$1');
  
  return code;
};

const targetDir = process.argv[2] || './plugins';

if (!fs.existsSync(targetDir)) {
  console.error(`❌ Directory not found: ${targetDir}`);
  process.exit(1);
}

fs.readdirSync(targetDir).forEach(file => {
  if (!file.endsWith('.js')) return;
  
  const filePath = path.join(targetDir, file);
  const code = fs.readFileSync(filePath, 'utf8');
  const obfuscatedCode = obfuscate(code);
  
  fs.writeFileSync(filePath, obfuscatedCode);
  console.log(`✅ Obfuscated: ${file}`);
});

console.log(`\n✅ All .js files in ${targetDir} have been obfuscated!`);
