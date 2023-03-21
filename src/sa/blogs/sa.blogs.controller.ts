import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationType } from 'src/types and models/types';
import { PaginationInputQueryModel } from '../../types and models/models';
import { SkipThrottle } from '@nestjs/throttler';
import { BlogsService } from '../../blogs/blog.service';
import { UsersService } from '../users/users.service';
import { BasicAuthGuard } from '../../auth/strategys/basic-strategy';

@Controller('sa/blogs')
export class SABlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Put(':blogId/bind-with-user/:userId')
  @HttpCode(204)
  async bindBlogToUser(
    @Param('blogId') blogId: string,
    @Param('userId') userId: string,
  ) {
    const blog = await this.blogsService.findBlogByBlogId(blogId);
    if (!blog) {
      throw new NotFoundException();
    }
    const user = await this.usersService.findUserByUserId(userId);
    if (!user) {
      throw new NotFoundException();
    }
    const isBind = await this.blogsService.bindBlogToUser(blogId, user);
    if (!isBind) {
      throw new BadRequestException();
    }
  }

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
}
