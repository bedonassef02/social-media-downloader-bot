import { Injectable, Logger } from '@nestjs/common';
import { SUBSCRIPTION_DURATIONS } from './subscription.constants';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import { UserService } from '../user/user.service';
import { User } from "../user/entities/user.entity";
import { SubscriptionPlan } from "./types/subscription.plan";
import { UserType } from "../user/types/user.type";

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly userService: UserService) {}

  async createSubscription(
    subscriptionDto: CreateSubscriptionDto,
  ): Promise<User> {
    const { telegramId, plan } = subscriptionDto;
    const user = await this.userService.findOrCreate(telegramId);

    const now = new Date();
    let subscriptionEndDate: Date;

    // Calculate subscription end date based on the plan
    if (plan === SubscriptionPlan.MONTHLY)
      subscriptionEndDate = new Date(
        now.getTime() + SUBSCRIPTION_DURATIONS.MONTHLY,
      );
    else if (plan === SubscriptionPlan.YEARLY)
      subscriptionEndDate = new Date(
        now.getTime() + SUBSCRIPTION_DURATIONS.YEARLY,
      );
    else throw new Error('Invalid subscription plan');

    // Update user with subscription details
    user.type = UserType.PREMIUM;
    user.subscriptionPlan = plan;
    user.subscriptionStartDate = now;
    user.subscriptionEndDate = subscriptionEndDate;

    this.logger.log(
      `Created ${plan} subscription for user ${telegramId} until ${subscriptionEndDate.toISOString()}`,
    );

    return user.save();
  }

  async getSubscriptionDetails(telegramId: number): Promise<{
    isActive: boolean;
    plan: SubscriptionPlan;
    endDate: Date | null;
    daysRemaining: number | null;
  }> {
    const user = await this.userService.findOrCreate(telegramId);

    const now = new Date();
    const isActive = this.isSubscriptionActive(user);
    const daysRemaining = user.subscriptionEndDate
      ? Math.max(
          0,
          Math.ceil(
            (user.subscriptionEndDate.getTime() - now.getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : null;

    return {
      isActive,
      plan: user.subscriptionPlan,
      endDate: user.subscriptionEndDate || null,
      daysRemaining,
    };
  }

  private isSubscriptionActive(user: User): boolean {
    if (user.type !== UserType.PREMIUM) return false;
    if (!user.subscriptionEndDate) return false;

    const now = new Date();
    return now <= user.subscriptionEndDate;
  }
}
