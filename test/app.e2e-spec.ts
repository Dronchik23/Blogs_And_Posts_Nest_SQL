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
});
