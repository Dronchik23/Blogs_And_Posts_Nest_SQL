import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PaginationType } from 'src/types and models/types';
import { BlogsService } from './blog.service';
import {
  BlogViewModel,
  PaginationInputQueryModel,
} from '../types and models/models';
import { PostsService } from '../posts/post.service';
import { CurrentUserIdFromToken } from '../auth/decorators';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
  ) {}
  @SkipThrottle()
  @Get()
  async getAllBlogs(
    @Query() query: PaginationInputQueryModel,
  ): Promise<PaginationType> {
    const { searchNameTerm, pageNumber, pageSize, sortBy, sortDirection } =
      query;

    const allBlogs = await this.blogsService.findAllBlogs(
      searchNameTerm,
      +pageSize,
      sortBy,
      sortDirection,
      +pageNumber,
    );
    return allBlogs;
  }
  @Get(':blogId/posts')
  async getPostByBlogId(
    @Param('blogId') blogId: string,
    @Query() paginationInPutQueryDTO: PaginationInputQueryModel,
    @CurrentUserIdFromToken() currentUserId: string | null,
  ): Promise<PaginationType> {
    const blog = await this.blogsService.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const posts = await this.postsService.findPostsByBlogId(
      blogId,
      paginationInPutQueryDTO.pageNumber,
      paginationInPutQueryDTO.pageSize,
      paginationInPutQueryDTO.sortBy,
      paginationInPutQueryDTO.sortDirection,
      currentUserId,
    );
    return posts;
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogViewModel> {
    const blog = await this.blogsService.findBlogByBlogId(id);
    if (!blog) {
      throw new NotFoundException();
    }
    return blog;
  }
}
