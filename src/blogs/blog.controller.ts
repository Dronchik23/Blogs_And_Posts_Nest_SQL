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
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { PaginationType } from 'src/types and models/types';
import { BlogsService } from './blog.service';
import {
  BlogCreateModel,
  BlogUpdateModel,
  BlogViewModel,
  PaginationInputQueryModel,
  PostViewModel,
} from '../types and models/models';
import { PostsService } from '../posts/post.service';
import { Request } from 'express';

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
    console.log(
      'tut',
      typeof sortBy,
      typeof pageNumber,
      typeof pageSize,
      typeof sortDirection,
    );

    const allBlogs = await this.blogsService.findAllBlogs(
      searchNameTerm,
      +pageSize,
      sortBy,
      sortDirection,
      +pageNumber,
    );
    return allBlogs;
  }

  @Post()
  async createBlog(
    @Body() createBlogDto: BlogCreateModel,
  ): Promise<BlogViewModel> {
    const newBlog = await this.blogsService.createBlog(
      createBlogDto.name,
      createBlogDto.description,
      createBlogDto.websiteUrl,
    );
    return newBlog;
  }

  @Get(':blogId/posts')
  async getPostByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: PaginationInputQueryModel,
    @Req() req: Request,
  ): Promise<PaginationType> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const userId = new ObjectId(req.userId!);
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
      userId,
    );
    return posts;
  }

  @Post(':blogId/posts')
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body()
    createPostDto: {
      title: string;
      shortDescription: string;
      content: string;
      blogId: string;
      blogName: string;
    },
  ): Promise<any> {
    const blog = await this.blogsService.findBlogById(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const newPost = await this.postsService.createPost(
      createPostDto.title,
      createPostDto.shortDescription,
      createPostDto.content,
      blogId,
      createPostDto.blogName,
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
