import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './helpers/createApp';
import { Logger } from '@nestjs/common';

const PORT = process.env.PORT || 3000;

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);
  await app.listen(PORT);
}
bootstrap();

process.on('uncaughtException', (err) => {
  logger.error('GLOBAL ERROR');
  logger.error(err, err.stack);
});
