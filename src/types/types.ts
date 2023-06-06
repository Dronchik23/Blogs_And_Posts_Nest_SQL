import {
  BloggerCommentViewModel,
  BloggerUserViewModel,
  BlogViewModel,
  CommentViewModel,
  GamePlayerProgressViewModel,
  PostViewModel,
  UserViewModel,
} from '../models/models';

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
    | BloggerCommentViewModel[]
    | DeviceDBType[]
    | BloggerUserViewModel[];
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
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
export enum BanStatus {
  banned = 'banned',
  notBanned = 'notBanned',
  all = 'all',
}
export enum GameStatuses {
  PendingSecondPlayer = 'PendingSecondPlayer',
  Active = 'Active',
  Finished = 'Finished',
}
export enum AnswerStatuses {
  Correct = 'Correct',
  Incorrect = 'Incorrect',
}
// classes
export class BlogDBType {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
    public isMembership: boolean,
    public blogOwnerId: string,
    public blogOwnerLogin: string,
    public isBanned: boolean,
    public banDate: string | null,
  ) {}
}
export class PostDBType {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public createdAt: string,
    public likesCount: number = 0,
    public dislikesCount: number = 0,
    public myStatus: LikeStatus = LikeStatus.None,
    public newestLikes?: NewestLikesType[],
    public extendedLikesInfo?: ExtendedLikesInfoType,
  ) {}
}
export class CommentDBType {
  constructor(
    public id: string,
    public content: string,
    public commentatorId: string,
    public commentatorLogin: string,
    public createdAt: string,
    public likesCount: number = 0,
    public dislikesCount: number = 0,
    public myStatus: LikeStatus = LikeStatus.None,
    public postId: string,
    public postTitle: string,
    public blogId: string,
    public blogName: string,
  ) {}
}
export class UserDBType {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public passwordHash: string,
    public createdAt: string,
    public confirmationCode: string,
    public confirmationExpirationDate: string,
    public isEmailConfirmed: boolean,
    public recoveryCode: string | null,
    public isRecoveryConfirmed: boolean,
    public isBanned: boolean,
    public banDate: string,
    public banReason: string,
    public blogId?: string,
    public GameStatuses?: GameStatuses,
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
export class PasswordRecoveryType {
  constructor(
    public recoveryCode: string | null,
    public isConfirmed: boolean,
  ) {}
}
export class UserBanInfoType {
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
export class BlogBanInfoType {
  isBanned: boolean;
  banDate: string | null;
  constructor(isBanned = false, banDate = null) {
    this.isBanned = isBanned;
    this.banDate = banDate;
  }
}
export class PostInfoType {
  constructor(
    public id: string,
    public title: string,
    public blogId: string,
    public blogName: string,
  ) {}
}
export class LikeDBType {
  constructor(
    public userId: string,
    public id: string,
    public login: string,
    public status: LikeStatus = LikeStatus.None,
    public addedAt: string,
    public postId?: string,
    public commentId?: string,
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
  constructor(public userId: string, public userLogin: string) {}
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
export class QuestionDBType {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
export class GameDBType {
  id: string;
  questions: any;
  status: GameStatuses;
  pairCreatedDate: string;
  startGameDate: string;
  finishGameDate: string;
  firstPlayerProgress?: GamePlayerProgressViewModel;
  secondPlayerProgress?: GamePlayerProgressViewModel;
}
/*export class GamePlayerProgressType {
  answer: AnswerType,
  player: string
  score: number
}*/
