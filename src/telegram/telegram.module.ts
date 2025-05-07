import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TiktokModule } from '../platforms/tiktok/tiktok.module';

@Module({
  imports: [TiktokModule],
  providers: [TelegramService],
})
export class TelegramModule {}
