import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VideoConsumer } from './video.consumer';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [
    PlatformModule,
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    }),
  ],
  providers: [VideoConsumer],
  exports: [VideoConsumer],
})
export class QueueModule {}
