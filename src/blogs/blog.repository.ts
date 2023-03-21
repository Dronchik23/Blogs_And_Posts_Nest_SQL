import mongoose, { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { BlogDBType } from '../types and models/types';
import { BlogViewModel, UserViewModel } from '../types and models/models';
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
  ): Promise<BlogViewModel[]> {
    const filter = this.searchNameTermFilter(searchNameTerm);

    const sortedBlogs = await this.blogsModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    return this.fromBlogDBTypeBlogViewModelWithPagination(sortedBlogs);
  }

  async findBlogByBlogId(id: string): Promise<BlogViewModel | null> {
    const blog = await this.blogsModel
      .findOne({
        _id: new ObjectId(id),
      })
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
      {
        _id: new mongoose.Types.ObjectId(id),
      },
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
    try {
      const result = await this.blogsModel.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (result.deletedCount === 1) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  async getBlogsCount(searchNameTerm?: string | null | undefined) {
    const filter = this.searchNameTermFilter(searchNameTerm);
    return this.blogsModel.countDocuments(filter);
  }

  async deleteAllBlogs() {
    const result = await this.blogsModel.deleteMany({});
    return result.deletedCount;
  }
  async bindBlogToUser(blogId: string, user: UserViewModel): Promise<boolean> {
    debugger;
    const isBind: BlogDBType = await this.blogsModel
      .findOne({
        _id: new mongoose.Types.ObjectId(blogId),
        'blogOwnerInfo.userId': user.id,
      })
      .lean();
    if (!isBind) {
      return;
    }
    const result = await this.blogsModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(blogId),
      },
      {
        $set: {
          blogsOwnerInfo: {
            userId: user.id,
            userLogin: user.login,
          },
        },
      },
    );

    return result.matchedCount === 1;
  }
}
