import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { ErrorType } from '../types and models/types';
import {
  CommentInputModel,
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
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import {
  CurrentUser,
  CurrentUserId,
  CurrentUserIdFromToken,
} from '../auth/decorators';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';
import { UsersQueryRepository } from '../query-repositorys/users-query.repository';
import { CommentsQueryRepository } from '../query-repositorys/comments-query.repository';

@Controller({ path: 'posts', scope: Scope.REQUEST })
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id/comments')
  async getCommentByPostId(
    @Param('id') id: string,
    @Query() paginationInPutQueryDTO: PaginationInputQueryModel,
    @CurrentUserIdFromToken() CurrentUserId,
  ) {
    const post = await this.postsQueryRepository.findPostByPostId(id);
    if (!post) {
      throw new NotFoundException();
    }

    return await this.commentsQueryRepository.findCommentsByPostId(
      post.id,
      paginationInPutQueryDTO.pageNumber,
      paginationInPutQueryDTO.pageSize,
      paginationInPutQueryDTO.sortBy,
      paginationInPutQueryDTO.sortDirection,
      CurrentUserId,
    );
  }

  @UseGuards(BearerAuthGuard)
  @Post(':id/comments')
  async createCommentByPostId(
    @Param('id') postId: string,
    @Body() commentCreateDTO: CommentInputModel,
    @CurrentUser() currentUser,
  ) {
    const content = commentCreateDTO.content;

    const post = await this.postsQueryRepository.findPostByPostId(postId);
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
    return await this.postsQueryRepository.findAllPosts(
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      query.pageNumber,
      currentUserId,
    );
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
    const post = await this.postsQueryRepository.findPostByPostId(
      id,
      CurrentUserId,
    );

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
  ): Promise<void> {
    const post = await this.postsQueryRepository.findPostByPostId(id);
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

  @UseGuards(BearerAuthGuard)
  @Put(':id/like-status')
  @HttpCode(204)
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() likeStatusDTO: LikeInputModel,
    @CurrentUserId() currentUserId: string | null,
  ): Promise<void> {
    const post = await this.postsQueryRepository.findPostByPostId(
      id,
      currentUserId,
    );
    if (!post) {
      throw new NotFoundException();
    }
    const user = await this.usersQueryRepository.findUserByUserId(
      currentUserId,
    );
    const parentId = post.id;
    await this.likesService.updateLikeStatus(
      parentId,
      currentUserId,
      user.login,
      likeStatusDTO.likeStatus,
    );
  }
}
