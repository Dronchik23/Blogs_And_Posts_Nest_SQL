import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
  BlogPaginationQueryModel,
  BlogPostInputModel,
  BlogUpdateModel,
  BlogViewModel,
  CommentPaginationQueryModel,
  PostUpdateModel,
  PostViewModel,
  UserViewModel,
} from '../types and models/models';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateBlogCommand } from '../use-cases/blogs/create-blog-use-case';
import { CommandBus } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../query-repositorys/blogs-query.repository';
import { UpdateBlogCommand } from '../use-cases/blogs/update-blog-by-blogId-use-case';
import { DeleteBlogCommand } from '../use-cases/blogs/delete-blog-by-blogId-use-case';
import { CreatePostCommand } from '../use-cases/posts/create-post-use-case';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import { DeletePostCommand } from '../use-cases/posts/delete-post-by-postId-use-case';
import { UpdatePostCommand } from '../use-cases/posts/update-post-by-postId-and-blogid-use-case';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';
import { CurrentUser, CurrentUserId } from '../auth/decorators';
import { CommentsQueryRepository } from '../query-repositorys/comments-query.repository';

@SkipThrottle()
@Controller({ path: 'blogger/blogs', scope: Scope.REQUEST })
export class BloggerBlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @UseGuards(BearerAuthGuard)
  @Get()
  async getAllBlogs(
    @Query() query: BlogPaginationQueryModel,
    @CurrentUserId() currentUserId,
  ) {
    return await this.blogsQueryRepository.findAllBlogsForBlogger(
      query.searchNameTerm,
      +query.pageSize,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
      currentUserId,
    );
  }

  @UseGuards(BearerAuthGuard)
  @Get('/comments')
  @HttpCode(200)
  async getAllCommentsForBlogOwner(
    @Query() query: CommentPaginationQueryModel,
    @CurrentUserId() currentUserId,
  ) {
    return await this.commentsQueryRepository.findAllCommentsForBlogOwner(
      query.searchLoginTerm,
      +query.pageSize,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
      currentUserId,
    );
  }

  @UseGuards(BearerAuthGuard)
  @Post()
  async createBlog(
    @Body() createBlogDTO: BlogInputModel,
    @CurrentUser() currentUser: UserViewModel,
  ): Promise<BlogViewModel> {
    return await this.commandBus.execute(
      new CreateBlogCommand(createBlogDTO, currentUser.id, currentUser.login),
    );
  }

  @UseGuards(BearerAuthGuard)
  @Post(':blogId/posts')
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body() blogPostCreateDTO: BlogPostInputModel,
    @CurrentUserId() currentUserId: string,
  ): Promise<PostViewModel> {
    const blog = await this.blogsQueryRepository.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const blogOwner: any =
      await this.blogsQueryRepository.findBlogByBlogIdAndUserId(
        blogId,
        currentUserId,
      );
    if (!blogOwner) {
      throw new ForbiddenException();
    }
    const newPost = await this.commandBus.execute(
      new CreatePostCommand(blogPostCreateDTO, blogId),
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
    @CurrentUserId() currentUserid: string,
  ): Promise<void | boolean> {
    const blog = await this.blogsQueryRepository.findBlogByBlogIdWithBlogDBType(
      blogId,
    );
    if (!blog) {
      throw new NotFoundException();
    }
    if (blog.blogOwnerId !== currentUserid) {
      throw new ForbiddenException();
    }
    const isUpdated = await this.commandBus.execute(
      new UpdateBlogCommand(blogId, updateBlogDto),
    );
    if (!isUpdated) {
      throw new NotFoundException();
    }
  }

  @UseGuards(BearerAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlogByBlogId(
    @Param('blogId') blogId: string,
    @CurrentUserId() currentUserid: string,
  ): Promise<boolean> {
    const blog = await this.blogsQueryRepository.findBlogByBlogIdWithBlogDBType(
      blogId,
    );
    if (!blog) {
      throw new NotFoundException();
    }
    if (blog.blogOwnerId !== currentUserid) {
      throw new ForbiddenException();
    }
    const isDeleted = await this.commandBus.execute(
      new DeleteBlogCommand(blogId),
    );
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(BearerAuthGuard)
  @Delete(':blogId/posts/:postId')
  @HttpCode(204)
  async deletePostByBlogIdAndPostId(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<boolean> {
    const blog = await this.blogsQueryRepository.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const blogOwner: BlogViewModel =
      await this.blogsQueryRepository.findBlogByBlogIdAndUserId(
        blogId,
        currentUserId,
      );

    const post: PostViewModel =
      await this.postsQueryRepository.findPostByPostId(postId);

    if (post.blogId !== blogId) {
      throw new ForbiddenException();
    }

    if (!post) {
      throw new NotFoundException();
    }

    const isDeleted = await this.commandBus.execute(
      new DeletePostCommand(postId),
    );

    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(BearerAuthGuard)
  @Put(':blogId/posts/:postId')
  @HttpCode(204)
  async updatePostByPostIdAndBlogId(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() postUpdateDTO: PostUpdateModel,
    @CurrentUserId() currentUserId: string,
  ): Promise<any> {
    const blog = await this.blogsQueryRepository.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const blogOwner: any =
      await this.blogsQueryRepository.findBlogByBlogIdAndUserId(
        blogId,
        currentUserId,
      );
    if (!blogOwner) {
      throw new ForbiddenException();
    }

    const post = await this.postsQueryRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException();
    }

    const isUpdated = await this.commandBus.execute(
      new UpdatePostCommand(postId, postUpdateDTO),
    );
    if (!isUpdated) {
      throw new NotFoundException();
    }
  }
}
