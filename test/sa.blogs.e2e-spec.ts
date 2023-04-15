import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/types and models/models';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EmailAdapter } from '../src/email/email.adapter';
import { disconnect } from 'mongoose';

describe('sa/blogs tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let server: any;
  let accessToken;
  let blog;
  let user;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  const url = '/sa/blogs';
  const wipeAllDataUrl = '/testing/all-data';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env['MONGO_URI'] = mongoUri;

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
    await disconnect();
  });

  describe('sa/blogs', () => {
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

      const loginUser = await request(server).post('/auth/login').send({
        loginOrEmail: createUserDto.login,
        password: createUserDto.password,
      });

      accessToken = loginUser.body.accessToken;

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
    it('should get all blogs', async () => {
      const response = await request(server)
        .get('/sa/blogs')
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
