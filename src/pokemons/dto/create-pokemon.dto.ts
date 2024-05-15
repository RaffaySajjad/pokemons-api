import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

class AttackDto {
  @ApiProperty({
    description: 'The name of the attack',
    default: 'THUNDER_SHOCK',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The amount of damage the attack does',
    default: 40,
  })
  @IsNumber()
  damage: number;
}

class WeaknessDto {
  @ApiProperty({
    description: 'The name of the weakness',
    default: 'FIRE_BLAST',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The multiplier of the weakness',
    default: 2,
  })
  @IsNumber()
  multiplier: number;
}

class ResistanceDto {
  @ApiProperty({
    description: 'The name of the resistance',
    default: 'WATER_GUN',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The value of the resistance',
    default: 20,
  })
  @IsNumber()
  value: number;
}

export class CreatePokemonDto {
  @ApiProperty({
    description: 'The name of the pokemon',
    default: 'Pikachu',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The health of the pokemon',
    default: 100,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  health: number;

  @ApiProperty({
    description: 'The rarity of the pokemon',
    default: 'Rare',
  })
  @IsString()
  rarity: string;

  @ApiProperty({
    description: 'The attack of the pokemon',
    default: { name: 'THUNDER_SHOCK', damage: 40 },
  })
  @Type(() => AttackDto)
  attack: AttackDto;

  @ApiProperty({
    description: 'The weakness of the pokemon',
    default: { name: 'FIRE_BLAST', multiplier: 2 },
  })
  @Type(() => WeaknessDto)
  weakness: WeaknessDto;

  @ApiProperty({
    description: 'The resistance of the pokemon',
    default: { name: 'WATER_GUN', value: 20 },
  })
  @Type(() => ResistanceDto)
  resistance?: ResistanceDto;
}
