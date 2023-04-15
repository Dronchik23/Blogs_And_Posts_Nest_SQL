import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/types and models/models';
import { MailBoxImap } from './imap.service';
import jwt from 'jsonwebtoken';
import { settings } from '../src/jwt/jwt.settings';
import { TestAppModule } from '../src/test.app.module';
import { disconnect } from 'mongoose';

describe('AppController (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let server: any;
  let accessToken;
  let blog;
  let post;
  let user;
  const postsUrl = '/posts';
  const wipeAllDataUrl = '/testing/all-data';
  const wipeAllComments = '/testing/all-comments';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app = createApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await disconnect();
  });

  describe('posts', () => {
    describe('get posts tests', () => {
      it('should get all posts', async () => {
        await request(server).delete(wipeAllDataUrl);

        await request(server).get(postsUrl).expect(200, {
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
    });
    describe('create comment tests', () => {
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
      it('should create comment with correct data', async () => {
        const responseForComment2 = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(201); // create comment with valid data

        const comment2 = responseForComment2.body;

        const commentFoundedById = await request(server)
          .get(`/comments/${comment2.id}`)
          .expect(200);

        expect(commentFoundedById.body).toEqual(comment2);
      });
      it('should not create comment with incorrect input data', async () => {
        await request(server).delete(wipeAllComments);
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
        await request(server).delete(wipeAllComments);

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
    });
    describe('like post tests', () => {
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
      it('should not like not existing post', async () => {
        await request(server)
          .get(postsUrl + 100 + `/like-status`)
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
});
