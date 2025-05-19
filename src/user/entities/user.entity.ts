import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserType {
  NORMAL = 'normal',
  PREMIUM = 'premium',
}

export enum SubscriptionPlan {
  NONE = 'none',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  telegramId: number;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, enum: UserType, default: UserType.NORMAL })
  type: UserType;

  @Prop({ enum: SubscriptionPlan, default: SubscriptionPlan.NONE })
  subscriptionPlan: SubscriptionPlan;

  @Prop()
  subscriptionStartDate: Date;

  @Prop()
  subscriptionEndDate: Date;

  @Prop({ default: 0 })
  requestsThisHour: number;

  @Prop()
  lastRequestTime: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
