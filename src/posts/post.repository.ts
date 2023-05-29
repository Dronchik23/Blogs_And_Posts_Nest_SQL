import {
  BlogPostInputModel,
  BlogViewModel,
  PostUpdateModel,
  PostViewModel,
} from '../models/models';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Posts } from '../entities/posts.entity';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Posts) private readonly postModel: Repository<Posts>,
  ) {}

  async createPost(
    createPostDTO: BlogPostInputModel,
    blog: BlogViewModel,
  ): Promise<PostViewModel> {
    const newPost = Posts.create(createPostDTO, blog);
    const createdPost = await this.postModel.save(newPost);
    const a = new PostViewModel(createdPost);
    return a;
  }

  async updatePostByPostId(
    postId: string,
    postUpdateDTO: PostUpdateModel,
  ): Promise<boolean> {
    const result = await this.postModel.update(postId, {
      title: postUpdateDTO.title,
      content: postUpdateDTO.content,
      shortDescription: postUpdateDTO.shortDescription,
    });
    return result.affected > 0;
  }

  async deletePostByPostId(postId: string): Promise<boolean> {
    const result = await this.postModel.delete({ id: postId });
    return result.affected > 0;
  }

  async deleteAllPosts() {
    return await this.postModel.delete({});
  }
}
