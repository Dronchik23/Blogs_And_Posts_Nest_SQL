import { Injectable, Scope } from '@nestjs/common';
import { BlogDBType } from '../types and models/types';
import {
  BlogInputModel,
  BlogViewModel,
  UserViewModel,
} from '../types and models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Blogs } from '../entities/blogs.entity';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blogs) private readonly blogModel: Repository<Blogs>,
  ) {
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
    createBlogDTO: BlogInputModel,
    blogOwnerId: string,
    blogOwnerLogin: string,
  ): Promise<BlogViewModel> {
    const newBlog = Blogs.create(createBlogDTO, blogOwnerId, blogOwnerLogin);
    const createdBlog = await this.blogModel.save(newBlog);
    return new BlogViewModel(createdBlog);
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
