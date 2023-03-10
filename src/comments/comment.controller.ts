import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { CommentsService } from './comment.service';
import { LikesService } from '../likes/like.service';
import { JwtAuthGuard } from '../auth/strategys/bearer-strategy';
import { LikeInputModel } from '../types and models/models';
import {
  CurrentUser,
  CurrentUserId,
  CurrentUserIdFromToken,
} from '../auth/current-user-param.decorator';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put(':id/like-status')
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
    @Body('content') content: string,
    @CurrentUser() currentUser,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(id);
    if (!comment) {
      return HttpStatus.NOT_FOUND;
    }

    const isUpdated = await this.commentsService.updateCommentByUserId(
      id,
      content,
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
    @Param('id') id: string,
    @CurrentUserIdFromToken() currentUserId,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(
      id,
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
    @Param('id') id: string,
    @CurrentUser() currentUser,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(id);
    if (!comment) {
      return HttpStatus.NOT_FOUND;
    }

    const isDeleted = await this.commentsService.deleteCommentByCommentId(
      id,
      currentUser,
    );
    if (isDeleted) {
      return HttpStatus.NO_CONTENT;
    } else {
      return HttpStatus.FORBIDDEN;
    }
  }
}
