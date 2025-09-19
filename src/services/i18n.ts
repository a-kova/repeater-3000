import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18n from 'i18n';

// Recreate __filename / __dirname for ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18n.configure({
  locales: ['ru', 'uk'],
  defaultLocale: 'ru',
  directory: path.join(__dirname, '../../locales'),
  updateFiles: false,
});

function makeT(locale: string) {
  return (phrase: string, ...args: any[]) =>
    i18n.__({ phrase, locale }, ...args);
}

export { makeT };
