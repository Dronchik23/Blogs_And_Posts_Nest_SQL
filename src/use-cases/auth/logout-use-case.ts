import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../devices/device.repository';
import { DeviceDBType } from '../../types/types';
import { DevicesQueryRepository } from '../../query-repositorys/devices-query.repository';
import { TokensRepository } from '../../tokens/tokens.repository';
import { UnauthorizedException } from '@nestjs/common';

export class LogoutCommand {
  constructor(
    public deviceId: string,
    public userId: string,
    public lastActiveDate: string,
    public refreshToken: string,
  ) {}
}

@CommandHandler(LogoutCommand)
export class LogoutService implements ICommandHandler<LogoutCommand> {
  constructor(
    private readonly devicesQueryRepository: DevicesQueryRepository,
    private readonly devicesRepository: DevicesRepository,
    private readonly tokensRepository: TokensRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<DeviceDBType> {
    const expiredRefreshToken = await this.tokensRepository.findBannedToken(
      command.refreshToken,
    );
    if (expiredRefreshToken) {
      throw new UnauthorizedException();
    }

    await this.devicesQueryRepository.findDeviceByDeviceIdUserIdAndDate(
      command.deviceId,
      command.userId,
      command.lastActiveDate,
    );

    await this.tokensRepository.addToRefreshTokenBlackList(
      command.refreshToken,
    );

    return this.devicesRepository.findAndDeleteDeviceByDeviceIdUserIdAndDate(
      command.deviceId,
      command.userId,
      command.lastActiveDate,
    );
  }
}
