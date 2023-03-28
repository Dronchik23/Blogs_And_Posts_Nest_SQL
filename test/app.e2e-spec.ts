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

  // desc SA/users
  // =>  desc GET
  // =>  desc POST
  // => => => it wipe all data
  // => => => it 401 (without auth | bad auth)
  // => => => it 400 invalid input data
  // => => => it 201 create user  ===========================>>>>>>>> to func
  // => => => it 200 get user === user from 201
  // => => => it 400 try create user with login or email already in db
  // =>  desc PUT
  // => => => it wipe all data
  // => => => it prepare data(user from func)
  // => => => it 401 (without auth | bad auth)
  // => => => it 400 invalid input data
  // it 404
  // put
  // => => => it 200 get user !== user from 201
  // =>  desc DELETE
  describe('create user', () => {
    const wipeAllDataUrl = '/testing/all-data';
    const usersUrl = '/sa/users';
    const loginUrl = '/auth/login';
    const countOfUsers = 10;
    it('should wipe all data before tests', async () => {
      await request(server).delete(wipeAllDataUrl);
    });
    it('prepare data for test (users, blog, post)', async () => {
      //const users = [];
      // for (let i = 0; i < countOfUsers; i++)
      const createUserDto: UserInputModel = {
        login: `user`,
        password: 'password',
        email: `user@gmail.com`,
      };
      const createUserResponse = await request(server)
        .post(usersUrl)
        .auth('admin', 'qwerty')
        .send(createUserDto);

      /*     const loginUser = await request(server).post(loginUrl).send({
        loginOrEmail: createUserDto.login,
        password: createUserDto.password,
      });

      const accessToken = loginUser.body.accessToken;
      const user = {
        ...createUserDto,
        ...createUserResponse.body,
        accessToken,
      };*/
      console.log(createUserResponse.body);
      expect(createUserResponse.body).toBeDefined();
    });
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

/* describe('create user', () => {
  it('should wipe all data before tests', async () => {
    await request(server).delete('/testing/all-data');
  });
  it('should create new user', async () => {
    const userData: UserInputModel = {
      login: 'John',
      password: '123456',
      email: 'johndoe@example.com',
    };

    const response = await request(server)
      .post('sa/users')
      .auth('admin', 'qwerty')
      .send(userData);

    const user: UserViewModel = response.body;
    console.log(user);
    expect(user.login).toEqual(userData.login);
    expect(user.email).toEqual(userData.email);
  });
});*/
