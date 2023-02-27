import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  AccountDataType,
  CommentatorInfoType,
  EmailConfirmationType,
  ExtendedLikesInfoType,
  LikesInfoType,
  LikeStatus,
  PasswordRecoveryType,
} from './types';

export type AttemptDocument = Attempt & Document;

@Schema()
export class Attempt {
  @Prop()
  ip: string;

  @Prop()
  url: string;

  @Prop()
  attemptsTime: string;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);

export type LikeDocument = Like & Document;

@Schema()
export class Like {
  @Prop()
  parentId: ObjectId;

  @Prop()
  userId: ObjectId;

  @Prop()
  userLogin: string;

  @Prop()
  status: LikeStatus;

  @Prop()
  addedAt: string;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

export type CommentDocument = Comment & Document;

@Schema()
export class Comment {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  content: string;

  @Prop()
  commentatorInfo: CommentatorInfoType;

  @Prop()
  createdAt: string;

  @Prop()
  postId: string;

  @Prop()
  likesInfo: LikesInfoType;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

export type PostDocument = Post & Document;

@Schema()
export class Post {
  @Prop()
  _id: ObjectId;

  @Prop()
  title: string;

  @Prop()
  shortDescription: string;

  @Prop()
  content: string;

  @Prop()
  blogId: string;

  @Prop()
  blogName: string;

  @Prop()
  createdAt: string;

  @Prop()
  extendedLikesInfo: ExtendedLikesInfoType;
}

export const PostSchema = SchemaFactory.createForClass(Post);

export type TokenBlackListDocument = TokenBlackList & Document;

@Schema()
export class TokenBlackList {
  @Prop()
  refreshToken: string;
}

export const TokenBlackListSchema =
  SchemaFactory.createForClass(TokenBlackList);

export type BlogDocument = Blog & Document;

@Schema()
export class Blog {
  @Prop()
  _id: ObjectId;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  websiteUrl: string;

  @Prop()
  createdAt: string;

  @Prop()
  isMembership: boolean;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

export type DeviceDocument = Device & Document;

@Schema()
export class Device {
  @Prop()
  ip: string;

  @Prop()
  title: string;

  @Prop()
  lastActiveDate: string;

  @Prop()
  deviceId: string;

  @Prop()
  userId: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

export type UserDocument = User & Document;

@Schema({ _id: false, id: false })
export class AccountData {
  @Prop({ type: String, unique: true })
  login: string;
  @Prop({ type: String, unique: true })
  email: string;
  @Prop({ type: String })
  passwordHash: string;
  @Prop({ type: String })
  createdAt: string;
}

export const AccountDataSchema = SchemaFactory.createForClass(AccountData);

@Schema()
export class User {
  @Prop()
  _id: ObjectId;

  @Prop({ type: AccountDataSchema })
  accountData: AccountData;

  @Prop()
  emailConfirmation: EmailConfirmationType;

  @Prop()
  passwordRecovery: PasswordRecoveryType;

  @Prop()
  passwordSalt?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
