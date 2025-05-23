import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UserType } from './types/user.type';
import { SubscriptionPlan } from '../subscription/types/subscription.plan';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findOrCreate(
    telegramId: number,
    username: string = null,
  ): Promise<User> {
    let user = await this.userModel.findOne({ telegramId });

    if (!user) {
      this.logger.log(`Creating new user with telegramId: ${telegramId}`);
      user = await this.userModel.create({
        telegramId,
        username,
        type: UserType.NORMAL,
        subscriptionPlan: SubscriptionPlan.NONE,
        requestsThisHour: 0,
        lastRequestTime: new Date(),
      });
    }

    return user;
  }

  async updateRequests(user: User): Promise<User> {
    const now = new Date();

    // Reset counter if an hour has passed
    if (
      user.lastRequestTime &&
      now.getTime() - user.lastRequestTime.getTime() > 3600000
    )
      user.requestsThisHour = 1;
    else user.requestsThisHour += 1;

    user.lastRequestTime = now;
    return user.save();
  }

  async canMakeRequest(user: User): Promise<boolean> {
    if (this.hasActiveSubscription(user)) return true;

    const now = new Date();

    // Reset counter if an hour has passed
    if (
      user.lastRequestTime &&
      now.getTime() - user.lastRequestTime.getTime() > 3600000
    )
      return true;

    return user.requestsThisHour < 3;
  }

  hasActiveSubscription(user: User): boolean {
    if (user.type !== UserType.PREMIUM) return false;
    if (!user.subscriptionEndDate) return false;

    const now = new Date();

    if (now > user.subscriptionEndDate) {
      this.handleExpiredSubscription(user);
      return false;
    }

    return true;
  }

  private async handleExpiredSubscription(user: User): Promise<void> {
    user.type = UserType.NORMAL;
    user.subscriptionPlan = SubscriptionPlan.NONE;

    this.logger.log(`Subscription expired for user ${user.telegramId}`);

    await user.save();
  }
}
