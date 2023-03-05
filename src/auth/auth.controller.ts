import { Controller, Post, Body, Req, Res, Get } from '@nestjs/common';
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
  UserCreateModel,
  UserViewModel,
} from '../types and models/models';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private devicesService: DevicesService,
  ) {}

  @Post('login')
  async login(
    @Body() loginInputModelDto: LoginInputModel,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = req.ip;
    const title = req.headers['user-agent']!;
    const loginOrEmail = loginInputModelDto.loginOrEmail;
    const password = loginInputModelDto.password;
    const tokens = await this.authService.login(
      loginOrEmail,
      password,
      ip,
      title,
    );
    if (!tokens) return res.sendStatus(401);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return res.status(200).send({ accessToken: tokens.accessToken });
  }

  @Post('refreshToken')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const jwtPayload = req.jwtPayload!;
    const tokens: TokenType | null = await this.authService.refreshToken(
      jwtPayload,
    );
    if (!tokens) return res.sendStatus(401);
    return res
      .status(201)
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .send({ accessToken: tokens.accessToken });
  }

  @Post('passwordRecovery')
  async passwordRecovery(@Body('email') email: string, @Res() res: Response) {
    const user: any = await this.usersService.findUserByEmail(email);
    if (user) {
      await this.authService.sendRecoveryCode(user.accountData.email);
      return res.sendStatus(204);
    }
    return res.sendStatus(204);
  }

  @Post('newPassword')
  async newPassword(
    @Body() body: { newPassword: string; recoveryCode: string },
    @Res() res: Response,
  ) {
    const { newPassword, recoveryCode } = body;
    const user = await this.usersService.findUserByRecoveryCode(recoveryCode);
    if (!user) {
      return res.sendStatus(204);
    }
    await this.usersService.changePassword(newPassword, user!._id);
    return res.sendStatus(204);
  }

  @Post('registration-confirmation')
  async registrationConfirmation(
    @Body() codeInputModelDTO: CodeInputModel,
    @Res() res: Response,
  ) {
    const result = await this.authService.confirmEmail(codeInputModelDTO.code);
    if (result) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(400);
    }
  }

  @Post('registration')
  async registration(
    @Body() createUserDTO: UserCreateModel,
    @Res() res: Response,
  ): Promise<any> {
    const user = await this.usersService.findUserByEmail(createUserDTO.email);
    if (user) {
      return res.status(400).send({
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
    return res.sendStatus(204);
  }

  @Post('registration-email-resending')
  async registrationEmailResending(
    @Body() registrationEmailResendingDTO: RegistrationEmailResendingModel,
    @Res()
    res: Response,
  ) {
    const haveAnyEmailLikeThis = await this.authService.resendConfirmationCode(
      registrationEmailResendingDTO.email,
    );
    if (!haveAnyEmailLikeThis) {
      return res.status(400).send({
        errorsMessages: [
          {
            message: 'E-mail not found',
            field: 'email',
          },
        ],
      });
    }
    return res.sendStatus(204);
  }

  @Get('me')
  async me(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    return res.send({
      login: user.login,
      email: user.email,
      userId: user.id,
    });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const jwtPayload = req.jwtPayload;
    const lastActiveDate = new Date(jwtPayload.iat * 1000).toISOString();
    const device =
      await this.devicesService.findAndDeleteDeviceByDeviceIdUserIdAndDate(
        jwtPayload.deviceId,
        jwtPayload.userId,
        lastActiveDate,
      );
    if (!device) {
      return res.sendStatus(401);
    } else {
      return res.sendStatus(204);
    }
  }
}
