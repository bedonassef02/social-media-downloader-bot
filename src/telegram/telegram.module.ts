import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [ConfigModule, PlatformModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
