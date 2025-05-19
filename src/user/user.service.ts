import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserType } from './entities/user.entity';

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
      user = new this.userModel({
        telegramId,
        username,
        type: UserType.NORMAL,
        requestsThisHour: 0,
        lastRequestTime: new Date(),
      });
      await user.save();
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
    if (user.type === UserType.PREMIUM) return true;

    const now = new Date();

    // Reset counter if an hour has passed
    if (
      user.lastRequestTime &&
      now.getTime() - user.lastRequestTime.getTime() > 3600000
    )
      return true;

    return user.requestsThisHour < 3;
  }
}
