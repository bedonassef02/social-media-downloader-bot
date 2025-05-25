import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from './queue.constants';
import { Logger } from '@nestjs/common';
import { PlatformFactory } from '../platform/platform.factory';
import { Video } from '../platform/video.interface';
import { TelegramCore } from '../telegram/telegram.core';
import { UserService } from '../user/user.service';
import { Telegram } from 'telegraf';

@Processor(QUEUE_NAMES.VIDEO_PROCESSING, { concurrency: 5 })
export class VideoConsumer extends WorkerHost {
  private readonly logger = new Logger(VideoConsumer.name);
  private bot: Telegram;

  constructor(
    private readonly platformFactory: PlatformFactory,
    private readonly telegramCore: TelegramCore,
    private readonly userService: UserService,
  ) {
    super();
    this.bot = this.telegramCore.bot.telegram;
  }

  async process(job: Job<any>): Promise<any> {
    const { chatId, text, from } = job.data;
    this.logger.log(`Processing job ${job.id} for chat ${chatId}`);
    try {
      // Find or create user record
      const user = await this.userService.findOrCreate(
        from.id,
        from.username || `user_${from.id}`,
      );

      // Update user's request count
      await this.userService.updateRequests(user);

      if (!text || !this.isValidUrl(text)) {
        await this.bot.sendMessage(chatId, '❌ Please send a valid URL.');
        return;
      }

      const platformService = this.platformFactory.getPlatformService(text);
      if (!platformService) {
        await this.bot.sendMessage(
          chatId,
          '❌ Platform not supported. Use /help to see supported platforms.',
        );
        return;
      }

      const processingMsg = await this.bot.sendMessage(
        chatId,
        `⏳ Processing your ${platformService.name} link...`,
      );

      let videoInfo: Video | null;
      try {
        videoInfo = await platformService.getVideoInfo(text);
      } catch (error) {
        await this.bot.editMessageText(
          chatId,
          processingMsg.message_id,
          undefined,
          `❌ Failed to process ${platformService.name} video. Please try again later.`,
        );
        return;
      }

      if (!videoInfo?.downloadUrl && !videoInfo?.isMultiItem) {
        await this.bot.editMessageText(
          chatId,
          processingMsg.message_id,
          undefined,
          `❌ Could not download content from ${platformService.name}.`,
        );
        return;
      }

      await this.bot.editMessageText(
        chatId,
        processingMsg.message_id,
        undefined,
        '✅ Successfully processed! Sending content...',
      );

      if (videoInfo.isMultiItem && videoInfo.items?.length)
        await this.sendMultipleItems(chatId, videoInfo, platformService.name);
      else await this.sendVideo(chatId, videoInfo, platformService.name);

      await this.bot.deleteMessage(chatId, processingMsg.message_id);
    } catch (error) {
      this.logger.error(`Failed processing job ${job.id}: ${error.message}`);
      await this.bot.sendMessage(
        chatId,
        '❌ An unexpected error occurred. Please try again later.',
      );
      throw error;
    }
  }

  private async sendVideo(
    chatId: number,
    videoInfo: Video,
    platformName: string,
  ) {
    try {
      await this.bot.sendVideo(
        chatId,
        { url: videoInfo.downloadUrl },
        {
          caption: this.createCaption(videoInfo, platformName),
          supports_streaming: true,
          parse_mode: 'Markdown',
        },
      );
    } catch (error) {
      this.logger.error(`Error sending video to ${chatId}: ${error.message}`);
      await this.bot.sendDocument(
        chatId,
        { url: videoInfo.downloadUrl },
        {
          caption: this.createCaption(videoInfo, platformName),
          parse_mode: 'Markdown',
        },
      );
    }
  }

  private async sendMultipleItems(
    chatId: number,
    videoInfo: Video,
    platformName: string,
  ) {
    try {
      const caption = this.createCaption(videoInfo, platformName);
      const mediaGroup =
        videoInfo.items &&
        videoInfo.items
          .filter((item) => item.type === 'image')
          .map((item, index) => ({
            type: 'photo' as const,
            media: item.url,
            caption: index === 0 ? caption : undefined,
            parse_mode: 'Markdown' as const,
          }));

      if (mediaGroup && mediaGroup.length > 0)
        if (mediaGroup.length === 1)
          await this.bot.sendPhoto(chatId, mediaGroup[0].media, {
            caption: mediaGroup[0].caption,
            parse_mode: 'Markdown',
          });
        else
          for (let i = 0; i < mediaGroup.length; i += 10)
            await this.bot.sendMediaGroup(chatId, mediaGroup.slice(i, i + 10));
      else
        await this.bot.sendMessage(
          chatId,
          '❌ No images found in the multi-item content.',
        );
    } catch (error) {
      this.logger.error(`Error sending items to ${chatId}: ${error.message}`);
      await this.bot.sendMessage(
        chatId,
        '❌ Failed to send some items. Please try again.',
      );
    }
  }

  private isValidUrl(text: string): boolean {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }

  private createCaption(videoInfo: Video, platformName: string): string {
    const parts = [`*🎬 ${platformName} Content*`];

    if (videoInfo.author) parts.push(`*👤 Author:* ${videoInfo.author}`);
    if (videoInfo.description) {
      const maxLength = 200;
      const description =
        videoInfo.description.length > maxLength
          ? `${videoInfo.description.substring(0, maxLength)}...`
          : videoInfo.description;
      parts.push(`*📌 Title:* ${description}`);
    }
    if (videoInfo.likes) parts.push(`*❤️ Likes:* ${videoInfo.likes}`);
    if (videoInfo.views) parts.push(`*👀 Views:* ${videoInfo.views}`);
    if (videoInfo.comments) parts.push(`*💬 Comments:* ${videoInfo.comments}`);
    if (videoInfo.shares) parts.push(`*🔄 Shares:* ${videoInfo.shares}`);

    return parts.join('\n\n');
  }
}
