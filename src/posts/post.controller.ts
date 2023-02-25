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
  CommentCreateModel,
  CommentViewModel,
  PaginationInputQueryModel,
  PostCreateModel,
  PostUpdateModel,
  PostViewModel,
} from '../types and models/models';
import { PostsService } from './post.service';
import { CommentsService } from '../comments/comment.service';
import { LikesService } from '../likes/like.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @Get(':id/comments')
  async getCommentByPostId(
    @Param('id') id: string,
    @Query() query: PaginationInputQueryModel,
    @Req() req: Request,
    @Res() res: Response<PaginationType>,
  ) {
    const postId = new ObjectId(id);
    const post = await this.postsService.findPostByPostId(postId);
    if (!post) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    const userId = new ObjectId(req.userId);
    const pageNumber = query.pageNumber;
    const pageSize = query.pageSize;
    const sortBy = query.sortBy;
    const sortDirection = query.sortDirection;
    const comments = await this.commentsService.findCommentsByPostId(
      post.id,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      userId,
    );
    return res.send(comments);
  }

  @Post(':id/comments')
  async createCommentByPostId(
    @Param('id') id: string,
    @Body() body: CommentCreateModel,
    @Req() req: Request,
    @Res() res: Response<CommentViewModel | ErrorType>,
  ) {
    const postId = new ObjectId(req.params.id);
    const content = body.content;
    const user = req.user;

    const post = await this.postsService.findPostByPostId(postId);
    if (!post) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }

    const newComment = await this.commentsService.createComment(
      postId,
      content,
      user,
    );
    if (newComment) {
      return res.status(HttpStatus.CREATED).send(newComment);
    } else {
      return res.status(HttpStatus.UNAUTHORIZED).send({
        errorsMessages: [
          {
            message: 'string',
            field: 'postId',
          },
        ],
      });
    }
  }

  @Get()
  async getAllPosts(
    @Query() query: PaginationInputQueryModel,
    @Req() req: Request,
    @Res() res: Response<PaginationType>,
  ) {
    const pageNumber = query.pageNumber;
    const pageSize = query.pageSize;
    const sortBy = query.sortBy;
    const sortDirection = query.sortDirection;

    const userId = new ObjectId(req.userId);

    const allPosts = await this.postsService.findAllPosts(
      pageSize,
      sortBy,
      sortDirection,
      pageNumber,
      userId,
    );

    return res.send(allPosts);
  }

  @Post()
  async createPost(
    @Body() createPostModel: PostCreateModel,
  ): Promise<PostViewModel | ErrorType> {
    const newPost = await this.postsService.createPost(
      createPostModel.title,
      createPostModel.shortDescription,
      createPostModel.content,
      createPostModel.blogId,
      createPostModel.blogName,
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
    const post = await this.postsService.findPostByPostId(new ObjectId(id));

    if (post) {
      return post;
    } else {
      throw new NotFoundException();
    }
  }

  @Put(':id')
  async updatePostByPostId(
    @Param('id') id: string,
    @Body() updatePostModel: PostUpdateModel,
  ): Promise<void> {
    const isUpdated = await this.postsService.updatePostById(
      id,
      updatePostModel.title,
      updatePostModel.shortDescription,
      updatePostModel.content,
      updatePostModel.blogId,
    );

    if (!isUpdated) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  async deletePostByPostId(@Param('id') id: string): Promise<void> {
    const isDeleted = await this.postsService.deletePostById(id);

    if (!isDeleted) {
      throw new NotFoundException();
    }
  }

  @Put(':id/like')
  async updateLikeStatus(
    @Param('id') id: string,
    @Body('likeStatus') likeStatus: LikeStatus,
    @Req() req: Request,
    @Res() res: Response<LikeDbType>,
  ): Promise<void> {
    const userId = new ObjectId(req.userId!);
    const post = await this.postsService.findPostByPostId(
      new ObjectId(id),
      userId,
    );

    if (!post) {
      throw new NotFoundException();
    }

    const parentId = new ObjectId(post.id);
    const userLogin = req.user!.login;

    await this.likesService.updateLikeStatus(
      parentId,
      userId,
      userLogin,
      likeStatus,
    );
  }
}