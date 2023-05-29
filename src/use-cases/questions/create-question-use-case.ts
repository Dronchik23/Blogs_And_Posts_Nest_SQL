import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionInputModel, QuestionViewModel } from '../../models/models';
import { QuestionRepository } from '../../sa/quiz/questions/question.repository';

export class CreateQuestionCommand {
  constructor(public questionCreateDTO: QuestionInputModel) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionService
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private readonly questionRepository: QuestionRepository) {}

  async execute(command: CreateQuestionCommand): Promise<QuestionViewModel> {
    const question: QuestionViewModel =
      await this.questionRepository.createQuestion(command.questionCreateDTO);
    return question;
  }
}
