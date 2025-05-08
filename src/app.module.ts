import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlatformModule } from './platform/platform.module';
import { QueueModule } from './queue/queue.module';
import { TelegramModule } from './telegram/telegram.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    PlatformModule,
    QueueModule,
    TelegramModule,
  ],
})
export class AppModule {}
