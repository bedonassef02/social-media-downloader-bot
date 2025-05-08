import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { PlatformFactory } from '../platform/platform.factory';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { Queue } from 'bullmq';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    private platformFactory: PlatformFactory,
    @InjectQueue(QUEUE_NAMES.VIDEO_PROCESSING) private videoQueue: Queue,
  ) {
    this.bot = new Telegraf(
      this.configService.get<string>('TELEGRAM_BOT_TOKEN'),
    );
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.start((ctx) => {
      ctx.reply(
        'Welcome to Video Downloader Bot! 🎬\n\n' +
          'Just send me a video link from a supported platform and I will download it for you without watermark',
      );
    });

    this.bot.help((ctx) => {
      const supportedPlatforms = this.platformFactory.getSupportedPlatforms();
      ctx.reply(
        'How to use this bot:\n\n' +
          '1. Simply send a video link from any supported platform\n' +
          '2. Wait for the bot to process and download the video\n' +
          '3. Receive your video without watermarks!\n\n' +
          `Supported platforms: ${supportedPlatforms.join(', ')}`,
      );
    });

    this.bot.on(message('text'), this.handleMessage.bind(this));

    this.bot.catch((err, ctx) => {
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

  async onModuleInit(): Promise<void> {
    await this.bot.launch();
    this.logger.log('Telegram bot has been started');
  }

  async onModuleDestroy(): Promise<void> {
    this.bot.stop('SIGTERM');
  }
}
