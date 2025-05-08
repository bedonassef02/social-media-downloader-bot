import { Module } from '@nestjs/common';
import { PlatformFactory } from './platform.factory';
import { TiktokModule } from './tiktok/tiktok.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TiktokModule, CommonModule],
  providers: [PlatformFactory],
  exports: [PlatformFactory],
})
export class PlatformModule {}
