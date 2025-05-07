import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { TiktokModule } from './platforms/tiktok/tiktok.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelegramModule,
    TiktokModule,
  ],
})
export class AppModule {}
