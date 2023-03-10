import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import {
  ErrorType,
  LikeDbType,
  LikeStatus,
  PaginationType,
} from '../types and models/types';
import {
  CommentInputModel,
  CommentViewModel,
  LikeInputModel,
  PaginationInputQueryModel,
  PostInputModel,
  PostUpdateModel,
  PostViewModel,
} from '../types and models/models';
import { PostsService } from './post.service';
import { CommentsService } from '../comments/comment.service';
import { LikesService } from '../likes/like.service';
import { BasicAuthGuard } from '../auth/strategys/basic-strategy';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/strategys/bearer-strategy';
import {
  CurrentUserId,
  CurrentUserIdFromToken,
} from '../auth/current-user-param.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':id/comments')
  async getCommentByPostId(
    @Param('id') id: string,
    @Query() query: PaginationInputQueryModel,
    @Req() req: Request,
    //@Res() res: Response<PaginationType>,
  ) {
    const post = await this.postsService.findPostByPostId(id);
    if (!post) {
      return HttpStatus.NOT_FOUND;
    }

    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const userId = new ObjectId(req.userId);

    const allComments = await this.commentsService.findCommentsByPostId(
      post.id,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      userId,
    );
    return allComments;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createCommentByPostId(
    @Param('id') id: string,
    @Body() commentCreateDTO: CommentInputModel,
    @CurrentUserIdFromToken() currentUser,
    @Req() req: Request,
  ) {
    const postId = req.params.id;
    const content = commentCreateDTO.content;

    const post = await this.postsService.findPostByPostId(id);
    if (!post) {
      return HttpStatus.NOT_FOUND;
    }

    const newComment = await this.commentsService.createComment(
      postId,
      content,
      currentUser,
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
    @Query() query: PaginationInputQueryModel,
    @Req() req: Request,
    @CurrentUserIdFromToken() currentUserId,
  ) {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;

    const allPosts = await this.postsService.findAllPosts(
      pageSize,
      sortBy,
      sortDirection,
      pageNumber,
      currentUserId,
    );

    return allPosts;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body() postCreateDTO: PostInputModel,
  ): Promise<PostViewModel | ErrorType> {
    const newPost = await this.postsService.createPost(
      postCreateDTO.title,
      postCreateDTO.shortDescription,
      postCreateDTO.content,
      postCreateDTO.blogId,
    );

    if (newPost) {
      return newPost;
    } else {
      return {
        errorsMessages: [
          {
            message: 'string',
            field: 'blogId',
          },
        ],
      };
    }
  }

  @Get(':id')
  async getPostByPostId(@Param('id') id: string): Promise<PostViewModel> {
    const post = await this.postsService.findPostByPostId(id);

    if (post) {
      return post;
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(204)
  async updatePostByPostId(
    @Param('id') id: string,
    @Body() postUpdateDTO: PostUpdateModel,
  ): Promise<any> {
    const post = await this.postsService.findPostByPostId(id);
    if (!post) {
      throw new NotFoundException();
    }
    const isUpdated = await this.postsService.updatePostById(
      id,
      postUpdateDTO.title,
      postUpdateDTO.shortDescription,
      postUpdateDTO.content,
      postUpdateDTO.blogId,
    );
    if (!isUpdated) {
      throw new NotFoundException();
    }
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async deletePostByPostId(@Param('id') id: string): Promise<boolean> {
    const isDeleted = await this.postsService.deletePostById(id);
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/like-status')
  @HttpCode(204)
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() likeStatusDTO: LikeInputModel,
    @CurrentUserId() currentUserId,
  ): Promise<any> {
    debugger;
    const post = await this.postsService.findPostByPostId(id, currentUserId);
    if (!post) {
      throw new NotFoundException();
    }
    const user = await this.usersService.getUserByUserId(currentUserId);
    const parentId = post.id;
    await this.likesService.updateLikeStatus(
      parentId,
      currentUserId,
      user.login,
      likeStatusDTO.likeStatus,
    );
  }
}
