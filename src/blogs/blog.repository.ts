import mongoose, { Model } from 'mongoose';
import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDBType } from '../types and models/types';
import { BlogViewModel, UserViewModel } from '../types and models/models';
import { BlogDocument } from '../types and models/schemas';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsRepository {
  constructor(
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDocument>,
  ) {}

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

  async createBlog(blogForSave: BlogDBType): Promise<BlogViewModel> {
    const newBlog = await this.blogsModel.create(blogForSave);
    return this.fromBlogDBTypeBlogViewModel(newBlog);
  }

  async updateBlogByBlogId(
    id: string,
    name: string,
    websiteUrl: string,
  ): Promise<boolean> {
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
