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
import { sleep } from './helpers/sleepfunction';

describe('pair-games-games tests (e2e)', () => {
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

  describe('sa/games/questions', () => {
    describe('get game by gameId tests', () => {
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
      it('should send 404 if game not found', async () => {
        const fakeGameId = 'cuifhw09r';
        await request(server)
          .get(gameUrl + `/${fakeGameId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
      it('should get game by gameId', async () => {
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

        expect(foundGame.id).toEqual(game.id);
        expect(foundGame.status).toEqual(game.status);
        expect(foundGame.questions).toBeDefined();
        expect(foundGame.pairCreatedDate).toEqual(game.pairCreatedDate);
        expect(foundGame.startGameDate).toBeNull();
        expect(foundGame.finishGameDate).toBeNull();
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

        const pair2: GameViewModel = createResponseForPairUser2.body;

        expect(pair2.id).toBeDefined();
        expect(pair2.status).toEqual(GameStatuses.Active);
        expect(pair2.questions).toBeDefined();
        expect(pair2.pairCreatedDate).toBeDefined();
        expect(pair2.startGameDate).toBeDefined();
        expect(pair2.finishGameDate).toBeNull();
      });
      it('Should return 403 if current user is already participating in active game', async () => {
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
        console.log('foundGame', foundGame.firstPlayerProgress.answers);
        console.log('foundGame', foundGame);

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
      it('should send 403 if firstPlayer give more than 5 answers', async () => {
        for (let i = 0; i < 5; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Задержка в 1 секунду

          const answerRequest = await request(server)
            .post(sendAnswerUrl)
            .send({ answer: 'answer1' })
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        }

        sleep(10);

        const answerRequest = await request(server)
          .post(sendAnswerUrl)
          .send({ answer: 'not correct' })
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(403);

        /*      const answer: AnswerViewModel = answerRequest.body;

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
        expect(foundGame.finishGameDate).toBeNull();*/
      });
    });
  });
});
