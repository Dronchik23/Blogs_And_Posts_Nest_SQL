import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel, UserViewModel } from '../src/types and models/models';

describe('AppController (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app = createApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe.skip('create user', () => {
    it('should wipe all data before tests', async () => {
      await request(server).delete('/testing/all-data');
    });
    /*  it('should create new user', async () => {
      const userData: UserInputModel = {
        login: 'John',
        password: '123456',
        email: 'johndoe@example.com',
      };

      const response = await request(server)
        .post('sa/users')
        .set('Authorization', `Basic YWRtaW46cXdlcnR5`)
        .send(userData)
        .expect(201);

      const user: UserViewModel = response.body;
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.login).toEqual(userData.login);
      expect(user.email).toEqual(userData.email);
    });*/
  });

  describe('like posts logic', () => {
    const wipeAllDataUrl = '/testing/all-data';
    const usersUrl = '/users';
    const loginUrl = '/auth/login';
    const countOfUsers = 10;
    it('should wipe all data before tests', async () => {
      await request(server).delete(wipeAllDataUrl);
    });
    it('prepare data for test (users, blog, post)', async () => {
      const users = [];
      for (let i = 0; i < countOfUsers; i++) {
        const createUserDto: UserInputModel = {
          login: `user${i}`,
          password: 'password',
          email: `user${i}@gmail.com`,
        };
        const createUserResponse = await request(server)
          .post(usersUrl)
          .auth('admin', 'qwerty')
          .send(createUserDto);

        const loginUser = await request(server).post(loginUrl).send({
          loginOrEmail: createUserDto.login,
          password: createUserDto.password,
        });

        const accessToken = loginUser.body.accessToken;
        const user = {
          ...createUserDto,
          ...createUserResponse.body,
          accessToken,
        };
        console.log(user);
        expect(user).toBeDefined();
      }
    });
  });
});
