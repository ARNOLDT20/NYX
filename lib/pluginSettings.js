const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(process.cwd(), 'store', 'plugin_settings.json');

const ensureStore = async () => {
  const dir = path.dirname(SETTINGS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
};

const readAll = async () => {
  await ensureStore();
  const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
};

const writeAll = async (obj) => {
  await ensureStore();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(obj, null, 2), 'utf8');
};

const get = async (chatId, key) => {
  const all = await readAll();
  if (!all[chatId]) return undefined;
  return all[chatId][key];
};

const set = async (chatId, key, value) => {
  const all = await readAll();
  if (!all[chatId]) all[chatId] = {};
  all[chatId][key] = value;
  await writeAll(all);
  return true;
};

module.exports = { get, set, readAll, writeAll };
