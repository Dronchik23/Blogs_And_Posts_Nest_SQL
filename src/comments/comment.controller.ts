import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { CommentsService } from './comment.service';
import { LikesService } from '../likes/like.service';
import { JwtAuthGuard } from '../auth/strategys/bearer-strategy';
import {
  CommentParamInPutModel,
  CommentUpdateModel,
  CommentViewModel,
  LikeInputModel,
} from '../types and models/models';
import {
  CurrentUser,
  CurrentUserId,
  CurrentUserIdFromToken,
} from '../auth/current-user-param.decorator';
import { ErrorType } from '../types and models/types';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put(':id/like-status')
  @HttpCode(204)
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() likeStatusDTO: LikeInputModel,
    @CurrentUser() currentUser,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(
      id,
      currentUser.id,
    );
    if (!comment) {
      return HttpStatus.NOT_FOUND;
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

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCommentByUserId(
    @Param('id') id: string,
    @Body('content') commentInputDTO: CommentUpdateModel,
    @CurrentUser() currentUser,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(id);
    if (!comment) {
      return HttpStatus.NOT_FOUND;
    }

    const isUpdated = await this.commentsService.updateCommentByUserId(
      id,
      commentInputDTO.content,
      currentUser,
    );
    if (isUpdated) {
      return HttpStatus.NO_CONTENT;
    } else {
      return HttpStatus.FORBIDDEN;
    }
  }

  @Get(':id')
  async getCommentByCommentId(
    @Param('id') commentId: string,
    @CurrentUserIdFromToken() currentUserId,
  ): Promise<CommentViewModel | HttpStatus> {
    const comment = await this.commentsService.findCommentByCommentId(
      commentId,
      currentUserId,
    );
    if (comment) {
      return HttpStatus.OK, comment;
    } else {
      return HttpStatus.NOT_FOUND;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCommentByCommentId(
    @Param('id') commentIdDTO: CommentParamInPutModel,
    @CurrentUser() currentUser,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(
      commentIdDTO.commentId,
    );
    if (!comment) {
      return HttpStatus.NOT_FOUND;
    }

    const isDeleted = await this.commentsService.deleteCommentByCommentId(
      commentIdDTO.commentId,
      currentUser,
    );
    if (isDeleted) {
      return HttpStatus.NO_CONTENT;
    } else {
      return HttpStatus.FORBIDDEN;
    }
  }
}
