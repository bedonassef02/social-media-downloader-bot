import { ConfigModule } from '@nestjs/config';
import redisConfig from './redis.config';
import databaseConfig from './database.config';
import telegramConfig from './telegram.config';

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [redisConfig, databaseConfig, telegramConfig],
});
