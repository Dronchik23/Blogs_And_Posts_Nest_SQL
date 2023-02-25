import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { BlogDBType } from '../types and models/types';
import { BlogViewModel } from '../types and models/models';
import { BlogDocument } from '../types and models/schemas';

@Injectable()
export class BlogsRepository {
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
  ): Promise<any> {
    const filter = this.searchNameTermFilter(searchNameTerm);
    const totalCount = await this.getBlogsCount(searchNameTerm);
    const pagesCount = Math.ceil(totalCount / pageSize);

    const sortedBlogs = await this.blogsModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean()
      .exec();

    const items = this.fromBlogDBTypeBlogViewModelWithPagination(sortedBlogs);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async findBlogByBlogId(id: string): Promise<BlogViewModel | null> {
    const blog = await this.blogsModel
      .findOne({ _id: new ObjectId(id) })
      .exec();

    return blog ? this.fromBlogDBTypeBlogViewModel(blog) : null;
  }

  async createBlog(blogForSave: BlogDBType): Promise<BlogViewModel> {
    const newBlog = await this.blogsModel.create(blogForSave);
    return this.fromBlogDBTypeBlogViewModel(newBlog);
  }

  async updateBlogById(
    id: string,
    name: string,
    websiteUrl: string,
  ): Promise<BlogViewModel | boolean> {
    const result = await this.blogsModel.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          websiteUrl,
        },
      },
    );

    return result.matchedCount === 1;
  }

  async deleteBlogByBlogId(id: string): Promise<boolean> {
    const result = await this.blogsModel
      .deleteOne({ _id: new ObjectId(id) })
      .exec();

    return result.deletedCount === 1;
  }

  async getBlogsCount(searchNameTerm?: any) {
    const filter = this.searchNameTermFilter(searchNameTerm);
    return this.blogsModel.countDocuments(filter);
  }

  async deleteAllBlogs() {
    const result = await this.blogsModel.deleteMany({});
    return result.deletedCount;
  }
}
