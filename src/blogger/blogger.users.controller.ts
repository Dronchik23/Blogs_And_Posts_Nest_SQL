import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import {
  BloggerBanUserInputModel,
  UserPaginationQueryModel,
} from '../types and models/models';
import { PostsService } from '../posts/post.service';
import { SkipThrottle } from '@nestjs/throttler';
import { BlogsService } from '../blogs/blog.service';
import { CommandBus } from '@nestjs/cqrs';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import { BanUserByUserIdByBloggerCommand } from '../use-cases/blogger/users/ban-user-by-userId-by-blogger-use-case';
import { findBannedUsersByBlogIdCommand } from '../use-cases/blogger/users/find-banned-users-by-blogId-use-case';
import { PaginationType } from '../types and models/types';
import { CurrentUserId } from '../auth/decorators';

@SkipThrottle()
@Controller({ path: 'blogger/users', scope: Scope.REQUEST })
export class BloggerUsersController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(BearerAuthGuard)
  @Put(':userId/ban')
  @HttpCode(204)
  async banUserByUserId(
    @Param('userId') userId: string,
    @Body() BloggerBanUserDTO: BloggerBanUserInputModel,
  ): Promise<boolean> {
    return await this.commandBus.execute(
      new BanUserByUserIdByBloggerCommand(
        userId,
        BloggerBanUserDTO.isBanned,
        BloggerBanUserDTO.banReason,
        BloggerBanUserDTO.blogId,
      ),
    );
  }

  @UseGuards(BearerAuthGuard)
  @Get('/blog/:blogId')
  @HttpCode(200)
  async findBannedUsersByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: UserPaginationQueryModel,
    @CurrentUserId() currentUserId: string,
  ): Promise<PaginationType> {
    return await this.commandBus.execute(
      new findBannedUsersByBlogIdCommand(
        currentUserId,
        blogId,
        +query.pageNumber,
        +query.pageSize,
        query.sortBy,
        query.sortDirection,
        query.searchLoginTerm,
      ),
    );
  }
}
