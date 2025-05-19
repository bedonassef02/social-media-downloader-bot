import { SubscriptionPlan } from '../../user/entities/user.entity';

export class CreateSubscriptionDto {
  telegramId: number;
  plan: SubscriptionPlan;
}
