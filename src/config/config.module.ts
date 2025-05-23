import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import redisConfig, { redisConfigValidation } from './redis.config';
import databaseConfig, { databaseConfigValidation } from './database.config';
import telegramConfig, { telegramConfigValidation } from './telegram.config';

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [redisConfig, databaseConfig, telegramConfig],
  validationSchema: Joi.object({
    ...redisConfigValidation,
    ...databaseConfigValidation,
    ...telegramConfigValidation,
  }),
  validationOptions: {
    allowUnknown: true,
    abortEarly: false,
  },
});
