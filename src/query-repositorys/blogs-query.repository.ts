import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { BlogDBType, PaginationType, SortDirection } from '../types/types';
import { BlogViewModel, SABlogViewModel } from '../models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Blogs } from '../entities/blogs.entity';
import { plainToClass } from 'class-transformer';

@Injectable({ scope: Scope.DEFAULT })
export class BlogsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blogs) private readonly blogModel: Repository<Blogs>,
  ) {}

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
    userId: string,
  ): Promise<PaginationType> {
    const builder = await this.blogModel
      .createQueryBuilder('blogs')
      .where('blogs."blogOwnerId" = :userId', { userId })
      .andWhere(
        'blogs."blogOwnerId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)',
      );

    if (searchNameTerm) {
      builder.andWhere('blogs.name ILIKE :searchNameTerm', {
        searchNameTerm: `%${searchNameTerm}%`,
      });
    }

    const blogs: BlogDBType[] = await builder
      .orderBy(
        `blogs.${sortBy} COLLATE "C"`,
        sortDirection.toUpperCase() as SortDirection,
      )
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await builder.getCount();

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
    const builder = await this.blogModel
      .createQueryBuilder('blogs')
      .where(
        'blogs."blogOwnerId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)',
      )
      .andWhere('NOT blogs."isBanned"');

    if (searchNameTerm) {
      const searchNameTermUpper = searchNameTerm.toUpperCase();
      builder.andWhere('blogs.name ILIKE :searchNameTerm', {
        searchNameTerm: `%${searchNameTermUpper}%`,
      });
    }

    const blogs: BlogDBType[] = await builder
      .orderBy(
        `blogs.${sortBy} COLLATE "C"`,
        sortDirection.toUpperCase() as SortDirection,
      )
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await builder.getCount();

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

  async findBlogByBlogId(blogId: string): Promise<BlogViewModel | null> {
    try {
      const blog = await this.blogModel
        .createQueryBuilder('blogs')
        .where('blogs.id = :blogId', { blogId })
        .andWhere(
          'blogs."blogOwnerId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)',
        )
        .andWhere('NOT blogs."isBanned"')
        .getOne();

      return blog ? this.fromBlogDBTypeBlogViewModel(blog) : null;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async findBlogByBlogIdAndUserId(blogId: string, userId: string) {
    try {
      const blog: BlogDBType = await this.blogModel
        .createQueryBuilder('blogs')
        .where('blogs.id = :blogId', { blogId })
        .andWhere('blogs."blogOwnerId" = :userId', { userId })
        .andWhere('NOT blogs."isBanned"')
        .getOne();

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
    const builder = await this.blogModel.createQueryBuilder('blogs');

    if (searchNameTerm) {
      const searchNameTermUpper = searchNameTerm.toUpperCase();
      builder.andWhere('blogs.name ILIKE :searchNameTerm', {
        searchNameTerm: `%${searchNameTermUpper}%`,
      });
    }

    const blogs: BlogDBType[] = await builder
      .orderBy(
        `blogs.${sortBy} COLLATE "C"`,
        sortDirection.toUpperCase() as SortDirection,
      )
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await builder.getCount();

    const mappedBlogs =
      this.fromBlogDBTypeBlogViewModelWithPaginationForSa(blogs);

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
      const result = await this.blogModel.findOneBy({ id: blogId });
      if (!result) {
        throw new NotFoundException();
      }
      const blog = plainToClass(BlogDBType, result);
      return blog;
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
