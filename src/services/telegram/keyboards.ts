import { Markup } from 'telegraf';
import { timezones } from '../../constants.js';
import i18n from '../i18n.js';

const timeOptions = [i18n.__('Turn off')];

for (let i = 0; i < 24; i++) {
  timeOptions.push(`${i < 10 ? '0' : ''}${i}:00`);
}

export const timeKeyboard = Markup.keyboard(timeOptions, {
  columns: 2,
}).oneTime();

export const timezoneKeyboard = Markup.keyboard(
  timezones.map((tz) => tz.label),
  { columns: 1 }
).oneTime();
