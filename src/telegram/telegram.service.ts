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
import { Video } from '../platform/video.interface';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    private platformFactory: PlatformFactory,
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
      if ('text' in ctx.message) {
        const url = ctx.message.text;
        const platformService = this.platformFactory.getPlatformService(url);

        if (!platformService) {
          await ctx.reply(
            '❌ Please send a valid video URL from a supported platform.',
          );
          return;
        }

        const processingMsg = await ctx.reply(
          `⏳ Processing your ${platformService.name} link...`,
        );

        const videoInfo = await platformService.getVideoInfo(url);

        if (!videoInfo || !videoInfo.downloadUrl) {
          await ctx.telegram.editMessageText(
            processingMsg.chat.id,
            processingMsg.message_id,
            null,
            `❌ Failed to download the ${platformService.name} video. Please try again later.`,
          );
          return;
        }

        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          null,
          '✅ Successfully downloaded! Sending video now...',
        );

        await ctx.replyWithVideo(
          {
            url: videoInfo.downloadUrl,
            filename: `${platformService.name.toLowerCase()}_video.mp4`,
          },
          {
            caption: this.createCaption(videoInfo, platformService.name),
          },
        );

        await ctx.telegram.deleteMessage(
          processingMsg.chat.id,
          processingMsg.message_id,
        );
      }
    } catch (error) {
      this.logger.error('Error processing video:', error);
      await ctx.reply(
        '❌ An error occurred while processing the video. Please try again later.',
      );
    }
  }

  private createCaption(videoInfo: Video, platformName: string): string {
    let caption = `🎬 ${platformName} Video\n\n`;

    if (videoInfo.author) caption += `👤 Author: ${videoInfo.author}\n`;
    if (videoInfo.likes) caption += `❤️ Likes: ${videoInfo.likes}\n`;
    if (videoInfo.comments) caption += `💬 Comments: ${videoInfo.comments}\n`;
    if (videoInfo.shares) caption += `🔄 Shares: ${videoInfo.shares}\n`;
    if (videoInfo.views) caption += `👁️ Views: ${videoInfo.views}\n`;
    if (videoInfo.description)
      caption += `📝 Description: ${videoInfo.description.substring(0, 100)}${videoInfo.description.length > 100 ? '...' : ''}\n`;

    return caption;
  }

  async onModuleInit(): Promise<void> {
    await this.bot.launch();
    this.logger.log('Telegram bot has been started');
  }

  async onModuleDestroy(): Promise<void> {
    this.bot.stop('SIGTERM');
  }
}
