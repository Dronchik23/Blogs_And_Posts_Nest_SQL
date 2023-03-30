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
  let accessToken;
  let blog;
  let post;
  let user;
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
    console.log(user);
    expect(user).toBeDefined();

    const loginUser = await request(server).post('/auth/login').send({
      loginOrEmail: createUserDto.login,
      password: createUserDto.password,
    });

    accessToken = loginUser.body.accessToken;

    /*    const user = {
      ...createUserDto,
      ...responseForUser.body,
      token: accessToken,
    };*/

    const responseForBlog = await request(server)
      .post('/blogger/blogs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'name',
        websiteUrl: 'https://youtube.com',
        description: 'valid description',
      });

    blog = responseForBlog.body;
    console.log(blog);
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
    console.log(post);
    expect(post).toBeDefined();
  });

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

  describe('sa/users', () => {
    const url = '/sa/users';
    let createdUser: any = null;

    it('should get all users', async () => {
      await request(server).delete(wipeAllDataUrl);
      const a = await request(server)
        .get(url)
        .auth('admin', 'qwerty')
        .expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
    });

    describe('create user tests', () => {
      it('should not create user with incorrect input data', async () => {
        await request(server).delete(wipeAllDataUrl);
        await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send({ login: '', password: 'valid', email: 'valid' })
          .expect(400);

        await request(server).get('/posts').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });

        await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send({ login: 'valid', password: '', email: 'valid' })
          .expect(400);

        await request(server).get('/posts').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });

        await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send({ login: 'valid', password: 'valid', email: '' })
          .expect(400);

        await request(server).get('/posts').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create user with incorrect authorization data', async () => {
        await request(server).delete(wipeAllDataUrl);
        await request(server)
          .post(url)
          .set('Authorization', `Basic invalid`)
          .send({ login: 'valid', password: 'valid', email: 'valid' })
          .expect(401);

        await request(server)
          .post(url)
          .set('Authorization', `Bearer YWRtaW46cXdlcnR5`)
          .send({ login: 'valid', password: 'valid', email: 'valid' })
          .expect(401);

        await request(server).get(url).auth('admin', 'qwerty').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should create user with correct input data', async () => {
        await request(server).delete(wipeAllDataUrl);
        const createResponseForUser = await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send({
            login: 'valid',
            password: 'valid123',
            email: 'valid@mail.ru',
          })
          .expect(201);

        createdUser = createResponseForUser.body;

        expect(createdUser).toEqual({
          id: expect.any(String),
          login: expect.any(String),
          email: expect.any(String),
          createdAt: expect.any(String),
          banInfo: expect.any(Object),
        });

        await request(server)
          .get(url)
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [createdUser],
          });
      });
    });
    describe('update ban status user tests', () => {
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
          .put(url + -12)
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
          .delete(url + -12)
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
          .set('Authorization', `Bearer YWRtaW46cXdlcnR5`)
          .expect(401);
      });
      it('should delete user with correct id', async () => {
        await request(server)
          .delete(`/sa/users/${user.id}`)
          .auth('admin', 'qwerty')
          .expect(204);

        await request(server)
          .get(`/sa/users/${user.id}`)
          .auth('admin', 'qwerty')
          .expect(404);
      });
    });
  });
  describe('sa/blogs', () => {
    const url = '/sa/blogs';

    beforeAll(async () => {
      await request(server).delete(wipeAllDataUrl);
    });

    it('should get all blogs', async () => {
      await request(server).delete(wipeAllDataUrl);
      await request(server).get(url).auth('admin', 'qwerty').expect(200, {
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });
    it('should return 404 for not existing blog', async () => {
      await request(server)
        .get(url + 1)
        .expect(404);
    });
  });
  describe('bloggers/blogs', () => {
    const url = '/blogger/blogs';

    beforeAll(async () => {
      await request(server).delete(wipeAllDataUrl);
    });

    describe('get blogs tests', () => {
      it('should get all blogs', async () => {
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
        console.log(user);
        expect(user).toBeDefined();

        const loginUser = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto.login,
          password: createUserDto.password,
        });

        accessToken = loginUser.body.accessToken;

        await request(server).get(url).expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should return 404 for not existing blog', async () => {
        await request(server)
          .get(url + 1)
          .expect(404);
      });
    });
    describe('create blog tests', () => {
      it('should not create blog with incorrect name', async () => {
        const wipeAllDataUrl = '/testing/all-data';
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
        console.log(user);
        expect(user).toBeDefined();

        const loginUser = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto.login,
          password: createUserDto.password,
        });

        accessToken = loginUser.body.accessToken;

        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: '',
            websiteUrl: 'https://youtu.be/R2xIHSGqg9Y',
            description: 'valid description',
          })
          .expect(400);

        await request(server).get(url).expect(200, {
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

        await request(server).get(url).expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create blog with incorrect websiteUrl', async () => {
        const wipeAllDataUrl = '/testing/all-data';
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
        console.log(user);
        expect(user).toBeDefined();

        const loginUser = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto.login,
          password: createUserDto.password,
        });

        accessToken = loginUser.body.accessToken;

        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid',
            websiteUrl: '',
            description: 'valid description',
          })
          .expect(400);

        await request(server).get(url).expect(200, {
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

        await request(server).get('/blogs').expect(200, {
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

        await request(server).get(url).expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create blog with incorrect description', async () => {
        const wipeAllDataUrl = '/testing/all-data';
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
        console.log(user);
        expect(user).toBeDefined();

        const loginUser = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto.login,
          password: createUserDto.password,
        });

        accessToken = loginUser.body.accessToken;

        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'valid',
            websiteUrl: 'www.vk.com',
            description: '',
          })
          .expect(400);

        await request(server).get(url).expect(200, {
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

        await request(server).get(url).expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create blog with incorrect authorization data', async () => {
        await request(server).delete(wipeAllDataUrl);
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
        const responseForBlog = await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'name',
            websiteUrl: 'https://youtube.com',
            description: 'valid description',
          })
          .expect(201);

        const createdBlog = responseForBlog.body;

        expect(createdBlog).toEqual({
          id: expect.any(String),
          name: expect.any(String),
          websiteUrl: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        });

        const response = await request(server)
          .get(`/blogs/${createdBlog.id}`)
          .expect(200);

        expect(response.body).toEqual(createdBlog);
      });
    });
    describe('update blog tests', () => {
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
    });
    describe('delete blog tests', () => {
      it('should not delete blog that not exist ', async () => {
        await request(server)
          .delete(url + -12)
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
        await request(server).get(`/blogs/${blog.id}`).expect(200);
        await request(server)
          .delete(`/blogger/blogs/${blog.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);

        await request(server).get(`/blogs/${blog.id}`).expect(404);
      });
    });
    describe('create post tests', () => {
      it('should not create post with incorrect input data', async () => {
        const wipeAllDataUrl = '/testing/all-data';
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
        console.log(user);
        expect(user).toBeDefined();

        const loginUser = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto.login,
          password: createUserDto.password,
        });

        accessToken = loginUser.body.accessToken;

        const url = `/${bloggerUrl}/${blog.id}/posts`;
        await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: '',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(400);

        await request(server).get('/posts').expect(200, {
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
            title: '  ',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(400);

        await request(server).get('/posts').expect(200, {
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
            title: 'titlemorethen30symbols1234567po',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(400);

        await request(server).get('/posts').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create post with incorrect authorization data', async () => {
        const wipeAllDataUrl = '/testing/all-data';
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
        console.log(user);
        expect(user).toBeDefined();

        const loginUser = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto.login,
          password: createUserDto.password,
        });

        accessToken = loginUser.body.accessToken;

        const url = `/${bloggerUrl}/${blog.id}/posts`;
        await request(server)
          .post(url)
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
          .post(url)
          .set('Authorization', `Bearer `)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'string',
            blogId: 'valid',
            blogName: 'valid',
          })
          .expect(401);

        await request(server).get('/posts').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
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

        post = createResponseForPost.body;

        expect(post).toEqual({
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
          .get(`/posts/${post.id}`)
          .expect(200);

        expect(postFoundedById.body).toEqual(post);
      });
    });
    describe('update post test', () => {
      //some logic
    });
    describe('delete post tests', () => {
      //some logic
    });
  });
  describe('posts', () => {
    const postsUrl = '/posts';

    it.skip('should get all posts', async () => {
      await request(server).get(postsUrl).expect(200, {
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });
    it.skip('should return 404 for not existing post', async () => {
      await request(server)
        .get(postsUrl + -1)
        .expect(404);
    });

    describe.skip('create comments tests', () => {
      it('should not create comment with incorrect input data', async () => {
        await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: '' })
          .expect(400); // create comment with empty string

        await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 4 })
          .expect(400); // create comment with number

        await request(server).get(`/posts/${post.id}/comments`).expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create comment with incorrect authorization data', async () => {
        await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(401); // create comment with bad auth data

        await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer `)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(401); // create comment without token

        await request(server).get(`/posts/${post.id}/comments`).expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should create comment with correct data', async () => {
        const response = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(201); // create comment with valid data

        const comment = response.body;

        const commentFoundedById = await request(server)
          .get(`/comments/${comment.id}`)
          .expect(200);

        expect(commentFoundedById.body).toEqual(comment);
      });
    });
  });
});
