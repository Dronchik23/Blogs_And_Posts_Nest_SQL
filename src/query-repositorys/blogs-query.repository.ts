import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { BlogSQLDBType, PaginationType } from '../types and models/types';
import { BlogViewModel, SABlogViewModel } from '../types and models/models';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsQueryRepository {
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

  private fromBlogDBTypeBlogViewModelWithPagination(
    blogs: BlogSQLDBType[],
  ): BlogViewModel[] {
    return blogs.map((blog) => ({
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    }));
  }

  private fromBlogDBTypeBlogViewModelWithPaginationForSa(
    blogs: BlogSQLDBType[],
  ): SABlogViewModel[] {
    return blogs.map((blog) => ({
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      blogOwnerInfo: {
        userId: blog.blogOwnerId,
        userLogin: blog.blogOwnerLogin,
      },
      banInfo: { isBanned: blog.isBanned, banDate: blog.banDate },
    }));
  }

  async findAllBlogsForBlogger(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    userId?: string,
  ): Promise<PaginationType> {
    const blogs: BlogSQLDBType[] = await this.dataSource.query(`
  SELECT * FROM blogs
  WHERE name ILIKE '%${searchNameTerm ?? ''}%', blogOwnerId = ${userId}
  ORDER BY ${sortBy} ${sortDirection}
  LIMIT ${pageSize}
  OFFSET ${(pageNumber - 1) * pageSize};
`);

    const bannedBlogIds = await this.getBannedBlogsIds();

    const sortedBlogs = blogs.filter((blog) => {
      return !bannedBlogIds.includes(blog.id);
    });

    const totalCount = sortedBlogs.length;

    const mappedBlogs =
      this.fromBlogDBTypeBlogViewModelWithPagination(sortedBlogs);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedBlogs,
    };
  }

  async findAllBlogs(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<PaginationType> {
    return await this.dataSource.query(`
  SELECT * FROM blogs
  WHERE name ILIKE '%${searchNameTerm ?? ''}%'
  ORDER BY ${sortBy} ${sortDirection}
  LIMIT ${pageSize}
  OFFSET ${(pageNumber - 1) * pageSize};
`);
  }

  async findBlogByBlogId(blogId: string): Promise<BlogViewModel | null> {
    try {
      const bannedBlogIds: string[] = await this.getBannedBlogsIds();
      const query = `SELECT * FROM blogs WHERE id = '${blogId}' AND id NOT IN (${bannedBlogIds
        .map((id) => `'${id}'`)
        .join(', ')});`;
      const result = await this.dataSource.query(query);
      const blog = result.rows[0];
      return blog ? this.fromBlogDBTypeBlogViewModel(blog) : null;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async findBlogByBlogIdAndUserId(blogId: string, userId: string) {
    try {
      const bannedBlogIds: string[] = await this.getBannedBlogsIds();
      const bannedBlogIdsStr: string = bannedBlogIds.join(',');
      const blog: BlogSQLDBType = await this.dataSource.query(
        `SELECT * FROM blogs WHERE id = '${blogId}' AND ownerId = '${userId}' AND id NOT IN (${bannedBlogIdsStr}) LIMIT 1;`,
      );
      return blog ? this.fromBlogDBTypeBlogViewModel(blog) : null;
    } catch (error) {
      throw new ForbiddenException();
    }
  }

  async findAllBlogsForSA(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<PaginationType> {
    const blogs: BlogSQLDBType[] = await this.dataSource.query(
      `SELECT * FROM blogs;`,
    );

    const mappedBlogs =
      this.fromBlogDBTypeBlogViewModelWithPaginationForSa(blogs);

    const totalCount = blogs.length;

    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedBlogs,
    };
  }

  async findBlogByBlogIdWithBlogDBType(blogId: string): Promise<BlogSQLDBType> {
    try {
      return await this.dataSource.query(
        `SELECT * FROM blogs WHERE id = ${blogId};`,
      );
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async getBannedBlogsIds(): Promise<string[]> {
    const bannedBlogs: BlogSQLDBType[] = await this.dataSource.query(
      `SELECT * FROM blogs WHERE isBanned = true ;`,
    );
    return bannedBlogs.map((u) => u.id); // return banned ips
  }
}
