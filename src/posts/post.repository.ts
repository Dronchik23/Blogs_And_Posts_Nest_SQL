import { Filter } from 'mongodb';
import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
import {
  LikeDbType,
  LikeStatus,
  NewestLikesType,
  PostDBType,
} from '../types and models/types';
import { PostViewModel } from '../types and models/models';
import { LikeDocument, Post, PostDocument } from '../types and models/schemas';
import { ObjectId } from 'mongodb';

@injectable()
export class PostsRepository {
  constructor(
    @InjectModel('Post') private readonly postsModel: Model<PostDocument>,
    @InjectModel('Like') private readonly likesModel: Model<LikeDocument>,
  ) {}

  private fromPostDBTypePostViewModel = (post: Post): PostViewModel => {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toString(),
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: post.extendedLikesInfo.myStatus,
        newestLikes: post.extendedLikesInfo.newestLikes,
      },
    };
  };
  private fromPostDBTypeToPostViewModelWithPagination = (
    posts: PostDBType[],
  ): PostViewModel[] => {
    return posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toString(),
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: post.extendedLikesInfo.myStatus,
        newestLikes: post.extendedLikesInfo.newestLikes,
      },
    }));
  };

  async findAllPosts(
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    userId?: string,
  ): Promise<PostViewModel[]> {
    const allPosts: PostDBType[] = await this.postsModel
      .find({})
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    for (const post of allPosts) {
      await this.getLikesInfoForPost(post, userId);
    }

    return this.fromPostDBTypeToPostViewModelWithPagination(allPosts);
  }
  async findPostById(
    postId: string,
    userId?: string,
  ): Promise<PostViewModel | null> {
    const post = await this.postsModel
      .findOne({
        _id: new mongoose.Types.ObjectId(postId),
      })
      .exec();
    if (!post) return null;

    const postWithLikesInfo = await this.getLikesInfoForPost(post, userId);

    return this.fromPostDBTypePostViewModel(postWithLikesInfo);
  }

  async createPost(postForSave: PostDBType): Promise<PostViewModel> {
    const newPost = await this.postsModel.create(postForSave);
    return this.fromPostDBTypePostViewModel(newPost);
  }

  async updatePostById(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean> {
    try {
      const result = await this.postsModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(id),
        },
        {
          $set: {
            title: title,
            shortDescription: shortDescription,
            content: content,
            blogId: blogId,
          },
        },
      );

      if (result.matchedCount === 1) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  async deletePostById(id: string): Promise<boolean> {
    try {
      const result = await this.postsModel.deleteOne({
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

  async findPostsByBlogId(
    blogId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    userId?: string,
  ) {
    const foundPosts: PostDBType[] = await this.postsModel
      .find({ blogId: blogId })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    for (const post of foundPosts) {
      await this.getLikesInfoForPost(post, userId);
    }
    return this.fromPostDBTypeToPostViewModelWithPagination(foundPosts);
  }

  async getPostsCount(filter: FilterQuery<PostDBType>) {
    return this.postsModel.countDocuments(filter, { skip: 1 });
  }
  async deleteAllPosts(): Promise<any> {
    return this.postsModel.deleteMany({});
  }
  private mapNewestLikes(likes: LikeDbType[]): NewestLikesType[] {
    return likes.map((like) => ({
      addedAt: like.addedAt,
      userId: like.userId.toString(),
      login: like.userLogin,
    }));
  }
  private async getLikesInfoForPost(post: any, userId?: string) {
    post.extendedLikesInfo.likesCount = await this.likesModel.countDocuments({
      parentId: post._id,
      status: LikeStatus.Like,
    });
    post.extendedLikesInfo.dislikesCount = await this.likesModel.countDocuments(
      {
        parentId: post._id,
        status: LikeStatus.Dislike,
      },
    );
    const newestLikes: LikeDbType[] = await this.likesModel
      .find({ parentId: post._id, status: LikeStatus.Like })
      .sort({ addedAt: -1 })
      .limit(3)
      .exec();

    post.extendedLikesInfo.newestLikes = this.mapNewestLikes(newestLikes);

    if (userId) {
      const status: LikeDbType = await this.likesModel
        .findOne({
          parentId: post._id,
          userId: new mongoose.Types.ObjectId(userId),
        })
        .lean();
      if (status) {
        post.extendedLikesInfo.myStatus = status.status;
      }
    }
    return post;
  }

  async getPostsCountByBlogId(blogId: string) {
    return this.postsModel.countDocuments({ blogId });
  }

  async getAllPostCount() {
    return this.postsModel.countDocuments();
  }
}
