import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionUpdateModel } from '../../models/models';

import { QuestionRepository } from '../../sa/quiz/questions/question.repository';

export class UpdateQuestionCommand {
  constructor(
    public questionId: string,
    public questionUpdateDTO: QuestionUpdateModel,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionService
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private readonly questionRepository: QuestionRepository) {}

  async execute(command: UpdateQuestionCommand): Promise<boolean> {
    return await this.questionRepository.updateQuestionByQuestionId(
      command.questionId,
      command.questionUpdateDTO,
    );
  }
}
