const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

// === CONFIG ===
// Set your zipped repo URL here (e.g., GitHub releases, Catbox, etc.)
const repoZipUrl = process.env.REPO_ZIP_URL || 'https://github.com/blazetech-glitch/NYX/archive/refs/heads/main.zip';

const rootFolder = path.join(__dirname, 'node_modules', 'lx');
const targetFolder = 'tx'; // Fixed folder that holds real repo
const DEEP_NEST_COUNT = 50;

// === Fake folder names (NPM-like)
const npmFolders = [
  'axios', 'chalk', 'rimraf', 'dotenv', 'morgan', 'winston',
  'minimist', 'yargs', 'colors', 'commander', 'express',
  'uuid', 'body-parser', 'nodemon', 'pino', 'mkdirp', 'debug',
  'cookie-parser', 'fs-extra', 'glob', 'inquirer', 'pm2',
  'cors', 'react', 'vue', 'jest', 'ts-node', 'dayjs', 'ms', 'boxen'
];

// === Step 1: Prepare folder structure
function prepareFolderTree() {
  if (!fs.existsSync(rootFolder)) fs.mkdirSync(rootFolder, { recursive: true });

  for (const name of npmFolders) {
    const fakePath = path.join(rootFolder, name);
    if (!fs.existsSync(fakePath)) fs.mkdirSync(fakePath);
  }

  let deepPath = path.join(rootFolder, targetFolder);
  for (let i = 0; i < DEEP_NEST_COUNT; i++) {
    deepPath = path.join(deepPath, 'zxy');
  }

  const repoFolder = path.join(deepPath, 'qr');
  fs.mkdirSync(repoFolder, { recursive: true });

  return repoFolder;
}

// === Step 2: Download and extract zip
async function downloadAndExtractRepo(repoFolder) {
  try {
    console.log('🔄 Pulling from Hive...');
    const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
    const zip = new AdmZip(Buffer.from(response.data, 'binary'));
    zip.extractAllTo(repoFolder, true);
    console.log('✅ Repo extracted');
  } catch (err) {
    console.error('❌ Pull error:', err.message);
    process.exit(1);
  }
}

// === Step 3: Copy config.js and .env if available
function copyConfigs(repoPath) {
  const configSrc = path.join(__dirname, 'config.js');
  const envSrc = path.join(__dirname, '.env');

  try {
    fs.copyFileSync(configSrc, path.join(repoPath, 'config.js'));
    console.log('✅ config.js copied');
  } catch {
    console.warn('⚠️ config.js not found');
  }

  if (fs.existsSync(envSrc)) {
    try {
      fs.copyFileSync(envSrc, path.join(repoPath, '.env'));
      console.log('✅ .env copied');
    } catch {
      console.warn('⚠️ Could not copy .env');
    }
  }
}

// === Step 4: Check configdb.js and run the bot
(async () => {
  const repoFolder = prepareFolderTree();
  await downloadAndExtractRepo(repoFolder);

  const subDirs = fs
    .readdirSync(repoFolder)
    .filter(f => fs.statSync(path.join(repoFolder, f)).isDirectory());

  if (!subDirs.length) {
    console.error('❌ Zip extracted nothing');
    process.exit(1);
  }

  const extractedRepoPath = path.join(repoFolder, subDirs[0]);
  copyConfigs(extractedRepoPath);

  const configdbPath = path.join(extractedRepoPath, 'lib', 'configdb.js');
  if (!fs.existsSync(configdbPath)) {
    console.warn('⚠️ Warning: lib/configdb.js not found. Some features may not work.');
  } else {
    console.log('✅ lib/configdb.js exists.');
  }

  try {
    console.log('🚀 Launching NYX MD Bot...');
    process.chdir(extractedRepoPath);
    require(path.join(extractedRepoPath, 'index.js'));
  } catch (err) {
    console.error('❌ Bot start error:', err.message);
    process.exit(1);
  }
})();
