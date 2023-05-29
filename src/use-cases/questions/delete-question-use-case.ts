import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../sa/quiz/questions/question.repository';

export class DeleteQuestionCommand {
  constructor(public questionId: string) {}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionService
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(private readonly questionRepository: QuestionRepository) {}

  async execute(command: DeleteQuestionCommand): Promise<boolean> {
    return await this.questionRepository.deleteQuestionByQuestionId(
      command.questionId,
    );
  }
}
