import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import telegramConfig from '../config/telegram.config';

@Injectable()
export class TelegramCore implements OnModuleInit, OnModuleDestroy {
  public bot: Telegraf;
  private readonly logger = new Logger(TelegramCore.name);

  constructor(
    @Inject(telegramConfig.KEY)
    private readonly tgConfig: ConfigType<typeof telegramConfig>,
  ) {
    this.bot = new Telegraf(this.tgConfig.botToken);
  }

  async onModuleInit(): Promise<void> {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'help', description: 'Get help information' },
      { command: 'premium', description: 'View premium options' },
      { command: 'subscribe', description: 'How to subscribe' },
      {
        command: 'subscription',
        description: 'View your subscription details',
      },
      { command: 'status', description: 'Check your account status' },
    ]);

    await this.bot.telegram.setMyDefaultAdministratorRights({
      rights: {
        is_anonymous: false,
        can_manage_chat: false,
        can_change_info: false,
        can_post_messages: true,
        can_edit_messages: false,
        can_delete_messages: false,
        can_manage_video_chats: false,
        can_invite_users: false,
        can_restrict_members: false,
        can_pin_messages: false,
        can_promote_members: false,
      },
    });

    await this.bot.launch();
    this.logger.log('Telegram bot has been started');
  }

  async onModuleDestroy(): Promise<void> {
    this.bot.stop('SIGTERM');
  }
}
