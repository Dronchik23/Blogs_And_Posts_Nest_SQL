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
import { Players } from '../../entities/players.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';

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
    @InjectRepository(Players)
    private readonly playerModel: Repository<Players>,
    @InjectRepository(Games)
    private readonly gameModule: Repository<Games>,
  ) {}

  async execute(command: CreateGameCommand): Promise<GameViewModel> {
    const playersEntity: Players = await this.playerModel
      .createQueryBuilder()
      .where('"firstPlayerId" = :userId OR "secondPlayerId" = :userId', {
        userId: command.user.id,
      })
      .getOne();

    if (playersEntity) {
      const game: Games = await this.gameModule.findOneBy({
        gameProgressId: playersEntity.gameProgressId,
      });

      if (game) {
        throw new ForbiddenException();
      }
    }

    const questions: QuestionViewModel[] =
      await this.questionsQueryRepository.getFiveRandomQuestions();

    const activeGame: Games =
      await this.gamesQueryRepository.findPairByGameStatus(
        GameStatuses.PendingSecondPlayer,
      );

    if (isNil(activeGame)) {
      const gameWith1Player: GameViewModel =
        await this.gamesRepository.createGameWithOnePlayer(
          questions,
          command.user,
        );

      return gameWith1Player;
    } else {
      const gameWith2players: GameViewModel =
        await this.gamesRepository.createGameWithTwoPlayers(
          command.user,
          activeGame,
        );

      return gameWith2players;
    }
  }
}
