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
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { PaginationType } from 'src/types and models/types';
import { BlogsService } from './blog.service';
import {
  BlogCreateModel,
  BlogUpdateModel,
  BlogViewModel,
  PaginationInputQueryModel,
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
    const allBlogs = await this.blogsService.findAllBlogs(
      searchNameTerm,
      pageSize,
      sortBy,
      sortDirection,
      pageNumber,
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
  ): Promise<any> {
    const userId = new ObjectId(req.userId!);
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
  async deleteBlogByBlogId(@Param('blogId') blogId: string): Promise<void> {
    const isDeleted = await this.blogsService.deleteBlogByBlogId(blogId);
    if (!isDeleted) {
      throw new NotFoundException();
    }
  }
}
