import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConnectionService } from './connection/connection.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {logger: false});

  const teste = await app.resolve(ConnectionService)
  await teste.connect()

  await app.listen(3000);
}
bootstrap();
