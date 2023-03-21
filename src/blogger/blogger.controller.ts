import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { PaginationType } from 'src/types and models/types';
import {
  BlogInputModel,
  BlogPostInputModel,
  BlogUpdateModel,
  BlogViewModel,
  PaginationInputQueryModel,
  PostViewModel,
} from '../types and models/models';
import { PostsService } from '../posts/post.service';
import { BasicAuthGuard } from '../auth/strategys/basic-strategy';

import { SkipThrottle } from '@nestjs/throttler';
import { BlogsService } from '../blogs/blog.service';

@Controller('blogger/blogs')
export class BloggerBlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
  ) {}
  @SkipThrottle()
  @Get()
  async getAllBlogs(@Query() query: PaginationInputQueryModel) {
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
  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(
    @Body() createBlogDTO: BlogInputModel,
  ): Promise<BlogViewModel> {
    debugger;
    const newBlog = await this.blogsService.createBlog(
      createBlogDTO.name,
      createBlogDTO.description,
      createBlogDTO.websiteUrl,
    );
    return newBlog;
  }
  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body() blogPostCreateDTO: BlogPostInputModel,
  ): Promise<PostViewModel> {
    const blog = await this.blogsService.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const newPost = await this.postsService.createPost(
      blogPostCreateDTO.title,
      blogPostCreateDTO.shortDescription,
      blogPostCreateDTO.content,
      blogId,
    );
    if (newPost) {
      return newPost;
    } else {
      throw new NotFoundException();
    }
  }
  @UseGuards(BasicAuthGuard)
  @Put(':blogId')
  @HttpCode(204)
  async updateBlogByBlogId(
    @Param('blogId') blogId: string,
    @Body() updateBlogDto: BlogUpdateModel,
  ): Promise<void> {
    const isUpdated = await this.blogsService.updateBlogById(
      blogId,
      updateBlogDto.name,
      updateBlogDto.websiteUrl,
    );
    if (!isUpdated) {
      throw new NotFoundException();
    }
  }
  @UseGuards(BasicAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlogByBlogId(@Param('blogId') blogId: string): Promise<boolean> {
    const isDeleted = await this.blogsService.deleteBlogByBlogId(blogId);
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }
}
