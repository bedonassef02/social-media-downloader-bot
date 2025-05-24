import { Module } from '@nestjs/common';
import { PlatformModule } from './platform/platform.module';
import { QueueModule } from './queue/queue.module';
import { TelegramModule } from './telegram/telegram.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { configModule } from './config/config.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    configModule,
    CacheModule.register({
      isGlobal: true,
    }),
    CommonModule,
    PlatformModule,
    QueueModule,
    TelegramModule,
    UserModule,
    DatabaseModule,
    SubscriptionModule,
  ],
})
export class AppModule {}
