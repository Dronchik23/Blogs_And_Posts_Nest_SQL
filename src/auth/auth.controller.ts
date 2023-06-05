import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Scope,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { TokenType, UserDBType } from '../types/types';
import { CustomJwtService } from '../jwt/jwt.service';
import {
  CodeInputModel,
  LoginInputModel,
  NewPasswordInputModel,
  RegistrationEmailResendingModel,
  UserInputModel,
} from '../models/models';
import { BearerAuthGuard } from './strategys/bearer-strategy';
import { SkipThrottle } from '@nestjs/throttler';
import { ClientIp, CurrentUser, JwtPayload, UserAgent } from './decorators';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UsersQueryRepository } from '../query-repositorys/users-query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { RegistrationUserCommand } from '../use-cases/users/registration-user-use-case';
import { LoginCommand } from '../use-cases/auth/login-use-case';
import { RefreshTokenCommand } from '../use-cases/auth/refresh-token-use-case';
import { PasswordRecoveryCommand } from '../use-cases/auth/password-recovery-use-case';
import { NewPasswordCommand } from '../use-cases/auth/new-password-use-case';
import { RegistrationConfirmationCommand } from '../use-cases/auth/registration-confirmation-use-case';
import { LogoutCommand } from '../use-cases/auth/logout-use-case';
import { RegistrationEmailResendingCommand } from '../use-cases/auth/registration-email-resending-use-case';
import { isNil } from '@nestjs/common/utils/shared.utils';

@Controller({ path: 'auth', scope: Scope.REQUEST })
export class AuthController {
  constructor(
    private jwtService: CustomJwtService,
    private usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginInputModelDto: LoginInputModel,
    @UserAgent() title,
    @ClientIp() ip,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.commandBus.execute(
      new LoginCommand(loginInputModelDto, ip, title),
    );
    if (!tokens) {
      throw new UnauthorizedException();
    }
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return {
      accessToken: tokens.accessToken,
    };
  }

  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @JwtPayload() jwtPayload,
  ) {
    const tokens: TokenType | null = await this.commandBus.execute(
      new RefreshTokenCommand(jwtPayload, jwtPayload.refreshToken),
    );
    if (!tokens) {
      throw new UnauthorizedException();
    }
    return res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .send({
        accessToken: tokens.accessToken,
      });
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body('email') email: string) {
    const user: UserDBType =
      await this.usersQueryRepository.findUserByLoginOrEmail(email);
    if (user) {
      await this.commandBus.execute(new PasswordRecoveryCommand(user.email));
      return HttpStatus.NO_CONTENT;
    }
    return HttpStatus.NO_CONTENT;
  }

  @Post('new-password')
  async newPassword(@Body() newPasswordInputModelDto: NewPasswordInputModel) {
    const user: any =
      await this.usersQueryRepository.findUserByPasswordRecoveryCode(
        newPasswordInputModelDto.recoveryCode,
      );
    if (isNil(user)) {
      return HttpStatus.NO_CONTENT;
    }
    await this.commandBus.execute(
      new NewPasswordCommand(newPasswordInputModelDto.newPassword, user!.id),
    );
    return HttpStatus.NO_CONTENT;
  }

  @Post('registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(@Body() codeInputModelDTO: CodeInputModel) {
    const result = await this.commandBus.execute(
      new RegistrationConfirmationCommand(codeInputModelDTO.code),
    );
    if (isNil(result)) {
      throw new BadRequestException();
    }
  }
  @Post('registration')
  @HttpCode(204)
  async registration(@Body() createUserDTO: UserInputModel): Promise<any> {
    const user = await this.usersQueryRepository.findUserByEmail(
      createUserDTO.email,
    );
    if (user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'E-mail already in use',
            field: 'email',
          },
        ],
      });
    }
    await this.commandBus.execute(new RegistrationUserCommand(createUserDTO));
  }

  @Post('registration-email-resending')
  @HttpCode(204)
  async registrationEmailResending(
    @Body() registrationEmailResendingDTO: RegistrationEmailResendingModel,
  ) {
    const email = await this.commandBus.execute(
      new RegistrationEmailResendingCommand(
        registrationEmailResendingDTO.email,
      ),
    ); // check email for existent
    if (!email) {
      throw new BadRequestException({
        message: [
          {
            message: 'E-mail already in use',
            field: 'email',
          },
        ],
      });
    }
    return HttpStatus.NO_CONTENT;
  }

  @SkipThrottle()
  @UseGuards(BearerAuthGuard)
  @Get('me')
  async me(@CurrentUser() currentUser) {
    return {
      login: currentUser.login,
      email: currentUser.email,
      userId: currentUser.id,
    };
  }

  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@JwtPayload() jwtPayload) {
    const lastActiveDate = new Date(jwtPayload.iat * 1000).toISOString();
    const device = await this.commandBus.execute(
      new LogoutCommand(
        jwtPayload.deviceId,
        jwtPayload.userId,
        lastActiveDate,
        jwtPayload.refreshToken,
      ),
    );
    if (isNil(device)) {
      throw new UnauthorizedException();
    }
  }
}
