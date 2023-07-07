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
        answers: game.gameProgress.answers
          .filter((answer) => answer.firstPlayerAnswerStatus !== null)
          .map((a) => ({
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
        answers: game.gameProgress.answers
          .filter((answer) => answer.secondPlayerAnswerStatus !== null)
          .map((answer) => {
            return {
              answerStatus: answer.secondPlayerAnswerStatus,
              questionId: answer.questionId,
              addedAt: answer.secondPlayerAddedAt,
            };
          }),
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

  /*  private fromRawSQLToGameViewModel(game: Games): GameViewModel {
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
  }*/

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
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const playersEntityArray = await queryRunner.manager
        .createQueryBuilder()
        .select('player')
        .from(Players, 'player')
        .where(
          'player."firstPlayerId" = :currentUserId OR player."secondPlayerId" = :currentUserId',
          { currentUserId },
        )
        .getMany();

      if (playersEntityArray.length === 0) {
        await queryRunner.commitTransaction();
        return null;
      }

      let currentGame: Games | undefined;

      for (const player of playersEntityArray) {
        currentGame = await queryRunner.manager.findOne(Games, {
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
        await queryRunner.commitTransaction();
        return null;
      } else if (currentGame.gameProgress.players.secondPlayerId === null) {
        await queryRunner.commitTransaction();
        return this.fromRawSQLToGameForOneViewModel(currentGame);
      }

      await queryRunner.commitTransaction();
      return new GameViewModel(currentGame);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return null;
    } finally {
      await queryRunner.release();
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
