import {
  Body,
  Controller,
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
import { PostsService } from './post.service';
import { CommentsService } from '../comments/comment.service';
import { LikesService } from '../likes/like.service';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import { CurrentUser, CurrentUserIdFromToken } from '../auth/decorators';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';
import { UsersQueryRepository } from '../query-repositorys/users-query.repository';
import { CommentsQueryRepository } from '../query-repositorys/comments-query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateCommentCommand } from '../use-cases/comments/create-comment-use-case';
import { UpdateLikeStatusCommand } from '../use-cases/likes/update-like-status-use-case';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller({ path: 'posts', scope: Scope.REQUEST })
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id/comments')
  async getCommentByPostId(
    @Param('id') id: string,
    @Query() paginationInPutQueryDTO: CommentPaginationQueryModel,
    @CurrentUserIdFromToken() CurrentUserId,
  ) {
    const post = await this.postsQueryRepository.findPostByPostId(id);
    if (!post) {
      throw new NotFoundException();
    }

    return await this.commentsQueryRepository.findCommentsByPostId(
      post.id,
      paginationInPutQueryDTO.pageNumber,
      paginationInPutQueryDTO.pageSize,
      paginationInPutQueryDTO.sortBy,
      paginationInPutQueryDTO.sortDirection,
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
  ) {
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
  ) {
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
