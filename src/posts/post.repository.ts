import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { PostDBType } from '../types and models/types';
import { PostViewModel } from '../types and models/models';
import { Post, PostDocument } from '../types and models/schemas';

@injectable()
export class PostsRepository {
  constructor(
    @InjectModel('Post') private readonly postsModel: Model<PostDocument>,
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

  async createPost(postForSave: PostDBType): Promise<PostViewModel> {
    const newPost = await this.postsModel.create(postForSave);
    return this.fromPostDBTypePostViewModel(newPost);
  }

  async updatePostByPostId(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean> {
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

    return result.matchedCount === 1;
  }

  async deletePostByPostId(id: string): Promise<boolean> {
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

  async deleteAllPosts(): Promise<any> {
    return this.postsModel.deleteMany({});
  }
}
