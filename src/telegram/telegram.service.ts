import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { PlatformFactory } from '../platform/platform.factory';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { Queue } from 'bullmq';
import { TelegramCore } from './telegram.core';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private platformFactory: PlatformFactory,
    private telegramCore: TelegramCore,
    @InjectQueue(QUEUE_NAMES.VIDEO_PROCESSING) private videoQueue: Queue,
  ) {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    const bot = this.telegramCore.bot;

    bot.start((ctx) => {
      ctx.reply(
        'Welcome to Video Downloader Bot! 🎬\n\n' +
          'Just send me a video link from a supported platform and I will download it for you without watermark',
      );
    });

    bot.help((ctx) => {
      const supportedPlatforms = this.platformFactory.getSupportedPlatforms();
      ctx.reply(
        'How to use this bot:\n\n' +
          '1. Simply send a video link from any supported platform\n' +
          '2. Wait for the bot to process and download the video\n' +
          '3. Receive your video without watermarks!\n\n' +
          `Supported platforms: ${supportedPlatforms.join(', ')}`,
      );
    });

    bot.on(message('text'), this.handleMessage.bind(this));

    bot.catch((err, ctx) => {
      this.logger.error(`Error for ${ctx.updateType}:`, err);
      ctx.reply('❌ An error occurred. Please try again later.');
    });
  }

  async handleMessage(ctx: Context): Promise<void> {
    try {
      if (!('text' in ctx.message)) return;

      const job = await this.videoQueue.add('transcode', {
        chatId: ctx.chat.id,
        messageId: ctx.message.message_id,
        text: ctx.message.text,
        from: ctx.from,
      });

      this.logger.log(`Video processing job added with ID: ${job.id}`);
    } catch (error) {
      this.logger.error('Error processing video:', error);
      await ctx.reply('❌ An error occurred. Please try again later.');
    }
  }
}
