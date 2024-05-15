import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

console.log(
  'CORS Whitelist:',
  configService.get<string>('ALLOWED_ORIGINS')?.split(','),
);

async function bootstrap() {
  const PORT = configService.get<string>('PORT');
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get<string>('ALLOWED_ORIGINS')?.split(','),
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true,
  });

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
