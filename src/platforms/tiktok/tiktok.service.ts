import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { HelperService } from './helper.service';
import { Video } from '../video.interface';

@Injectable()
export class TikTokService {
  public readonly name = 'TikTok';
  private readonly logger = new Logger(TikTokService.name);

  constructor(private helperService: HelperService) {}

  isValidUrl(url: string): boolean {
    const pattern =
      /https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/(?:.*\/)?(?:(?:v|embed|video|t)\/)?([0-9]+)|([^@]+@[^@]+)/;
    return pattern.test(url);
  }

  async getVideoInfo(url: string): Promise<Video | null> {
    try {
      return await this.getTiklydownInfo(url);
    } catch (error) {
      this.logger.error('All API services failed to fetch video info');
      return null;
    }
  }

  async getTiklydownInfo(url: string): Promise<Video> {
    const response = await this.helperService.retry(
      () =>
        axios.get(
          `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
        ),
      3,
    );

    if (response.data?.video?.noWatermark)
      return {
        downloadUrl: response.data.video.noWatermark,
        author: response.data.author?.name,
        likes: response.data.stats?.likeCount,
        comments: response.data.stats?.commentCount,
        shares: response.data.stats?.shareCount,
        views: response.data.stats?.playCount,
        description: response.data.title,
      };

    throw new Error('Invalid response from tiklydown API');
  }
}
