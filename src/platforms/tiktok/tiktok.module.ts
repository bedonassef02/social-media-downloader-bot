import { Module } from '@nestjs/common';
import { TikTokService } from './tiktok.service';
import { HelperService } from './helper.service';

@Module({
  providers: [TikTokService, HelperService],
  exports: [TikTokService, HelperService],
})
export class TiktokModule {}
