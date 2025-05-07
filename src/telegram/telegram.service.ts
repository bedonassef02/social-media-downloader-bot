import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { TikTokService } from '../platforms/tiktok/tiktok.service';
import { Video } from '../platforms/video.interface';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    private tikTokService: TikTokService,
  ) {
    this.bot = new Telegraf(
      this.configService.get<string>('TELEGRAM_BOT_TOKEN'),
    );
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.start((ctx) => {
      ctx.reply(
        'Welcome to TikTok Downloader Bot! 🎬\n\n' +
          'Just send me a TikTok video link and I will download it for you without watermark',
      );
    });

    this.bot.help((ctx) => {
      ctx.reply(
        'How to use this bot:\n\n' +
          '1. Simply send a TikTok video link\n' +
          '2. Wait for the bot to process and download the video\n' +
          '3. Receive your video without watermarks!',
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

        if (!this.tikTokService.isValidUrl(url)) {
          await ctx.reply('❌ Please send a valid TikTok video URL.');
          return;
        }

        const processingMsg = await ctx.reply(
          '⏳ Processing your TikTok link...',
        );

        const videoInfo = await this.tikTokService.getVideoInfo(url);

        if (!videoInfo || !videoInfo.downloadUrl) {
          await ctx.telegram.editMessageText(
            processingMsg.chat.id,
            processingMsg.message_id,
            null,
            '❌ Failed to download the TikTok video. Please try again later.',
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
            filename: 'tiktok_video.mp4',
          },
          {
            caption: this.createCaption(videoInfo),
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

  private createCaption(videoInfo: Video): string {
    let caption = `🎬 TikTok Video\n\n`;

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
  }

  async onModuleDestroy(): Promise<void> {
    this.bot.stop('SIGTERM');
  }
}
