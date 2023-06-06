import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  GameViewModel,
  QuestionViewModel,
  UserViewModel,
} from '../../models/models';
import { GamesRepository } from '../../game/pairs-quiz.repository';
import { GameStatuses } from '../../types/types';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../sa/users/users-repository';
import { QuestionsQueryRepository } from '../../query-repositorys/questions-query.repository';
import { GamesQueryRepository } from '../../query-repositorys/games-query-repository.service';
import { Games } from '../../entities/games.entity';
import { isNil } from '@nestjs/common/utils/shared.utils';

export class CreateGameCommand {
  constructor(public user: UserViewModel) {}
}

@CommandHandler(CreateGameCommand)
export class CreateGameService implements ICommandHandler<CreateGameCommand> {
  constructor(
    private readonly gamesRepository: GamesRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly usersRepository: UsersRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
    private readonly gamesQueryRepository: GamesQueryRepository,
  ) {}

  async execute(command: CreateGameCommand): Promise<GameViewModel> {
    const gameStatus = GameStatuses.PendingSecondPlayer;

    let startGameDate = new Date().toISOString();

    const questions: QuestionViewModel[] =
      await this.questionsQueryRepository.getFiveRandomQuestions();

    const secondPair: Games =
      await this.gamesQueryRepository.findPairByGameStatus(gameStatus);

    if (isNil(secondPair)) {
      startGameDate = null;

      return await this.gamesRepository.createGame(
        questions,
        command.user,
        startGameDate,
      );
    } else {
      return await this.gamesRepository.createGame(
        questions,
        command.user,
        startGameDate,
        secondPair,
      );
    }
  }
}
