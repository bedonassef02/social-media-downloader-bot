import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('redis', () => ({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
}));

export const redisConfigValidation = {
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
};
