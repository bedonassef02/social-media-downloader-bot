import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class HelperService {
  private readonly logger = new Logger(HelperService.name);

  async get(url: string, config?: AxiosRequestConfig) {
    return axios.get(url, config);
  }

  async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 300,
  ): Promise<T> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        this.logger.warn(`Retry attempt ${retries}/${maxRetries}`);

        if (retries >= maxRetries) throw error;

        await new Promise((resolve) => setTimeout(resolve, delay * 2));
      }
    }

    throw new Error('Exceeded maximum retries');
  }
}
