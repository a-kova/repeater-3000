import { Markup } from 'telegraf';
import { makeT } from '../i18n.js';

export function getTimeKeyboard(locale: string) {
  const t = makeT(locale);
  const timeOptions = [t('Turn off')];

  for (let i = 0; i < 24; i++) {
    timeOptions.push(`${i < 10 ? '0' : ''}${i}:00`);
  }

  return Markup.keyboard(timeOptions, {
    columns: 2,
  }).oneTime();
}
