import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
}));

export const telegramConfigValidation = {
  TELEGRAM_BOT_TOKEN: Joi.string().required(),
};
