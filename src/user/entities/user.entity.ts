import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserType } from '../types/user.type';
import { SubscriptionPlan } from '../../subscription/types/subscription.plan';

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
