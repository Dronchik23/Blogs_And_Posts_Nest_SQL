import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { BlogDBType, PaginationType } from '../types and models/types';
import { BlogViewModel, SABlogViewModel } from '../types and models/models';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsQueryRepository {
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
  //
  private fromBlogDBTypeBlogViewModelWithPagination(
    blogs: BlogDBType[],
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
    blogs: BlogDBType[],
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
    const blogs: BlogDBType[] = await this.dataSource.query(
      `
  SELECT * FROM blogs
  WHERE (LOWER(name) LIKE $1 OR $1 IS NULL) AND "blogOwnerId" = $2 AND $2 NOT IN (SELECT id FROM users WHERE "isBanned" = true)
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $3
  OFFSET $4;
`,
      [searchNameTerm, userId, pageSize, (pageNumber - 1) * pageSize],
    );

    const totalCount = await this.dataSource
      .query(
        `
SELECT COUNT(*) FROM blogs
WHERE "blogOwnerId" = $1 AND $1 NOT IN (SELECT id FROM users WHERE "isBanned" = true)
`,
        [userId],
      )
      .then((result) => +result[0].count);

    const mappedBlogs = this.fromBlogDBTypeBlogViewModelWithPagination(blogs);

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
    const blogs: BlogDBType[] = await this.dataSource.query(
      `
  SELECT * FROM blogs
  WHERE (LOWER(name) LIKE $1 OR $1 IS NULL)
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $2
  OFFSET $3;
`,
      [searchNameTerm, pageSize, (pageNumber - 1) * pageSize],
    );

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

  async findBlogByBlogId(blogId: string): Promise<BlogViewModel | null> {
    try {
      const result = await this.dataSource.query(
        `SELECT * FROM blogs WHERE id = $1 AND "blogOwnerId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
AND NOT EXISTS(SELECT id FROM blogs WHERE "isBanned" = true)`,
        [blogId],
      );
      return result[0] ? this.fromBlogDBTypeBlogViewModel(result[0]) : null;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async findBlogByBlogIdAndUserId(blogId: string, userId: string) {
    try {
      const blog: BlogDBType = await this.dataSource.query(
        `SELECT * FROM blogs WHERE id = $1 AND "blogOwnerId" = $2 AND id NOT IN (SELECT id FROM users WHERE "isBanned" = true)`,
        [blogId, userId],
      );
      return blog ? this.fromBlogDBTypeBlogViewModel(blog[0]) : null;
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
    const blogs = await this.dataSource.query(
      `
  SELECT * FROM blogs
  WHERE (LOWER(name) LIKE $1 OR $1 IS NULL)
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $2
  OFFSET $3;
`,
      [searchNameTerm, pageSize, (pageNumber - 1) * pageSize],
    );

    const mappedBlogs =
      this.fromBlogDBTypeBlogViewModelWithPaginationForSa(blogs);

    const totalCount = await this.dataSource
      .query(` SELECT COUNT(*) FROM blogs`)
      .then((result) => +result[0].count);

    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedBlogs,
    };
  }

  async findBlogByBlogIdWithBlogDBType(blogId: string): Promise<BlogDBType> {
    try {
      const result = await this.dataSource.query(
        `SELECT * FROM blogs WHERE id = $1`,
        [blogId],
      );
      return result[0];
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async getBannedBlogsIds(): Promise<string[]> {
    const bannedBlogs: BlogDBType[] = await this.dataSource.query(
      `SELECT * FROM blogs WHERE "isBanned" = true ;`,
    );
    return bannedBlogs.map((u) => u.id); // return banned ips
  }
}
