import { Filter, ObjectId } from 'mongodb';
import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LikeDbType,
  LikeStatus,
  NewestLikesType,
  PostDBType,
} from '../types and models/types';
import { PostViewModel } from '../types and models/models';
import { LikeDocument, PostDocument } from '../types and models/schemas';

@injectable()
export class PostsRepository {
  constructor(
    @InjectModel('Post') private readonly postsModel: Model<PostDocument>,
    @InjectModel('Like') private readonly likesModel: Model<LikeDocument>,
  ) {}

  private fromPostDBTypePostViewModel = (post: PostDBType): PostViewModel => {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
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
      createdAt: post.createdAt,
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
    userId?: ObjectId,
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
    postId: ObjectId,
    userId?: ObjectId,
  ): Promise<PostViewModel | null> {
    const post: PostDBType = await this.postsModel
      .findOne({ _id: postId })
      .lean();
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
  ): Promise<PostViewModel | boolean> {
    const result = await this.postsModel.updateOne(
      { id: id },
      {
        $set: {
          title: title,
          shortDescription: shortDescription,
          content: content,
          blogId: blogId,
        },
      },
    );
    return result.matchedCount === 1;
  }

  async deletePostById(id: string): Promise<boolean> {
    const result = await this.postsModel.deleteOne({ id: id });
    if (result.deletedCount === 1) {
      return true;
    } else {
      return false;
    }
  }

  async findPostsByBlogId(
    blogId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    userId?: ObjectId,
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

  async getPostsCount(filter: Filter<PostDBType>) {
    return this.postsModel.countDocuments({ filter }, { skip: 1 });
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
  private async getLikesInfoForPost(post: PostDBType, userId?: ObjectId) {
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
          userId: new ObjectId(userId),
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
