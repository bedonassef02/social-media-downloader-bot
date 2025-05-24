import { Injectable, Logger } from '@nestjs/common';
import { SUBSCRIPTION_DURATIONS } from './subscription.constants';
import { SubscriptionDto } from './dto/subscription.dto';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { UserType } from '../user/types/user.type';
import { SubscriptionDetails } from './types/subscription-details.interface';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly userService: UserService) {}

  async create(subscriptionDto: SubscriptionDto): Promise<User> {
    const { telegramId, plan } = subscriptionDto;
    const user = await this.userService.findOrCreate(telegramId);

    const now = new Date();
    const duration = SUBSCRIPTION_DURATIONS[plan.toUpperCase()];

    if (!duration) throw new Error('Invalid subscription plan');

    user.type = UserType.PREMIUM;
    user.subscriptionPlan = plan;
    user.subscriptionStartDate = now;
    user.subscriptionEndDate = new Date(now.getTime() + duration);

    this.logger.log(`Created ${plan} subscription for user ${telegramId}`);

    await this.userService.clearUserCache(telegramId);
    return user.save();
  }

  async findOne(telegramId: number): Promise<SubscriptionDetails> {
    const user = await this.userService.findOrCreate(telegramId);
    return {
      isActive: this.isActive(user),
      plan: user.subscriptionPlan,
      endDate: user.subscriptionEndDate || null,
      daysRemaining: this.calculateDaysRemaining(user.subscriptionEndDate),
    };
  }

  private isActive(user: User): boolean {
    return (
      user.type === UserType.PREMIUM &&
      user.subscriptionEndDate &&
      new Date() <= user.subscriptionEndDate
    );
  }

  private calculateDaysRemaining(endDate: Date | null): number | null {
    if (!endDate) return null;

    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(timeDiff / (24 * 60 * 60 * 1000)));
  }
}
