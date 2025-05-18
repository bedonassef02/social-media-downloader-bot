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
    const patterns = [
      /https?:\/\/(?:www\.|m\.)?tiktok\.com\/(?:@[\w.-]+\/video\/(\d+)|v\/(\d+)|\?shareId=(\d+)|@[\w.-]+\/(\d+))/i,
      /https?:\/\/(?:vm\.|vt\.)?tiktok\.com\/(\w+)/i,
      /https?:\/\/(?:www\.|m\.)?tiktok\.com\/t\/(\w+)/i,
      /https?:\/\/(?:www\.|m\.)?tiktok\.com\/@([\w.-]+)/i,
    ];

    return patterns.some((pattern) => pattern.test(url));
  }

  async getVideoInfo(url: string): Promise<Video | null> {
    try {
      const normalizedUrl = this.normalizeUrl(url);

      try {
        const video = await this.fetchFromApi(this.API_ENDPOINT, normalizedUrl);
        if (video) return video;
      } catch (error) {
        this.logger.warn(
          `Primary API failed: ${error.message}, trying backup...`,
        );
      }

      throw new Error('All API endpoints failed');
    } catch (error) {
      this.logger.error(`Error fetching TikTok video: ${error.message}`);
      return null;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        '_d',
        '_r',
        '_s',
        '_t',
      ].forEach((param) => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  private async fetchFromApi(endpoint: string, url: string): Promise<Video> {
    const response = await this.helperService.retry(() =>
      this.helperService.get(`${endpoint}?url=${encodeURIComponent(url)}`),
    );

    if (!response.data) throw new Error('Empty response from API');

    if (
      response.data.images &&
      Array.isArray(response.data.images) &&
      response.data.images.length > 0
    )
      return {
        downloadUrl: response.data.images[0].url,
        author: response.data.author?.name,
        likes: response.data.stats?.likeCount,
        comments: response.data.stats?.commentCount,
        shares: response.data.stats?.shareCount,
        views: response.data.stats?.playCount,
        description: response.data.title,
        duration: 0,
        isMultiItem: true,
        items: response.data.images.map((img) => ({
          url: img.url,
          type: 'image',
        })),
      };

    if (response.data?.video?.noWatermark)
      return {
        downloadUrl: response.data.video.noWatermark,
        author: response.data.author?.name,
        likes: response.data.stats?.likeCount,
        comments: response.data.stats?.commentCount,
        shares: response.data.stats?.shareCount,
        views: response.data.stats?.playCount,
        description: response.data.title,
        duration: response.data.video?.duration,
        isMultiItem: false,
      };

    throw new Error('Invalid response from API');
  }
}
