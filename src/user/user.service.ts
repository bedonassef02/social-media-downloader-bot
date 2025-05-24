import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UserType } from './types/user.type';
import { SubscriptionPlan } from '../subscription/types/subscription-plan.enum';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { UserRequestCount } from './types/user-request-count.type';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findOrCreate(
    telegramId: number,
    username: string = null,
  ): Promise<User> {
    const cacheKey = `user:${telegramId}`;
    let user: User = await this.cacheManager.get<User>(cacheKey);
    if (user) return user;

    user = await this.userModel.findOne({ telegramId });

    if (!user) {
      this.logger.log(`Creating new user: ${telegramId}`);
      user = await this.userModel.create({
        telegramId,
        username,
        type: UserType.NORMAL,
        subscriptionPlan: SubscriptionPlan.NONE,
      });
    }

    await this.cacheManager.set(cacheKey, user, 300 * 1000);
    return user;
  }

  async canMakeRequest(user: User): Promise<boolean> {
    if (this.hasActiveSubscription(user)) return true;

    return (await this.getRequestCount(user.telegramId)) < 3;
  }

  async updateRequests(user: User): Promise<number> {
    const requestKey = `requests:${user.telegramId}`;
    const now = Date.now();
    const hourStart = Math.floor(now / (1000 * 60 * 60)) * (1000 * 60 * 60);

    let requestData: UserRequestCount = await this.cacheManager.get(requestKey);

    if (!requestData || requestData.lastReset !== hourStart)
      requestData = {
        count: 1,
        lastReset: hourStart,
      };
    else requestData.count += 1;

    await this.cacheManager.set(requestKey, requestData, 3600 * 1000);
    return requestData.count;
  }

  async getRequestCount(telegramId: number): Promise<number> {
    const requestKey = `requests:${telegramId}`;
    const now = Date.now();
    const hourStart = Math.floor(now / (1000 * 60 * 60)) * (1000 * 60 * 60);

    const requestData: UserRequestCount =
      await this.cacheManager.get(requestKey);

    if (!requestData || requestData.lastReset !== hourStart) return 0;

    return requestData.count;
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

    const cacheKey = `user:${user.telegramId}`;
    await this.cacheManager.set(cacheKey, user, 300 * 1000);
  }

  async clearUserCache(telegramId: number): Promise<void> {
    await this.cacheManager.del(`user:${telegramId}`);
  }
}
