import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  GameViewModel,
  QuestionViewModel,
  UserViewModel,
} from '../../models/models';
import { GamesRepository } from '../../games/game.repository';
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
    debugger;
    const questions: QuestionViewModel[] =
      await this.questionsQueryRepository.getFiveRandomQuestions();

    const activeGame: Games =
      await this.gamesQueryRepository.findPairByGameStatus(
        GameStatuses.PendingSecondPlayer,
      );

    if (isNil(activeGame)) {
      return await this.gamesRepository.createGameWithOnePlayer(
        questions,
        command.user,
      );
    } else {
      return await this.gamesRepository.createGameWithTwoPlayers(
        command.user,
        activeGame,
      );
    }
  }
}
