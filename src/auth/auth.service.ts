import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { injectable } from 'inversify';
import { UsersRepository } from '../users/users.repository';
import { EmailService } from '../email/email.controller';
import {
  EmailConfirmationType,
  JWTPayloadType,
} from '../types and models/types';
import { JwtService } from '../jwt/jwt.service';
import { DevicesService } from '../devices/device.service';

@injectable()
export class AuthService {
  constructor(
    protected usersRepository: UsersRepository,
    protected emailService: EmailService,
    protected jwtService: JwtService,
    protected devicesService: DevicesService,
  ) {}

  async login(
    loginOrEmail: string,
    password: string,
    ip: string,
    title: string,
  ) {
    const user = await this.checkCredentials(loginOrEmail, password);
    if (!user) return null;
    const userId = user._id.toString();
    const deviceId = randomUUID();
    const { accessToken, refreshToken } = this.jwtService.createJWT(
      userId,
      deviceId,
    );
    const lastActiveDate = this.jwtService.getLastActiveDate(refreshToken);
    await this.devicesService.createDevice(
      ip,
      title,
      lastActiveDate,
      deviceId,
      userId,
    );
    return { accessToken, refreshToken };
  }

  private async checkCredentials(
    loginOrEmail: string,
    password: string,
  ): Promise<any> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return null;
    console.log(user);
    if (!user.passwordRecovery.isConfirmed) return null;
    const isHashIsEquals = await this.isPasswordCorrect(
      password,
      user.accountData.passwordHash,
    );
    if (isHashIsEquals) {
      return user;
    } else {
      return null;
    }
  }

  private async isPasswordCorrect(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }

  async confirmEmail(code: string): Promise<boolean> {
    const user = await this.usersRepository.findUserByConfirmationCode(code);
    if (!user) return false;
    if (user.emailConfirmation.confirmationCode !== code) return false;
    if (user.emailConfirmation.expirationDate < new Date()) return false;
    return await this.usersRepository.updateConfirmation(user._id);
  }

  async resendConfirmationCode(
    email: string,
  ): Promise<EmailConfirmationType | boolean> {
    const user = await this.usersRepository.findByEmail(email);
    console.log('user service', user);
    if (!user) return false;
    const newCode = randomUUID();
    await this.usersRepository.updateConfirmationCodeByUserId(
      user._id,
      newCode,
    );
    await this.emailService.resendingEmailMessage(
      user.accountData.email,
      newCode,
    );
    return true;
  }

  async refreshToken(jwtPayload: JWTPayloadType) {
    const lastActiveDate = new Date(jwtPayload.iat * 1000).toISOString();
    const device = await this.devicesService.findDeviceByDeviceIdUserIdAndDate(
      jwtPayload.deviceId,
      jwtPayload.userId,
      lastActiveDate,
    );
    if (!device) return null;
    const { accessToken, refreshToken } = this.jwtService.createJWT(
      jwtPayload.userId,
      jwtPayload.deviceId,
    );
    const newLastActiveDate = this.jwtService.getLastActiveDate(refreshToken);
    await this.devicesService.updateLastActiveDateByDevice(
      jwtPayload.deviceId,
      jwtPayload.userId,
      newLastActiveDate,
    );
    return { accessToken, refreshToken };
  }

  async sendRecoveryCode(email: string) {
    const newCode = randomUUID();
    await this.emailService.recoveryCodeMessage(email, newCode);
    await this.usersRepository.updatePasswordRecoveryCodeByEmail(
      email,
      newCode,
    );
    return;
  }
}
