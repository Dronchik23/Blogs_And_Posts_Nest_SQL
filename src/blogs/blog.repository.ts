import { Injectable, Scope } from '@nestjs/common';
import {
  BlogInputModel,
  BlogUpdateModel,
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
  ) {}

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
    updateBlogDto: BlogUpdateModel,
  ): Promise<boolean> {
    const result = await this.blogModel.update(blogId, {
      name: updateBlogDto.name,
      websiteUrl: updateBlogDto.websiteUrl,
      description: updateBlogDto.description,
    });
    return result.affected > 0;
  }

  async deleteBlogByBlogId(blogId: string): Promise<boolean> {
    const result = await this.blogModel.delete(blogId);
    return result.affected > 0;
  }

  async deleteAllBlogs() {
    return await this.blogModel.delete({});
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
