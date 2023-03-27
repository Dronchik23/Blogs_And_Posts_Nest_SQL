import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
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
import { CreateBlogCommand } from '../use-cases/blogs/create-blog-use-case';
import { CommandBus } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../query-repositorys/blogs-query.repository';
import { UpdateBlogCommand } from '../use-cases/blogs/update-blog-by-blogId-use-case';
import { DeleteBlogCommand } from '../use-cases/blogs/delete-blog-by-blogId-use-case';
import { CreatePostCommand } from '../use-cases/posts/create-post-use-case';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';

@Controller({ path: 'blogger/blogs', scope: Scope.REQUEST })
export class BloggerBlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}
  @SkipThrottle()
  @Get()
  async getAllBlogs(@Query() query: PaginationInputQueryModel) {
    return await this.blogsQueryRepository.findAllBlogs(
      query.searchNameTerm,
      +query.pageSize,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
    );
  }
  @UseGuards(BearerAuthGuard)
  @Post()
  async createBlog(
    @Body() createBlogDTO: BlogInputModel,
  ): Promise<BlogViewModel> {
    return await this.commandBus.execute(
      new CreateBlogCommand(
        createBlogDTO.name,
        createBlogDTO.description,
        createBlogDTO.websiteUrl,
      ),
    );
  }
  @UseGuards(BearerAuthGuard)
  @Post(':blogId/posts')
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body() blogPostCreateDTO: BlogPostInputModel,
  ): Promise<PostViewModel> {
    const blog = await this.blogsQueryRepository.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const newPost = await this.commandBus.execute(
      new CreatePostCommand(
        blogPostCreateDTO.title,
        blogPostCreateDTO.shortDescription,
        blogPostCreateDTO.content,
        blogId,
      ),
    );
    if (newPost) {
      return newPost;
    } else {
      throw new NotFoundException();
    }
  }
  @UseGuards(BearerAuthGuard)
  @Put(':blogId')
  @HttpCode(204)
  async updateBlogByBlogId(
    @Param('blogId') blogId: string,
    @Body() updateBlogDto: BlogUpdateModel,
  ): Promise<void | boolean> {
    const isUpdated = await this.commandBus.execute(
      new UpdateBlogCommand(
        blogId,
        updateBlogDto.name,
        updateBlogDto.websiteUrl,
      ),
    );
    if (!isUpdated) {
      throw new NotFoundException();
    }
  }
  @UseGuards(BasicAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlogByBlogId(@Param('blogId') blogId: string): Promise<boolean> {
    const isDeleted = await this.commandBus.execute(
      new DeleteBlogCommand(blogId),
    );
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }
}
