import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserInputModel, UserViewModel } from '../../../src/models/models';
import { EmailAdapter } from '../../../src/email/email.adapter';
import { createApp } from '../../../src/helpers/createApp';
import { AppModule } from '../../../src/app.module';

describe.skip('blogs creator (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);

  let app: INestApplication;
  let server: any;
  let user: UserViewModel;
  let accessToken;
  let blog;
  const userAgent = {
    'User-Agent': 'jest user-agent',
  };
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };

  const wipeAllData = '/testing/all-data';

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

  describe('blogs creator', () => {
    it('should create 10 users', async () => {
      await request(server).delete(wipeAllData);

      const createUserDto: UserInputModel = {
        login: `user`,
        password: 'password',
        email: `user@gmail.com`,
      };

      const createBlogDTO = (i: number) => ({
        name: `name${i}`,
        websiteUrl: `https://youtube${i}.com`,
        description: `valid description${i}`,
      });

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

      for (let i = 1; i <= 10; i++) {
        await request(server)
          .post('/blogger/blogs')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(createBlogDTO(i));
      }

      const getBlogsResponse = await request(server).get('/blogs').expect(200);

      expect(getBlogsResponse.body.totalCount).toEqual(10);
      expect(getBlogsResponse.body.items.length).toEqual(10);

      expect(getBlogsResponse.body.totalCount).toEqual(10);
      expect(getBlogsResponse.body.items.length).toEqual(10);
    });
  });
});
