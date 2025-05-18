import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlatformService } from './platform.interface';
import { TikTokService } from './tiktok/tiktok.service';

@Injectable()
export class PlatformFactory implements OnModuleInit {
  private readonly logger = new Logger(PlatformFactory.name);
  private platformServices: PlatformService[] = [];

  constructor(private tiktokService: TikTokService) {}

  onModuleInit() {
    this.registerPlatform(this.tiktokService);
  }

  registerPlatform(platform: PlatformService): PlatformFactory {
    this.platformServices.push(platform);
    this.logger.log(`Registered platform: ${platform.name}`);
    return this;
  }

  getSupportedPlatforms(): string[] {
    return this.platformServices.map((platform) => platform.name);
  }

  getPlatformService(url: string): PlatformService | null {
    for (const platformService of this.platformServices)
      if (platformService.isValidUrl(url)) return platformService;

    this.logger.warn(`No supported platform found for URL: ${url}`);
    return null;
  }
}
