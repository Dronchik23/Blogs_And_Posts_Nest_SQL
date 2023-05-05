import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../sa/users/users-repository';
import { CustomJwtService } from '../../jwt/jwt.service';
import { JWTPayloadType, TokenType } from '../../types and models/types';
import { DevicesQueryRepository } from '../../query-repositorys/devices-query.repository';
import { DevicesRepository } from '../../devices/device.repository';
import { TokensRepository } from '../../tokens/tokens.repository';
import { UnauthorizedException } from '@nestjs/common';

export class RefreshTokenCommand {
  constructor(public jwtPayload: JWTPayloadType, public refreshToken: string) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenService
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly devicesQueryService: DevicesQueryRepository,
    private readonly devicesRepository: DevicesRepository,
    private readonly jwtService: CustomJwtService,
    private readonly tokensRepository: TokensRepository,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenType> {
    const lastActiveDate = new Date(
      command.jwtPayload.iat * 1000,
    ).toISOString();

    const device =
      await this.devicesQueryService.findDeviceByDeviceIdUserIdAndDate(
        command.jwtPayload.deviceId.toString(),
        command.jwtPayload.userId.toString(),
        lastActiveDate.toString(),
      );
    if (!device) return null;
    console.log(device);

    const expiredRefreshToken = await this.tokensRepository.findBannedToken(
      command.refreshToken,
    );
    if (expiredRefreshToken) {
      throw new UnauthorizedException();
    }

    const { accessToken, refreshToken } = this.jwtService.createJWT(
      command.jwtPayload.userId,
      command.jwtPayload.deviceId,
    );

    const newLastActiveDate = this.jwtService.getLastActiveDate(refreshToken);

    await this.devicesRepository.updateLastActiveDateByDevice(
      command.jwtPayload.deviceId,
      command.jwtPayload.userId,
      newLastActiveDate,
    );

    await this.tokensRepository.addToRefreshTokenBlackList(
      command.refreshToken,
    );

    return { accessToken, refreshToken };
  }
}
