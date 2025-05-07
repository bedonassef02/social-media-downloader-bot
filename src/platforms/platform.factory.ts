import { Injectable, Logger } from '@nestjs/common';
import { PlatformService } from './platform.interface';

@Injectable()
export class PlatformFactory {
  private readonly logger = new Logger(PlatformFactory.name);
  private platformServices: PlatformService[] = [];

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

    return null;
  }
}
