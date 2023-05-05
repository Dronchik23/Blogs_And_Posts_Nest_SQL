import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './helpers/createApp';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);
  await app.listen(PORT);
}
bootstrap();
