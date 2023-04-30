import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/types and models/models';
import { EmailAdapter } from '../src/email/email.adapter';

describe('sa/blogs tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
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
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('sa/blogs', () => {
    describe('get blogs tests', () => {
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
        console.log('user', user);

        const loginUser = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto.login,
            password: createUserDto.password,
          });

        accessToken = loginUser.body.accessToken;
        console.log('accessToken', accessToken);

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
        console.log('blog', blog);
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
              id: blog.id,
              name: expect.any(String),
              description: expect.any(String),
              websiteUrl: expect.any(String),
              createdAt: expect.any(String),
              isMembership: expect.any(Boolean),
              blogOwnerInfo: expect.any(Object),
              banInfo: expect.any(Object),
            }),
          ]),
        });
      });
    });
    describe('ban blog tests', () => {
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
      it('should not ban blog that not exist', async () => {
        const fakeBlogId = '500';
        await request(server)
          .put(url + `/${fakeBlogId}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
          })
          .expect(404);
      });
      it('should not ban blog with incorrect input data', async () => {
        await request(server)
          .put(url + `/${blog.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: '',
          })
          .expect(400);

        await request(server)
          .put(url + `/${blog.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: 'true',
          })
          .expect(400);
      });
      it('should not ban blog with incorrect authorization data', async () => {
        await request(server)
          .put(url + `/${blog.id}/ban`)
          .auth('admin', '')
          .send({
            isBanned: true,
          })
          .expect(401);

        await request(server)
          .put(url + `/${blog.id}/ban`)
          .auth('', 'qwerty')
          .send({
            isBanned: 'true',
          })
          .expect(401);
      });
      it('should ban blog with correct data', async () => {
        await request(server)
          .put(url + `/${blog.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
          })
          .expect(204);

        const responseForBlog2 = await request(server)
          .get(url)
          .auth('admin', 'qwerty');

        const { items } = responseForBlog2.body;
        console.log('items', items);
        const bannedBlog = items.find((item) => item.banInfo.isBanned);

        expect(responseForBlog2.body);

        expect(bannedBlog).toBeDefined();
      });
      it('should unban blog with correct data', async () => {
        await request(server)
          .put(url + `/${blog.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: false,
          })
          .expect(204);

        const responseForBlog2 = await request(server)
          .get(url)
          .auth('admin', 'qwerty');

        const { items } = responseForBlog2.body;
        console.log('items', items);
        const bannedBlog = items.find((item) => item.banInfo.isBanned);

        expect(responseForBlog2.body);

        expect(bannedBlog).toBeUndefined();

        const responseForBlogs = await request(server).get('/blogs');

        expect(responseForBlogs.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [blog],
        });
      });
    });
  });
});
