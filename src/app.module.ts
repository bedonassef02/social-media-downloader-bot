import { Module } from '@nestjs/common';
import { TiktokModule } from './platforms/tiktok/tiktok.module';

@Module({
  imports: [TiktokModule],
})
export class AppModule {}
