import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeDBType, LikeStatus } from '../../types and models/types';
import { LikesRepository } from '../../likes/like.repository';
import { ObjectId } from 'mongodb';

export class UpdateLikeStatusCommand {
  constructor(
    public parentId: string,
    public userId: string,
    public login: string,
    public likeStatus: LikeStatus,
  ) {}
}

@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusService
  implements ICommandHandler<UpdateLikeStatusCommand>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(command: UpdateLikeStatusCommand): Promise<any> {
    const addedAt = new Date().toISOString();

    return await this.likesRepository.updateLikeStatus(
      command.parentId,
      command.userId,
      command.login,
      command.likeStatus,
      addedAt,
    );
  }
}
