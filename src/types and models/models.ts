import { ExtendedLikesInfoType, LikeStatus } from './types';

export type BlogCreateModel = {
  name: string;
  description: string;
  websiteUrl: string;
};
export type BlogUpdateModel = {
  name: string;
  websiteUrl: string;
};
export type BlogViewModel = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
};
export type PaginationInputQueryModel = {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
  searchNameTerm?: string;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
};
export type PostCreateModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
};
export type PostUpdateModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
};
export type PostViewModel = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: ExtendedLikesInfoType;
};
export type UserCreateModel = {
  login: string;
  email: string;
  password: string;
};
export type UserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
};

export type CommentCreateModel = {
  content: string;
};
export type CommentViewModel = {
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
};
