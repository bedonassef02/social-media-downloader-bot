import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramCore implements OnModuleInit, OnModuleDestroy {
  public bot: Telegraf;
  private readonly logger = new Logger(TelegramCore.name);

  constructor(private configService: ConfigService) {
    this.bot = new Telegraf(
      this.configService.get<string>('TELEGRAM_BOT_TOKEN'),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.bot.launch();
    this.logger.log('Telegram bot has been started');
  }

  async onModuleDestroy(): Promise<void> {
    this.bot.stop('SIGTERM');
  }
}
