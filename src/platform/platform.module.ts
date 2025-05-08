import { Module } from '@nestjs/common';
import { PlatformFactory } from './platform.factory';
import { TiktokModule } from './tiktok/tiktok.module';

@Module({
  imports: [TiktokModule],
  providers: [PlatformFactory],
  exports: [PlatformFactory, TiktokModule],
})
export class PlatformModule {}
