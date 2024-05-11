import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

async function bootstrap() {
  const PORT = configService.get<string>('PORT');
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Pokemons API')
    .setDescription('The Pokemons API description')
    .setVersion('1.0')
    .addTag('pokemons')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(PORT);
}
bootstrap();
