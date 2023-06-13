import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  GameViewModel,
  QuestionInputModel,
  UserInputModel,
  UserViewModel,
} from '../src/models/models';
import request from 'supertest';

import { GameStatuses } from '../src/types/types';
import { createApp } from '../src/helpers/createApp';
import { EmailAdapter } from '../src/email/email.adapter';
import { AppModule } from '../src/app.module';
import { Questions } from '../src/entities/questions.entity';

describe('pair-games-games tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);

  let app: INestApplication;
  let server: any;
  let user: UserViewModel;
  let accessToken: string;
  let game: GameViewModel;
  let questions: Questions[];
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  const questionsUrl = '/sa/quiz/questions';
  const gameCreateUrl = '/pair-games-quiz/pairs/connection';
  const gameUrl = '/pair-games-quiz/pairs';
  const currentGameUrl = '/pair-games-quiz/pairs/my-current';
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

  describe('sa/games/questions', () => {
    describe('get games by gameId tests', () => {
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

        const createResponseForGame = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = createResponseForGame.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
      });
      it('should get games by pairId', async () => {
        const responseForGame = await request(server)
          .get(gameUrl + `/${game.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const gameFromResponse = responseForGame.body;

        expect(gameFromResponse.id).toEqual(game.id);
        expect(gameFromResponse.status).toBeDefined();
        expect(gameFromResponse.questions).toBeDefined();
        expect(gameFromResponse.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(gameFromResponse.startGameDate).toBeDefined();
        expect(gameFromResponse.finishGameDate).toBeDefined();
      });
      it.skip('should send 403 if user try to get alien games', async () => {
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
          .get(gameUrl + `/${game.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(403);
      });
      it.skip('should not get games by bad pairId', async () => {
        const badPairId = 4;
        return await request(server)
          .get(gameUrl + `/${badPairId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);
      });
    });
    describe('get current games tests', () => {
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
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = createResponseForPair.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
      });
      it('should get current games', async () => {
        const responseForGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const foundGame = responseForGame.body;
        console.log('game test', foundGame);

        expect(foundGame.id).toEqual(game.id);
        expect(foundGame.status).toEqual(game.status);
        expect(foundGame.questions).toBeDefined();
        expect(foundGame.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(foundGame.startGameDate).toBeNull();
        expect(foundGame.finishGameDate).toBeNull();
      });
    });
    describe('create games games for one player tests', () => {
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

        questions = getResponseForQuestions.body.items;
        console.log('before all questions', questions);

        expect(getResponseForQuestions.body.totalCount).toEqual(10);
        expect(getResponseForQuestions.body.items.length).toEqual(10);
      });
      it('should create games for one player with correct input data', async () => {
        const createResponseForPair = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const createdGame: GameViewModel = createResponseForPair.body;

        expect(createdGame.id).toBeDefined();
        expect(createdGame.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(createdGame.questions.length).toBe(5);
        expect(createdGame.pairCreatedDate).toBeDefined();
        expect(createdGame.startGameDate).toBeNull();
        expect(createdGame.finishGameDate).toBeNull();
      });
      it.skip('should not create games with incorrect authorization data', async () => {
        await request(server)
          .post(gameCreateUrl)
          .set('', `Bearer ${accessToken}`)
          .expect(401);

        await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Basic ${accessToken}`);
        expect(401);

        /*      const fakeAccessToken = 'fakehghjqiI7289';

        await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${fakeAccessToken}`);
        expect(401);*/
      });
    });
    describe.skip('create games games for two players tests', () => {
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
      it('should create games for two players with correct input data', async () => {
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

        const createResponseForPairUser1 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = createResponseForPairUser1.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(game.questions).toEqual(game.questions);
        expect(game.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(game.startGameDate).toBeNull();
        expect(game.finishGameDate).toBeNull();

        const createResponseForPairUser2 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const pair2: GameViewModel = createResponseForPairUser2.body;

        expect(pair2.id).toBeDefined();
        expect(pair2.status).toEqual(GameStatuses.Active);
        expect(pair2.questions).toBeDefined();
        expect(pair2.pairCreatedDate).toBeDefined();
        expect(pair2.startGameDate).toBeDefined();
        expect(pair2.finishGameDate).toBeNull();
      });
      it.skip('should not create games with incorrect authorization data', async () => {
        await request(server)
          .post(gameCreateUrl)
          .set('', `Bearer ${accessToken}`)
          .expect(401);

        await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Basic ${accessToken}`);
        expect(401);

        /*      const fakeAccessToken = 'fakehghjqiI7289';

        await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${fakeAccessToken}`);
        expect(401);*/
      });
    });
    describe('send answer test tests', () => {
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
      //it('should send answer with correct input data', async () => {});
    });
  });
});
