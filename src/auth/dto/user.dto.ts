import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserDto {
  @ApiProperty({
    description: 'The username of the user',
    default: 'user',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    default: 'password',
    format: 'password',
  })
  @IsString()
  password: string;
}
