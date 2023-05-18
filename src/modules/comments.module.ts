import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comments } from '../entities/comments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comments])],
  controllers: [],
  providers: [],
})
export class CommentsModule {}
