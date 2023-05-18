import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Posts } from '../entities/posts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Posts])],
  controllers: [],
  providers: [],
})
export class PostsModule {}