import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/models/models';
import { AppModule } from '../src/app.module';
import { EmailAdapter } from '../src/email/email.adapter';

describe('blogs test (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let server: any;
  let accessToken;
  let user;
  let blog;
  let post;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  const url = '/blogs';
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

  describe('blogs tests', () => {
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
      it('should return blogs', async () => {
        const response = await request(server).get(url).expect(200);

        expect(response.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [blog],
        });
      });
    });
    describe('get blog by blogId tests', () => {
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
      it('should return 404 for not existing blog', async () => {
        await request(server)
          .get(url + 1)
          .expect(404);
      });
      it('should return blog if input data is correct', async () => {
        const response = await request(server)
          .get(url + `/${blog.id}`)
          .expect(200);

        expect(response.body).toEqual(blog);
      });
    });
    describe('get posts by blogId tests', () => {
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

        const responseForPost = await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'valid',
            blogId: blog.id,
          });

        post = responseForPost.body;
        console.log('post', post);
        expect(post).toBeDefined();
      });
      it('should return 404 for not existing post', async () => {
        const fakeBlogId = -500;
        await request(server)
          .get(url + `/${fakeBlogId}/posts`)
          .expect(404);
      });
      it('Should get post by blogId', async () => {
        await request(server)
          .get(url + `/${blog.id}/posts`)
          .expect((res) => {
            const { pagesCount, page, pageSize, totalCount, items } = res.body;
            expect(pagesCount).toBe(1);
            expect(page).toBe(1);
            expect(pageSize).toBe(10);
            expect(totalCount).toBe(1);
            expect(items).toHaveLength(1);
            expect(items[0].id).toBe(post.id);
          });
      });
    });
  });
});
