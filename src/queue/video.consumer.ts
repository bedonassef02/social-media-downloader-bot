import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from './queue.constants';

@Processor(QUEUE_NAMES.VIDEO_PROCESSING)
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {

  }
}
