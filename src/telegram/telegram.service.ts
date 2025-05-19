import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { PlatformFactory } from '../platform/platform.factory';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_PRIORITY } from '../queue/queue.constants';
import { Queue } from 'bullmq';
import { TelegramCore } from './telegram.core';
import { UserService } from '../user/user.service';
import { UserType } from '../user/entities/user.entity';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private platformFactory: PlatformFactory,
    private telegramCore: TelegramCore,
    private userService: UserService,
    @InjectQueue(QUEUE_NAMES.VIDEO_PROCESSING) private videoQueue: Queue,
  ) {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    const bot = this.telegramCore.bot;

    bot.start((ctx) => {
      ctx.reply(
        'Welcome to Video Downloader Bot! 🎬\n\n' +
          'Just send me a video link from a supported platform and I will download it for you without watermark.\n\n' +
          '⚠️ *Free users* can make 3 requests per hour.\n' +
          '✨ *Premium users* get unlimited requests with higher priority.\n\n' +
          'Use /premium to see premium options.',
        { parse_mode: 'Markdown' },
      );
    });

    bot.help((ctx) => {
      const supportedPlatforms = this.platformFactory.getSupportedPlatforms();
      ctx.reply(
        'How to use this bot:\n\n' +
          '1. Simply send a video link from any supported platform\n' +
          '2. Wait for the bot to process and download the video\n' +
          '3. Receive your video without watermarks!\n\n' +
          `Supported platforms: ${supportedPlatforms.join(', ')}\n\n` +
          '📋 *Commands*\n' +
          '/start - Start the bot\n' +
          '/help - Show this help message\n' +
          '/premium - Show premium options\n' +
          '/status - Check your current status\n\n' +
          '⚠️ Free users: 3 requests per hour\n' +
          '✨ Premium users: Unlimited requests + Priority processing',
        { parse_mode: 'Markdown' },
      );
    });

    bot.command('premium', (ctx) => {
      ctx.reply(
        '✨ *Premium Subscription* ✨\n\n' +
          'Upgrade to premium and get:\n' +
          '• Unlimited video downloads\n' +
          '• Priority processing\n' +
          '• No hourly limits\n\n' +
          'Contact @admin to get your premium subscription!',
        { parse_mode: 'Markdown' },
      );
    });

    bot.command('status', async (ctx) => {
      try {
        const user = await this.userService.findOrCreate(
          ctx.from.id,
          ctx.from.username || `user_${ctx.from.id}`,
        );

        const accountType =
          user.type === UserType.PREMIUM ? 'Premium ✨' : 'Free';
        const requestsLeft =
          user.type === UserType.PREMIUM
            ? 'Unlimited'
            : `${Math.max(0, 3 - user.requestsThisHour)} of 3 this hour`;

        ctx.reply(
          `*Account Status*\n\n` +
            `Account Type: *${accountType}*\n` +
            `User ID: \`${user.telegramId}\`\n` +
            `Requests Available: *${requestsLeft}*\n\n` +
            (user.type === UserType.NORMAL
              ? `Upgrade to premium for unlimited requests and priority processing!`
              : `Thanks for being a premium user!`),
          { parse_mode: 'Markdown' },
        );
      } catch (error) {
        ctx.reply('Error fetching your status.');
      }
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

      const user = await this.userService.findOrCreate(
        ctx.from.id,
        ctx.from.username || `user_${ctx.from.id}`,
      );

      const canMakeRequest = await this.userService.canMakeRequest(user);

      if (!canMakeRequest) {
        await ctx.reply(
          '⚠️ *Rate limit reached*\n\n' +
            'You have reached the limit of 3 requests per hour for free users.\n\n' +
            'Please try again later or upgrade to premium for unlimited requests!',
          { parse_mode: 'Markdown' },
        );
        return;
      }

      // Set job priority based on user type
      const priority =
        user.type === UserType.PREMIUM
          ? QUEUE_PRIORITY.PREMIUM
          : QUEUE_PRIORITY.NORMAL;

      await this.videoQueue.add(
        'transcode',
        {
          chatId: ctx.chat.id,
          messageId: ctx.message.message_id,
          text: ctx.message.text,
          from: ctx.from,
        },
        { priority },
      );
    } catch (error) {
      this.logger.error('Error processing video:', error);
      await ctx.reply('❌ An error occurred. Please try again later.');
    }
  }
}
