import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { PlatformFactory } from '../platform/platform.factory';
import { UserService } from '../user/user.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SUBSCRIPTION_PRICES } from '../subscription/subscription.constants';
import { UserType } from '../user/types/user.type';
import { SubscriptionPlan } from '../subscription/types/subscription.plan';

@Injectable()
export class CommandHandler {
  constructor(
    private platformFactory: PlatformFactory,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
  ) {}

  start(ctx: Context): void {
    ctx.reply(
      '🎬 *Welcome to Video Downloader Bot!*\n\n' +
        '🔗 Send any video link to remove watermarks!\n\n' +
        '⚡ *Free*: 3 downloads/hour\n' +
        '💎 *Premium*: Unlimited + Priority\n\n' +
        '👉 /premium - Upgrade options\n' +
        '📩 Need help? Contact @bedonassef02',
      { parse_mode: 'Markdown' },
    );
  }

  help(ctx: Context): void {
    const supportedPlatforms = this.platformFactory.getSupportedPlatforms();
    ctx.reply(
      '📚 *How to use*:\n\n' +
        '1️⃣ Send video link\n' +
        '2️⃣ Get watermark-free video!\n\n' +
        `📺 Supported: ${supportedPlatforms.join(', ')}\n\n` +
        '🔹 /premium - Upgrade account\n' +
        '🔹 /status - Your usage\n\n' +
        '💬 Contact @bedonassef02 for support',
      { parse_mode: 'Markdown' },
    );
  }

  premium(ctx: Context): void {
    const yearlyDiscount = Math.round(
      (1 - SUBSCRIPTION_PRICES.YEARLY / (SUBSCRIPTION_PRICES.MONTHLY * 12)) *
        100,
    );
    ctx.reply(
      '💎 *Premium Benefits*:\n\n' +
        '✅ Unlimited downloads\n' +
        '🚀 Priority processing\n' +
        '⏱️ No waiting limits\n\n' +
        '💰 *Plans*:\n' +
        `💵 Monthly: $${SUBSCRIPTION_PRICES.MONTHLY}\n` +
        `💎 Yearly: $${SUBSCRIPTION_PRICES.YEARLY} (Save ${yearlyDiscount}%!)\n\n` +
        '📩 *How to subscribe*:\n' +
        '1. Contact @bedonassef02\n' +
        '2. Choose your plan\n' +
        '3. Get instant activation!',
      { parse_mode: 'Markdown' },
    );
  }

  async subscribe(ctx: Context): Promise<void> {
    ctx.reply(
      '💎 *Get Premium in 3 Steps*:\n\n' +
        '1️⃣ Contact @bedonassef02\n' +
        '2️⃣ Choose your plan:\n' +
        `   • Monthly ($${SUBSCRIPTION_PRICES.MONTHLY})\n` +
        `   • Yearly ($${SUBSCRIPTION_PRICES.YEARLY}) - BEST VALUE!\n` +
        '3️⃣ Complete payment\n\n' +
        '✨ Instant activation!\n' +
        '❓ Questions? Just ask @bedonassef02',
      { parse_mode: 'Markdown' },
    );
  }

  async subscriptionStatus(ctx: Context): Promise<void> {
    const details = await this.subscriptionService.getSubscriptionDetails(
      ctx.from.id,
    );

    if (!details.isActive) {
      ctx.reply(
        '🔍 *No Active Subscription*\n\n' +
          '💎 Want premium benefits?\n' +
          'Contact @bedonassef02 or use /premium',
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
      '📊 *Your Premium Plan*\n\n' +
        `📅 ${planName} ($${price})\n` +
        `✅ Active\n` +
        `⏳ Expires: ${details.endDate?.toDateString()}\n` +
        `📆 ${details.daysRemaining} days remaining\n\n` +
        '🔄 Need help? Contact @bedonassef02',
      { parse_mode: 'Markdown' },
    );
  }

  async status(ctx: Context): Promise<void> {
    const user = await this.userService.findOrCreate(
      ctx.from.id,
      ctx.from.username || `user_${ctx.from.id}`,
    );

    const accountType =
      user.type === UserType.PREMIUM ? '💎 Premium' : '⚡ Free';
    const requestsLeft =
      user.type === UserType.PREMIUM
        ? '∞ Unlimited'
        : `${Math.max(0, 3 - user.requestsThisHour)}/3 this hour`;

    let subscriptionInfo = '';
    if (
      user.type === UserType.PREMIUM &&
      this.userService.hasActiveSubscription(user)
    ) {
      const details = await this.subscriptionService.getSubscriptionDetails(
        ctx.from.id,
      );
      subscriptionInfo =
        `\n📅 Plan: *${details.plan === SubscriptionPlan.MONTHLY ? 'Monthly' : 'Yearly'}*\n` +
        `⏳ Expires in *${details.daysRemaining} days*\n`;
    }

    ctx.reply(
      `📊 *Your Account*\n\n` +
        `👤 ${accountType}\n` +
        `📥 Downloads: *${requestsLeft}*\n` +
        subscriptionInfo +
        (user.type === UserType.NORMAL
          ? `\n💎 Want unlimited downloads?\nContact @bedonassef02 or use /premium`
          : `\n✨ Thank you for being premium!\nNeed help? @bedonassef02`),
      { parse_mode: 'Markdown' },
    );
  }

  rateLimitReached(ctx: Context): void {
    ctx.reply(
      '⛔ *Download Limit Reached!*\n\n' +
        'Free users get 3 downloads/hour\n\n' +
        '💎 Get unlimited access:\n' +
        '👉 Contact @bedonassef02\n' +
        'or use /premium',
      { parse_mode: 'Markdown' },
    );
  }

  error(ctx: Context): void {
    ctx.reply(
      '❌ Something went wrong!\n\n' +
        'Please try again later or contact @bedonassef02 for help',
      { parse_mode: 'Markdown' },
    );
  }
}
