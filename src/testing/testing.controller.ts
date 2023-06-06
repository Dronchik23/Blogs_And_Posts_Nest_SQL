import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import { BlogsRepository } from '../blogs/blog.repository';
import { UsersRepository } from '../sa/users/users-repository';
import { DevicesRepository } from '../devices/device.repository';
import { CommentsRepository } from '../comments/comment.repository';
import { LikesRepository } from '../likes/like.repository';
import { PostsRepository } from '../posts/post.repository';
import { TokensRepository } from '../tokens/tokens.repository';
import { TestingRepository } from './testing.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Games } from '../entities/games.entity';
import { Repository } from 'typeorm';
import { Questions } from '../entities/question.entity';

@Controller('testing')
export class TestingController {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly devicesRepository: DevicesRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly likesRepository: LikesRepository,
    private readonly tokensRepository: TokensRepository,
    private readonly testingRepository: TestingRepository,
    @InjectRepository(Games) private q: Repository<Games>,
    @InjectRepository(Questions) private qs: Repository<Questions>,
  ) {}

  @Delete('all-data')
  @HttpCode(204)
  async deleteAllData() {
    await this.testingRepository.deleteAllData();
    // await this.blogsRepository.deleteAllBlogs();
    // await this.usersRepository.deleteAllUsers();
    // await this.postsRepository.deleteAllPosts();
    // await this.devicesRepository.deleteAllDevices();
    // await this.commentsRepository.deleteAllComments();
    // await this.likesRepository.deleteAllLikes();
    // await this.tokensRepository.deleteAllBannedRefreshTokens();
  }

  @Delete('all-blogs')
  @HttpCode(204)
  async deleteAllBlogs() {
    await this.blogsRepository.deleteAllBlogs();
  }

  @Delete('all-posts')
  @HttpCode(204)
  async deleteAllPosts() {
    await this.postsRepository.deleteAllPosts();
  }

  @Delete('all-comments')
  @HttpCode(204)
  async deleteAllComments() {
    await this.commentsRepository.deleteAllComments();
  }

  @Delete('all-users')
  @HttpCode(204)
  async deleteAllUsers() {
    await this.usersRepository.deleteAllUsers();
  }

  @Delete('all-likes')
  @HttpCode(204)
  async deleteAllLikes() {
    await this.likesRepository.deleteAllLikes();
  }

  @Delete('all-bannedRefreshTokens')
  @HttpCode(204)
  async deleteAllBannedRefreshTokens() {
    await this.tokensRepository.deleteAllBannedRefreshTokens();
  }
}
