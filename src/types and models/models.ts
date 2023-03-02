import { ExtendedLikesInfoType, LikeStatus } from './types';
import { IsString, Length, Matches } from 'class-validator';

export class BlogUpdateModel {
  name: string;
  websiteUrl: string;
}
export class BlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}
export class PaginationInputQueryModel {
  searchNameTerm?: string;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
  pageNumber: number;
  searchLoginTerm?: string;
  searchEmailTerm?: string;
}
export class PostCreateModel {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
}
export class PostUpdateModel {
  title: string;
  shortDescription: string;
  content: string;
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
export class UserCreateModel {
  login: string;
  email: string;
  password: string;
}
export class UserViewModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

export class CommentCreateModel {
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

export class BlogCreateModel {
  @IsString()
  @Length(1, 15)
  name: string;
  @IsString()
  @Length(1, 100)
  description: string;
  @IsString()
  @Length(0, 100)
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  websiteUrl: string;
}
