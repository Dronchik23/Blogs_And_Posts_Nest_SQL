import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/models/models';
import jwt from 'jsonwebtoken';
import { settings } from '../src/jwt/jwt.settings';
import { DeviceDBType, UserDBType } from '../src/types/types';
import { EmailAdapter } from '../src/email/email.adapter';
import { UsersQueryRepository } from '../src/query-repositorys/users-query.repository';
import { sleep } from './helpers/sleepfunction';

describe('auth (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let server: any;
  let usersQueryRepository: UsersQueryRepository;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  let accessToken;
  let refreshToken;
  let deviceId;
  let user;
  const userAgent = {
    'User-Agent': 'jest user-agent',
  };
  const wipeAllDataUrl = '/testing/all-data';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailAdapter)
      .useValue(mokEmailAdapter)
      .compile();

    app = moduleFixture.createNestApplication();
    app = createApp(app);
    usersQueryRepository = app.get(UsersQueryRepository);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    describe('password-recovery tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);

        const createUserDto: UserInputModel = {
          login: `user`,
          password: 'password',
          email: `user@gmail.com`,
        };

        const responseForUser = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto);

        user = responseForUser.body;
        expect(user).toBeDefined();
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds', async () => {
        const email = 'any@gmail.com';
        for (let i = 0; i < 5; i++) {
          await request(server)
            .post('/auth/password-recovery')
            .send({
              email,
            })
            .expect(204);
        }
        await request(server)
          .post('/auth/password-recovery')
          .send({
            email,
          })
          .expect(429);
      }, 10000);
      it('should not send password recovery with incorrect input data', () => {
        request(server)
          .post('/auth/login')
          .send({
            email: '',
          })
          .expect(400);

        request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: user.login,
            password: '',
          })
          .expect(400);
      });
      it('should return 204 even if current email is not registered', () => {
        request(server)
          .post('/auth/password-recovery')
          .send({
            email: 'user799jj@gmail.com',
          })
          .expect(204);
      });
      it('should send email with new recovery code', () => {
        request(server)
          .post('/auth/password-recovery')
          .send({
            email: 'user@gmail.com',
          })
          .expect(204);
      });
    });
    describe.skip('refreshToken tests', () => {
      it('some test', async () => {
        'some logik';
      });
    });
    describe('new password tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);

        const createUserDto: UserInputModel = {
          login: `user`,
          password: 'password',
          email: `user@gmail.com`,
        };

        const responseForUser = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto);

        user = responseForUser.body;
        expect(user).toBeDefined();
      });
      it('should not change password with incorrect input data', async () => {
        await request(server)
          .post('/auth/new-password')
          .send({
            newPassword: '',
            recoveryCode: 'valid',
          })
          .expect(400);

        await request(server)
          .post('/auth/new-password')
          .send({
            newPassword: 'valid',
            recoveryCode: '',
          })
          .expect(400);
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds', async () => {
        for (let i = 0; i < 5; i++) {
          await request(server).post('/auth/new-password').send({
            newPassword: '1234567789',
            recoveryCode: 'valid',
          });
        }
        await request(server)
          .post('/auth/new-password')
          .send({
            newPassword: '1234567789',
            recoveryCode: 'valid',
          })
          .expect(429);
      });
    });
    describe('login tests ', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);

        const createUserDto: UserInputModel = {
          login: `user`,
          password: 'password',
          email: `user@gmail.com`,
        };

        const responseForUser = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto);

        user = responseForUser.body;
        expect(user).toBeDefined();
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to login', async () => {
        await sleep(10);
        for (let i = 0; i < 5; i++) {
          request(server).post('/auth/login').send({
            loginOrEmail: 'user',
            password: 'password',
          });
        }
        request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: 'user',
            password: 'password',
          })
          .expect(429);
      });
      it('should login with incorrect input data', async () => {
        await sleep(10);

        await request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: '',
            password: 'password',
          })
          .expect(400);

        await request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: '',
            password: 'password',
          })
          .expect(400);
      });
      it('should send 401 if password, login or email is wrong', async () => {
        await request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: 'us',
            password: 'password',
          })
          .expect(401);

        await request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: 'user',
            password: 'pass',
          })
          .expect(401);

        await request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: 'us@gmail.com',
            password: 'password',
          })
          .expect(401);
      });
      it('should login user with correct login', async () => {
        await sleep(10);
        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: 'user',
            password: 'password',
          })
          .expect(200);

        const accessToken2 = loginUser2.body.accessToken;

        expect(accessToken2).toBeDefined();
      });
      it('should login user with correct email', async () => {
        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: 'user@gmail.com',
            password: 'password',
          })
          .expect(200);

        const accessToken2 = loginUser2.body.accessToken;

        expect(accessToken2).toBeDefined();
      });
    });
    describe('registration confirmation test', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);

        const createUserDto: UserInputModel = {
          login: `user`,
          password: 'password',
          email: `user@gmail.com`,
        };

        const responseForUser = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto);

        user = responseForUser.body;
        expect(user).toBeDefined();
      });
      it('should not confirmation with incorrect input data', async () => {
        await request(server)
          .post('/auth/registration-confirmation')
          .send({
            code: '',
          })
          .expect(400);
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to change password', async () => {
        for (let i = 0; i < 5; i++) {
          await request(server).post('/auth/registration-confirmation').send({
            code: 'valid',
          });
        }

        await request(server)
          .post('/auth/registration-confirmation')
          .send({
            loginOrEmail: 'user',
            password: 'password',
          })
          .expect(429);
      });
      it('should confirm registration with correct input data', async () => {
        await sleep(10);

        await request(server).delete(wipeAllDataUrl);

        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password',
          email: `user2@gmail.com`,
        };

        await request(server)
          .post('/auth/registration')
          .send({
            login: createUserDto2.login,
            password: createUserDto2.password,
            email: createUserDto2.email,
          })
          .expect(204);

        const userDBType: UserDBType =
          await usersQueryRepository.findUserByLogin(createUserDto2.login);

        expect(userDBType).toBeDefined();

        const code = userDBType.confirmationCode;

        await request(server)
          .post('/auth/registration-confirmation')
          .send({
            code: code,
          })
          .expect(204);
      });
    });
    describe('registration tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);
      });
      it('should not registered with incorrect input data', async () => {
        await request(server)
          .post('/auth/registration')
          .send({
            login: '',
            password: 'validpassword',
            email: 'user2@gmail.com',
          })
          .expect(400);

        await request(server)
          .post('/auth/registration')
          .send({
            login: 'valid',
            password: '',
            email: 'user2@gmail.com',
          })
          .expect(400);

        await request(server)
          .post('/auth/registration')
          .send({
            login: 'valid',
            password: 'validpassword',
            email: 'user.com',
          })
          .expect(400);
      });
      it('should registered with correct input data', async () => {
        await request(server)
          .post('/auth/registration')
          .send({
            login: 'valid',
            password: 'validpassword',
            email: 'user2@gmail.com',
          })
          .expect(204);
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to use registration', async () => {
        for (let i = 0; i < 5; i++) {
          await request(server).post('/auth/registration').send({
            login: 'valid',
            password: 'validpassword',
            email: 'user2@gmail.com',
          });
        }

        await request(server)
          .post('/auth/registration')
          .send({
            login: 'valid',
            password: 'validpassword',
            email: 'user2@gmail.com',
          })
          .expect(429);
      });
    });
    describe('registration email resending tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);

        const createUserDto: UserInputModel = {
          login: `user`,
          password: 'password',
          email: `user@gmail.com`,
        };

        const responseForUser = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto);

        user = responseForUser.body;
        expect(user).toBeDefined();
      });
      it('should not resend email with incorrect input data', async () => {
        await request(server)
          .post('/auth/registration-email-resending')
          .send({
            email: '',
          })
          .expect(400);
      });
      it('should resend email with correct input data', async () => {
        await sleep(10);

        await request(server).delete(wipeAllDataUrl);

        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password',
          email: `user2@gmail.com`,
        };

        await request(server)
          .post('/auth/registration')
          .send({
            login: createUserDto2.login,
            password: createUserDto2.password,
            email: createUserDto2.email,
          })
          .expect(204);

        await request(server)
          .post('/auth/registration-email-resending')
          .send({
            email: createUserDto2.email,
          })
          .expect(204);
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to resend email', async () => {
        for (let i = 0; i < 5; i++) {
          await request(server)
            .post('/auth/registration-email-resending')
            .send({
              email: 'user@gmail.com',
            });
        }

        await request(server)
          .post('/auth/registration-email-resending')
          .send({
            email: 'user@gmail.com',
          })
          .expect(429);
      });
    });
    describe('logout tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);

        const createUserDto: UserInputModel = {
          login: `user`,
          password: 'password',
          email: `user@gmail.com`,
        };

        const responseForUser = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto);

        user = responseForUser.body;
        expect(user).toBeDefined();

        const loginUser = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto.login,
            password: createUserDto.password,
          });

        accessToken = loginUser.body.accessToken;

        refreshToken = loginUser.headers['set-cookie'][0]
          .split(';')[0]
          .split('=')[1];
      });
      it('should logout if refreshToken is actual', async () => {
        await request(server)
          .post('/auth/logout')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(204);
      });
      it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
        await request(server)
          .post('/auth/logout')
          .set('Cookie', `refreshToken=`)
          .expect(401);

        await request(server)
          .post('/auth/logout')
          .set('Cookie', `refreshToken=${refreshToken + 1}`)
          .expect(401);
      });
      it('should send 401 if refreshToken inside cookie is expired', async () => {
        // распарсиваем токен, чтобы получить его содержимое
        const decodedToken: any = jwt.decode(refreshToken);

        // изменяем поле exp на дату из прошлого (например, на дату вчера)
        decodedToken.exp = Math.floor(Date.now() / 1000) - 86400;

        // заново подписываем токен с измененным содержимым
        const invalidToken = jwt.sign(decodedToken, settings.JWT_SECRET);

        // отправляем запрос с измененным токеном
        await request(server)
          .post('/auth/logout')
          .set('Cookie', `refreshToken=${invalidToken}`)
          .expect(401);
      });
    });
    describe('me tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllDataUrl);

        const createUserDto: UserInputModel = {
          login: `user`,
          password: 'password',
          email: `user@gmail.com`,
        };

        const responseForUser = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto);

        user = responseForUser.body;
        expect(user).toBeDefined();

        const loginUser = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto.login,
            password: createUserDto.password,
          });

        accessToken = loginUser.body.accessToken;
      });
      it('should send 401 if authorization data is incorrect', async () => {
        await request(server)
          .get('/auth/me')
          .set('Authorization', `Bearer `)
          .expect(401);

        await request(server).get('/auth/me').expect(401);
      });
      it('should send 200 if authorization data is correct', async () => {
        await request(server)
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
      });
    });
    describe('devices', () => {
      describe('get all devices with current session tests', () => {
        beforeAll(async () => {
          await request(server).delete(wipeAllDataUrl);

          const createUserDto: UserInputModel = {
            login: `user`,
            password: 'password',
            email: `user@gmail.com`,
          };

          const responseForUser = await request(server)
            .post('/sa/users')
            .auth('admin', 'qwerty')
            .send(createUserDto);

          user = responseForUser.body;
          expect(user).toBeDefined();

          const loginUser = await request(server)
            .post('/auth/login')
            .set(userAgent)
            .send({
              loginOrEmail: createUserDto.login,
              password: createUserDto.password,
            });

          accessToken = loginUser.body.accessToken;

          refreshToken = loginUser.headers['set-cookie'][0]
            .split(';')[0]
            .split('=')[1];

          const decodedToken: any = await jwt.verify(
            refreshToken,
            settings.JWT_REFRESH_SECRET,
          );

          deviceId = decodedToken.deviceId;
        });
        it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=`)
            .expect(401);

          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken + 1}`)
            .expect(401);
        });
        it('should send 401 if refreshToken inside cookie is expired', async () => {
          // распарсиваем токен, чтобы получить его содержимое
          const decodedToken: any = jwt.decode(refreshToken);

          // изменяем поле exp на дату из прошлого (например, на дату вчера)
          decodedToken.exp = Math.floor(Date.now() / 1000) - 86400;

          // заново подписываем токен с измененным содержимым
          const invalidToken = jwt.sign(decodedToken, settings.JWT_SECRET);

          // отправляем запрос с измененным токеном
          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${invalidToken}`)
            .expect(401);
        });
        it('should send 200 if refreshToken inside cookie is correct', async () => {
          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200)
            .expect((res) => {
              const devices = res.body as DeviceDBType[];
              expect(devices.length).toBeGreaterThan(0);
              expect(devices[0].deviceId).toEqual(deviceId);
            });
        });
      });
      describe('terminate all sessions exclude current tests', () => {
        beforeAll(async () => {
          await sleep(10);

          await request(server).delete(wipeAllDataUrl);

          const createUserDto: UserInputModel = {
            login: `user`,
            password: 'password',
            email: `user@gmail.com`,
          };

          const responseForUser = await request(server)
            .post('/sa/users')
            .auth('admin', 'qwerty')
            .send(createUserDto);

          user = responseForUser.body;
          expect(user).toBeDefined();

          const loginUser = await request(server)
            .post('/auth/login')
            .set(userAgent)
            .send({
              loginOrEmail: createUserDto.login,
              password: createUserDto.password,
            });

          accessToken = loginUser.body.accessToken;

          refreshToken = loginUser.headers['set-cookie'][0]
            .split(';')[0]
            .split('=')[1];

          const decodedToken: any = await jwt.verify(
            refreshToken,
            settings.JWT_REFRESH_SECRET,
          );

          deviceId = decodedToken.deviceId;
        });
        it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=`)
            .expect(401);

          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken + 1}`)
            .expect(401);
        });
        it('should send 401 if refreshToken inside cookie is expired', async () => {
          // распарсиваем токен, чтобы получить его содержимое
          const decodedToken: any = jwt.decode(refreshToken);

          // изменяем поле exp на дату из прошлого (например, на дату вчера)
          decodedToken.exp = Math.floor(Date.now() / 1000) - 86400;

          // заново подписываем токен с измененным содержимым
          const invalidToken = jwt.sign(decodedToken, settings.JWT_SECRET);

          // отправляем запрос с измененным токеном
          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=${invalidToken}`)
            .expect(401);
        });
        it('should send 204 if refreshToken inside cookie is correct', async () => {
          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(204);

          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200);
        });
      });
      describe('terminate session by deviceId tests', () => {
        beforeAll(async () => {
          await request(server).delete(wipeAllDataUrl);

          const createUserDto: UserInputModel = {
            login: `user`,
            password: 'password',
            email: `user@gmail.com`,
          };

          const responseForUser = await request(server)
            .post('/sa/users')
            .auth('admin', 'qwerty')
            .send(createUserDto);

          user = responseForUser.body;
          expect(user).toBeDefined();

          const loginUser = await request(server)
            .post('/auth/login')
            .set(userAgent)
            .send({
              loginOrEmail: createUserDto.login,
              password: createUserDto.password,
            });

          accessToken = loginUser.body.accessToken;

          refreshToken = loginUser.headers['set-cookie'][0]
            .split(';')[0]
            .split('=')[1];

          const decodedToken: any = await jwt.verify(
            refreshToken,
            settings.JWT_REFRESH_SECRET,
          );

          deviceId = decodedToken.deviceId;
        });
        it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=`)
            .expect(401);

          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${refreshToken + 1}`)
            .expect(401);
        });
        it('should send 401 if refreshToken inside cookie is expired', async () => {
          // распарсиваем токен, чтобы получить его содержимое
          const decodedToken2: any = jwt.decode(refreshToken);

          // изменяем поле exp на дату из прошлого (например, на дату вчера)
          decodedToken2.exp = Math.floor(Date.now() / 1000) - 86400;

          // заново подписываем токен с измененным содержимым
          const invalidToken = jwt.sign(decodedToken2, settings.JWT_SECRET);

          // отправляем запрос с измененным токеном
          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${invalidToken}`)
            .expect(401);
        });
        it('should send 403 if user try to delete device of another user', async () => {
          await request(server).post('/sa/users').auth('admin', 'qwerty').send({
            login: `user2`,
            password: 'password',
            email: `user2@gmail.com`,
          });

          const loginUser2 = await request(server)
            .post('/auth/login')
            .set(userAgent)
            .send({
              loginOrEmail: 'user2',
              password: 'password',
            });

          const refreshToken2 = loginUser2.headers['set-cookie'][0]
            .split(';')[0]
            .split('=')[1];

          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${refreshToken2}`)
            .expect(403);
        });
        it('should send 204 if refreshToken inside cookie is correct', async () => {
          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(204);

          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200)
            .expect((res) => {
              const devices = res.body as DeviceDBType[];
              expect(Array.isArray(devices)).toBeTruthy();
              expect(devices.some((d) => d.deviceId === deviceId)).toBeFalsy();
            });
        });
      });
    });
  });
});
