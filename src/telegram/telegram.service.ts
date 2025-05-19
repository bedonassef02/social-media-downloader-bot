import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_PRIORITY } from '../queue/queue.constants';
import { Queue } from 'bullmq';
import { TelegramCore } from './telegram.core';
import { UserService } from '../user/user.service';
import { UserType } from '../user/entities/user.entity';
import { CommandHandler } from './command-handler';

@Injectable()
export class TelegramService {
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

    bot.on(message('text'), this.handleMessage.bind(this));

    bot.catch((err, ctx) => this.command.error(ctx));
  }

  private async handleMessage(ctx: Context): Promise<void> {
    if (!('text' in ctx.message)) return;

    const user = await this.userService.findOrCreate(
      ctx.from.id,
      ctx.from.username || `user_${ctx.from.id}`,
    );

    const canMakeRequest = await this.userService.canMakeRequest(user);

    if (!canMakeRequest) {
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
