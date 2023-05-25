import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import {
  BanBlogInputModel,
  BlogPaginationQueryModel,
} from '../../models/models';
import { SkipThrottle } from '@nestjs/throttler';
import { BasicAuthGuard } from '../../auth/strategys/basic-strategy';
import { CommandBus } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../../query-repositorys/blogs-query.repository';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { BindBlogToUserCommand } from '../../use-cases/blogs/bind-blog-to-user-use-case';
import { BanBlogByBlogIdCommand } from '../../use-cases/blogs/ban-blog-by-blogId-use-case';

@SkipThrottle()
@Controller({ path: 'sa/blogs', scope: Scope.REQUEST })
export class SABlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Put(':blogId/bind-with-user/:userId')
  @HttpCode(204)
  async bindBlogToUser(
    @Param('blogId') blogId: string,
    @Param('userId') userId: string,
  ) {
    const blog = await this.blogsQueryRepository.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const user = await this.usersQueryRepository.findUserByUserId(userId);
    if (!user) {
      throw new NotFoundException();
    }
    const isBind = await this.commandBus.execute(
      new BindBlogToUserCommand(blogId, user),
    );
    if (!isBind) {
      throw new BadRequestException();
    }
  }

  @Get()
  async getAllBlogs(@Query() query: BlogPaginationQueryModel) {
    return await this.blogsQueryRepository.findAllBlogsForSA(
      query.searchNameTerm,
      +query.pageSize,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
    );
  }

  @UseGuards(BasicAuthGuard)
  @Put(':blogId/ban')
  @HttpCode(204)
  async banBlogByBlogId(
    @Param('blogId') blogId: string,
    @Body() banBlogDTO: BanBlogInputModel,
  ): Promise<boolean> {
    return await this.commandBus.execute(
      new BanBlogByBlogIdCommand(blogId, banBlogDTO),
    );
  }
}
