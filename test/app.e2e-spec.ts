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
    console.log('blog beforeEach', blog);
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app = createApp(app);
    await app.init();
    server = app.getHttpServer();

    const mailBox = new MailBoxImap();
    await mailBox.connectToMail();

    expect.setState({ mailBox });
  });

  afterAll(async () => {
    const mailBox: MailBoxImap = expect.getState().mailBox;
    await mailBox.disconnect();

    await app.close();
  });

  describe('sa/users', () => {
    const url = '/sa/users';

    it('should get all users', async () => {
      await request(server).delete(wipeAllDataUrl);
      await request(server).get(url).auth('admin', 'qwerty').expect(200, {
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });
    describe('ban user tests', () => {
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
          .get('/sa/users')
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [user],
          });

        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: 'true',
            banReason: 'valid string more than 20 letters',
          })
          .expect(400);

        await request(server)
          .get('/sa/users')
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [user],
          });
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
      it('should ban user with correct data', async () => {
        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204);

        const responseForUser = await request(server)
          .get(`/sa/users/${user.id}`)
          .auth('admin', 'qwerty')
          .expect(200);

        user = responseForUser.body;

        expect(user.banInfo.isBanned).toBe(true);
      });
    });
    describe('create user tests', () => {
      it('should not create user with incorrect input data', async () => {
        await request(server).delete(wipeAllDataUrl);
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
        await request(server).delete(wipeAllDataUrl);
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
      it('should create user with correct input data', async () => {
        await request(server).delete(wipeAllDataUrl); // затираем все
        const createResponseForUser2 = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send({
            login: 'valid',
            password: 'valid123',
            email: 'valid@gmail.ru',
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
          .delete('/sa/users' + -12)
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
  describe('bloggers/blogs', () => {
    const url = '/blogger/blogs';

    beforeAll(async () => {
      await request(server).delete(wipeAllDataUrl);
    });

    describe('get blogs tests', () => {
      it('should return 404 for not existing blog', async () => {
        await request(server)
          .get(url + 1)
          .expect(404);
      });
      it('should return blogs created by blogger', async () => {
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

        const loginUser2 = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto2.login,
          password: createUserDto2.password,
        });

        const accessToken2 = loginUser2.body.accessToken;

        const responseForBlog = await request(server)
          .post(url)
          .set('Authorization', `Bearer ${accessToken2}`)
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
          .get(url)
          .set('Authorization', `Bearer ${accessToken2}`)
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

        const loginUser2 = await request(server).post('/auth/login').send({
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
      it('should not delete post that not exist ', async () => {
        await request(server)
          .delete(`/blogger/blogs/${blog.id}/posts/` + -12)
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

        const loginUser2 = await request(server).post('/auth/login').send({
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
        debugger;
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
        debugger;
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

        const loginUser2 = await request(server).post('/auth/login').send({
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
  });
  describe('posts', () => {
    const postsUrl = '/posts';

    it('should get all posts', async () => {
      await request(server).delete(wipeAllDataUrl);
      await request(server).get('/posts').expect(200, {
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });
    it('should return 404 for not existing post', async () => {
      await request(server)
        .get(postsUrl + -1)
        .expect(404);
    });
    describe('create comment tests', () => {
      it('should not create comment with incorrect input data', async () => {
        const localResponseForPost = await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'valid',
            blogId: blog.id,
          });

        const post2 = localResponseForPost.body;
        expect(post2).toBeDefined();

        await request(server)
          .post(`/posts/${post2.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: '' })
          .expect(400); // create comment with empty string

        await request(server)
          .post(`/posts/${post2.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 4 })
          .expect(400); // create comment with number

        await request(server).get(`/posts/${post2.id}/comments`).expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create comment with incorrect authorization data', async () => {
        const localResponseForPost = await request(server)
          .post(`/blogger/blogs/${blog.id}/posts`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'valid',
            shortDescription: 'valid',
            content: 'valid',
            blogId: blog.id,
          });

        const post2 = localResponseForPost.body;
        expect(post2).toBeDefined();

        await request(server)
          .post(`/posts/${post2.id}/comments`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(401); // create comment with bad auth data

        await request(server)
          .post(`/posts/${post2.id}/comments`)
          .set('Authorization', `Bearer `)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(401); // create comment without token

        await request(server).get(`/posts/${post2.id}/comments`).expect(200, {
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
    describe('like post tests', () => {
      it('should not like not existing post', async () => {
        await request(server)
          .get(`/posts/` + 100 + `/like-status`)
          .expect(404);
      });
      it('should not like post with incorrect input data', async () => {
        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: '' })
          .expect(400);

        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 4 })
          .expect(400);

        await request(server)
          .get(`/posts/${post.id}`)
          .expect(200, {
            ...post,
          });
      });
      it('should not like post with incorrect authorization data', async () => {
        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({ likeStatus: 'Like' })
          .expect(401);

        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Bearer `)
          .send({ likeStatus: 'Like' })
          .expect(401);
      });
      it('should like post with correct data', async () => {
        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 'Like' })
          .expect(204);

        const postFoundedById = await request(server)
          .get(`/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(postFoundedById.body.extendedLikesInfo.myStatus).toEqual('Like');
        expect(postFoundedById.body.extendedLikesInfo.likesCount).toEqual(1);
        expect(postFoundedById.body.extendedLikesInfo.dislikesCount).toEqual(0);
      });
      it('should dislike post with correct data', async () => {
        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 'Dislike' })
          .expect(204);

        const postFoundedById = await request(server)
          .get(`/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(postFoundedById.body.extendedLikesInfo.myStatus).toEqual(
          'Dislike',
        );
        expect(postFoundedById.body.extendedLikesInfo.dislikesCount).toEqual(1);
        expect(postFoundedById.body.extendedLikesInfo.likesCount).toEqual(0);
      });
      it('Should not return banned user like for post', async () => {
        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 'Like' })
          .expect(204);

        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204); // ban user

        const postFoundedById = await request(server)
          .get(`/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(postFoundedById.body.extendedLikesInfo.myStatus).toEqual('None');
        expect(postFoundedById.body.extendedLikesInfo.dislikesCount).toEqual(0);
        expect(postFoundedById.body.extendedLikesInfo.likesCount).toEqual(0);
      });
    });
  });
  describe('comments', () => {
    describe('get comment test', () => {
      it('should not get comment that not exist', async () => {
        await request(server)
          .get('/comments' + 1)
          .expect(404);
      });
      it('should get comment', async () => {
        await request(server)
          .get(`/comments/${comment.id}`)
          .expect(200, {
            ...comment,
          });
      });
      it('Should not return banned user comment', async () => {
        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204);

        const responseForUser = await request(server)
          .get(`/sa/users/${user.id}`)
          .auth('admin', 'qwerty')
          .expect(200);

        user = responseForUser.body;

        expect(user.banInfo.isBanned).toBe(true);

        await request(server).get(`/comments/${comment.id}`).expect(404);
      });
    });
    describe('update comment tests', () => {
      it('should not update comment with incorrect input data', async () => {
        debugger;
        const reqWithIncorrectContent = await request(server)
          .put(`/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: '' });

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
      it('should not update comment that not exist ', async () => {
        await request(server)
          .put('/comments/' + -12)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content whit many letters' })
          .expect(404);
      });
      it('should not update comment with bad auth params', async () => {
        await request(server)
          .put(`/comments/${comment.id}`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({ content: 'valid content whit many letters' })
          .expect(401);

        await request(server)
          .put(`/comments/${comment.id}`)
          .set('Authorization', ``)
          .send({ content: 'valid content whit many letters' })
          .expect(401);
      });
      it('should not update comment of another user', async () => {
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

        const loginUser2 = await request(server).post('/auth/login').send({
          loginOrEmail: createUserDto2.login,
          password: createUserDto2.password,
        });

        const accessToken2 = loginUser2.body.accessToken;

        await request(server)
          .put(`/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .send({ content: 'valid content whit many letters' })
          .expect(403);
      });
      it('should update comment with correct input data ', async () => {
        await request(server)
          .put(`/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'new valid content whit many letters' })
          .expect(204);

        await request(server)
          .get(`/comments/${comment.id}`)
          .expect(200, {
            ...comment,
            content: 'new valid content whit many letters',
          });
      });
    });
    describe('like comment tests', () => {
      it('should not comment not existing post', async () => {
        await request(server)
          .get(`/comments/` + 100 + `/like-status`)
          .expect(404);
      });
      it('should not like post with incorrect input data', async () => {
        debugger;
        await request(server)
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: '' })
          .expect(400);

        await request(server)
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 4 })
          .expect(400);

        await request(server)
          .get(`/comments/${comment.id}`)
          .expect(200, {
            ...comment,
          });
      });
      it('should not like comment with incorrect authorization data', async () => {
        await request(server)
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Basic ${accessToken}`)
          .send({ likeStatus: 'Like' })
          .expect(401);

        await request(server)
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Bearer `)
          .send({ likeStatus: 'Like' })
          .expect(401);
      });
      it('should like comment with correct data', async () => {
        await request(server)
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 'Like' })
          .expect(204);

        const commentFoundedById = await request(server)
          .get(`/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(commentFoundedById.body.likesInfo.myStatus).toEqual('Like');
        expect(commentFoundedById.body.likesInfo.likesCount).toEqual(1);
        expect(commentFoundedById.body.likesInfo.dislikesCount).toEqual(0);
      });
      it('should dislike post with correct data', async () => {
        await request(server)
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 'Dislike' })
          .expect(204);

        const commentFoundedById = await request(server)
          .get(`/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(commentFoundedById.body.likesInfo.myStatus).toEqual('Dislike');
        expect(commentFoundedById.body.likesInfo.dislikesCount).toEqual(1);
        expect(commentFoundedById.body.likesInfo.likesCount).toEqual(0);
      });
      it('Should not return banned user like for comment', async () => {
        await request(server)
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 'Like' })
          .expect(204);

        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204); // ban user

        const commentFoundedById = await request(server)
          .get(`/comments/${comment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(commentFoundedById.body.likesInfo.myStatus).toEqual('None');
        expect(commentFoundedById.body.likesInfo.dislikesCount).toEqual(0);
        expect(commentFoundedById.body.likesInfo.likesCount).toEqual(0);
      });
    });
  });
  describe('auth', () => {
    describe('password-recovery tests', () => {
      it('should send password recovery with incorrect input data', async () => {
        await request(server)
          .post('/auth/login')
          .send({
            email: '',
          })
          .expect(400);

        await request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: user.login,
            password: '',
          })
          .expect(400);
      });
      it('should return 204 even if current email is not registered', async () => {
        await request(server)
          .post('/auth/password-recovery')
          .send({
            email: 'user799jj@gmail.com',
          })
          .expect(204);
      });
      it('should send email with new recovery code', async () => {
        await request(server)
          .post('/auth/password-recovery')
          .send({
            email: 'user@gmail.com',
          })
          .expect(204);
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds', (done) => {
        setTimeout(async () => {
          const email = 'any@gmail.com';
          for (let i = 0; i < 5; i++) {
            await request(server)
              .post('/auth/password-recovery')
              .send({
                email,
              })
              .expect(204);
          }
          await request(server)
            .post('/auth/password-recovery')
            .send({
              email,
            })
            .expect(429);
          done();
        }, 10000);
      });
    });
    describe('new password tests', () => {
      it('should not change password with incorrect input data', async () => {
        await request(server)
          .post('/auth/new-password')
          .send({
            newPassword: '',
            recoveryCode: 'valid',
          })
          .expect(400);

        await request(server)
          .post('/auth/new-password')
          .send({
            newPassword: 'valid',
            recoveryCode: '',
          })
          .expect(400);
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds', async () => {
        for (let i = 0; i < 5; i++) {
          await request(server).post('/auth/new-password').send({
            newPassword: '1234567789',
            recoveryCode: 'valid',
          });
        }
        await request(server)
          .post('/auth/new-password')
          .send({
            newPassword: '1234567789',
            recoveryCode: 'valid',
          })
          .expect(429);
      });
    });
    describe('login tests', () => {
      it('should login with incorrect input data', (done) => {
        setTimeout(async () => {
          await request(server)
            .post('/auth/login')
            .send({
              loginOrEmail: '',
              password: 'password',
            })
            .expect(400);

          await request(server)
            .post('/auth/login')
            .send({
              loginOrEmail: '',
              password: 'password',
            })
            .expect(400);
          done();
        });
      }, 10000);
      it('should send 401 if password, login or email is wrong', (done) => {
        setTimeout(async () => {
          await request(server)
            .post('/auth/login')
            .send({
              loginOrEmail: 'us',
              password: 'password',
            })
            .expect(401);

          await request(server)
            .post('/auth/login')
            .send({
              loginOrEmail: 'user',
              password: 'pass',
            })
            .expect(401);

          await request(server)
            .post('/auth/login')
            .send({
              loginOrEmail: 'us@gmail.com',
              password: 'password',
            })
            .expect(401);

          done();
        }, 10000);
      });
      it('should login user with correct login', (done) => {
        setTimeout(async () => {
          const loginUser2 = await request(server)
            .post('/auth/login')
            .send({
              loginOrEmail: 'user',
              password: 'password',
            })
            .expect(200);

          accessToken = loginUser2.body.accessToken;

          expect(accessToken).toBeDefined();

          done();
        }, 10000);
      });
      it('should login user with correct email', (done) => {
        setTimeout(async () => {
          const loginUser2 = await request(server)
            .post('/auth/login')
            .send({
              loginOrEmail: 'user@gmail.com',
              password: 'password',
            })
            .expect(200);

          accessToken = loginUser2.body.accessToken;

          expect(accessToken).toBeDefined();

          done();
        }, 10000);
      });
      it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to login', async () => {
        for (let i = 0; i < 5; i++) {
          await request(server).post('/auth/login').send({
            loginOrEmail: 'user',
            password: 'password',
          });
        }

        await request(server)
          .post('/auth/login')
          .send({
            loginOrEmail: 'user',
            password: 'password',
          })
          .expect(429);
      });
      describe('registration confirmation test', () => {
        it('should not confirmation with incorrect input data', async () => {
          await request(server)
            .post('/auth/registration-confirmation')
            .send({
              code: '',
            })
            .expect(400);
        });
        it('should confirm registration with correct input data', async () => {
          await request(server).delete(wipeAllDataUrl);

          const mailBox: MailBoxImap = expect.getState().mailBox;

          const createUserDto: UserInputModel = {
            login: `user`,
            password: 'password',
            email: `andreantsygin@yandex.by`,
          };

          await request(server)
            .post('/sa/users')
            .auth('admin', 'qwerty')
            .send(createUserDto);

          const email = await mailBox.waitNewMessage(2);
          const html = await mailBox.getMessageHtml(email);

          expect(html).not.toBeNull();
          const code = html.split('code=')[1].split("'")[0];
          expect(code).toBeDefined();
          expect(isUUID(code)).toBeTruthy();
          expect.setState({ code });

          await request(server)
            .post('/auth/registration-confirmation')
            .send({
              code: code,
            })
            .expect(204);
        });
        it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to change password', async () => {
          for (let i = 0; i < 5; i++) {
            await request(server).post('/auth/registration-confirmation').send({
              code: 'valid',
            });
          }

          await request(server)
            .post('/auth/registration-confirmation')
            .send({
              loginOrEmail: 'user',
              password: 'password',
            })
            .expect(429);
        });
      });
      describe('registration tests', () => {
        it('should not registered with incorrect input data', async () => {
          await request(server)
            .post('/auth/registration')
            .send({
              login: '',
              password: 'validpassword',
              email: 'user2@gmail.com',
            })
            .expect(400);

          await request(server)
            .post('/auth/registration')
            .send({
              login: 'valid',
              password: '',
              email: 'user2@gmail.com',
            })
            .expect(400);

          await request(server)
            .post('/auth/registration')
            .send({
              login: 'valid',
              password: 'validpassword',
              email: 'user.com',
            })
            .expect(400);
        });
        it('should registered with correct input data', async () => {
          await request(server)
            .post('/auth/registration')
            .send({
              login: 'valid',
              password: 'validpassword',
              email: 'user2@gmail.com',
            })
            .expect(204);
        });
        it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to use registration', async () => {
          for (let i = 0; i < 5; i++) {
            await request(server).post('/auth/registration').send({
              login: 'valid',
              password: 'validpassword',
              email: 'user2@gmail.com',
            });
          }

          await request(server)
            .post('/auth/registration')
            .send({
              login: 'valid',
              password: 'validpassword',
              email: 'user2@gmail.com',
            })
            .expect(429);
        });
      });
      describe('registration email resending tests', () => {
        it('should not resend email with incorrect input data', async () => {
          await request(server)
            .post('/auth/registration-email-resending')
            .send({
              email: '',
            })
            .expect(400);
        });
        it('should resend email with correct input data', async () => {
          await request(server).delete(wipeAllDataUrl);

          const user = await request(server)
            .post('/sa/users')
            .auth('admin', 'qwerty')
            .send({
              login: `user`,
              password: 'password',
              email: `andreantsygin@yandex.ru`,
            }); // create user

          await request(server)
            .post('/auth/registration-email-resending')
            .send({
              email: 'andreantsygin@yandex.ru',
            })
            .expect(204);

          const mailBox: MailBoxImap = expect.getState().mailBox;

          const email = await mailBox.waitNewMessage(2);
          const html = await mailBox.getMessageHtml(email);

          expect(html).not.toBeNull();
          const code = html.split('code=')[1].split("'")[0];
          expect(code).toBeDefined();
          expect(isUUID(code)).toBeTruthy();
          expect.setState({ code });
        });
        it('should send 429 if more than 5 attempts from one IP-address during 10 seconds try to resend email', async () => {
          for (let i = 0; i < 5; i++) {
            await request(server)
              .post('/auth/registration-email-resending')
              .send({
                email: 'user@gmail.com',
              });
          }

          await request(server)
            .post('/auth/registration-email-resending')
            .send({
              email: 'user@gmail.com',
            })
            .expect(429);
        });
      });
      describe('logout tests', () => {
        it('should logout if refreshToken is actual', async () => {
          await request(server)
            .post('/auth/logout')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(204);
        });
        it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
          await request(server)
            .post('/auth/logout')
            .set('Cookie', `refreshToken=`)
            .expect(401);

          await request(server)
            .post('/auth/logout')
            .set('Cookie', `refreshToken=${refreshToken + 1}`)
            .expect(401);
        });
        it('should send 401 if refreshToken inside cookie is expired', async () => {
          // распарсиваем токен, чтобы получить его содержимое
          const decodedToken: any = jwt.decode(refreshToken);

          // изменяем поле exp на дату из прошлого (например, на дату вчера)
          decodedToken.exp = Math.floor(Date.now() / 1000) - 86400;

          // заново подписываем токен с измененным содержимым
          const invalidToken = jwt.sign(decodedToken, settings.JWT_SECRET);

          // отправляем запрос с измененным токеном
          await request(server)
            .post('/auth/logout')
            .set('Cookie', `refreshToken=${invalidToken}`)
            .expect(401);
        });
      });
      describe('me tests', () => {
        it('should send 401 if authorization data is incorrect', async () => {
          await request(server)
            .get('/auth/me')
            .set('Authorization', `Bearer `)
            .expect(401);
        });
        it('should send 200 if authorization data is correct', async () => {
          await request(server)
            .get('/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        });
      });
    });
    describe('devices', () => {
      describe('get all devices with current session tests', () => {
        it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=`)
            .expect(401);

          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken + 1}`)
            .expect(401);
        });
        it('should send 401 if refreshToken inside cookie is expired', async () => {
          // распарсиваем токен, чтобы получить его содержимое
          const decodedToken: any = jwt.decode(refreshToken);

          // изменяем поле exp на дату из прошлого (например, на дату вчера)
          decodedToken.exp = Math.floor(Date.now() / 1000) - 86400;

          // заново подписываем токен с измененным содержимым
          const invalidToken = jwt.sign(decodedToken, settings.JWT_SECRET);

          // отправляем запрос с измененным токеном
          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${invalidToken}`)
            .expect(401);
        });
        it('should send 200 if refreshToken inside cookie is correct', async () => {
          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200)
            .expect((res) => {
              const devices = res.body as DeviceDBType[];
              expect(devices.length).toBeGreaterThan(0);
              expect(devices[0].deviceId).toEqual(deviceId);
            });
        });
      });
      describe('terminate all sessions exclude current tests', () => {
        it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=`)
            .expect(401);

          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken + 1}`)
            .expect(401);
        });
        it('should send 401 if refreshToken inside cookie is expired', async () => {
          // распарсиваем токен, чтобы получить его содержимое
          const decodedToken: any = jwt.decode(refreshToken);

          // изменяем поле exp на дату из прошлого (например, на дату вчера)
          decodedToken.exp = Math.floor(Date.now() / 1000) - 86400;

          // заново подписываем токен с измененным содержимым
          const invalidToken = jwt.sign(decodedToken, settings.JWT_SECRET);

          // отправляем запрос с измененным токеном
          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=${invalidToken}`)
            .expect(401);
        });
        it('should send 204 if refreshToken inside cookie is correct', async () => {
          await request(server)
            .delete('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(204);

          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200)
            .expect((res) => {
              const devices = res.body as DeviceDBType[];
              expect(devices.length).toBeGreaterThan(0);
              expect(devices[0].deviceId).toEqual(deviceId);
            });
        });
      });
      describe('terminate session by deviceId tests', () => {
        it('should send 401 if refreshToken inside cookie is missing or incorrect', async () => {
          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=`)
            .expect(401);

          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${refreshToken + 1}`)
            .expect(401);
        });
        it('should send 401 if refreshToken inside cookie is expired', async () => {
          // распарсиваем токен, чтобы получить его содержимое
          const decodedToken: any = jwt.decode(refreshToken);

          // изменяем поле exp на дату из прошлого (например, на дату вчера)
          decodedToken.exp = Math.floor(Date.now() / 1000) - 86400;

          // заново подписываем токен с измененным содержимым
          const invalidToken = jwt.sign(decodedToken, settings.JWT_SECRET);

          // отправляем запрос с измененным токеном
          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${invalidToken}`)
            .expect(401);
        });
        it('should send 403 if user try to delete device of another user', async () => {
          await request(server).post('/sa/users').auth('admin', 'qwerty').send({
            login: `user2`,
            password: 'password',
            email: `user2@gmail.com`,
          });

          const loginUser2 = await request(server).post('/auth/login').send({
            loginOrEmail: 'user2',
            password: 'password',
          });

          const refreshToken2 = loginUser2.headers['set-cookie'][0]
            .split(';')[0]
            .split('=')[1];

          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${refreshToken2}`)
            .expect(403);
        });
        it('should send 204 if refreshToken inside cookie is correct', async () => {
          await request(server)
            .delete(`/security/devices/${deviceId}`)
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(204);

          await request(server)
            .get('/security/devices')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200)
            .expect((res) => {
              const devices = res.body as DeviceDBType[];
              expect(Array.isArray(devices)).toBeTruthy();
              expect(devices.some((d) => d.deviceId === deviceId)).toBeFalsy();
            });
        });
      });
    });
  });
});
