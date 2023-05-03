import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel, UserViewModel } from '../src/types and models/models';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailAdapter } from '../src/email/email.adapter';

describe('sa/users (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);

  let app: INestApplication;
  let server: any;
  let user: UserViewModel;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  const url = '/sa/users';
  const wipeAllData = '/testing/all-data';
  const userAgent = {
    'User-Agent': 'jest user-agent',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailAdapter)
      .useValue(mokEmailAdapter)
      .compile();

    app = moduleFixture.createNestApplication();
    app = createApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('sa/users', () => {
    describe('get users tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

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
      it('should get all users', async () => {
        await request(server)
          .get(url)
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [user],
          });
      });
    });
    describe('ban user tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

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
      it('should not ban user that not exist', async () => {
        const fakeUserId = 500;
        await request(server)
          .put(`/sa/users/${fakeUserId}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters',
          })
          .expect(404);
      });
      it('should not ban user with incorrect input data', async () => {
        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: '',
          })
          .expect(400);

        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: 'true',
            banReason: 'valid string more than 20 letters',
          })
          .expect(400);
      });
      it('should not ban user with incorrect authorization data', async () => {
        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', '')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(401);

        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('', 'qwerty')
          .send({
            isBanned: 'true',
            banReason: 'valid string more than 20 letters',
          })
          .expect(401);
      });
      it('should ban/unban user with correct data', async () => {
        await request(server)
          .put(url + `/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204);

        const responseForUser2 = await request(server)
          .get(url + `/${user.id}/`)
          .auth('admin', 'qwerty');

        user = responseForUser2.body;
        expect(user.banInfo.isBanned).toBe(true);

        await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: 'user@gmail.com',
            password: 'password',
          })
          .expect(401);

        await request(server)
          .put(url + `/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: false,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204);

        const responseForUser3 = await request(server)
          .get(url + `/${user.id}/`)
          .auth('admin', 'qwerty');

        user = responseForUser3.body;
        expect(user.banInfo.isBanned).toBe(false);

        await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: 'user@gmail.com',
            password: 'password',
          })
          .expect(200);
      });
    });
    describe('create user tests', () => {
      it('should create user with correct input data', async () => {
        await request(server).delete(wipeAllData);

        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password',
          email: `user2@gmail.com`,
        };

        const createResponseForUser2 = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send({
            login: createUserDto2.login,
            password: createUserDto2.password,
            email: createUserDto2.email,
          })
          .expect(201);

        const user2 = createResponseForUser2.body;

        await request(server)
          .get('/sa/users')
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [user2],
          });
      });
      it('should not create user with incorrect input data', async () => {
        await request(server).delete(wipeAllData);

        await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send({ login: '', password: 'valid', email: 'valid' })
          .expect(400);

        await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send({ login: 'valid', password: '', email: 'valid' })
          .expect(400);

        await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send({ login: 'valid', password: 'valid', email: '' })
          .expect(400);

        await request(server)
          .get('/sa/users')
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
      it('should not create user with incorrect authorization data', async () => {
        await request(server).delete(wipeAllData);
        await request(server)
          .post('/sa/users')
          .auth('admin', '')
          .send({
            login: 'validLogin',
            password: 'validpassword',
            email: 'user@gmail.com',
          })
          .expect(401);

        await request(server)
          .post('/sa/users')
          .auth('', 'qwerty')
          .send({
            login: 'validLogin',
            password: 'validpassword',
            email: 'valid@gmail.com',
          })
          .expect(401);

        await request(server)
          .get('/sa/users')
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
    });
    describe('update ban status user tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

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
      it('should not update user ban status with incorrect input data', async () => {
        const reqWithIncorrectIsBanned = await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({ isBanned: '', banReason: 'validStringMoreThen20words' });

        expect(reqWithIncorrectIsBanned.status).toBe(400);
        expect(reqWithIncorrectIsBanned.body).toEqual({
          errorsMessages: [
            {
              field: 'isBanned',
              message: expect.any(String),
            },
          ],
        });

        const reqWithIncorrectBanReason = await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({ isBanned: true, banReason: '' });

        expect(reqWithIncorrectBanReason.status).toBe(400);
        expect(reqWithIncorrectBanReason.body).toEqual({
          errorsMessages: [
            {
              field: 'banReason',
              message: expect.any(String),
            },
          ],
        });
      });
      it('should not update user ban status that not exist ', async () => {
        await request(server)
          .put('/sa/users' + -12)
          .auth('admin', 'qwerty')
          .send({ login: 'valid', password: 'valid', email: 'valid' })
          .expect(404);
      });
      it('should not update user ban status with bad auth params', async () => {
        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .set('Authorization', `Basic YWRtaW`)
          .send({ login: 'valid', password: '', email: 'valid' })
          .expect(401);

        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .set('Authorization', `Bearer YWRtaW46cXdlcnR5`)
          .send({ login: 'valid', password: 'valid', email: 'valid' })
          .expect(401);
      });
    });
    describe('delete user tests', () => {
      it('should not delete user that not exist ', async () => {
        await request(server)
          .delete('/sa/users' + `7hd9300388u`)
          .auth('admin', 'qwerty')
          .expect(404);
      });
      it('should not delete user with bad auth params', async () => {
        await request(server)
          .delete(`/sa/users/${user.id}`)
          .auth('admin', 'invalid')
          .expect(401);

        await request(server)
          .delete(`/sa/users/${user.id}`)
          .auth('Authorization', `Bearer YWRtaW46cXdlcnR5`)
          .expect(401);
      });
      it('should delete user with correct id', async () => {
        await request(server).delete(wipeAllData);

        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password',
          email: `user2@gmail.com`,
        };

        const responseForUser2 = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto2);

        const user2 = responseForUser2.body;

        expect(user2).toBeDefined();

        await request(server)
          .delete(`/sa/users/${user2.id}`)
          .auth('admin', 'qwerty')
          .expect(204);

        await request(server)
          .get(`/sa/users/${user2.id}`)
          .auth('admin', 'qwerty')
          .expect(404);
      });
    });
  });
});
