import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { PlatformFactory } from '../platform/platform.factory';
import { UserType, SubscriptionPlan } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SUBSCRIPTION_PRICES } from '../subscription/subscription.constants';

@Injectable()
export class CommandHandler {
  constructor(
    private platformFactory: PlatformFactory,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
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
        '/premium - Show premium subscription options\n' +
        '/subscription - Check your subscription status\n' +
        '/status - Check your current account status\n\n' +
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
        '*Choose your subscription plan:*\n' +
        `• Monthly: $${SUBSCRIPTION_PRICES.MONTHLY}/month - /subscribe_monthly\n` +
        `• Yearly: $${SUBSCRIPTION_PRICES.YEARLY}/year - /subscribe_yearly (Save ${Math.round((1 - SUBSCRIPTION_PRICES.YEARLY / (SUBSCRIPTION_PRICES.MONTHLY * 12)) * 100)}%!)\n\n` +
        'Use /subscription to check your current subscription status.',
      { parse_mode: 'Markdown' },
    );
  }

  async subscribe(ctx: Context): Promise<void> {
    const paymentLink = '';
    ctx.reply(
      '💳 *Monthly Subscription* 💳\n\n' +
        `Price: $${SUBSCRIPTION_PRICES.MONTHLY}/month\n\n` +
        'To complete your subscription, please follow the payment link below:\n\n' +
        `[Complete Payment](${paymentLink})\n\n` +
        'Once payment is complete, your premium features will be activated automatically.',
      { parse_mode: 'Markdown' },
    );
  }

  async subscriptionStatus(ctx: Context): Promise<void> {
    const details = await this.subscriptionService.getSubscriptionDetails(
      ctx.from.id,
    );

    if (!details.isActive) {
      ctx.reply(
        '📊 *Subscription Status* 📊\n\n' +
          "You currently don't have an active subscription.\n\n" +
          'Use /premium to see available subscription plans.',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    const planName =
      details.plan === SubscriptionPlan.MONTHLY ? 'Monthly' : 'Yearly';
    const price =
      details.plan === SubscriptionPlan.MONTHLY
        ? SUBSCRIPTION_PRICES.MONTHLY
        : SUBSCRIPTION_PRICES.YEARLY;

    ctx.reply(
      '📊 *Subscription Status* 📊\n\n' +
        `*Plan:* ${planName}\n` +
        `*Price:* $${price}/${details.plan.toLowerCase()}\n` +
        `*Status:* Active\n` +
        `*Expires:* ${details.endDate?.toDateString()}\n` +
        `*Days Remaining:* ${details.daysRemaining}\n\n` +
        'Use /cancel_subscription to cancel your subscription.',
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

    // Get subscription details if user is premium
    let subscriptionInfo = '';
    if (
      user.type === UserType.PREMIUM &&
      this.userService.hasActiveSubscription(user)
    ) {
      const details = await this.subscriptionService.getSubscriptionDetails(
        ctx.from.id,
      );
      subscriptionInfo =
        `\nSubscription Plan: *${details.plan === SubscriptionPlan.MONTHLY ? 'Monthly' : 'Yearly'}*\n` +
        `Expires: *${details.endDate?.toDateString()}*\n` +
        `Days Remaining: *${details.daysRemaining}*\n`;
    }

    ctx.reply(
      `*Account Status*\n\n` +
        `Account Type: *${accountType}*\n` +
        `User ID: \`${user.telegramId}\`\n` +
        `Requests Available: *${requestsLeft}*\n` +
        subscriptionInfo +
        `\n` +
        (user.type === UserType.NORMAL
          ? `Upgrade to premium for unlimited requests and priority processing! Use /premium`
          : `Thanks for being a premium user!`),
      { parse_mode: 'Markdown' },
    );
  }

  rateLimitReached(ctx: Context): void {
    ctx.reply(
      '⚠️ *Rate limit reached*\n\n' +
        'You have reached the limit of 3 requests per hour for free users.\n\n' +
        'Please try again later or upgrade to premium for unlimited requests! Use /premium',
      { parse_mode: 'Markdown' },
    );
  }

  error(ctx: Context): void {
    ctx.reply('❌ An error occurred. Please try again later.');
  }
}
