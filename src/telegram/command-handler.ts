import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { PlatformFactory } from '../platform/platform.factory';
import { UserType } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class CommandHandler {
  constructor(
    private platformFactory: PlatformFactory,
    private userService: UserService,
  ) {}
  start(ctx: Context): void {
    ctx.reply(
      'Welcome to Video Downloader Bot! 🎬\n\n' +
        'Just send me a video link from a supported platform and I will download it for you without watermark.\n\n' +
        '⚠️ *Free users* can make 3 requests per hour.\n' +
        '✨ *Premium users* get unlimited requests with higher priority.\n\n' +
        'Use /premium to see premium options.',
      { parse_mode: 'Markdown' },
    );
  }

  help(ctx: Context): void {
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
  }

  premium(ctx: Context): void {
    ctx.reply(
      '✨ *Premium Subscription* ✨\n\n' +
        'Upgrade to premium and get:\n' +
        '• Unlimited video downloads\n' +
        '• Priority processing\n' +
        '• No hourly limits\n\n' +
        'Contact @bedonassef02 to get your premium subscription!',
      { parse_mode: 'Markdown' },
    );
  }

  async status(ctx: Context): Promise<void> {
    const user = await this.userService.findOrCreate(
      ctx.from.id,
      ctx.from.username || `user_${ctx.from.id}`,
    );

    const accountType = user.type === UserType.PREMIUM ? 'Premium ✨' : 'Free';
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
  }

  rateLimitReached(ctx: Context): void {
    ctx.reply(
      '⚠️ *Rate limit reached*\n\n' +
        'You have reached the limit of 3 requests per hour for free users.\n\n' +
        'Please try again later or upgrade to premium for unlimited requests!',
      { parse_mode: 'Markdown' },
    );
  }

  error(ctx: Context): void {
    ctx.reply('❌ An error occurred. Please try again later.');
  }
}
