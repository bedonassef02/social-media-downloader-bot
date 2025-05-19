import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { PlatformModule } from '../platform/platform.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { TelegramCore } from './telegram.core';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    PlatformModule,
    UserModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.VIDEO_PROCESSING,
    }),
  ],
  providers: [TelegramService, TelegramCore],
  exports: [TelegramCore],
})
export class TelegramModule {}
