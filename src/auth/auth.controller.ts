import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './utilities/public.decorator';
import { UserDto } from './dto/user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: UserDto, @Res() response: Response) {
    const { username, password } = signInDto;
    const token = await this.authService.signIn(username, password);
    response.cookie('accessToken', token.access_token, {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
    });
    response.json(token);
  }
}
