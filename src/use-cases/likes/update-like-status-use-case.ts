import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeDBType, LikeStatus } from '../../types and models/types';
import { LikesRepository } from '../../likes/like.repository';
import { ObjectId } from 'mongodb';

export class UpdateLikeStatusCommand {
  constructor(
    public parentId: string,
    public userId: string,
    public userLogin: string,
    public newLikeStatus: LikeStatus,
  ) {}
}

@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusService
  implements ICommandHandler<UpdateLikeStatusCommand>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(command: UpdateLikeStatusCommand): Promise<any> {
    const newLike = new LikeDBType(
      new ObjectId(command.parentId),
      new ObjectId(command.userId),
      command.userLogin,
      command.newLikeStatus,
      new Date().toISOString(),
    );
    return await this.likesRepository.updateLikeStatus(newLike);
  }
}
