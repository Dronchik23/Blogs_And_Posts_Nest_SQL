import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blogs } from '../entities/blogs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blogs])],
  controllers: [],
  providers: [],
})
export class BlogsModule {}
