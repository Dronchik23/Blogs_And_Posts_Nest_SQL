import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import {
  BlogDBType,
  PaginationType,
  QuestionDBType,
  SortDirection,
  UserDBType,
} from '../types/types';
import { UserViewModel } from '../models/models';
import { Brackets, DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/users.entity';
import { Questions } from '../entities/question.entity';

@Injectable({ scope: Scope.DEFAULT })
export class QuestionsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
  ) {}

  async getAllQuestions(
    bodySearchTerm: string,
    publishedStatus: string,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    pageSize: number,
  ): Promise<PaginationType> {
    debugger;
    const builder = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from(Questions, 'questions');

    if (bodySearchTerm) {
      builder.andWhere('questions.body ILIKE :bodySearchTerm', {
        searchNameTerm: `%${bodySearchTerm}%`,
      });
    }

    const questions: any = await builder
      .orderBy(
        `questions.${sortBy} COLLATE "C"`,
        sortDirection.toUpperCase() as SortDirection,
      )
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getRawMany();

    const totalCount: number = await builder.getCount();

    //const mappedUsers = this.fromUserDBTypeToUserViewModelWithPagination(users);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: questions,
    };
  }
}
