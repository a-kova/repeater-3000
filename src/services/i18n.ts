import path from 'node:path';
import i18n from 'i18n';

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
