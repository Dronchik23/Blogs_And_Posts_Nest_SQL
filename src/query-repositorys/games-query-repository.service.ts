import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { GameStatuses } from '../types/types';
import { GameForOneViewModel, GameViewModel } from '../models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Games } from '../entities/games.entity';
import { isNil } from '@nestjs/common/utils/shared.utils';

@Injectable({ scope: Scope.DEFAULT })
export class GamesQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Games) private readonly gameModel: Repository<Games>,
  ) {}

  private fromGameDBTypeToGameViewModel(game: Games): GameViewModel {
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: game.firstPlayerAnswers.map((a) => ({
          questionId: a.questionId,
          answerStatus: a.answerStatus,
          addedAt: a.addedAt,
        })),
        player: {
          id: game.firstPlayerId,
          login: game.firstPlayerLogin,
        },
        score: game.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: game.secondPlayerAnswers.map((answer) => {
          return {
            answerStatus: answer.answerStatus,
            questionId: answer.questionId,
            addedAt: answer.addedAt,
          };
        }),
        player: {
          id: game.secondPlayerId,
          login: game.secondPlayerLogin,
        },
        score: game.secondPlayerScore,
      },
      questions: game.questions.map((q) => {
        return {
          id: q.id,
          body: q.body,
        };
      }),
      status: game.status,
      pairCreatedDate: game.pairCreatedDate,
      startGameDate: game.startGameDate,
      finishGameDate: game.finishGameDate,
    };
  }

  async findGameByGameId(gameId: string): Promise<GameViewModel> {
    try {
      const game: Games = await this.gameModel.findOneBy({ id: gameId });

      if (game.secondPlayerId === null) {
        return new GameForOneViewModel(game);
      }

      return game ? this.fromGameDBTypeToGameViewModel(game) : null;
    } catch (error) {
      new NotFoundException();
    }
  }

  async findPairByGameStatus(gameStatus: GameStatuses): Promise<Games> {
    try {
      return await this.gameModel.findOne({
        where: {
          status: gameStatus,
        },
      });
    } catch (error) {
      console.log(error, 'error');
    }
  }

  async findGameByPlayerId(currentUserId: string): Promise<GameViewModel> {
    try {
      const game = await this.gameModel.findOne({
        where: [
          { firstPlayerId: currentUserId },
          { secondPlayerId: currentUserId },
        ],
      });
      if (isNil(game)) {
        throw new NotFoundException();
      }

      if (game && game.secondPlayerId === null) {
        return new GameForOneViewModel(game);
      } else {
        return new GameViewModel(game);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async findNotFinishedGameByPlayerId(
    currentUserId: string,
  ): Promise<GameViewModel> {
    try {
      const game = await this.gameModel.findOne({
        where: [
          { firstPlayerId: currentUserId, status: Not(GameStatuses.Finished) },
          { secondPlayerId: currentUserId, status: Not(GameStatuses.Finished) },
        ],
      });
      if (game.secondPlayerId === null) {
        return new GameForOneViewModel(game);
      } else {
        return new GameViewModel(game);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
