import { Model } from 'mongoose';
import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { BlogDBType, PaginationType } from '../types and models/types';
import { BlogViewModel } from '../types and models/models';
import { BlogDocument } from '../types and models/schemas';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsQueryRepository {
  constructor(
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDocument>,
  ) {}

  private searchNameTermFilter(searchNameTerm: string | undefined | null): any {
    return { name: { $regex: searchNameTerm ?? '', $options: 'i' } };
  }

  private fromBlogDBTypeBlogViewModel(blog: BlogDBType): BlogViewModel {
    return {
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  private fromBlogDBTypeBlogViewModelWithPagination(
    blogs: BlogDBType[],
  ): BlogViewModel[] {
    return blogs.map((blog) => ({
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    }));
  }

  async findAllBlogs(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<PaginationType> {
    const filter = this.searchNameTermFilter(searchNameTerm);

    const blogs = await this.blogsModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    const mappedBlogs = this.fromBlogDBTypeBlogViewModelWithPagination(blogs);

    const totalCount = await this.getBlogsCount(searchNameTerm);

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedBlogs,
    };
  }

  async findBlogByBlogId(id: string): Promise<BlogViewModel | null> {
    const blog = await this.blogsModel
      .findOne({
        _id: new ObjectId(id),
      })
      .exec();

    return blog ? this.fromBlogDBTypeBlogViewModel(blog) : null;
  }

  async getBlogsCount(searchNameTerm?: string | null | undefined) {
    const filter = this.searchNameTermFilter(searchNameTerm);
    return this.blogsModel.countDocuments(filter);
  }
}
