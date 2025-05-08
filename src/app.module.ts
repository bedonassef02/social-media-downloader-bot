import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram/telegram.service';
import { HelperService } from './common/helper.service';
import { PlatformFactory } from './platforms/platform.factory';
import { TikTokService } from './platforms/tiktok/tiktok.service';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    QueueModule,
  ],
  providers: [
    HelperService,
    PlatformFactory,
    TikTokService,
    TelegramService,
    {
      provide: 'PLATFORM_INIT',
      useFactory: (
        platformFactory: PlatformFactory,
        tiktokService: TikTokService,
      ) => platformFactory.registerPlatform(tiktokService),
      inject: [PlatformFactory, TikTokService],
    },
  ],
})
export class AppModule {}
