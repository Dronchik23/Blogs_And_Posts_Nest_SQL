import { ObjectId } from 'mongodb';
import {
  BlogViewModel,
  CommentViewModel,
  PostViewModel,
  UserViewModel,
} from './models';

// types
export type PaginationType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items:
    | BlogViewModel[]
    | PostViewModel[]
    | UserViewModel[]
    | CommentViewModel[]
    | DeviceDBType[];
};
export type TokenType = {
  accessToken: string;
  refreshToken: string;
};
export type JWTPayloadType = {
  userId: string;
  deviceId: string;
  iat: number;
};

//enums
export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}
export enum BanStatus {
  banned = 'banned',
  notBanned = 'notBanned',
  all = 'all',
}
// classes
export class BlogDBType {
  constructor(
    public _id: ObjectId,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
    public isMembership: boolean,
    public blogOwnerInfo: BlogOwnerInfoType,
    public banInfo: BanBlogInfoType,
  ) {}
}
export class PostDBType {
  constructor(
    public _id: ObjectId,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public createdAt: string,
    public extendedLikesInfo: ExtendedLikesInfoType,
  ) {}
}
export class UserDBType {
  constructor(
    public _id: ObjectId,
    public accountData: AccountDataType,
    public emailConfirmation: EmailConfirmationType,
    public passwordRecovery: PasswordRecoveryType,
    public banInfo: BanInfoType,
    public passwordSalt?: string,
  ) {}
}
export class BanInfoType {
  isBanned: boolean;
  banDate: string;
  banReason: string;
  blogId?: string;

  constructor(isBanned = false, banDate = null, banReason = null) {
    this.isBanned = isBanned;
    this.banDate = banDate;
    this.banReason = banReason;
  }
}
export class BanBlogInfoType {
  isBanned: boolean;
  banDate: string;
  constructor(isBanned = false, banDate = null) {
    this.isBanned = isBanned;
    this.banDate = banDate;
  }
}
export class CommentDBType {
  constructor(
    public _id: ObjectId,
    public content: string,
    public commentatorInfo: CommentatorInfoType,
    public createdAt: string,
    public postId: string,
    public likesInfo: LikesInfoType,
  ) {}
}
export class LikeDBType {
  constructor(
    public parentId: ObjectId,
    public userId: ObjectId,
    public userLogin: string,
    public status: LikeStatus,
    public addedAt: string,
  ) {}
}
export class AccountDataType {
  constructor(
    public login: string,
    public email: string,
    public passwordHash: string,
    public createdAt: string,
  ) {}
}
export class EmailConfirmationType {
  constructor(
    public confirmationCode: string,
    public expirationDate: Date,
    public isConfirmed: boolean,
  ) {}
}
export class LikesInfoType {
  constructor(
    public likesCount: number = 0,
    public dislikesCount: number = 0,
    public myStatus: LikeStatus = LikeStatus.None,
  ) {}
}
export class NewestLikesType {
  constructor(
    public addedAt: string,
    public userId: string,
    public login: string,
  ) {}
}
export class ExtendedLikesInfoType {
  constructor(
    public likesCount: number = 0,
    public dislikesCount: number = 0,
    public myStatus: LikeStatus = LikeStatus.None,
    public newestLikes: NewestLikesType[],
  ) {}
}
export class PasswordRecoveryType {
  constructor(
    public recoveryCode: string | null,
    public isConfirmed: boolean,
  ) {}
}
export class DeviceDBType {
  constructor(
    public ip: string,
    public title: string,
    public lastActiveDate: string,
    public deviceId: string,
    public userId: string,
  ) {}
}
export class CommentatorInfoType {
  constructor(public userId: ObjectId, public userLogin: string) {}
}
export class BearerJwtPayloadType {
  iat: number;
  exp: number;
  userId: string;
}
export class BlogOwnerInfoType {
  userId: string;
  userLogin: string;
}
