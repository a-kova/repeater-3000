import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18n from 'i18n';

// Recreate __filename / __dirname for ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18n.configure({
  locales: ['ru', 'ua'],
  defaultLocale: 'ru',
  directory: path.join(__dirname, '../../locales'),
  objectNotation: true,
  updateFiles: false,
  autoReload: false,
  syncFiles: false,
});

export default i18n;
