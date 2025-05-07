import { Video } from './video.interface';

export interface PlatformService {
  readonly name: string;
  isValidUrl(url: string): boolean;
  getVideoInfo(url: string): Promise<Video | null>;
}
