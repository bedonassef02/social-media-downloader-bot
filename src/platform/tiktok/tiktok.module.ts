import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { TikTokService } from './tiktok.service';

@Module({
  imports: [CommonModule],
  providers: [TikTokService],
  exports: [TikTokService],
})
export class TiktokModule {}
