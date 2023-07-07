import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { GameStatuses } from '../types/types';
import { GameForOneViewModel, GameViewModel } from '../models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, Not, Repository } from 'typeorm';
import { Games } from '../entities/games.entity';
import { Players } from '../entities/players.entity';
import { GameProgresses } from '../entities/game-progresses';
import { Questions } from '../entities/questions.entity';
import { Answers } from '../entities/answers';

@Injectable({ scope: Scope.DEFAULT })
export class GamesQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Games) private readonly gameModel: Repository<Games>,
    @InjectRepository(Players)
    private readonly playerModel: Repository<Players>,
  ) {}

  private fromGameDBTypeToGameViewModel(game: Games): GameViewModel {
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: game.gameProgress.answers.map((a) => ({
          questionId: a.questionId,
          answerStatus: a.firstPlayerAnswerStatus,
          addedAt: a.firstPlayerAddedAt,
        })),
        player: {
          id: game.gameProgress.players.firstPlayerId,
          login: game.gameProgress.players.firstPlayerLogin,
        },
        score: game.gameProgress.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: game.gameProgress.answers.map((a) => ({
          questionId: a.questionId,
          answerStatus: a.secondPlayerAnswerStatus,
          addedAt: a.secondPlayerAddedAt,
        })),
        player: {
          id: game.gameProgress.players.secondPlayerId,
          login: game.gameProgress.players.secondPlayerLogin,
        },
        score: game.gameProgress.secondPlayerScore,
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

  private fromRawSQLToGameViewModel(game: Games): GameViewModel {
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: game.gameProgress.answers.map((a) => ({
          questionId: a.questionId,
          answerStatus: a.firstPlayerAnswerStatus,
          addedAt: a.firstPlayerAddedAt,
        })),
        player: {
          id: game.gameProgress.players.firstPlayerId,
          login: game.gameProgress.players.secondPlayerLogin,
        },
        score: game.gameProgress.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: game.gameProgress.answers
          .map((a) => ({
            questionId: a.questionId,
            answerStatus: a.secondPlayerAnswerStatus,
            addedAt: a.secondPlayerAddedAt,
          }))
          .filter(
            (answer, index, self) =>
              index ===
              self.findIndex((a) => a.questionId === answer.questionId),
          )
          .filter(
            (answer) =>
              answer.questionId && answer.answerStatus && answer.addedAt,
          ),

        player: {
          id: game.gameProgress.players.id,
          login: game.gameProgress.players.secondPlayerLogin,
        },
        score: game.gameProgress.secondPlayerScore,
      },
      questions: game.questions.map((q) => ({
        id: q.id,
        body: q.body,
      })),
      status: game.status,
      pairCreatedDate: game.pairCreatedDate,
      startGameDate: game.startGameDate,
      finishGameDate: game.finishGameDate,
    };
  }

  private fromRawSQLToGameForOneViewModel(game: Games): GameViewModel {
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: [],
        player: {
          id: game.gameProgress.players.firstPlayerId,
          login: game.gameProgress.players.firstPlayerLogin,
        },
        score: game.gameProgress.firstPlayerScore,
      },
      secondPlayerProgress: null,
      questions: null,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate,
      startGameDate: game.startGameDate,
      finishGameDate: game.finishGameDate,
    };
  }

  async findGameByGameId(gameId: string): Promise<GameViewModel> {
    try {
      const game: Games = await this.gameModel.findOneBy({ id: gameId });

      if (game.gameProgress.players.secondPlayerId === null) {
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

  async findGameByPlayerId(currentUserId: string): Promise<any> {
    try {
      const playersEntityArray = await this.playerModel
        .createQueryBuilder('player')
        .where(
          'player."firstPlayerId" = :currentUserId OR player."secondPlayerId" = :currentUserId',
          { currentUserId },
        )
        .getMany();

      if (playersEntityArray.length === 0) {
        return null;
      }

      let currentGame: Games | undefined;

      for (const player of playersEntityArray) {
        currentGame = await this.gameModel.findOne({
          where: {
            gameProgressId: player.gameProgressId,
            status: Not(Equal(GameStatuses.Finished)),
          },
        });

        if (currentGame) {
          break;
        }
      }

      if (!currentGame) {
        return null;
      } else if (currentGame.gameProgress.players.secondPlayerId === null) {
        return this.fromRawSQLToGameForOneViewModel(currentGame);
      }

      return new GameViewModel(currentGame);
    } catch (error) {
      return null;
    }
  }

  async findRawSQLGameByPlayerId(userId: string): Promise<any> {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select([
          'players."firstPlayerId"',
          'players."secondPlayerId"',
          'players."firstPlayerLogin"',
          'players."secondPlayerLogin"',
          'progress."firstPlayerScore"',
          'progress."secondPlayerScore"',
          'progress."id" as "gameProgressId"',
          'games."id"',
          'games."status"',
          'games."pairCreatedDate"',
          'games."startGameDate"',
          'games."finishGameDate"',
          'questions."id" as "questionId"',
          'questions."body"',
          'answers."firstPlayerAnswerStatus"',
          'answers."questionId" as "questionIdFromAnswers"',
          'answers."firstPlayerAddedAt"',
          'answers."secondPlayerAnswerStatus"',
          'answers."questionId"',
          'answers."secondPlayerAddedAt"',
        ])
        .from(Players, 'players')
        .where(
          'players."firstPlayerId" = :currentUserId OR players."secondPlayerId" = :currentUserId',
          { currentUserId: userId },
        )
        .innerJoin(
          GameProgresses,
          'progress',
          'progress.id = players."gameProgressId"',
        )
        .innerJoin(Games, 'games', 'games.id = progress.gameId')
        .leftJoin(Questions, 'questions', 'questions."gameId" = games.id')
        .leftJoin(Answers, 'answers', 'questions."gameId" = games.id')
        .getRawMany();
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
