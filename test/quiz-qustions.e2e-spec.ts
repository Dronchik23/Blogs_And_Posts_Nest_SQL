import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createApp } from '../src/helpers/createApp';
import {
  QuestionInputModel,
  QuestionViewModel,
  UserInputModel,
  UserViewModel,
} from '../src/models/models';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailAdapter } from '../src/email/email.adapter';

describe('sa/quiz/questions tests (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);

  let app: INestApplication;
  let server: any;
  let user: UserViewModel;
  let question: QuestionViewModel;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };
  const url = '/sa/quiz/questions/';
  const wipeAllData = '/testing/all-data';
  const userAgent = {
    'User-Agent': 'jest user-agent',
  };
  const createQuestionDto: QuestionInputModel = {
    body: `questionmorethen10`,
    correctAnswers: ['answer1', 'answer2'],
  };
  const updateQuestionDto: QuestionInputModel = {
    body: `new questionmorethen10`,
    correctAnswers: ['new answer1', 'new answer2'],
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
    describe('get question tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

        const createQuestionDto: QuestionInputModel = {
          body: `questionmorethen10`,
          correctAnswers: ['answer1', 'answer2'],
        };

        const createResponseForQuestion = await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send(createQuestionDto)
          .expect(201);

        question = createResponseForQuestion.body;
        expect(question).toBeDefined();
      });
      it('should get all questions', async () => {
        await request(server)
          .get(url)
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [question],
          });
      });
    });
    describe('create question tests', () => {
      it('should create question with correct input data', async () => {
        await request(server).delete(wipeAllData);

        const createResponseForQuestion = await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send(createQuestionDto)
          .expect(201);

        const question: QuestionViewModel = createResponseForQuestion.body;

        await request(server)
          .get(url)
          .auth('admin', 'qwerty')
          .expect(200, {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [question],
          });
      });
      it('should not create question with incorrect input data', async () => {
        await request(server).delete(wipeAllData);

        await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send({ body: 'validnicebodymore10', correctAnswers: 'dich' })
          .expect(400);

        await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send({ body: '', correctAnswers: ['not dich', 'not dich'] })
          .expect(400);

        await request(server).get(url).auth('admin', 'qwerty').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
      it('should not create question with incorrect authorization data', async () => {
        await request(server).delete(wipeAllData);
        await request(server)
          .post(url)
          .auth('admin', '')
          .send(createQuestionDto)
          .expect(401);

        await request(server)
          .post(url)
          .auth('', 'qwerty')
          .send(createQuestionDto)
          .expect(401);

        await request(server).get(url).auth('admin', 'qwerty').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
    });
    describe('delete question tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

        const createQuestionDto: QuestionInputModel = {
          body: `questionmorethen10`,
          correctAnswers: ['answer1', 'answer2'],
        };

        const createResponseForQuestion = await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send(createQuestionDto)
          .expect(201);

        question = createResponseForQuestion.body;
        expect(question).toBeDefined();
      });
      it('should not question user that not exist ', async () => {
        await request(server)
          .delete(`${url}${'fake' + question.id}`)
          .auth('admin', 'qwerty')
          .expect(404);
      });
      it('should not question user with bad auth params', async () => {
        await request(server)
          .delete(`${url}${question.id}`)
          .auth('admin', 'invalid')
          .expect(401);

        await request(server)
          .delete(`${url}${question.id}`)
          .auth('Authorization', `Bearer YWRtaW46cXdlcnR5`)
          .expect(401);
      });
      it('should question with correct id', async () => {
        debugger;
        await request(server)
          .delete(`${url}${question.id}`)
          .auth('admin', 'qwerty')
          .expect(204);

        await request(server).get(url).auth('admin', 'qwerty').expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
      });
    });
    describe('update question tests', () => {
      beforeAll(async () => {
        await request(server).delete(wipeAllData);

        const createQuestionDto: QuestionInputModel = {
          body: `questionmorethen10`,
          correctAnswers: ['answer1', 'answer2'],
        };

        const createResponseForQuestion = await request(server)
          .post(url)
          .auth('admin', 'qwerty')
          .send(createQuestionDto)
          .expect(201);

        question = createResponseForQuestion.body;
        expect(question).toBeDefined();
      });
      it('should not update question that not exist', async () => {
        const fakeQuestionId = '500';
        await request(server)
          .put(url + `${fakeQuestionId}`)
          .auth('admin', 'qwerty')
          .send(updateQuestionDto)
          .expect(404);
      });
      it('should not update question with incorrect input data', async () => {
        await request(server)
          .put(url + `${question.id}`)
          .auth('admin', 'qwerty')
          .send({
            body: '',
            correctAnswers: updateQuestionDto.correctAnswers,
          })
          .expect(400);

        await request(server)
          .put(url + `${question.id}`)
          .auth('admin', 'qwerty')
          .send({
            body: updateQuestionDto.body,
            correctAnswers: 'dich',
          })
          .expect(400);
      });
      it('should not update question with incorrect authorization data', async () => {
        await request(server)
          .put(url + `${question.id}`)
          .auth('admin', '')
          .send(updateQuestionDto)
          .expect(401);

        await request(server)
          .put(url + `${question.id}`)
          .auth('', 'qwerty')
          .send(updateQuestionDto)
          .expect(401);
      });
      it('should update question with correct data', async () => {
        await request(server)
          .put(url + `${question.id}`)
          .auth('admin', 'qwerty')
          .send(updateQuestionDto)
          .expect(204);

        const response = await request(server).get(url).auth('admin', 'qwerty');

        const updatedQuestion: QuestionViewModel = response.body.items[0];

        expect(updatedQuestion.body).toEqual(updateQuestionDto.body);
        expect(updatedQuestion.correctAnswers).toEqual(
          updatedQuestion.correctAnswers,
        );
      });
    });
  });
});