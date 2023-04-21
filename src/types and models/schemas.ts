import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  AccountDataType,
  BlogBanInfoType,
  BlogOwnerInfoType,
  CommentatorInfoType,
  EmailConfirmationType,
  ExtendedLikesInfoType,
  LikesInfoType,
  LikeStatus,
  PasswordRecoveryType,
  UserBanInfoType,
} from './types';

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
  _id: ObjectId;

  @Prop()
  content: string;

  @Prop()
  commentatorInfo: CommentatorInfoType;

  @Prop()
  createdAt: string;

  @Prop()
  postId: ObjectId;

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
  blogId: ObjectId;

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

  @Prop()
  blogOwnerInfo: BlogOwnerInfoType;

  @Prop()
  banInfo: BlogBanInfoType;
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
  deviceId: ObjectId;

  @Prop()
  userId: ObjectId;
}
export const DeviceSchema = SchemaFactory.createForClass(Device);

export type UserDocument = User & Document;
@Schema()
export class User {
  @Prop()
  _id: ObjectId;

  @Prop()
  accountData: AccountDataType;

  @Prop()
  emailConfirmation: EmailConfirmationType;

  @Prop()
  passwordRecovery: PasswordRecoveryType;
  @Prop()
  banInfo: UserBanInfoType;

  @Prop()
  passwordSalt?: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
