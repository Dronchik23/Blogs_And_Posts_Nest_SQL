import { Injectable, Scope } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import {
  ExtendedLikesInfoType,
  LikeStatus,
  PostDBType,
} from '../types and models/types';
import { BlogViewModel, PostViewModel } from '../types and models/models';
import { PostsRepository } from './post.repository';
import { BlogsQueryRepository } from '../query-repositorys/blogs-query.repository';

@Injectable({ scope: Scope.DEFAULT })
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<PostViewModel | null> {
    const blog: BlogViewModel | null =
      await this.blogsQueryRepository.findBlogByBlogId(blogId);

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

    if (isUpdated) {
      return true;
    } else {
      return false;
    }
  }

  async deletePostById(id: string): Promise<boolean> {
    return await this.postsRepository.deletePostById(id);
  }
}
