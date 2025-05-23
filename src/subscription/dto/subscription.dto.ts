import { SubscriptionPlan } from '../types/subscription.plan';

export class CreateSubscriptionDto {
  telegramId: number;
  plan: SubscriptionPlan;
}
