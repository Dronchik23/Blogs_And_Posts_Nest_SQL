import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { BlogDBType, PaginationType } from '../types and models/types';
import { BlogsRepository } from './blog.repository';
import { BlogViewModel } from '../types and models/models';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDBType>,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async findAllBlogs(
    searchNameTerm: any,
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
    const pagesCount = Math.ceil(totalCount / pageSize);
    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: allBlogs,
    };
  }

  async findBlogById(id: string): Promise<BlogViewModel | null> {
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
      createdAt: new Date(),
    });
    return await this.blogsRepository.createBlog(newBlog);
  }

  async updateBlogById(id: string, name: string, websiteUrl: string) {
    return await this.blogsRepository.updateBlogById(id, name, websiteUrl);
  }

  async deleteBlogByBlogId(id: string) {
    return await this.blogsRepository.deleteBlogByBlogId(id);
  }
}
