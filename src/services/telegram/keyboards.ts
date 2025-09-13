import { Markup } from 'telegraf';
import i18n from '../i18n.js';

console.log('Keyboards loaded', i18n.__('Turn off'));

const timeOptions = [i18n.__('Turn off')];

for (let i = 0; i < 24; i++) {
  timeOptions.push(`${i < 10 ? '0' : ''}${i}:00`);
}

export const timeKeyboard = Markup.keyboard(timeOptions, {
  columns: 2,
}).oneTime();
