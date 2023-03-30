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
  PostUpdateModel,
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
import { DeletePostCommand } from '../use-cases/posts/delete-post-by-postId-use-case';
import { UpdatePostCommand } from '../use-cases/posts/update-post-by-postId-use-case';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';

@Controller({ path: 'blogger/blogs', scope: Scope.REQUEST })
export class BloggerBlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
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
    console.log('CALLED');
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

  @UseGuards(BearerAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlogByBlogId(@Param('blogId') blogId: string): Promise<boolean> {
    debugger;
    const isDeleted = await this.commandBus.execute(
      new DeleteBlogCommand(blogId),
    );
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }
  //:TODO finish this endpoint
  @UseGuards(BearerAuthGuard)
  @Delete(':postId')
  @HttpCode(204)
  async deletePostByPostId(@Param('postId') id: string): Promise<boolean> {
    const isDeleted = await this.commandBus.execute(new DeletePostCommand(id));
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }
  //:TODO finish this endpoint
  @UseGuards(BearerAuthGuard)
  @Put(':id')
  @HttpCode(204)
  async updatePostByPostId(
    @Param('id') id: string,
    @Body() postUpdateDTO: PostUpdateModel,
  ): Promise<void> {
    const post = await this.postsQueryRepository.findPostByPostId(id);
    if (!post) {
      throw new NotFoundException();
    }
    const isUpdated = await this.commandBus.execute(
      new UpdatePostCommand(
        post.id,
        postUpdateDTO.title,
        postUpdateDTO.shortDescription,
        postUpdateDTO.content,
        postUpdateDTO.blogId,
      ),
    );
    if (!isUpdated) {
      throw new NotFoundException();
    }
  }
}
