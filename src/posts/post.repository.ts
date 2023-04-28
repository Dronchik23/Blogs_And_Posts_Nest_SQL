import { PostDBType } from '../types and models/types';
import { PostViewModel } from '../types and models/models';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

  private fromPostDBTypePostViewModel = (post: PostDBType): PostViewModel => {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: post.myStatus,
        newestLikes: post.newestLikes,
      },
    };
  };

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    name: string,
    createdAt: string,
  ): Promise<PostViewModel> {
    const post = await this.dataSource.query(
      `
INSERT INTO public.posts(
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
    )

  `,
      [title, shortDescription, content, blogId, name, createdAt],
    );

    return this.fromPostDBTypePostViewModel(post[0]); // mapping post
  }

  async updatePostByPostIdAndBlogId(
    postId: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE posts SET title = ${title}, 
shortDescription = $1, content = $2, WHERE postId = $3, blogId = $4;`,
      [title, content, postId, blogId],
    );
    return result.affectedRows > 0;
  }

  async deletePostByPostIdAndBlogId(
    blogId: string,
    postId: string,
  ): Promise<boolean> {
    return await this.dataSource.query(
      `DELETE FROM posts WHERE "blogId" = $1, postId = $2;`,
      [blogId, postId],
    );
  }

  async deleteAllPosts(): Promise<any> {
    return await this.dataSource.query(`DELETE FROM posts;`);
  }
}
