import { Controller, Delete, HttpCode } from '@nestjs/common';
import { BlogsRepository } from '../blogs/blog.repository';
import { UsersRepository } from '../users/users.repository';
import { DevicesRepository } from '../devices/device.repository';
import { CommentsRepository } from '../comments/comment.repository';
import { LikesRepository } from '../likes/like.repository';
import { AttemptsRepository } from '../attempts/attempts.repository';
import { PostsRepository } from '../posts/post.repository';

@Controller('testing')
export class TestingController {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly devicesRepository: DevicesRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly likesRepository: LikesRepository,
    private readonly attemptsRepository: AttemptsRepository,
  ) {}

  @Delete('all-data')
  @HttpCode(204)
  async deleteAllData() {
    await this.blogsRepository.deleteAllBlogs();
    await this.usersRepository.deleteAllUsers();
    await this.postsRepository.deleteAllPosts();
    await this.devicesRepository.deleteAllDevices();
    await this.commentsRepository.deleteAllComments();
    await this.likesRepository.deleteAllLikes();
    await this.attemptsRepository.deleteAllAttempts();
  }
}
