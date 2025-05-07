import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class HelperService {
  private readonly logger = new Logger(HelperService.name);
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'VideoDownloaderBot/1.0',
      },
    });
  }

  createHttpClient(config?: AxiosRequestConfig): AxiosInstance {
    return axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'VideoDownloaderBot/1.0',
      },
      ...config,
    });
  }

  async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 300,
  ): Promise<T> {
    let retries = 0;
    let delay = initialDelay;

    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        this.logger.warn(`Retry attempt ${retries}/${maxRetries}`);

        if (retries >= maxRetries) {
          this.logger.error('Maximum retries reached');
          throw error;
        }

        delay = delay * 2 + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Exceeded maximum retries');
  }

  async get(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.retry(() => this.httpClient.get(url, config));
  }

  async post(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<any> {
    return this.retry(() => this.httpClient.post(url, data, config));
  }

  formatNumber(num?: number | string): string | undefined {
    if (num === undefined) return undefined;

    const parsedNum = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(parsedNum)) return undefined;

    if (parsedNum >= 1000000) {
      return `${(parsedNum / 1000000).toFixed(1)}M`;
    } else if (parsedNum >= 1000) {
      return `${(parsedNum / 1000).toFixed(1)}K`;
    }
    return parsedNum.toString();
  }
}
