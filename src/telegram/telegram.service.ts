import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_PRIORITY } from '../queue/queue.constants';
import { Queue } from 'bullmq';
import { TelegramCore } from './telegram.core';
import { UserService } from '../user/user.service';
import { CommandHandler } from './command-handler';
import { UserType } from '../user/types/user.type';

@Injectable()
export class TelegramService {
  private logger: Logger = new Logger(TelegramService.name);

  constructor(
    private telegramCore: TelegramCore,
    private userService: UserService,
    private command: CommandHandler,
    @InjectQueue(QUEUE_NAMES.VIDEO_PROCESSING) private videoQueue: Queue,
  ) {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    const bot = this.telegramCore.bot;

    bot.start((ctx) => this.command.start(ctx));
    bot.help((ctx) => this.command.help(ctx));
    bot.command('premium', (ctx) => this.command.premium(ctx));
    bot.command('status', (ctx) => this.command.status(ctx));
    bot.command('subscribe', (ctx) => this.command.subscribe(ctx));
    bot.command('subscription', (ctx) => this.command.subscriptionStatus(ctx));
    bot.on(message('text'), this.handleMessage.bind(this));
    bot.catch((err, ctx) => this.command.error(ctx));
  }

  private async handleMessage(ctx: Context): Promise<void> {
    if (!('text' in ctx.message)) return;

    const user = await this.userService.findOrCreate(
      ctx.from.id,
      ctx.from.username || `user_${ctx.from.id}`,
    );

    this.logger.log(
      `Received message from user ${ctx.from.id}: ${ctx.message.text}`,
    );

    const isDuplicate = await this.userService.isDuplicateLink(
      ctx.from.id,
      ctx.message.text,
    );

    if (isDuplicate) {
      this.logger.log(`Duplicate message blocked for user ${ctx.from.id}`);
      this.command.duplicateLink(ctx);
      return;
    }

    const canMakeRequest = await this.userService.canMakeRequest(user);

    if (!canMakeRequest) {
      this.logger.log(`Rate limit reached for user ${ctx.from.id}`);
      this.command.rateLimitReached(ctx);
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
  }
}
