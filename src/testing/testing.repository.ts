import { Injectable, Scope } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class TestingRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async deleteAllData() {
    return await this.dataSource.query(`
DELETE FROM public.blogs CASCADE;

DELETE FROM public."comments" CASCADE;

DELETE FROM public.devices CASCADE;

DELETE FROM public.likes CASCADE;

DELETE FROM public.posts CASCADE;

DELETE FROM public."refreshTokenBlackList" CASCADE;

DELETE FROM public.users CASCADE;

DELETE FROM public.questions CASCADE; 

DELETE FROM public.players CASCADE;

DELETE FROM public.answers CASCADE;

DELETE FROM public."gameProgresses" CASCADE;

DELETE FROM public.games CASCADE;
`);
  }
}
