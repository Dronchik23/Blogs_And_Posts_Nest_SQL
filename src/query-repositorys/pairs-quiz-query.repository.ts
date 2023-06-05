import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import {
  BlogDBType,
  PaginationType,
  PairDBType,
  SortDirection,
} from '../types/types';
import {
  BlogViewModel,
  PairViewModel,
  SABlogViewModel,
} from '../models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Blogs } from '../entities/blogs.entity';
import { plainToClass } from 'class-transformer';
import { QuizPairs } from '../entities/quiz-pairs.entity';

@Injectable({ scope: Scope.DEFAULT })
export class PairsQuizQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(QuizPairs)
    private readonly pairModel: Repository<QuizPairs>,
  ) {}

  private fromPairDBTypePairViewModel(pair: PairDBType): PairViewModel {
    return {
      id: pair.id,
      firstPlayerProgress: pair.firstPlayerProgress,
      secondPlayerProgress: pair.secondPlayerProgress,
      questions: pair.questions,
      status: pair.status,
      pairCreatedDate: pair.pairCreatedDate,
      startGameDate: pair.startGameDate,
      finishGameDate: pair.finishGameDate,
    };
  }

  async findPairByPairId(pairId: string): Promise<PairViewModel> {
    try {
      debugger;
      const pair = await this.pairModel.findOneBy({ id: pairId });
      return pair ? this.fromPairDBTypePairViewModel(pair) : null;
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
