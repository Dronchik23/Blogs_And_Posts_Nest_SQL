import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/types and models/models';
import { AppModule } from '../src/app.module';
import { sleep } from './helpers/sleepfunction';
import { EmailAdapter } from '../src/email/email.adapter';

describe('blogger blogs tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let server: any;
  let accessToken;
  let blog;
  let post;
  let user;
  let comment;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  const userAgent = {
    'User-Agent': 'jest user-agent',
  };
  const url = '/blogger/blogs';
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

  describe('bloggers/blogs', () => {
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
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto.login,
            password: createUserDto.password,
          });

        accessToken = loginUser.body.accessToken;
      });
      it('should return 404 for not existing blog', async () => {
        await request(server)
          .get(url + 1)
          .expect(404);
      });
      it('should return blogs created by blogger', async () => {
        const responseForBlog = await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'name',
            websiteUrl: 'https://youtube.com',
            description: 'valid description',
          })
          .expect(201);

        const blog2 = responseForBlog.body;

        expect(blog2).toEqual({
          id: expect.any(String),
          name: expect.any(String),
          websiteUrl: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        });

        const response = await request(server)
          .get(`/blogger/blogs`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [blog2],
        });
      });
    });
    describe('create blog tests', () => {
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
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto.login,
            password: createUserDto.password,
          });

        accessToken = loginUser.body.accessToken;
      });
      it('should not create blog with incorrect name', async () => {
        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: '',
            websiteUrl: 'https://youtu.be/R2xIHSGqg9Y',
            description: 'valid description',
          })
          .expect(400);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });

        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'namelengthmore15',
            websiteUrl: 'https://youtu.be/R2xIHSGqg9Y',
            description: 'valid description',
          })
          .expect(400);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
      it('should not create blog with incorrect websiteUrl', async () => {
        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid',
            websiteUrl: 'bad url',
            description: 'valid description',
          })
          .expect(400);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });

        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid',
            websiteUrl: ' ',
            description: 'valid description',
          })
          .expect(400);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });

        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid',
            websiteUrl: 'htt://youtu.be/R2xIHSGqg9Y',
            description: 'valid description',
          })
          .expect(400);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
      it('should not create blog with incorrect description', async () => {
        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid',
            websiteUrl: 'www.vk.com',
            description: '',
          })
          .expect(400);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });

        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid',
            websiteUrl: 'www.vk.com',
            description: 4,
          })
          .expect(400);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
      it('should not create blog with incorrect authorization data', async () => {
        await request(server)
          .post(url)
          .set('Authorization', `Basic ${accessToken}`)
          .send({
            name: 'name',
            websiteUrl: 'https://youtu.be/R2xIHSGqg9Y',
            description: 'valid description',
          })
          .expect(401);

        await request(server)
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
      it('should create blog with correct input data', async () => {
        const responseForBlog2 = await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'name',
            websiteUrl: 'https://youtube.com',
            description: 'valid description',
          })
          .expect(201);

        const createdBlog2 = responseForBlog2.body;

        expect(createdBlog2).toEqual({
          id: expect.any(String),
          name: expect.any(String),
          websiteUrl: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        });

        const response2 = await request(server)
          .get(`/blogs/${createdBlog2.id}`)
          .expect(200);

        expect(response2.body).toEqual(createdBlog2);
      });
    });
    describe('update blog tests', () => {
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
      it('should not update blog with incorrect input data', async () => {
        const reqWithIncorrectName = await request(server)
          .put(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: '',
            description: 'valid content',
            websiteUrl: 'https://youtu.be/R2xIHSGqg9Y',
          });

        expect(reqWithIncorrectName.status).toBe(400);
        expect(reqWithIncorrectName.body).toEqual({
          errorsMessages: [
            {
              field: 'name',
              message: expect.any(String),
            },
          ],
        });

        const reqWithIncorrectWebsiteUrl = await request(server)
          .put(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'correct name',
            description: 'valid content',
            youtubeUrl: '',
          });

        expect(reqWithIncorrectWebsiteUrl.status).toBe(400);
        expect(reqWithIncorrectWebsiteUrl.body).toEqual({
          errorsMessages: [
            {
              field: 'websiteUrl',
              message: expect.any(String),
            },
          ],
        });

        const reqWithIncorrectDescription = await request(server)
          .put(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'correct name',
            description: '',
            websiteUrl: 'www.vk.com',
          });

        expect(reqWithIncorrectDescription.status).toBe(400);
        expect(reqWithIncorrectDescription.body).toEqual({
          errorsMessages: [
            {
              field: 'description',
              message: expect.any(String),
            },
          ],
        });
      });
      it('should not update blog that not exist ', async () => {
        await request(server)
          .put('/blogger/blogs' + -12)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid name',
            youtubeUrl: 'https://youtu.be/R2xIHSGqg9Y',
          })
          .expect(404);
      });
      it('should not update blog with bad auth params', async () => {
        await request(server)
          .put(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({ name: 'name', youtubeUrl: 'https://youtu.be/R2xIHSGqg9Y' })
          .expect(401);

        await request(server)
          .put(`/blogger/blogs/${blog.id}`)
          .set('Authorization', ``)
          .send({ name: 'name', youtubeUrl: 'https://youtu.be/R2xIHSGqg9Y' })
          .expect(401);
      });
      it('should update blog with correct input data ', async () => {
        await request(server)
          .put(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'new valid name',
            description: 'valid description',
            websiteUrl: 'https://youtube.com',
          })
          .expect(204);

        await request(server)
          .get(`/blogs/${blog.id}`)
          .expect(200, {
            ...blog,
            name: 'new valid name',
          });
      });
      it('should send 403 if user try to update elien blog', async () => {
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

        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto2.login,
            password: createUserDto2.password,
          });

        const accessToken2 = loginUser2.body.accessToken;

        await request(server)
          .put(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .send({
            name: 'new valid name',
            description: 'valid description',
            websiteUrl: 'https://youtube.com',
          })
          .expect(403);
      });
    });
    describe('delete blog tests', () => {
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
      it('should not delete blog that not exist ', async () => {
        await request(server)
          .delete('/blogger/blogs/63189b06003380064c4193be')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
      it('should not delete blog with bad auth params', async () => {
        await request(server)
          .delete(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Basic ${accessToken}`)
          .expect(401);

        await request(server)
          .delete(`/blogger/blogs/${blog.id}`)
          .set('Authorization', ``)
          .expect(401);
      });
      it('should delete blog with correct id', async () => {
        await request(server)
          .delete(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);

        await request(server).get(`/blogs/${blog.id}`).expect(404);
      });
    });
    describe('create post tests', () => {
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
      it('should not create post with incorrect input data', async () => {
        await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: '',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(400);

        await request(server)
          .get('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });

        await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: '  ',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(400);

        await request(server)
          .get('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });

        await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'titlemorethen30symbols1234567po',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(400);

        await request(server)
          .get('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
      it('should not create post with incorrect authorization data', async () => {
        await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(401);

        await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer `)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(401);

        await request(server)
          .get('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
      it('should not create post with blog of another user', async () => {
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

        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto2.login,
            password: createUserDto2.password,
          });

        const accessToken2 = loginUser2.body.accessToken;

        const responseForBlog2 = await request(server)
          .post('/blogger/blogs')
          .set('Authorization', `Bearer ${accessToken2}`)
          .send({
            name: 'name',
            websiteUrl: 'https://youtube.com',
            description: 'valid description',
          });

        const blog2 = responseForBlog2.body;
        expect(blog2).toBeDefined();

        await request(server)
          .post(`/blogger/blogs/${blog2.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'valid',
            blogId: blog2.id,
          })
          .expect(403);
      });
      it('should create post with correct input data', async () => {
        const createResponseForPost = await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'valid',
            blogId: blog.id,
          })
          .expect(201);

        const post2 = createResponseForPost.body;
        console.log('post2', post2);

        expect(post2).toEqual({
          id: expect.any(String),
          title: expect.any(String),
          shortDescription: expect.any(String),
          content: expect.any(String),
          blogId: expect.any(String),
          blogName: expect.any(String),
          createdAt: expect.any(String),
          extendedLikesInfo: expect.any(Object),
        });

        const postFoundedById = await request(server)
          .get(`/posts/${post2.id}`)
          .expect(200);

        expect(postFoundedById.body).toEqual(post2);
      });
    });
    describe('delete post tests', () => {
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
        expect(post).toBeDefined();
      });
      it('should not delete post that not exist ', async () => {
        await request(server)
          .delete(
            `/blogger/blogs/63189b06003380064c4193be/posts/6432f156d3189076979f01c1`,
          )
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
      it('should not delete post with bad auth params', async () => {
        await request(server)
          .delete(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Basic ${accessToken}`)
          .expect(401);

        await request(server)
          .delete(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer `)
          .expect(401);
      });
      it('should not delete post of another user', async () => {
        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password2',
          email: `user2@gmail.com`,
        };

        const responseForUser2 = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto2);

        const user2 = responseForUser2.body;
        expect(user2).toBeDefined();

        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto2.login,
            password: createUserDto2.password,
          });

        const accessToken2 = loginUser2.body.accessToken;

        await request(server)
          .delete(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(403);
      });
      it('should delete post with correct id', async () => {
        await request(server).get(`/posts/${post.id}`).expect(200);

        await request(server)
          .delete(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);

        await request(server).get(`/posts/${post.id}`).expect(404);
      });
    });
    describe('update post tests', () => {
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
        expect(post).toBeDefined();

        const responseForComment = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' });

        comment = responseForComment.body;
        expect(comment).toBeDefined();
      });
      it('should not update post with incorrect input data', async () => {
        const reqWithIncorrectTitle = await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: '',
            shortDescription: 'valid',
            content: 'valid',
          });

        expect(reqWithIncorrectTitle.status).toBe(400);
        expect(reqWithIncorrectTitle.body).toEqual({
          errorsMessages: [
            {
              field: 'title',
              message: expect.any(String),
            },
          ],
        });

        const reqWithIncorrectShortDescription = await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid',
            shortDescription: '',
            content: 'string',
          });

        expect(reqWithIncorrectShortDescription.status).toBe(400);
        expect(reqWithIncorrectShortDescription.body).toEqual({
          errorsMessages: [
            {
              field: 'shortDescription',
              message: expect.any(String),
            },
          ],
        });

        const reqWithIncorrectContent = await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid title',
            shortDescription: 'valid',
            content: '',
          });

        expect(reqWithIncorrectContent.status).toBe(400);
        expect(reqWithIncorrectContent.body).toEqual({
          errorsMessages: [
            {
              field: 'content',
              message: expect.any(String),
            },
          ],
        });
      });
      it('should not update post that not exist ', async () => {
        const fakeId = '21';
        await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${fakeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid title',
            shortDescription: 'valid description',
            content: 'valid content',
          })
          .expect(404);
      });
      it('should not update post with bad auth params', async () => {
        await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({
            title: 'valid title',
            shortDescription: 'valid',
            content: 'valid',
          })
          .expect(401);

        await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', ``)
          .send({
            title: 'valid title',
            shortDescription: 'valid',
            content: 'valid',
          })
          .expect(401);
      });
      it('should not update post of another user', async () => {
        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password2',
          email: `user2@gmail.com`,
        };

        const responseForUser2 = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto2);

        const user2 = responseForUser2.body;
        expect(user2).toBeDefined();

        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto2.login,
            password: createUserDto2.password,
          });

        const accessToken2 = loginUser2.body.accessToken;

        await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .send({
            title: 'new title',
            shortDescription: 'valid',
            content: 'valid',
          })
          .expect(403);
      });
      it('should update post with correct input data ', async () => {
        await request(server)
          .put(`/blogger/blogs/${blog.id}/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'new title',
            shortDescription: 'valid',
            content: 'valid',
          })
          .expect(204);

        await request(server)
          .get(`/posts/${post.id}`)
          .expect(200, {
            ...post,
            title: 'new title',
          });
      });
    });
    describe('get comments tests', () => {
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
        expect(post).toBeDefined();

        const responseForComment = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' });

        comment = responseForComment.body;
        expect(comment).toBeDefined();
      });
      it('should not get comments with incorrect authorization data', async () => {
        await request(server)
          .get(url + `/comments`)
          .set('Authorization', `Bearer `)
          .expect(401);
      });
      it('should get all comments', async () => {
        const response = await request(server)
          .get(url + `/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const expectedResponse = {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [comment],
        };

        // Verify the response object has the expected properties and values
        expect(response.body).toHaveProperty(
          'pagesCount',
          expectedResponse.pagesCount,
        );
        expect(response.body).toHaveProperty('page', expectedResponse.page);
        expect(response.body).toHaveProperty(
          'pageSize',
          expectedResponse.pageSize,
        );
        expect(response.body).toHaveProperty(
          'totalCount',
          expectedResponse.totalCount,
        );

        // Verify the comment object in the items array has the expected properties and values
        const receivedComment = response.body.items[0];
        expect(receivedComment).toHaveProperty('id', comment.id);
        expect(receivedComment).toHaveProperty('content', comment.content);
        expect(receivedComment).toHaveProperty(
          'commentatorInfo.userId',
          comment.commentatorInfo.userId,
        );
        expect(receivedComment).toHaveProperty(
          'commentatorInfo.userLogin',
          comment.commentatorInfo.userLogin,
        );
        expect(receivedComment).toHaveProperty('createdAt', comment.createdAt);
      });
    });
  });
});
