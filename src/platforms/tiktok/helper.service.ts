import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HelperService {
  private readonly logger = new Logger(HelperService.name);

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
}
