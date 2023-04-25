import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogViewModel, PostViewModel } from '../../types and models/models';
import {
  ExtendedLikesInfoType,
  LikeStatus,
  PostDBType,
} from '../../types and models/types';
import { ObjectId } from 'mongodb';
import { BlogsQueryRepository } from '../../query-repositorys/blogs-query.repository';
import { PostsRepository } from '../../posts/post.repository';

export class CreatePostCommand {
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostService implements ICommandHandler<CreatePostCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,

    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<PostViewModel> {
    const blog: BlogViewModel | null =
      await this.blogsQueryRepository.findBlogByBlogId(command.blogId);

    if (!blog) {
      return null;
    }

    const createdAt = new Date().toISOString();

    return await this.postsRepository.createPost(
      command.title,
      command.shortDescription,
      command.content,
      command.blogId,
      blog.name,
      createdAt,
    );
  }
}
