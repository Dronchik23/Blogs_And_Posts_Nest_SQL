import { Injectable, Scope } from '@nestjs/common';
import { BlogDBType } from '../types and models/types';
import { BlogViewModel, UserViewModel } from '../types and models/models';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

  private fromBlogDBTypeBlogViewModel(blog: BlogDBType): BlogViewModel {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
    createdAt: string,
    blogOwnerId: string,
    blogOwnerLogin: string,
    isMembership: boolean,
    isBanned: boolean,
  ): Promise<BlogViewModel> {
    const result = await this.dataSource.query(
      `
INSERT INTO blogs (
name,
description,
"websiteUrl",
"createdAt",
"blogOwnerId",
"blogOwnerLogin",
"isMembership",
"isBanned"
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *
`,
      [
        name,
        description,
        websiteUrl,
        createdAt,
        blogOwnerId,
        blogOwnerLogin,
        isMembership,
        isBanned,
      ],
    );

    return this.fromBlogDBTypeBlogViewModel(result[0]); // mapping blog
  }

  async updateBlogByBlogId(
    blogId: string,
    name: string,
    websiteUrl: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE blogs SET name = $1, "websiteUrl" = $2 WHERE id = $3;`,
      [name, websiteUrl, blogId],
    );
    return result[1];
  }

  async deleteBlogByBlogId(blogId: string): Promise<boolean> {
    return await this.dataSource.query(`DELETE FROM blogs WHERE id = $1;`, [
      blogId,
    ]);
  }

  async deleteAllBlogs() {
    return await this.dataSource.query(`DELETE FROM blogs;`);
  }

  async bindBlogToUser(blogId: string, user: UserViewModel): Promise<boolean> {
    return;
  }

  async changeBanStatusForBlog(
    blogId: string,
    isBanned: boolean,
    banDate: string,
  ) {
    if (isBanned === false) {
      banDate = null;
    } // if user unbanned - clear banDate
    const result = await this.dataSource.query(
      `UPDATE blogs SET "isBanned" = $1, "banDate" = $2 WHERE id = $3;`,
      [isBanned, banDate, blogId],
    );
    return result.affectedRows > 0;
  }
}
