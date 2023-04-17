import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createApp } from '../src/helpers/createApp';
import { UserInputModel } from '../src/types and models/models';
import { disconnect } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EmailAdapter } from '../src/email/email.adapter';

describe('comments tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
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
  const wipeAllDataUrl = '/testing/all-data';
  const wipeAllLikes = '/testing/all-likes';

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

  describe('comments', () => {
    describe('get comment test', () => {
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

        const responseForComment = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' });

        comment = responseForComment.body;
        expect(comment).toBeDefined();
      });
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
      it('Should not return comment of banned user', async () => {
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

        const responseForComment = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' });

        comment = responseForComment.body;
        expect(comment).toBeDefined();
      });
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
          .set('Authorization', `invalid`)
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

        const responseForComment = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' });

        comment = responseForComment.body;
        expect(comment).toBeDefined();
      });
      it('should not comment not existing post', async () => {
        await request(server)
          .get(`/comments/` + 100 + `/like-status`)
          .expect(404);
      });
      it('should not like post with incorrect input data', async () => {
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
        await request(server).delete(wipeAllLikes);
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
      it('should dislike comment with correct data', async () => {
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
      it('Should not return like for comment of banned user', async () => {
        await request(server).delete(wipeAllLikes);

        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password',
          email: `use2r@gmail.com`,
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
          .put(`/comments/${comment.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .send({ likeStatus: 'Like' })
          .expect(204);

        await request(server)
          .put(`/sa/users/${user2.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204); // ban user

        const commentFoundedById = await request(server)
          .get(`/comments/${comment.id}`)
          .expect(200);

        expect(commentFoundedById.body.likesInfo.myStatus).toEqual('None');
        expect(commentFoundedById.body.likesInfo.dislikesCount).toEqual(0);
        expect(commentFoundedById.body.likesInfo.likesCount).toEqual(0);
      });
    });
  });
});
