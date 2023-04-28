import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Scope,
} from '@nestjs/common';
import {
  BlogPaginationQueryModel,
  BlogViewModel,
  PostPaginationQueryModel,
} from '../types and models/models';
import { CurrentUserIdFromToken } from '../auth/decorators';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateBlogService } from '../use-cases/blogs/create-blog-use-case';
import { CommandBus } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../query-repositorys/blogs-query.repository';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';

@SkipThrottle()
@Controller({ path: 'blogs', scope: Scope.REQUEST })
export class BlogsController {
  constructor(
    private readonly createBlogsService: CreateBlogService,
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @SkipThrottle()
  @Get()
  async getAllBlogs(@Query() query: BlogPaginationQueryModel) {
    return await this.blogsQueryRepository.findAllBlogs(
      query.searchNameTerm,
      +query.pageSize,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
    );
  }

  @Get(':blogId/posts')
  async getPostByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: PostPaginationQueryModel,
    @CurrentUserIdFromToken() currentUserId: string | null,
  ): Promise<any> {
    const blog: any = await this.blogsQueryRepository.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const a: any = await this.postsQueryRepository.findPostsByBlogId(
      blogId,
      query.pageNumber,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      currentUserId,
    );
    return a;
  }

  @Get(':id')
  async getBlogByBlogId(@Param('id') id: string): Promise<BlogViewModel> {
    const blog = await this.blogsQueryRepository.findBlogByBlogId(id);
    if (!blog) {
      throw new NotFoundException();
    }
    return blog;
  }
}
