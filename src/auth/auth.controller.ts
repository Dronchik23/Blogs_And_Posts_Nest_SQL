import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  UseInterceptors,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { TokenType, UserDBType } from '../types and models/types';
import { AuthService } from './auth.service';
import { JwtService } from '../jwt/jwt.service';
import { DevicesService } from '../devices/device.service';
import {
  CodeInputModel,
  LoginInputModel,
  RegistrationEmailResendingModel,
  UserInputModel,
} from '../types and models/models';
import { BearerAuthGuard } from './strategys/bearer-strategy';
import { SkipThrottle } from '@nestjs/throttler';
import { ClientIp, CurrentUser, JwtPayload, UserAgent } from './decorators';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private devicesService: DevicesService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginInputModelDto: LoginInputModel,
    @UserAgent() title,
    @ClientIp() ip,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginOrEmail = loginInputModelDto.loginOrEmail;
    const password = loginInputModelDto.password;
    const tokens = await this.authService.login(
      loginOrEmail,
      password,
      ip,
      title,
    );
    console.log('tokens', tokens);
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
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @JwtPayload() jwtPayload,
  ) {
    debugger;
    const tokens: TokenType | null = await this.authService.refreshToken(
      jwtPayload,
    );
    if (!tokens) {
      throw new UnauthorizedException();
    }
    return res
      .status(201)
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .send({ accessToken: tokens.accessToken });
  }

  @Post('passwordRecovery')
  async passwordRecovery(@Body('email') email: string) {
    const user: any = await this.usersService.findUserByEmail(email);
    if (user) {
      await this.authService.sendRecoveryCode(user.accountData.email);
      return HttpStatus.NO_CONTENT;
    }
    return HttpStatus.NO_CONTENT;
  }

  @Post('newPassword')
  async newPassword(
    @Body() body: { newPassword: string; recoveryCode: string },
  ) {
    const { newPassword, recoveryCode } = body;
    const user = await this.usersService.findUserByRecoveryCode(recoveryCode);
    if (!user) {
      return HttpStatus.NO_CONTENT;
    }
    await this.usersService.changePassword(newPassword, user!._id);
    return HttpStatus.NO_CONTENT;
  }

  @Post('registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(@Body() codeInputModelDTO: CodeInputModel) {
    const result = await this.authService.confirmEmail(codeInputModelDTO.code);
    if (!result) {
      throw new BadRequestException();
    }
  }
  @SkipThrottle()
  @Post('registration')
  async registration(@Body() createUserDTO: UserInputModel): Promise<any> {
    const user = await this.usersService.findUserByEmail(createUserDTO.email);
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
    const newUser = await this.usersService.createUser(
      createUserDTO.login,
      createUserDTO.email,
      createUserDTO.password,
    );
    return HttpStatus.NO_CONTENT;
  }

  @Post('registration-email-resending')
  async registrationEmailResending(
    @Body() registrationEmailResendingDTO: RegistrationEmailResendingModel,
  ) {
    const haveAnyEmailLikeThis = await this.authService.resendConfirmationCode(
      registrationEmailResendingDTO.email,
    );
    if (!haveAnyEmailLikeThis) {
      throw new BadRequestException({
        errorsMessages: [
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
    const device =
      await this.devicesService.findAndDeleteDeviceByDeviceIdUserIdAndDate(
        jwtPayload.deviceId,
        jwtPayload.userId,
        lastActiveDate,
      );
    if (!device) {
      throw new UnauthorizedException();
    }
  }
}
