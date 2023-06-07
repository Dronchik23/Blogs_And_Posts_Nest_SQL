import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnswerViewModel, GameViewModel } from '../../models/models';
import { GamesRepository } from '../../games/pairs-quiz.repository';
import { GamesQueryRepository } from '../../query-repositorys/games-query-repository.service';
import { QuestionsQueryRepository } from '../../query-repositorys/questions-query.repository';

export class SendAnswerCommand {
  constructor(public player1Answer: string, public game: GameViewModel) {}
}

@CommandHandler(SendAnswerCommand)
export class SendAnswerService implements ICommandHandler<SendAnswerCommand> {
  constructor(
    private readonly gamesRepository: GamesRepository,
    private readonly gamesQueryRepository: GamesQueryRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async execute(command: SendAnswerCommand): Promise<any> {
    let player2Answer: string;

    /*    function processAnswers(games: GameViewModel) {
      const currentQuestion = games.questions[0]; // Получаем текущий вопрос из массива вопросов

      if (currentQuestion.answer === command.player1Answer) {
        // Ответ первого игрока на текущий вопрос правильный
        games.firstPlayerProgress.score++; // Увеличиваем счет первого игрока
      }

      const player2Answer = games.secondPlayerProgress.answers[0];

      if (currentQuestion.answer === player2Answer) {
        // Ответ второго игрока на текущий вопрос правильный
        games.secondPlayerProgress.score++; // Увеличиваем счет второго игрока
      }

      if (command.player1Answer !== null && player2Answer !== null) {
        // Если пришли оба ответа
        games.questions.shift(); // Удаляем текущий вопрос из массива вопросов

        if (games.questions.length > 0) {
          // Если еще есть вопросы, устанавливаем следующий вопрос как текущий
          setCurrentQuestion(games.questions[0]);
        } else {
          // Если вопросы закончились, завершаем игру
          finishGame();
        }
      }
    }*/
    return;

    function setCurrentQuestion(question) {
      // Здесь вы можете выполнить необходимые действия для установки вопроса в качестве текущего
    }

    function finishGame() {
      // Здесь вы можете выполнить необходимые действия для завершения игры
    }
  }
}
