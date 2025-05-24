import { SubscriptionPlan } from '../types/subscription-plan.enum';

export class SubscriptionDto {
  telegramId: number;
  plan: SubscriptionPlan;
}
