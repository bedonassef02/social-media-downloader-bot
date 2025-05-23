import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { VideoConsumer } from './video.consumer';
import { PlatformModule } from '../platform/platform.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UserModule } from '../user/user.module';
import redisConfig from '../config/redis.config';

@Module({
  imports: [
    PlatformModule,
    ConfigModule,
    TelegramModule,
    UserModule,
    BullModule.forRootAsync(redisConfig.asProvider()),
  ],
  providers: [VideoConsumer],
})
export class QueueModule {}
