import { SubscriptionPlan } from './subscription-plan.enum';

export interface SubscriptionDetails {
  isActive: boolean;
  plan: SubscriptionPlan;
  endDate: Date | null;
  daysRemaining: number | null;
}
