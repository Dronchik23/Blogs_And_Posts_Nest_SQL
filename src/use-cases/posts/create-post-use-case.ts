import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BlogPostInputModel,
  BlogViewModel,
  PostViewModel,
} from '../../models/models';
import { BlogsQueryRepository } from '../../query-repositorys/blogs-query.repository';
import { PostsRepository } from '../../posts/post.repository';

export class CreatePostCommand {
  constructor(
    public blogPostCreateDTO: BlogPostInputModel,
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

    const post: PostViewModel = await this.postsRepository.createPost(
      command.blogPostCreateDTO,
      blog,
    );
    return post;
  }
}
