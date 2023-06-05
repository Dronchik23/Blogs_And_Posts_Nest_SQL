import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  PairViewModel,
  QuestionInputModel,
  QuestionViewModel,
  UserInputModel,
  UserViewModel,
} from '../src/models/models';
import request from 'supertest';

import { GameStatuses } from '../src/types/types';
import { createApp } from '../src/helpers/createApp';
import { EmailAdapter } from '../src/email/email.adapter';
import { AppModule } from '../src/app.module';

describe('pair-game-quiz tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);

  let app: INestApplication;
  let server: any;
  let user: UserViewModel;
  let accessToken: string;
  let question: QuestionViewModel;
  let pair: PairViewModel;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  const questionsUrl = '/sa/quiz/questions/';
  const pairCreateUrl = '/pair-game-quiz/pairs/connection';
  const quizPairUrl = '/pair-game-quiz/pairs';
  const wipeAllData = '/testing/all-data';
  const userAgent = {
    'User-Agent': 'jest user-agent',
  };

  const createQuestionDto: QuestionInputModel = {
    body: `questionmorethen10`,
    correctAnswers: ['answer1', 'answer2'],
  };

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

  describe('sa/quiz/questions', () => {
    describe('get pair tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

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

        // Цикл для создания 10 вопросов
        for (let i = 0; i < 10; i++) {
          await request(server)
            .post(questionsUrl)
            .auth('admin', 'qwerty')
            .send(createQuestionDto)
            .expect(201);
        }

        const getResponseForQuestions = await request(server)
          .get(questionsUrl)
          .auth('admin', 'qwerty')
          .expect(200);

        expect(getResponseForQuestions.body.totalCount).toEqual(10);
        expect(getResponseForQuestions.body.items.length).toEqual(10);

        const createResponseForPair = await request(server)
          .post(pairCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        pair = createResponseForPair.body;

        expect(pair.id).toBeDefined();
        expect(pair.status).toEqual(GameStatuses.PendingSecondPlayer);
      });
      it('should get pair by pairId', async () => {
        return await request(server)
          .get(quizPairUrl + `/${pair.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200, pair);
      });
      it('should send 403 if user try to get alien pair', async () => {
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
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto2.login,
            password: createUserDto2.password,
          });

        const accessToken2 = loginUser2.body.accessToken;

        return await request(server)
          .get(quizPairUrl + `/${pair.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(403);
      });
      it.skip('should not get pair by bad pairId', async () => {
        const badPairId = 4;
        return await request(server)
          .get(quizPairUrl + `/${badPairId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);
      });
    });
    describe('create quiz pair tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

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

        // Цикл для создания 10 вопросов
        for (let i = 0; i < 10; i++) {
          await request(server)
            .post(questionsUrl)
            .auth('admin', 'qwerty')
            .send(createQuestionDto)
            .expect(201);
        }

        const getResponseForQuestions = await request(server)
          .get(questionsUrl)
          .auth('admin', 'qwerty')
          .expect(200);

        expect(getResponseForQuestions.body.totalCount).toEqual(10);
        expect(getResponseForQuestions.body.items.length).toEqual(10);
      });
      it('should create pair with correct input data', async () => {
        const createResponseForPair = await request(server)
          .post(pairCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const pair: PairViewModel = createResponseForPair.body;

        expect(pair.id).toBeDefined();
        expect(pair.status).toEqual(GameStatuses.PendingSecondPlayer);
      });
      it('should not create pair with incorrect authorization data', async () => {
        await request(server)
          .post(pairCreateUrl)
          .set('', `Bearer ${accessToken}`)
          .expect(401);

        await request(server)
          .post(pairCreateUrl)
          .set('Authorization', `Basic ${accessToken}`);
        expect(401);

        await request(server)
          .post(pairCreateUrl)
          .set('Authorization', `Bearer ${accessToken} + 'fake'`);
        expect(401);

        await request(server)
          .get(questionsUrl)
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          });
      });
    });
  });
});
