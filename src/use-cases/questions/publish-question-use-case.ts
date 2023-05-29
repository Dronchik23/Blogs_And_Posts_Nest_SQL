import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublishQuestionModel } from '../../models/models';

import { QuestionRepository } from '../../sa/quiz/questions/question.repository';

export class PublishQuestionCommand {
  constructor(
    public questionId: string,
    public publishQuestionDTO: PublishQuestionModel,
  ) {}
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionService
  implements ICommandHandler<PublishQuestionCommand>
{
  constructor(private readonly questionRepository: QuestionRepository) {}

  async execute(command: PublishQuestionCommand): Promise<boolean> {
    const updatedAt = new Date().toISOString();

    return await this.questionRepository.publishQuestion(
      command.questionId,
      command.publishQuestionDTO,
      updatedAt,
    );
  }
}
