import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JWTPayloadType } from './types and models/types';
import { createApp } from './helpers/createApp';

async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);
  await app.listen(3000);
}
bootstrap();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User | null;
      userId: string | null;
      deviceId: string | null;
      jwtPayload: JWTPayloadType | null;
    }
  }
}
