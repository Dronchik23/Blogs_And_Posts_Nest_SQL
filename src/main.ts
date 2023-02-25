import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserViewModel } from './types and models/models';
import { JWTPayloadType } from './types and models/types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: UserViewModel | null;
      userId: string | null;
      deviceId: string | null;
      jwtPayload: JWTPayloadType | null;
    }
  }
}
