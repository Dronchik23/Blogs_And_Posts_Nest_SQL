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

@Controller({ path: 'comments', scope: Scope.REQUEST })
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @UseGuards(BearerAuthGuard)
  @Put(':id/like-status')
  @HttpCode(204)
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() likeStatusDTO: LikeInputModel,
    @CurrentUser() currentUser: UserViewModel,
  ) {
    const comment = await this.commentsQueryRepository.findCommentByCommentId(
      id,
      currentUser.id,
    );
    if (!comment) {
      throw new NotFoundException();
    }

    const parentId = comment.id;
    await this.likesService.updateLikeStatus(
      parentId,
      currentUser.id,
      currentUser.login,
      likeStatusDTO.likeStatus,
    );

    return HttpStatus.NO_CONTENT;
  }

  @UseGuards(BearerAuthGuard)
  @Put(':id')
  @HttpCode(204)
  async updateCommentByCommentId(
    @Param('id') id: string,
    @Body() commentInputDTO: CommentUpdateModel,
    @CurrentUser() currentUser,
  ) {
    const comment = await this.commentsQueryRepository.findCommentByCommentId(
      id,
    );
    if (!comment) {
      throw new NotFoundException();
    }

    const isUpdated = await this.commentsService.updateCommentByUserId(
      id,
      commentInputDTO.content,
      currentUser,
    );
    if (!isUpdated) {
      throw new ForbiddenException();
    }
  }

  @Get(':id')
  async getCommentByCommentId(
    @Param('id') commentId: string,
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
    debugger;
    const comment = await this.commentsQueryRepository.findCommentByCommentId(
      commentId,
      currentUserId,
    );
    if (!comment) {
      throw new NotFoundException();
    }

    const isDeleted = await this.commentsService.deleteCommentByCommentId(
      commentId,
      currentUserId,
    );
    if (!isDeleted) {
      throw new ForbiddenException();
    }
  }
}
