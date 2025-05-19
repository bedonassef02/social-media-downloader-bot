import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
