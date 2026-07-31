import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { readEnvironment } from "./environment";

async function bootstrap(): Promise<void> {
  const environment = readEnvironment();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("v1");
  app.enableCors({
    credentials: true,
    origin: environment.corsOrigins,
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableShutdownHooks();

  await app.listen(environment.port, "0.0.0.0");
}

void bootstrap();
