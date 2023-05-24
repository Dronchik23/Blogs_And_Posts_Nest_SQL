import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../sa/users/users-repository';
import { BanUserInputModel } from '../../models/models';
import { NotFoundException } from '@nestjs/common';

export class BanUserByUserIdBySACommand {
  constructor(public userId: string, public banUserDTO: BanUserInputModel) {}
}

@CommandHandler(BanUserByUserIdBySACommand)
export class BanUserByUserIdService
  implements ICommandHandler<BanUserByUserIdBySACommand>
{
  constructor(
    private readonly userQueryRepo: UsersQueryRepository,
    private readonly userRepo: UsersRepository,
  ) {}

  async execute(command: BanUserByUserIdBySACommand): Promise<boolean> {
    const user = await this.userQueryRepo.findUserByUserId(command.userId);
    if (!user) {
      throw new NotFoundException();
    }
    if (user.banInfo.isBanned === command.banUserDTO.isBanned) return null;
    const banDate = new Date().toISOString();
    return await this.userRepo.changeBanStatusForUserBySA(
      command.userId,
      command.banUserDTO,
      banDate,
    );
  }
}
