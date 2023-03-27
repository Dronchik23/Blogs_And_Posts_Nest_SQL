import {
  BanInfoType,
  BanStatus,
  BlogOwnerInfoType,
  ExtendedLikesInfoType,
  LikeStatus,
} from './types';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  IsBlogExist,
  IsCodeAlreadyConfirmed,
  IsCommentExist,
  IsEmailAlreadyConfirmed,
  IsEmailAlreadyExist,
  IsLoginAlreadyExist,
} from '../validator';

export class BlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;

  blogOwnerInfo?: BlogOwnerInfoType;
}

export class PaginationInputQueryModel {
  constructor() {
    this.sortBy = 'createdAt';
    this.sortDirection = 'desc';
  }
  searchNameTerm?: string;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
  pageNumber: number;
  searchLoginTerm?: string;
  searchEmailTerm?: string;
  banStatus: BanStatus;
}
export class PostUpdateModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 30)
  @IsNotEmpty()
  title: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 100)
  @IsNotEmpty()
  shortDescription: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 1000)
  @IsNotEmpty()
  content: string;
  @IsString()
  @IsNotEmpty()
  @IsBlogExist()
  blogId: string;
}
export class PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoType;
}
export class UserViewModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  banInfo: BanInfoType;
}
export class CommentInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20, 300)
  @IsNotEmpty()
  content: string;
}
export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };
}
export class BlogInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 15)
  @IsNotEmpty()
  name: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 100)
  @IsNotEmpty()
  description: string;
  @IsString()
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  @Length(0, 100)
  websiteUrl: string;
}
export class PostInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 30)
  @IsNotEmpty()
  title: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 100)
  @IsNotEmpty()
  shortDescription: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 1000)
  @IsNotEmpty()
  content: string;
  @IsString()
  @IsNotEmpty()
  @IsBlogExist()
  blogId: string;
}
export class BlogPostInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 30)
  @IsNotEmpty()
  title: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 100)
  @IsNotEmpty()
  shortDescription: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 1000)
  @IsNotEmpty()
  content: string;
}
export class BlogUpdateModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 15)
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsUrl()
  @Length(1, 1000)
  @IsNotEmpty()
  websiteUrl: string;
}
export class LoginInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @IsNotEmpty()
  loginOrEmail: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @IsNotEmpty()
  password: string;
}
export class UserInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(3, 10)
  @IsNotEmpty()
  @IsLoginAlreadyExist()
  login: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(6, 20)
  @IsNotEmpty()
  password: string;

  @IsString()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @IsNotEmpty()
  @IsEmailAlreadyExist()
  email: string;
}
export class LikeInputModel {
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
export class RegistrationEmailResendingModel {
  //@IsEmail()
  @IsEmailAlreadyConfirmed()
  email: string;
}
export class CodeInputModel {
  @IsString()
  @IsUUID()
  @IsCodeAlreadyConfirmed()
  code: string;
}
export class CommentUpdateModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20, 300)
  @IsNotEmpty()
  content: string;
}
export class BunUserInputModel {
  @IsBoolean()
  isBanned: boolean;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20)
  banReason: string;
}
