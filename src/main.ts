import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UserViewModel } from './types and models/models';
import { JWTPayloadType } from './types and models/types';
import { HttpExceptionFilter } from './exeption.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: false,
      transform: true,
      exceptionFactory: (errors) => {
        const errorForResponse = [];

        errors.forEach((e) => {
          const constraintsKeys = Object.keys(e.constraints);
          constraintsKeys.forEach((key) => {
            errorForResponse.push({
              message: e.constraints[key],
              field: e.property,
            });
          });
        });
        throw new BadRequestException(errorForResponse);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
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
