import { Controller, Post, Body, Req, Res, Get } from '@nestjs/common';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { TokenType } from '../types and models/types';
import { AuthService } from './auth.service';
import { JwtService } from '../jwt/jwt.service';
import { DevicesService } from '../devices/device.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private devicesService: DevicesService,
  ) {}

  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    const ip = req.ip;
    const title = req.headers['user-agent']!;
    const loginOrEmail = req.body.loginOrEmail;
    const password = req.body.password;
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
    return res.send({ accessToken: tokens.accessToken });
  }

  @Post('refreshToken')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const jwtPayload = req.jwtPayload!;
    const tokens: TokenType | null = await this.authService.refreshToken(
      jwtPayload,
    );
    if (!tokens) return res.sendStatus(401);
    return res
      .status(200)
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .send({ accessToken: tokens.accessToken });
  }

  @Post('passwordRecovery')
  async passwordRecovery(@Body('email') email: string, @Res() res: Response) {
    const user = await this.usersService.findUserByEmail(email);
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

  @Post('registrationConfirmation')
  async registrationConfirmation(
    @Body('code') code: string,
    @Res() res: Response,
  ) {
    const result = await this.authService.confirmEmail(code);
    if (result) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(400);
    }
  }

  @Post('registration')
  async registration(@Body('email') email: string, @Res() res: Response) {
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).send({
        errorsMessages: [
          {
            message: 'E-mail already in use',
            field: 'email',
          },
        ],
      });
    }
    return res.sendStatus(204);
  }

  @Post('registrationEmailResending')
  async registrationEmailResending(
    @Body('email') email: string,
    @Res() res: Response,
  ) {
    await this.authService.resendConfirmationCode(email);
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