import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import {
  ExtendedLikesInfoType,
  LikeStatus,
  PaginationType,
  PostDBType,
} from '../types and models/types';
import { BlogViewModel, PostViewModel } from '../types and models/models';
import { PostsRepository } from './post.repository';
import { BlogsService } from '../blogs/blog.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsRepository: PostsRepository,
  ) {}

  async findAllPosts(
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    userId?: string,
  ): Promise<PaginationType> {
    const allPosts = await this.postsRepository.findAllPosts(
      pageSize,
      sortBy,
      sortDirection,
      pageNumber,
      userId,
    );
    const totalCount = await this.postsRepository.getAllPostCount();

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: allPosts,
    };
  }

  async findPostByPostId(
    id: string,
    userId?: string,
  ): Promise<PostViewModel | null> {
    return await this.postsRepository.findPostById(id, userId);
  }

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<PostViewModel | null> {
    const blog: BlogViewModel | null = await this.blogsService.findBlogByBlogId(
      blogId,
    );

    if (!blog) {
      return null;
    }

    const newPost = new PostDBType(
      new ObjectId(),
      title,
      shortDescription,
      content,
      blogId,
      blog.name,
      new Date().toISOString(),
      new ExtendedLikesInfoType(0, 0, LikeStatus.None, []),
    );

    return await this.postsRepository.createPost(newPost);
  }

  async updatePostById(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean> {
    const isUpdated = this.postsRepository.updatePostById(
      id,
      title,
      shortDescription,
      content,
      blogId,
    );
    console.log('isUpdated service', isUpdated);
    if (isUpdated) {
      return true;
    } else {
      return false;
    }
  }

  async deletePostById(id: string): Promise<boolean> {
    return await this.postsRepository.deletePostById(id);
  }

  async findPostsByBlogId(
    blogId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    userId?: string,
  ): Promise<PaginationType> {
    const allPosts = await this.postsRepository.findPostsByBlogId(
      blogId,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      userId,
    );

    const totalCount = await this.postsRepository.getPostsCount({ blogId });

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: allPosts,
    };
  }
}
