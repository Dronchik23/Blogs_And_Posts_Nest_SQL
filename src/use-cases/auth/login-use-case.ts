import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../sa/users/users-repository.service';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import {
  DeviceDBType,
  TokenType,
  UserDBType,
} from '../../types and models/types';
import { JwtService } from '../../jwt/jwt.service';
import { DevicesRepository } from '../../devices/device.repository';

export class LoginCommand {
  constructor(
    public loginEmail: string,
    public password: string,
    public ip: string,
    public title: string,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginService implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly devicesRepository: DevicesRepository,
    private readonly jwtService: JwtService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute(command: LoginCommand): Promise<TokenType> {
    const user = await this.checkCredentials(
      command.loginEmail,
      command.password,
    );
    if (!user) return null;
    if (user.banInfo.isBanned === true) return null;
    const userId = user._id.toString();
    const deviceId = randomUUID().toString();
    const { accessToken, refreshToken } = this.jwtService.createJWT(
      userId,
      deviceId,
    );
    const lastActiveDate = this.jwtService.getLastActiveDate(refreshToken);
    const newDevice = new DeviceDBType(
      command.ip,
      command.title,
      lastActiveDate,
      deviceId,
      userId,
    );
    await this.devicesRepository.createDevice(newDevice);

    return { accessToken, refreshToken };
  }

  private async checkCredentials(
    loginOrEmail: string,
    password: string,
  ): Promise<UserDBType | null> {
    const user = await this.usersQueryRepository.findUserByLoginOrEmail(
      loginOrEmail,
    );
    if (!user) return null;
    if (!user.passwordRecovery.isConfirmed) return null;
    const isHashIsEquals = await bcrypt.compare(
      password,
      user.accountData.passwordHash,
    ); // check hash and password
    if (isHashIsEquals) {
      return user;
    } else {
      return null;
    }
  }
}
