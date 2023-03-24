import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogDBType } from '../types and models/types';
import { BlogsRepository } from './blog.repository';
import { UserViewModel } from '../types and models/models';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsService {
  constructor(
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDBType>,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async updateBlogById(id: string, name: string, websiteUrl: string) {
    return await this.blogsRepository.updateBlogById(id, name, websiteUrl);
  }

  async deleteBlogByBlogId(id: string): Promise<boolean> {
    return await this.blogsRepository.deleteBlogByBlogId(id);
  }

  async bindBlogToUser(blogId: string, user: UserViewModel): Promise<boolean> {
    return await this.blogsRepository.bindBlogToUser(blogId, user);
  }
}
