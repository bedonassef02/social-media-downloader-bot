import { Injectable, Logger } from '@nestjs/common';
import { HelperService } from '../../common/helper.service';
import { Video } from '../video.interface';
import { PlatformService } from '../platform.interface';

@Injectable()
export class TikTokService implements PlatformService {
  public readonly name = 'TikTok';
  private readonly logger = new Logger(TikTokService.name);
  private readonly API_ENDPOINT = 'https://api.tiklydown.eu.org/api/download';

  constructor(private helperService: HelperService) {}

  isValidUrl(url: string): boolean {
    const pattern =
      /https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/(?:.*\/)?(?:(?:v|embed|video|t)\/)?([0-9]+)|([^@]+@[^@]+)/;
    return pattern.test(url);
  }

  async getVideoInfo(url: string): Promise<Video | null> {
    try {
      const video = await this.fetchFromApi(this.API_ENDPOINT, url);
      if (video) return video;
      throw new Error('API endpoints failed');
    } catch (error) {
      this.logger.error(`Error fetching TikTok video: ${error.message}`);
      return null;
    }
  }

  private async fetchFromApi(endpoint: string, url: string): Promise<Video> {
    const response = await this.helperService.get(
      `${endpoint}?url=${encodeURIComponent(url)}`,
    );

    if (response.data?.video?.noWatermark)
      return {
        downloadUrl: response.data.video.noWatermark,
        author: response.data.author?.name,
        likes: this.helperService.formatNumber(response.data.stats?.likeCount),
        comments: this.helperService.formatNumber(
          response.data.stats?.commentCount,
        ),
        shares: this.helperService.formatNumber(
          response.data.stats?.shareCount,
        ),
        views: this.helperService.formatNumber(response.data.stats?.playCount),
        description: response.data.title,
        duration: response.data.video?.duration,
      };

    throw new Error('Invalid response from API');
  }
}
