import { LikeStatus, PostDBType } from '../types and models/types';
import {
  BlogPostInputModel,
  BlogViewModel,
  PostUpdateModel,
  PostViewModel,
} from '../types and models/models';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Blogs } from '../entities/blogs.entity';
import { Posts } from '../entities/posts.entity';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Posts) private readonly postModel: Repository<Posts>,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  async createPost(
    createPostDTO: BlogPostInputModel,
    blog: BlogViewModel,
  ): Promise<PostViewModel> {
    const newPost = Posts.create(createPostDTO, blog);
    const createdPost = await this.postModel.save(newPost);
    return new PostViewModel(createdPost);
  }

  async updatePostByPostId(
    postId: string,
    postUpdateDTO: PostUpdateModel,
  ): Promise<boolean> {
    const post = await this.postsQueryRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException();
    }
    post.title = postUpdateDTO.title;
    post.content = postUpdateDTO.content;
    post.shortDescription = postUpdateDTO.shortDescription;
    await this.postModel.save(post);
    return true;
  }

  async deletePostByPostId(postId: string): Promise<boolean> {
    const result = await this.postModel.delete(postId);
    return result.affected > 0;
  }

  async deleteAllPosts(): Promise<any> {
    return await this.dataSource.query(`DELETE FROM posts CASCADE;`);
  }
}
