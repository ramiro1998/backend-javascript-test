import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  app.setGlobalPrefix('api')
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
