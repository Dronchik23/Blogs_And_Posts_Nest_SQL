import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/helpers/createApp';
import { PostViewModel, UserInputModel } from '../src/models/models';
import { AppModule } from '../src/app.module';
import { EmailAdapter } from '../src/email/email.adapter';

describe('AppController (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);
  let app: INestApplication;
  let server: any;
  let accessToken;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  let blog;
  let post: PostViewModel;
  let user;
  const postsUrl = '/posts';
  const userAgent = {
    'User-Agent': 'jest user-agent',
  };
  const wipeAllDataUrl = '/testing/all-data';
  const wipeAllComments = '/testing/all-comments';

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

  describe('posts', () => {
    describe('get all posts tests', () => {
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
        console.log('post', post);
      });
      it('should get all posts', async () => {
        await request(server)
          .get(postsUrl)
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
      it('should return 404 for not existing post', async () => {
        await request(server)
          .get(postsUrl + -1)
          .expect(404);
      });
      it('Should not return banned blog post', async () => {
        await request(server)
          .put('/sa/blogs' + `/${blog.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
          })
          .expect(204);

        const responseForBlog2 = await request(server)
          .get('/sa/blogs')
          .auth('admin', 'qwerty');

        const { items } = responseForBlog2.body;
        console.log('items', items);

        const bannedBlog = items.find((item) => item.banInfo.isBanned);

        expect(bannedBlog).toBeDefined();

        await request(server).get(`/posts/`).expect({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
    });
    describe('get post by postId tests', () => {
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
        console.log('postik', post);
        expect(post).toBeDefined();
      });
      it('should get post by postId', async () => {
        const response = await request(server).get(postsUrl + `/${post.id}`);

        expect(response.body).toEqual(post);
      });
      it('should return 404 for not existing post', async () => {
        await request(server)
          .get(postsUrl + -1)
          .expect(404);
      });
      it('Should not return banned blog post', async () => {
        await request(server)
          .put('/sa/blogs' + `/${blog.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: true,
          })
          .expect(204);

        const responseForBlog2 = await request(server)
          .get('/sa/blogs')
          .auth('admin', 'qwerty');

        const { items } = responseForBlog2.body;

        const bannedBlog = items.find((item) => item.banInfo.isBanned);

        expect(bannedBlog).toBeDefined();

        await request(server)
          .get(postsUrl + `/${post.id}`)
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
      it('should create comment with correct data', async () => {
        const responseForComment2 = await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(201); // create comment with valid data

        const comment2 = responseForComment2.body;
        expect(comment2).toBeDefined();

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
      it('banned user can`t comment the post', async () => {
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
        expect(user).toBeDefined();

        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto2.login,
            password: createUserDto2.password,
          });

        const accessToken2 = loginUser2.body.accessToken;

        await request(server)
          .put(`/blogger/users/${user2.id}/ban`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            isBanned: true,
            banReason: 'valid string more than 20 letters ',
            blogId: blog.id,
          })
          .expect(204); // ban user2

        const response = await request(server)
          .get(`/sa/users/${user2.id}`)
          .auth('admin', 'qwerty');

        expect(response.body.banInfo.isBanned).toBeTruthy();

        await request(server)
          .post(`/posts/${post.id}/comments`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .send({ content: 'valid content string more than 20 letters' })
          .expect(403);
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
      it.skip('should not like not existing post', async () => {
        await request(server)
          .get(postsUrl + 100 + `/like-status`)
          .expect(404);
      });
      it.skip('should not like post with incorrect input data', async () => {
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
      it.skip('should not like post with incorrect authorization data', async () => {
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
      it.skip('should like post with correct data', async () => {
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
      it.skip('should dislike post with correct data', async () => {
        await request(server)
          .put(`/posts/${post.id}/like-status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ likeStatus: 'Dislike' })
          .expect(204);

        const postFoundedById = await request(server)
          .get(`/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(postFoundedById.body.id).toEqual(post.id);
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
        expect(postFoundedById.body.extendedLikesInfo.newestLikes).toHaveLength(
          0,
        );
      });
      it('Should return unbanned user like for post', async () => {
        await request(server)
          .put(`/sa/users/${user.id}/ban`)
          .auth('admin', 'qwerty')
          .send({
            isBanned: false,
            banReason: 'valid string more than 20 letters ',
          })
          .expect(204); // ban user

        const postFoundedById = await request(server)
          .get(`/posts/${post.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(postFoundedById.body.extendedLikesInfo.myStatus).toEqual('Like');
        expect(postFoundedById.body.extendedLikesInfo.dislikesCount).toEqual(0);
        expect(postFoundedById.body.extendedLikesInfo.likesCount).toEqual(1);
        expect(postFoundedById.body.extendedLikesInfo.newestLikes).toHaveLength(
          1,
        );
      });
    });
  });
});
