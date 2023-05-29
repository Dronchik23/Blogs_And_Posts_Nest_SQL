import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserViewModel } from '../../../src/models/models';
import { EmailAdapter } from '../../../src/email/email.adapter';
import { createApp } from '../../../src/helpers/createApp';
import { AppModule } from '../../../src/app.module';

describe.skip('users creator (e2e)', () => {
  jest.setTimeout(1000 * 60 * 3);

  let app: INestApplication;
  let server: any;
  let user: UserViewModel;
  const mokEmailAdapter = {
    async sendEmail(
      email: string,
      subject: string,
      message: string,
    ): Promise<void> {
      return;
    },
  };

  const wipeAllData = '/testing/all-data';

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

  describe('users creator', () => {
    it('should create 10 users', async () => {
      await request(server).delete(wipeAllData);

      const createUserDto = (i: number) => ({
        login: `user${i}`,
        password: 'password',
        email: `user${i}@gmail.com`,
      });

      for (let i = 1; i <= 10; i++) {
        await request(server)
          .post('/sa/users')
          .auth('admin', 'qwerty')
          .send(createUserDto(i))
          .expect(201);
      }

      const getUsersResponse = await request(server)
        .get('/sa/users')
        .auth('admin', 'qwerty')
        .expect(200);

      expect(getUsersResponse.body.totalCount).toEqual(10);
      expect(getUsersResponse.body.items.length).toEqual(10);
    });
  });
});
