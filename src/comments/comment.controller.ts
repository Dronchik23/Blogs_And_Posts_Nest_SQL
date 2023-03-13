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
  UserViewModel,
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
    @CurrentUser() currentUser: UserViewModel,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(
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

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCommentByUserId(
    @Param('id') id: string,
    @Body() commentInputDTO: CommentUpdateModel,
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
      throw new ForbiddenException();
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
    @Param() commentId: string,
    @CurrentUserId() currentUserId,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(
      commentId,
      currentUserId,
    );
    if (!comment) {
      return HttpStatus.NOT_FOUND;
    }

    const isDeleted = await this.commentsService.deleteCommentByCommentId(
      commentId,
      currentUserId,
    );
    if (isDeleted) {
      return HttpStatus.NO_CONTENT;
    } else {
      throw new ForbiddenException();
    }
  }
}
