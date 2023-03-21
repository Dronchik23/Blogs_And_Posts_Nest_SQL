import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { BlogDBType, PaginationType } from '../types and models/types';
import { BlogsRepository } from './blog.repository';
import { BlogViewModel, UserViewModel } from '../types and models/models';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDBType>,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async findAllBlogs(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<PaginationType> {
    const allBlogs = await this.blogsRepository.findAllBlogs(
      searchNameTerm,
      pageSize,
      sortBy,
      sortDirection,
      pageNumber,
    );

    const totalCount = await this.blogsRepository.getBlogsCount(searchNameTerm);

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: allBlogs,
    };
  }

  async findBlogByBlogId(id: string): Promise<BlogViewModel | null> {
    return this.blogsRepository.findBlogByBlogId(id);
  }

  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
  ): Promise<BlogViewModel> {
    const newBlog = new this.blogsModel({
      _id: new ObjectId(),
      name,
      description,
      websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    });
    return await this.blogsRepository.createBlog(newBlog);
  }

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
