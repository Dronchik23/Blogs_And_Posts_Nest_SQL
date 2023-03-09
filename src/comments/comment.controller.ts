import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LikeDbType, LikeStatus } from '../types and models/types';
import { ObjectId } from 'mongodb';
import { CommentsService } from './comment.service';
import { LikesService } from '../likes/like.service';
import { JwtAuthGuard } from '../auth/strategys/bearer-strategy';
import {
  CurrentUser,
  CurrentUserId,
} from '../auth/current-user-param.decorator';
import { LikeInputModel } from '../types and models/models';
import { Response } from 'express';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put(':id/like')
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() likeStatusDTO: LikeInputModel,
    @CurrentUser() currentUser,
    @Res({ passthrough: true }) res: Response<LikeDbType>,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(
      id,
      currentUser.id,
    );
    if (!comment) {
      return res.sendStatus(404);
    }

    const parentId = comment.id;
    await this.likesService.updateLikeStatus(
      parentId,
      currentUser.id,
      currentUser.login,
      likeStatusDTO.likeStatus,
    );

    return res.sendStatus(204);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCommentByUserId(
    @Param('id') id: string,
    @Body('content') content: string,
    @Res() res,
    @Req() req,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(id);
    if (!comment) {
      return res.sendStatus(404);
    }

    const isUpdated = await this.commentsService.updateCommentByUserId(
      id,
      content,
      req.user,
    );
    if (isUpdated) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(403);
    }
  }

  @Get(':id')
  async getCommentByCommentId(@Param('id') id: string, @Req() req, @Res() res) {
    const userId = new ObjectId(req.user.userId);
    const comment = await this.commentsService.findCommentByCommentId(
      id,
      userId,
    );
    if (comment) {
      return res.status(200).send(comment);
    } else {
      return res.sendStatus(404);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCommentByCommentId(
    @Param('id') id: string,
    @CurrentUser() currentUser,
    @Res() res,
    @Req() req,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(id);
    if (!comment) {
      return res.sendStatus(404);
    }

    const isDeleted = await this.commentsService.deleteCommentByCommentId(
      id,
      currentUser,
    );
    if (isDeleted) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(403);
    }
  }
}
