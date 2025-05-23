import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI,
}));

export const databaseConfigValidation = {
  MONGODB_URI: Joi.string().uri().required(),
};
