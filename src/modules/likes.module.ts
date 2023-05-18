import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Likes } from '../entities/likes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Likes])],
  controllers: [],
  providers: [],
})
export class LikesModule {}
