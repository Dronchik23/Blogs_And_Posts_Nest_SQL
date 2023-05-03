import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../sa/users/users-repository';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { TokenType, UserDBType } from '../../types and models/types';
import { CustomJwtService } from '../../jwt/jwt.service';
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
    private readonly jwtService: CustomJwtService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute(command: LoginCommand): Promise<TokenType> {
    const user = await this.checkCredentials(
      command.loginEmail,
      command.password,
    );
    if (!user) return null;
    if (user.isBanned === true) return null;
    const userId = user.id;
    const deviceId = randomUUID();
    const { accessToken, refreshToken } = this.jwtService.createJWT(
      userId,
      deviceId,
    );
    const lastActiveDate = this.jwtService.getLastActiveDate(refreshToken);

    await this.devicesRepository.createDevice(
      command.ip,
      command.title,
      lastActiveDate,
      deviceId,
      userId,
    ); // create device

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
    if (!user.isRecoveryConfirmed) return null;
    const isHashIsEquals = await bcrypt.compare(password, user.passwordHash); // check hash and password
    if (isHashIsEquals) {
      return user;
    } else {
      return null;
    }
  }
}
