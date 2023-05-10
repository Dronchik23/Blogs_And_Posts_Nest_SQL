import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import {
  CommentInputModel,
  CommentPaginationQueryModel,
  LikeInputModel,
  PostPaginationQueryModel,
  PostViewModel,
  UserViewModel,
} from '../types and models/models';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import { CurrentUser, CurrentUserIdFromToken } from '../auth/decorators';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';
import { UsersQueryRepository } from '../query-repositorys/users-query.repository';
import { CommentsQueryRepository } from '../query-repositorys/comments-query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateCommentCommand } from '../use-cases/comments/create-comment-use-case';
import { UpdateLikeStatusCommand } from '../use-cases/likes/update-like-status-use-case';
import { SkipThrottle } from '@nestjs/throttler';
import { PaginationType, UserDBType } from '../types and models/types';

@SkipThrottle()
@Controller({ path: 'posts', scope: Scope.REQUEST })
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id/comments')
  async getCommentByPostId(
    @Param('id') id: string,
    @Query() query: CommentPaginationQueryModel,
    @CurrentUserIdFromToken() CurrentUserId,
  ) {
    const post = await this.postsQueryRepository.findPostByPostId(id);
    if (!post) {
      throw new NotFoundException();
    }

    return await this.commentsQueryRepository.findCommentsByPostId(
      post.id,
      query.pageNumber,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      CurrentUserId,
    );
  }

  @SkipThrottle()
  @UseGuards(BearerAuthGuard)
  @Post(':postId/comments')
  async createCommentByPostId(
    @Param('postId') postId: string,
    @Body() commentCreateDTO: CommentInputModel,
    @CurrentUser() currentUser,
  ): Promise<any> {
    const user: UserDBType =
      await this.usersQueryRepository.findUserByUserIdWithDBTypeBonus(
        currentUser.id,
      );
    if (user.isBanned === true) {
      throw new ForbiddenException();
    }

    const post = await this.postsQueryRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException();
    }

    const newComment = await this.commandBus.execute(
      new CreateCommentCommand(postId, commentCreateDTO.content, currentUser),
    );

    if (newComment) {
      return HttpStatus.CREATED, newComment;
    } else {
      return (
        HttpStatus.UNAUTHORIZED,
        {
          errorsMessages: [
            {
              message: 'string',
              field: 'postId',
            },
          ],
        }
      );
    }
  }

  @Get()
  async getAllPosts(
    @Query() query: PostPaginationQueryModel,
    @CurrentUserIdFromToken() currentUserId,
  ): Promise<PaginationType> {
    return await this.postsQueryRepository.findAllPosts(
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      query.pageNumber,
      currentUserId,
    );
  }

  @Get(':id')
  async getPostByPostId(
    @Param('id') id: string,
    @CurrentUserIdFromToken() CurrentUserId: string | null,
  ): Promise<PostViewModel> {
    const post = await this.postsQueryRepository.findPostByPostId(
      id,
      CurrentUserId,
    );

    if (post) {
      return post;
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(BearerAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(204)
  async updateLikeStatus(
    @Param('postId') postId: string,
    @Body() likeStatusDTO: LikeInputModel,
    @CurrentUser() currentUser: UserViewModel,
  ): Promise<any> {
    const post = await this.postsQueryRepository.findPostByPostId(
      postId,
      currentUser.id,
    );
    if (!post) {
      throw new NotFoundException();
    }
    const parentId = post.id;
    await this.commandBus.execute(
      new UpdateLikeStatusCommand(
        parentId,
        currentUser.id,
        currentUser.login,
        likeStatusDTO.likeStatus,
      ),
    );
  }
}
