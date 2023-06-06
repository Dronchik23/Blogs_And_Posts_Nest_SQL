import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BasicAuthGuard } from '../../../auth/strategys/basic-strategy';
import {
  PublishQuestionModel,
  QuestionInputModel,
  QuestionPaginationQueryModel,
  QuestionUpdateModel,
  QuestionViewModel,
} from '../../../models/models';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../../../use-cases/questions/create-question-use-case';
import { PaginationType } from '../../../types/types';
import { QuestionsQueryRepository } from '../../../query-repositorys/questions-query.repository';
import { DeleteQuestionCommand } from '../../../use-cases/questions/delete-question-use-case';
import { UpdateQuestionCommand } from '../../../use-cases/questions/update-question-use-case';
import { PublishQuestionCommand } from '../../../use-cases/questions/publish-question-use-case';

@SkipThrottle()
@Controller({ path: 'sa/quiz/questions', scope: Scope.REQUEST })
export class QuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async getAllQuestions(
    @Query() query: QuestionPaginationQueryModel,
  ): Promise<PaginationType> {
    return this.questionsQueryRepository.getAllQuestions(
      query.bodySearchTerm,
      query.publishedStatus,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
      +query.pageSize,
    );
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createQuestion(
    @Body() createQuestionDTO: QuestionInputModel,
  ): Promise<QuestionViewModel> {
    {
      return await this.commandBus.execute(
        new CreateQuestionCommand(createQuestionDTO),
      );
    }
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':questionId')
  @HttpCode(204)
  async deleteQuestionByQuestionId(
    @Param('questionId') questionId: string,
  ): Promise<boolean> {
    const isDeleted = await this.commandBus.execute(
      new DeleteQuestionCommand(questionId),
    );
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(BasicAuthGuard)
  @Put(':questionId')
  @HttpCode(204)
  async updateQuestionByQuestionId(
    @Param('questionId') questionId: string,
    @Body() updateQuestionDTO: QuestionUpdateModel,
  ): Promise<boolean> {
    return await this.commandBus.execute(
      new UpdateQuestionCommand(questionId, updateQuestionDTO),
    );
  }

  @UseGuards(BasicAuthGuard)
  @Put(':questionId/publish')
  @HttpCode(204)
  async publishQuestionBy(
    @Param('questionId') questionId: string,
    @Body() publishQuestionDTO: PublishQuestionModel,
  ): Promise<boolean> {
    return await this.commandBus.execute(
      new PublishQuestionCommand(questionId, publishQuestionDTO),
    );
  }
}
