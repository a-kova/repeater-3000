import { Markup } from 'telegraf';
import i18n from '../i18n.js';

export function getTimeKeyboard() {
  const timeOptions = [i18n.__('Turn off')];

  console.log({
    typeof__: typeof i18n.__,
    currentLocale: i18n.getLocale?.(),
    sample: i18n.__('Turn off'),
    hasKeyRu: !!i18n.getCatalog('ru')?.['Turn off'],
    hasKeyUa: !!i18n.getCatalog('ua')?.['Turn off'],
  });

  for (let i = 0; i < 24; i++) {
    timeOptions.push(`${i < 10 ? '0' : ''}${i}:00`);
  }

  return Markup.keyboard(timeOptions, {
    columns: 2,
  }).oneTime();
}
