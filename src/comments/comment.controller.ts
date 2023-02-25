import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { LikeStatus } from '../types and models/types';
import { ObjectId } from 'mongodb';
import { CommentsService } from './comment.service';
import { LikesService } from '../likes/like.service';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  //@UseGuards(JwtAuthGuard)
  @Put(':id/like')
  async updateLikeStatus(
    @Param('id') id: string,
    @Body('likeStatus') newLikeStatus: LikeStatus,
    @Req() req,
    @Res() res,
  ) {
    if (
      newLikeStatus !== LikeStatus.None &&
      newLikeStatus !== LikeStatus.Like &&
      newLikeStatus !== LikeStatus.Dislike
    ) {
      return res.sendStatus(400);
    }

    const userId = new ObjectId(req.user.userId);
    const comment = await this.commentsService.findCommentByCommentId(
      id,
      userId,
    );
    if (!comment) {
      return res.sendStatus(404);
    }

    const parentId = new ObjectId(comment.id);
    const userLogin = req.user.login;
    await this.likesService.updateLikeStatus(
      parentId,
      userId,
      userLogin,
      newLikeStatus,
    );

    return res.sendStatus(204);
  }

  //@UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCommentByUserId(
    @Param('id') id: string,
    @Body('content') content: string,
    // @User() user,
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

  //@UseGuards(JwtAuthGuard)
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

  //@UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCommentByCommentId(
    @Param('id') id: string,
    //@User() user,
    @Res() res,
    @Req() req,
  ) {
    const comment = await this.commentsService.findCommentByCommentId(id);
    if (!comment) {
      return res.sendStatus(404);
    }

    const isDeleted = await this.commentsService.deleteCommentByCommentId(
      id,
      req.user,
    );
    if (isDeleted) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(403);
    }
  }
}
