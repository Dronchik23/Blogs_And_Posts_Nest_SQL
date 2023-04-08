import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comment.service';
import { LikesService } from '../likes/like.service';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import {
  CommentUpdateModel,
  CommentViewModel,
  LikeInputModel,
  UserViewModel,
} from '../types and models/models';
import {
  CurrentUser,
  CurrentUserId,
  CurrentUserIdFromToken,
} from '../auth/decorators';
import { CommentsQueryRepository } from '../query-repositorys/comments-query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../use-cases/comments/delete-comment-by-commentId-use-case';
import { UpdateCommentCommand } from '../use-cases/comments/update -comment-by-commentId-and-userId-use-case';
import { UpdateLikeStatusCommand } from '../use-cases/likes/update-like-status-use-case';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller({ path: 'comments', scope: Scope.REQUEST })
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(BearerAuthGuard)
  @Put(':commentId/like-status')
  @HttpCode(204)
  async updateLikeStatus(
    @Param('commentId') commentId: string,
    @Body() likeStatusDTO: LikeInputModel,
    @CurrentUser() currentUser: UserViewModel,
  ) {
    const comment = await this.commentsQueryRepository.findCommentByCommentId(
      commentId,
      currentUser.id,
    );
    if (!comment) {
      throw new NotFoundException();
    }

    const parentId = comment.id;
    await this.commandBus.execute(
      new UpdateLikeStatusCommand(
        parentId,
        currentUser.id,
        currentUser.login,
        likeStatusDTO.likeStatus,
      ),
    );

    return HttpStatus.NO_CONTENT;
  }

  @UseGuards(BearerAuthGuard)
  @Put(':commentId')
  @HttpCode(204)
  async updateCommentByCommentId(
    @Param('commentId') commentId: string,
    @Body() commentInputDTO: CommentUpdateModel,
    @CurrentUserId() currentUserId,
  ) {
    const comment = await this.commentsQueryRepository.findCommentByCommentId(
      commentId,
    );
    if (!comment) {
      throw new NotFoundException();
    }

    const isUpdated = await this.commandBus.execute(
      new UpdateCommentCommand(
        commentId,
        commentInputDTO.content,
        currentUserId,
      ),
    );
    if (!isUpdated) {
      throw new ForbiddenException();
    }
  }

  @Get(':commentId')
  async getCommentByCommentId(
    @Param('commentId') commentId: string,
    @CurrentUserIdFromToken() currentUserId,
  ): Promise<CommentViewModel | HttpStatus> {
    const comment = await this.commentsQueryRepository.findCommentByCommentId(
      commentId,
      currentUserId,
    );
    if (comment) {
      return HttpStatus.OK, comment;
    } else {
      throw new NotFoundException();
    }
  }
  @UseGuards(BearerAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async deleteCommentByCommentId(
    @Param('id') commentId: string,
    @CurrentUserId() currentUserId,
  ): Promise<void> {
    const comment = await this.commentsQueryRepository.findCommentByCommentId(
      commentId,
      currentUserId,
    );
    if (!comment) {
      throw new NotFoundException();
    }

    const isDeleted = await this.commandBus.execute(
      new DeleteCommentCommand(commentId, currentUserId),
    );
    if (!isDeleted) {
      throw new ForbiddenException();
    }
  }
}
