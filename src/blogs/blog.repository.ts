import { Injectable, Scope } from '@nestjs/common';
import { BlogSQLDBType } from '../types and models/types';
import { BlogViewModel, UserViewModel } from '../types and models/models';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

  private fromBlogDBTypeBlogViewModel(blog: BlogSQLDBType): BlogViewModel {
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
  ): Promise<BlogViewModel> {
    const query = `
   INSERT INTO public.blogs(
  name,
  description,
  "websiteUrl",
  "createdAt",
  "isMembership",
  "blogOwnerId",
  "blogOwnerLogin"
) 
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
) 
RETURNING *
  `;
    const values = [
      name,
      description,
      websiteUrl,
      createdAt,
      blogOwnerId,
      blogOwnerLogin,
    ];

    const blog = await this.dataSource.query(query, values);

    return this.fromBlogDBTypeBlogViewModel(blog[0]); // mapping blog
  }

  async updateBlogByBlogId(
    blogId: string,
    name: string,
    websiteUrl: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE blogs SET name = ${name}, websiteUrl = ${websiteUrl}, WHERE id = ${blogId};`,
    );
    return result.affectedRows > 0;
  }

  async deleteBlogByBlogId(blogId: string): Promise<boolean> {
    return await this.dataSource.query(
      `DELETE FROM blogs WHERE id = ${blogId};`,
    );
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
      `UPDATE blogs SET isBanned = ${isBanned}, banDate = ${banDate} WHERE id = ${blogId};`,
    );
    return result.affectedRows > 0;
  }
}
