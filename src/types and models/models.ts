import {
  BlogOwnerInfoType,
  ExtendedLikesInfoType,
  LikeStatus,
  PostInfoType,
  UserBanInfoType,
} from './types';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  IsBlogExist,
  IsCodeAlreadyConfirmed,
  IsEmailAlreadyConfirmed,
  IsEmailAlreadyExist,
  IsLoginAlreadyExist,
} from '../validator';
import { Transform, Type } from 'class-transformer';
import { Optional } from '@nestjs/common';

export class DefaultPaginationData {
  @Type(() => Number)
  @IsOptional()
  pageSize = 10;
  @IsOptional()
  @IsString()
  sortBy = 'createdAt';
  @IsOptional()
  @IsString()
  @Transform((params) => {
    return params.value === 'asc' ? 'asc' : 'desc';
  })
  sortDirection: 'asc' | 'desc' = 'desc';
  @IsOptional()
  @Type(() => Number)
  pageNumber: number | null = 1;
}
export class UserPaginationQueryModel extends DefaultPaginationData {
  @IsOptional()
  @IsString()
  searchLoginTerm: string | null = null;

  @IsOptional()
  @IsString()
  searchEmailTerm: string | null = null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === 'banned') return true;
    if (value === 'notBanned') return false;
    if (value === 'all') return null;
    return null;
  })
  banStatus: string = null;
}
export class BlogPaginationQueryModel extends DefaultPaginationData {
  @IsOptional()
  @IsString()
  searchNameTerm: string | null = null;
}
export class CommentPaginationQueryModel extends DefaultPaginationData {
  @IsOptional()
  @IsString()
  searchLoginTerm: string | null = null;
}
export class PostPaginationQueryModel extends DefaultPaginationData {}

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
}
export class BlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo?: BlogOwnerInfoType;
}
export class SABlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo: BlogOwnerInfoType;
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
  banInfo: UserBanInfoType;
}
export class BloggerUserViewModel {
  id: string;
  login: string;
  banInfo: UserBanInfoType;
}
export class CommentInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20, 300)
  @IsNotEmpty()
  content: string;
}
export class BloggerCommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  postInfo: PostInfoType;
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };
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
  @Matches(/^(?!\s*$).+/)
  @Length(1, 500)
  @IsNotEmpty()
  description: string;
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
export class BanUserInputModel {
  @IsBoolean()
  isBanned: boolean;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20)
  banReason: string;
}
export class BanBlogInputModel {
  @IsBoolean()
  isBanned: boolean;
}
export class NewPasswordInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(6, 20)
  newPassword: string;
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;
}
export class BloggerBanUserInputModel {
  @IsBoolean()
  isBanned: boolean;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20)
  banReason: string;
  @IsString()
  @IsNotEmpty()
  @IsBlogExist()
  blogId: string;
}
