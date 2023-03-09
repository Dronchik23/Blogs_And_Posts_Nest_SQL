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
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { PaginationType } from 'src/types and models/types';
import { BlogsService } from './blog.service';
import {
  BlogInputModel,
  BlogPostInputModel,
  BlogUpdateModel,
  BlogViewModel,
  PaginationInputQueryModel,
  PostInputModel,
  PostViewModel,
} from '../types and models/models';
import { PostsService } from '../posts/post.service';
import { Request } from 'express';
import { BasicAuthGuard } from '../auth/strategys/basic-strategy';
import { CurrentUserId } from '../auth/current-user-param.decorator';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
  ) {}

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
  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(
    @Body() createBlogDTO: BlogInputModel,
  ): Promise<BlogViewModel> {
    const newBlog = await this.blogsService.createBlog(
      createBlogDTO.name,
      createBlogDTO.description,
      createBlogDTO.websiteUrl,
    );
    return newBlog;
  }
  @UseGuards(BasicAuthGuard)
  @Get(':blogId/posts')
  async getPostByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: PaginationInputQueryModel,
    @CurrentUserId() currentUserId,
  ): Promise<PaginationType> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const blog = await this.blogsService.findBlogById(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const posts = await this.postsService.findPostsByBlogId(
      blogId,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      currentUserId,
    );
    return posts;
  }
  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body() blogPostCreateDTO: BlogPostInputModel,
  ): Promise<PostViewModel> {
    debugger;
    const blog = await this.blogsService.findBlogById(blogId);
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

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogViewModel> {
    const blog = await this.blogsService.findBlogById(id);
    if (!blog) {
      throw new NotFoundException();
    }
    return blog;
  }
  @UseGuards(BasicAuthGuard)
  @Put(':blogId')
  @HttpCode(204)
  async updateBlogById(
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
