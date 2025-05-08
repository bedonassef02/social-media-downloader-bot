import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { PlatformModule } from '../platform/platform.module';
import { QueueModule } from '../queue/queue.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { TelegramCore } from './telegram.core';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => QueueModule),
    BullModule.registerQueue({
      name: QUEUE_NAMES.VIDEO_PROCESSING,
    }),
    PlatformModule,
  ],
  providers: [TelegramService, TelegramCore],
  exports: [TelegramCore],
})
export class TelegramModule {}
