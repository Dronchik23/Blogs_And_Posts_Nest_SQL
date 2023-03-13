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
  HttpStatus,
  NotFoundException,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { ErrorType } from '../types and models/types';
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
  CurrentUser,
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
    @Query() paginationInPutQueryDTO: PaginationInputQueryModel,
    @CurrentUserIdFromToken() CurrentUserId,
  ) {
    const post = await this.postsService.findPostByPostId(id);
    if (!post) {
      throw new NotFoundException();
    }

    const allComments = await this.commentsService.findCommentsByPostId(
      post.id,
      paginationInPutQueryDTO.pageNumber,
      paginationInPutQueryDTO.pageSize,
      paginationInPutQueryDTO.sortBy,
      paginationInPutQueryDTO.sortDirection,
      CurrentUserId,
    );
    return allComments;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createCommentByPostId(
    @Param('id') postId: string,
    @Body() commentCreateDTO: CommentInputModel,
    @CurrentUser() currentUser,
  ) {
    const content = commentCreateDTO.content;

    const post = await this.postsService.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException();
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
  async getPostByPostId(
    @Param('id') id: string,
    @CurrentUserIdFromToken() CurrentUserId: string | null,
  ): Promise<PostViewModel> {
    const post = await this.postsService.findPostByPostId(id, CurrentUserId);

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
    @CurrentUserId() currentUserId: string | null,
  ): Promise<any> {
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
