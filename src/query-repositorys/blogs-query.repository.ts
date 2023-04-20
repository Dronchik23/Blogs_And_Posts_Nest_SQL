import { Model } from 'mongoose';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import {
  BlogDBType,
  PaginationType,
  PostDBType,
} from '../types and models/types';
import { BlogViewModel, SABlogViewModel } from '../types and models/models';
import { BlogDocument } from '../types and models/schemas';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsQueryRepository {
  constructor(
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDocument>,
  ) {}

  private searchNameTermFilter(searchNameTerm: string | undefined | null): any {
    return {
      name: { $regex: searchNameTerm ?? '', $options: 'i' },
    };
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

  private fromBlogDBTypeBlogViewModelWithPaginationForSa(
    blogs: BlogDBType[],
  ): SABlogViewModel[] {
    return blogs.map((blog) => ({
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      blogOwnerInfo: blog.blogOwnerInfo,
      banInfo: blog.banInfo,
    }));
  }

  async findAllBlogsForBlogger(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    userId?: string,
  ): Promise<PaginationType> {
    const filter = {
      ...this.searchNameTermFilter(searchNameTerm),
      'blogOwnerInfo.userId': userId,
    };

    const blogs: BlogDBType[] = await this.blogsModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    const bannedBlogIds = await this.getBannedBlogsIds();

    const sortedBlogs = blogs.filter((blog) => {
      return !bannedBlogIds.includes(blog._id);
    });

    const totalCount = await this.blogsModel.countDocuments(sortedBlogs);

    const mappedBlogs =
      this.fromBlogDBTypeBlogViewModelWithPagination(sortedBlogs);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedBlogs,
    };
  }

  async findAllBlogs(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<PaginationType> {
    const filter = {
      ...this.searchNameTermFilter(searchNameTerm),
    };

    const blogs: BlogDBType[] = await this.blogsModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    const bannedBlogIds = await this.getBannedBlogsIds();

    const sortedBlogs = blogs.filter((blog) => {
      return !bannedBlogIds.includes(blog._id);
    });

    const totalCount = await this.blogsModel.countDocuments(sortedBlogs);

    const mappedBlogs =
      this.fromBlogDBTypeBlogViewModelWithPagination(sortedBlogs);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedBlogs,
    };
  }

  async findBlogByBlogId(id: string): Promise<BlogViewModel | null> {
    try {
      const blog = await this.blogsModel
        .findOne({
          _id: new ObjectId(id),
        })
        .exec();

      return blog ? this.fromBlogDBTypeBlogViewModel(blog) : null;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async findBlogByBlogIdAndUserId(blogId: string, userId: string) {
    try {
      return await this.blogsModel
        .findOne({
          _id: new ObjectId(blogId),
          'blogOwnerInfo.userId': userId,
        })
        .lean();
    } catch (error) {
      throw new ForbiddenException();
    }
  }

  async findAllBlogsForSA(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<PaginationType> {
    const filter = this.searchNameTermFilter(searchNameTerm);

    const blogs: BlogDBType[] = await this.blogsModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    const mappedBlogs =
      this.fromBlogDBTypeBlogViewModelWithPaginationForSa(blogs);

    const totalCount = await this.getBlogsCount(searchNameTerm);

    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedBlogs,
    };
  }

  async getBlogsCount(searchNameTerm?: string | null | undefined) {
    const filter = this.searchNameTermFilter(searchNameTerm);
    return this.blogsModel.countDocuments(filter);
  }

  async findBlogByBlogIdWithBlogDBType(blogId: string): Promise<BlogDBType> {
    try {
      return this.blogsModel
        .findOne({
          _id: new ObjectId(blogId),
        })
        .lean();
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async getBannedBlogsIds(): Promise<ObjectId[]> {
    const bannedBlogs: BlogDBType[] = await this.blogsModel
      .find({ 'banInfo.isBanned': true })
      .lean();

    const bannedBlogIds = bannedBlogs.map((u) => u._id);
    return bannedBlogIds;
  }
}
