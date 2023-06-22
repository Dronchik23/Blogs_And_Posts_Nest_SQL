import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  AnswerViewModel,
  GameViewModel,
  QuestionInputModel,
  UserInputModel,
  UserViewModel,
} from '../src/models/models';
import request from 'supertest';

import { AnswerStatuses, GameStatuses } from '../src/types/types';
import { createApp } from '../src/helpers/createApp';
import { EmailAdapter } from '../src/email/email.adapter';
import { AppModule } from '../src/app.module';
import { Questions } from '../src/entities/questions.entity';

describe('pair-game-quiz/pairs tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);

  let app: INestApplication;
  let server: any;
  let user: UserViewModel;
  let user2: UserViewModel;
  let accessToken: string;
  let accessToken2: string;
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
  const gameCreateUrl = '/pair-game-quiz/pairs/connection';
  const gameUrl = '/pair-game-quiz/pairs';
  const sendAnswerUrl = '/pair-game-quiz/pairs/my-current/answers';
  const currentGameUrl = '/pair-game-quiz/pairs/my-current';
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

  describe('pair-game-quiz/pairs', () => {
    describe('get game by gameId tests', () => {
      beforeEach(async () => {
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
      it('should send 404 if game not found', async () => {
        const fakeGameId = 'd2964585-e9a0-44a3-8e7a-f63851ca35fa';
        await request(server)
          .get(gameUrl + `/${fakeGameId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
      it('should get game with 1 player by gameId', async () => {
        const responseForGame = await request(server)
          .get(gameUrl + `/${game.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const gameFromResponse = responseForGame.body;

        expect(gameFromResponse.id).toBeDefined();
        expect(gameFromResponse.status).toEqual(
          GameStatuses.PendingSecondPlayer,
        );
        expect(gameFromResponse.firstPlayerProgress.player.id).toEqual(user.id);
        expect(gameFromResponse.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(gameFromResponse.firstPlayerProgress.answers).toEqual([]);
        expect(gameFromResponse.firstPlayerProgress.score).toBe(0);
        expect(gameFromResponse.secondPlayerProgress).toBeNull();
        expect(gameFromResponse.questions).toBeNull();
        expect(gameFromResponse.pairCreatedDate).toBeDefined();
        expect(gameFromResponse.startGameDate).toBeNull();
        expect(gameFromResponse.finishGameDate).toBeNull();
      });
      it('should get game with 2 players by gameId by 1st Player', async () => {
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

        accessToken2 = loginUser2.body.accessToken;

        const createResponseForGame2 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const game2: GameViewModel = createResponseForGame2.body;

        expect(game2.id).toEqual(game.id);
        expect(game2.status).toEqual(GameStatuses.Active);
        expect(game2.questions).toBeDefined();
        expect(game2.pairCreatedDate).toBeDefined();
        expect(game2.startGameDate).toBeDefined();
        expect(game2.finishGameDate).toBeNull();

        const responseForGame = await request(server)
          .get(gameUrl + `/${game.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const responseFor1stPlayer = responseForGame.body;

        expect(responseFor1stPlayer.id).toBeDefined();
        expect(responseFor1stPlayer.status).toEqual(GameStatuses.Active);
        expect(responseFor1stPlayer.firstPlayerProgress.player.id).toEqual(
          user.id,
        );
        expect(responseFor1stPlayer.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(responseFor1stPlayer.firstPlayerProgress.answers).toBeDefined();
        expect(responseFor1stPlayer.firstPlayerProgress.score).toBe(0);
        expect(responseFor1stPlayer.secondPlayerProgress.player.id).toEqual(
          user2.id,
        );
        expect(responseFor1stPlayer.secondPlayerProgress.player.login).toEqual(
          user2.login,
        );
        expect(responseFor1stPlayer.questions.length).toBe(5);
        expect(responseFor1stPlayer.pairCreatedDate).toBeDefined();
        expect(responseFor1stPlayer.startGameDate).toBeDefined();
        expect(responseFor1stPlayer.finishGameDate).toBeNull();
      });
      it('should get game with 2 players by gameId by 2nd Player', async () => {
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

        accessToken2 = loginUser2.body.accessToken;

        const createResponseForGame2 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const game2: GameViewModel = createResponseForGame2.body;

        expect(game2.id).toEqual(game.id);
        expect(game2.status).toEqual(GameStatuses.Active);
        expect(game2.firstPlayerProgress.player.id).toEqual(user.id);
        expect(game2.firstPlayerProgress.player.login).toEqual(user.login);
        expect(game2.firstPlayerProgress.answers).toBeDefined();
        expect(game2.firstPlayerProgress.score).toBe(0);
        expect(game2.secondPlayerProgress.player.id).toEqual(user2.id);
        expect(game2.secondPlayerProgress.player.login).toEqual(user2.login);
        expect(game2.questions.length).toBe(5);
        expect(game2.pairCreatedDate).toBeDefined();
        expect(game2.startGameDate).toBeDefined();
        expect(game2.finishGameDate).toBeNull();

        const responseForGame1stPlayer = await request(server)
          .get(gameUrl + `/${game.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const responseForGame = responseForGame1stPlayer.body;

        expect(responseForGame.id).toEqual(game.id);
        expect(responseForGame.status).toEqual(GameStatuses.Active);
        expect(responseForGame.firstPlayerProgress.player.id).toEqual(user.id);
        expect(responseForGame.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(responseForGame.firstPlayerProgress.answers).toBeDefined();
        expect(responseForGame.firstPlayerProgress.score).toBe(0);
        expect(responseForGame.secondPlayerProgress.player.id).toEqual(
          user2.id,
        );
        expect(responseForGame.secondPlayerProgress.player.login).toEqual(
          user2.login,
        );
        expect(responseForGame.questions.length).toBe(5);
        expect(responseForGame.pairCreatedDate).toBeDefined();
        expect(responseForGame.startGameDate).toBeDefined();
        expect(responseForGame.finishGameDate).toBeNull();
      });
      it('should send 403 if user try to get alien game', async () => {
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

        await request(server)
          .get(gameUrl + `/${game.id}`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(403);
      });
    });
    describe('get current game tests', () => {
      beforeEach(async () => {
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
      it('should get current game with 1 player by 1st player', async () => {
        const responseForGame = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = responseForGame.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(game.firstPlayerProgress.player.id).toEqual(user.id);
        expect(game.firstPlayerProgress.player.login).toEqual(user.login);
        expect(game.firstPlayerProgress.answers).toEqual([]);
        expect(game.firstPlayerProgress.score).toBe(0);
        expect(game.secondPlayerProgress).toBeNull();
        expect(game.questions).toBeNull();
        expect(game.pairCreatedDate).toBeDefined();
        expect(game.startGameDate).toBeNull();
        expect(game.finishGameDate).toBeNull();

        const responseForCurrentGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const currentGame: GameViewModel = responseForCurrentGame.body;

        expect(currentGame.id).toBeDefined();
        expect(currentGame.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(currentGame.firstPlayerProgress.player.id).toEqual(user.id);
        expect(currentGame.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(currentGame.firstPlayerProgress.answers).toBeDefined();
        expect(currentGame.firstPlayerProgress.score).toBe(0);
        expect(currentGame.secondPlayerProgress).toBeNull();
        expect(currentGame.questions).toBeNull();
        expect(currentGame.pairCreatedDate).toBeDefined();
        expect(currentGame.startGameDate).toBeDefined();
        expect(currentGame.finishGameDate).toBeNull();
      });
      it('should get current game with 2 players by 1st player', async () => {
        const responseForGame = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = responseForGame.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(game.firstPlayerProgress.player.id).toEqual(user.id);
        expect(game.firstPlayerProgress.player.login).toEqual(user.login);
        expect(game.firstPlayerProgress.answers).toEqual([]);
        expect(game.firstPlayerProgress.score).toBe(0);
        expect(game.secondPlayerProgress).toBeNull();
        expect(game.questions).toBeNull();
        expect(game.pairCreatedDate).toBeDefined();
        expect(game.startGameDate).toBeNull();
        expect(game.finishGameDate).toBeNull();

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

        accessToken2 = loginUser2.body.accessToken;
        debugger;
        const responseForGame2 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const game2: GameViewModel = responseForGame2.body;

        expect(game2.id).toBeDefined();
        expect(game2.status).toEqual(GameStatuses.Active);
        expect(game2.questions).toBeDefined();
        expect(game2.pairCreatedDate).toBeDefined();
        expect(game2.startGameDate).toBeDefined();
        expect(game2.finishGameDate).toBeNull();

        const responseForCurrentGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const currentGame: GameViewModel = responseForCurrentGame.body;

        expect(currentGame.id).toBeDefined();
        expect(currentGame.status).toEqual(GameStatuses.Active);
        expect(currentGame.firstPlayerProgress.player.id).toEqual(user.id);
        expect(currentGame.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(currentGame.firstPlayerProgress.answers).toBeDefined();
        expect(currentGame.firstPlayerProgress.score).toBe(0);
        expect(currentGame.secondPlayerProgress.player.id).toEqual(user2.id);
        expect(currentGame.secondPlayerProgress.player.login).toEqual(
          user2.login,
        );
        expect(currentGame.questions.length).toBe(5);
        expect(currentGame.pairCreatedDate).toBeDefined();
        expect(currentGame.startGameDate).toBeDefined();
        expect(currentGame.finishGameDate).toBeNull();
      });
      it('should get current game with 2 players by 1nd player', async () => {
        const responseForGame = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = responseForGame.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(game.firstPlayerProgress.player.id).toEqual(user.id);
        expect(game.firstPlayerProgress.player.login).toEqual(user.login);
        expect(game.firstPlayerProgress.answers).toEqual([]);
        expect(game.firstPlayerProgress.score).toBe(0);
        expect(game.secondPlayerProgress).toBeNull();
        expect(game.questions).toBeNull();
        expect(game.pairCreatedDate).toBeDefined();
        expect(game.startGameDate).toBeNull();
        expect(game.finishGameDate).toBeNull();

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

        accessToken2 = loginUser2.body.accessToken;
        debugger;
        const responseForGame2 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const game2: GameViewModel = responseForGame2.body;

        expect(game2.id).toBeDefined();
        expect(game2.status).toEqual(GameStatuses.Active);
        expect(game2.questions).toBeDefined();
        expect(game2.pairCreatedDate).toBeDefined();
        expect(game2.startGameDate).toBeDefined();
        expect(game2.finishGameDate).toBeNull();

        const responseForCurrentGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const currentGame: GameViewModel = responseForCurrentGame.body;

        expect(currentGame.id).toBeDefined();
        expect(currentGame.status).toEqual(GameStatuses.Active);
        expect(currentGame.firstPlayerProgress.player.id).toEqual(user.id);
        expect(currentGame.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(currentGame.firstPlayerProgress.answers).toBeDefined();
        expect(currentGame.firstPlayerProgress.score).toBe(0);
        expect(currentGame.secondPlayerProgress.player.id).toEqual(user2.id);
        expect(currentGame.secondPlayerProgress.player.login).toEqual(
          user2.login,
        );
        expect(currentGame.questions.length).toBe(5);
        expect(currentGame.pairCreatedDate).toBeDefined();
        expect(currentGame.startGameDate).toBeDefined();
        expect(currentGame.finishGameDate).toBeNull();
      });
      it('should send 404 if game not found', async () => {
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
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(404);
      });
      it('should send 404 if active game not found', async () => {
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

        const createResponseForGame = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const createdGame: GameViewModel = createResponseForGame.body;

        expect(createdGame.id).toBeDefined();
        expect(createdGame.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(createdGame.firstPlayerProgress.player.id).toEqual(user.id);
        expect(createdGame.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(createdGame.firstPlayerProgress.answers).toEqual([]);
        expect(createdGame.firstPlayerProgress.score).toBe(0);
        expect(createdGame.secondPlayerProgress).toBeNull();
        expect(createdGame.questions).toBeNull();
        expect(createdGame.pairCreatedDate).toBeDefined();
        expect(createdGame.startGameDate).toBeNull();
        expect(createdGame.finishGameDate).toBeNull();

        await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(404);
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

        expect(getResponseForQuestions.body.totalCount).toEqual(10);
        expect(getResponseForQuestions.body.items.length).toEqual(10);
      });
      it('should create games for one player with correct input data', async () => {
        const createResponseForGame = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const createdGame: GameViewModel = createResponseForGame.body;

        expect(createdGame.id).toBeDefined();
        expect(createdGame.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(createdGame.firstPlayerProgress.player.id).toEqual(user.id);
        expect(createdGame.firstPlayerProgress.player.login).toEqual(
          user.login,
        );
        expect(createdGame.firstPlayerProgress.answers).toEqual([]);
        expect(createdGame.firstPlayerProgress.score).toBe(0);
        expect(createdGame.secondPlayerProgress).toBeNull();
        expect(createdGame.questions).toBeNull();
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
    describe('create games games for two players tests', () => {
      beforeEach(async () => {
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

        const game2: GameViewModel = createResponseForPairUser2.body;

        expect(game2.id).toBeDefined();
        expect(game2.status).toEqual(GameStatuses.Active);
        expect(game2.questions).toBeDefined();
        expect(game2.pairCreatedDate).toBeDefined();
        expect(game2.startGameDate).toBeDefined();
        expect(game2.finishGameDate).toBeNull();
      });
      it('Should return 403 if current user is already in active game', async () => {
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

        const responseForGameUser1 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = responseForGameUser1.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(game.questions).toEqual(game.questions);
        expect(game.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(game.startGameDate).toBeNull();
        expect(game.finishGameDate).toBeNull();

        const responseForGameUser2 = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const game2: GameViewModel = responseForGameUser2.body;

        expect(game2.id).toBeDefined();
        expect(game2.status).toEqual(GameStatuses.Active);
        expect(game2.questions).toBeDefined();
        expect(game2.pairCreatedDate).toBeDefined();
        expect(game2.startGameDate).toBeDefined();
        expect(game2.finishGameDate).toBeNull();

        await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(403);
      });
      it('Should return 403 if current user is already in pending game', async () => {
        const responseForGame = await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        game = responseForGame.body;

        expect(game.id).toBeDefined();
        expect(game.status).toEqual(GameStatuses.PendingSecondPlayer);
        expect(game.questions).toEqual(game.questions);
        expect(game.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(game.startGameDate).toBeNull();
        expect(game.finishGameDate).toBeNull();

        await request(server)
          .post(gameCreateUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(403);
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
    describe('send answer tests', () => {
      beforeEach(async () => {
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

        const createUserDto2: UserInputModel = {
          login: `user2`,
          password: 'password',
          email: `user2@gmail.com`,
        };

        const responseForUser2 = await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto2);

        user2 = responseForUser2.body;
        expect(user2).toBeDefined();

        const loginUser2 = await request(server)
          .post('/auth/login')
          .set(userAgent)
          .set(userAgent)
          .send({
            loginOrEmail: createUserDto2.login,
            password: createUserDto2.password,
          });

        accessToken2 = loginUser2.body.accessToken;

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
      it('should send incorrect answer from firstPlayer with correct input data', async () => {
        const answerRequest = await request(server)
          .post(sendAnswerUrl)
          .send({ answer: 'not correct' })
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const answer: AnswerViewModel = answerRequest.body;

        expect(answer.questionId).toBeDefined();
        expect(answer.answerStatus).toEqual(AnswerStatuses.Incorrect);
        expect(answer.addedAt).toBeDefined();

        const responseForGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const foundGame: GameViewModel = responseForGame.body;

        expect(foundGame.id).toEqual(game.id);
        expect(foundGame.status).toEqual('Active');
        expect(foundGame.questions).toBeDefined();
        expect(foundGame.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(foundGame.startGameDate).toBeDefined();
        expect(foundGame.firstPlayerProgress.answers[0].answerStatus).toEqual(
          AnswerStatuses.Incorrect,
        );
        expect(foundGame.firstPlayerProgress.score).toBe(0);
        expect(foundGame.finishGameDate).toBeNull();
      });
      it('should send incorrect answer from secondPlayer with correct input data', async () => {
        const answerRequest = await request(server)
          .post(sendAnswerUrl)
          .send({ answer: 'not correct' })
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const answer: AnswerViewModel = answerRequest.body;

        expect(answer.questionId).toBeDefined();
        expect(answer.answerStatus).toEqual(AnswerStatuses.Incorrect);
        expect(answer.addedAt).toBeDefined();

        const responseForGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const foundGame: GameViewModel = responseForGame.body;

        expect(foundGame.id).toEqual(game.id);
        expect(foundGame.status).toEqual('Active');
        expect(foundGame.questions).toBeDefined();
        expect(foundGame.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(foundGame.startGameDate).toBeDefined();
        expect(foundGame.secondPlayerProgress.answers[0].answerStatus).toEqual(
          AnswerStatuses.Incorrect,
        );
        expect(foundGame.secondPlayerProgress.score).toBe(0);
        expect(foundGame.finishGameDate).toBeNull();
      });
      it('should send correct answer from firstPlayer with correct input data', async () => {
        const answerRequest = await request(server)
          .post(sendAnswerUrl)
          .send({ answer: 'answer1' })
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const answer: AnswerViewModel = answerRequest.body;

        expect(answer.questionId).toBeDefined();
        expect(answer.answerStatus).toEqual(AnswerStatuses.Correct);
        expect(answer.addedAt).toBeDefined();

        const responseForGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const foundGame: GameViewModel = responseForGame.body;

        expect(foundGame.id).toEqual(game.id);
        expect(foundGame.status).toEqual('Active');
        expect(foundGame.questions).toBeDefined();
        expect(foundGame.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(foundGame.startGameDate).toBeDefined();
        expect(foundGame.firstPlayerProgress.answers[0].answerStatus).toEqual(
          AnswerStatuses.Correct,
        );
        expect(foundGame.firstPlayerProgress.score).toBe(1);
        expect(foundGame.finishGameDate).toBeNull();
      });
      it('should send correct answer from secondPlayer with correct input data', async () => {
        const answerRequest = await request(server)
          .post(sendAnswerUrl)
          .send({ answer: 'answer1' })
          .set('Authorization', `Bearer ${accessToken2}`)
          .expect(200);

        const answer: AnswerViewModel = answerRequest.body;

        expect(answer.questionId).toBeDefined();
        expect(answer.answerStatus).toEqual(AnswerStatuses.Correct);
        expect(answer.addedAt).toBeDefined();

        const responseForGame = await request(server)
          .get(currentGameUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const foundGame: GameViewModel = responseForGame.body;

        expect(foundGame.id).toEqual(game.id);
        expect(foundGame.status).toEqual('Active');
        expect(foundGame.questions).toBeDefined();
        expect(foundGame.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(foundGame.startGameDate).toBeDefined();
        expect(foundGame.secondPlayerProgress.answers[0].answerStatus).toEqual(
          AnswerStatuses.Correct,
        );
        expect(foundGame.secondPlayerProgress.score).toBe(1);
        expect(foundGame.finishGameDate).toBeNull();
      });
      it('should send 5 correct answers from firstPlayer and secondPlayer with correct input data', async () => {
        for (let i = 0; i < 5; i++) {
          const firstPlayerRequest = await request(server)
            .post(sendAnswerUrl)
            .send({ answer: 'answer1' })
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

          const answer: AnswerViewModel = firstPlayerRequest.body;

          expect(answer.questionId).toBeDefined();
          expect(answer.answerStatus).toEqual(AnswerStatuses.Correct);
          expect(answer.addedAt).toBeDefined();

          const secondPlayerRequest = await request(server)
            .post(sendAnswerUrl)
            .send({ answer: 'incorrect' })
            .set('Authorization', `Bearer ${accessToken2}`)
            .expect(200);

          const answer2: AnswerViewModel = secondPlayerRequest.body;

          expect(answer2.questionId).toBeDefined();
          expect(answer2.answerStatus).toEqual(AnswerStatuses.Incorrect);
          expect(answer2.addedAt).toBeDefined();
        }
      });
      it('should send 5 correct answers from firstPlayer with correct input data', async () => {
        for (let i = 0; i < 5; i++) {
          const answerRequest = await request(server)
            .post(sendAnswerUrl)
            .send({ answer: 'answer1' })
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

          const answer: AnswerViewModel = answerRequest.body;

          expect(answer.questionId).toBeDefined();
          expect(answer.answerStatus).toEqual(AnswerStatuses.Correct);
          expect(answer.addedAt).toBeDefined();
        }
      });
      it('should send 5 correct answers from secondPlayer with correct input data', async () => {
        for (let i = 0; i < 5; i++) {
          const answerRequest = await request(server)
            .post(sendAnswerUrl)
            .send({ answer: 'answer1' })
            .set('Authorization', `Bearer ${accessToken2}`)
            .expect(200);

          const answer: AnswerViewModel = answerRequest.body;

          expect(answer.questionId).toBeDefined();
          expect(answer.answerStatus).toEqual(AnswerStatuses.Correct);
          expect(answer.addedAt).toBeDefined();
        }
      });
      it('should send 403 if firstPlayer give more than 5 answers', async () => {
        for (let i = 0; i < 5; i++) {
          await request(server)
            .post(sendAnswerUrl)
            .send({ answer: 'answer1' })
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        }

        await request(server)
          .post(sendAnswerUrl)
          .send({ answer: 'not correct' })
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(403);
      });
    });
  });
});
