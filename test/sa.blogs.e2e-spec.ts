import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/types and models/models';
import { MailBoxImap } from './imap.service';
import { isUUID } from 'class-validator';
import jwt from 'jsonwebtoken';
import { settings } from '../src/jwt/jwt.settings';
import { DeviceDBType } from '../src/types and models/types';

describe('AppController (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let server: any;
  let accessToken;
  let refreshToken;
  let deviceId;
  let blog;
  let post;
  let user;
  let comment;
  const bloggerUrl = 'blogger/blogs';
  const wipeAllDataUrl = '/testing/all-data';

  beforeEach(async () => {
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

    const loginUser = await request(server).post('/auth/login').send({
      loginOrEmail: createUserDto.login,
      password: createUserDto.password,
    });

    accessToken = loginUser.body.accessToken;

    refreshToken = loginUser.headers['set-cookie'][0]
      .split(';')[0]
      .split('=')[1];
    console.log('refreshToken', refreshToken);

    const decodedToken: any = await jwt.verify(
      refreshToken,
      settings.JWT_REFRESH_SECRET,
    );

    deviceId = decodedToken.deviceId;

    const responseForBlog = await request(server)
      .post('/blogger/blogs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'name',
        websiteUrl: 'https://youtube.com',
        description: 'valid description',
      });

    blog = responseForBlog.body;
    expect(blog).toBeDefined();
  });

  /*  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: mongod.getUri(),
            useNewUrlParser: true,
            useUnifiedTopology: true,
          }),
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });*/

  afterAll(async () => {
    const mailBox: MailBoxImap = expect.getState().mailBox;
    await mailBox.disconnect();

    await app.close();
  });

  describe('sa/blogs', () => {
    const url = '/sa/blogs';

    beforeAll(async () => {
      await request(server).delete(wipeAllDataUrl);
    });

    it('should get all blogs', async () => {
      const response = await request(server)
        .get(url)
        .auth('admin', 'qwerty')
        .expect(200);

      expect(response.body).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            websiteUrl: expect.any(String),
            createdAt: expect.any(String),
            isMembership: expect.any(Boolean),
            blogOwnerInfo: expect.any(Object),
          }),
        ]),
      });
    });

    it('should return 404 for not existing blog', async () => {
      await request(server)
        .get(url + 1)
        .expect(404);
    });
  });
});
