import { Module } from '@nestjs/common';
import { PokemonsService } from './pokemons.service';
import { PokemonsController } from './pokemons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pokemon } from './entity/pokemon.entity';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [S3Module, TypeOrmModule.forFeature([Pokemon])],
  controllers: [PokemonsController],
  providers: [PokemonsService],
})
export class PokemonsModule {}
