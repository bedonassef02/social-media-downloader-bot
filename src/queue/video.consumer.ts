import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from './queue.constants';
import { Logger } from '@nestjs/common';
import { PlatformFactory } from '../platform/platform.factory';
import { Video } from '../platform/video.interface';
import { Telegraf } from 'telegraf';
import { TelegramCore } from '../telegram/telegram.core';

@Processor(QUEUE_NAMES.VIDEO_PROCESSING)
export class VideoConsumer extends WorkerHost {
  private readonly logger = new Logger(VideoConsumer.name);
  private bot: Telegraf;

  constructor(
    private readonly platformFactory: PlatformFactory,
    private readonly telegramCore: TelegramCore,
  ) {
    super();
    this.bot = this.telegramCore.bot;
  }

  async process(job: Job<any>): Promise<any> {
    const { chatId, text } = job.data;
    this.logger.log(`Starting processing job ${job.id} for chat ${chatId}`);

    try {
      if (!text || !this.isValidUrl(text)) {
        await this.sendMessage(chatId, '❌ Please send a valid URL.');
        return;
      }

      const platformService = this.platformFactory.getPlatformService(text);
      if (!platformService) {
        await this.sendMessage(
          chatId,
          '❌ Platform not supported. Use /help to see supported platforms.',
        );
        return;
      }

      // Send initial processing message
      const processingMsg = await this.sendMessage(
        chatId,
        `⏳ Processing your ${platformService.name} link...`,
      );

      // Get video info
      let videoInfo: Video;
      try {
        videoInfo = await platformService.getVideoInfo(text);
      } catch (error) {
        this.logger.error(
          `Error getting video info: ${error.message}`,
          error.stack,
        );
        await this.editMessage(
          chatId,
          processingMsg.message_id,
          `❌ Failed to process ${platformService.name} video. Please try again later.`,
        );
        return;
      }

      if (!videoInfo?.downloadUrl) {
        await this.editMessage(
          chatId,
          processingMsg.message_id,
          `❌ Could not download video from ${platformService.name}.`,
        );
        return;
      }

      // Update with success message
      await this.editMessage(
        chatId,
        processingMsg.message_id,
        '✅ Successfully processed! Sending video...',
      );

      // Send the video
      await this.sendVideo(chatId, videoInfo, platformService.name);

      // Clean up processing message
      await this.deleteMessage(chatId, processingMsg.message_id);

      this.logger.log(
        `Successfully completed job ${job.id} for chat ${chatId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed processing job ${job.id}: ${error.message}`,
        error.stack,
      );
      await this.sendMessage(
        chatId,
        '❌ An unexpected error occurred. Please try again later.',
      );
      throw error; // Will trigger BullMQ's retry mechanism if configured
    }
  }

  private async sendMessage(chatId: number, text: string) {
    return this.bot.telegram.sendMessage(chatId, text);
  }

  private async editMessage(chatId: number, messageId: number, text: string) {
    return this.bot.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      text,
    );
  }

  private async deleteMessage(chatId: number, messageId: number) {
    return this.bot.telegram.deleteMessage(chatId, messageId);
  }

  private async sendVideo(
    chatId: number,
    videoInfo: Video,
    platformName: string,
  ) {
    try {
      await this.bot.telegram.sendVideo(
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
      // Fallback to sending as document if video send fails
      await this.bot.telegram.sendDocument(
        chatId,
        { url: videoInfo.downloadUrl },
        {
          caption: this.createCaption(videoInfo, platformName),
        },
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
    const captionParts = [`*🎬 ${platformName} Video*`];

    if (videoInfo.author) captionParts.push(`*👤 Author:* ${videoInfo.author}`);
    if (videoInfo.description)
      captionParts.push(`*📌 Title:* ${videoInfo.description}`);
    if (videoInfo.likes) captionParts.push(`*❤️ Likes:* ${videoInfo.likes}`);
    if (videoInfo.views) captionParts.push(`*👀 Views:* ${videoInfo.views}`);
    if (videoInfo.comments)
      captionParts.push(`*💬 Comments:* ${videoInfo.comments}`);
    if (videoInfo.shares) captionParts.push(`*🔄 Shares:* ${videoInfo.shares}`);

    if (videoInfo.description) {
      const maxLength = 200;
      const description =
        videoInfo.description.length > maxLength
          ? `${videoInfo.description.substring(0, maxLength)}...`
          : videoInfo.description;
      captionParts.push(`*📝 Description:* ${description}`);
    }

    return captionParts.join('\n\n');
  }
}
