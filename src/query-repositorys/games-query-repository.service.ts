import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { GameStatuses, GameDBType } from '../types/types';
import {
  AnswerViewModel,
  GameViewModel,
  PlayerViewModel,
} from '../models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

  private gameDBTypePairViewModel(game: Games): GameViewModel {
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: game.gameProgress.answers.map((a) => ({
          questionId: a.firstPlayerQuestionId,
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
          questionId: a.firstPlayerQuestionId,
          answerStatus: a.firstPlayerAnswerStatus,
          addedAt: a.firstPlayerAddedAt,
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

  private RawSQLGameDBTypePairViewModel(rawGame: any[]): GameViewModel {
    const game = rawGame[0];
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: [
          {
            questionId: game.firstPlayerQuestionId,
            answerStatus: game.firstPlayerAnswerStatus,
            addedAt: game.firstPlayerAddedAt,
          },
        ],
        player: {
          id: game.firstPlayerId,
          login: game.firstPlayerLogin,
        },
        score: game.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: [
          {
            questionId: game.secondPlayerQuestionId,
            answerStatus: game.secondPlayerAnswerStatus,
            addedAt: game.secondPlayerAddedAt,
          },
        ],
        player: {
          id: game.secondPlayerId,
          login: game.secondPlayerLogin,
        },
        score: game.secondPlayerScore,
      },
      questions: [
        {
          id: game.questionId,
          body: game.body,
        },
      ],
      status: game.status,
      pairCreatedDate: game.pairCreatedDate,
      startGameDate: game.startGameDate,
      finishGameDate: game.finishGameDate,
    };
  }

  async findGameByGameId(gameId: string): Promise<GameViewModel> {
    try {
      const game = await this.gameModel.findOneBy({ id: gameId });
      return game ? this.gameDBTypePairViewModel(game) : null;
    } catch (error) {
      throw new NotFoundException();
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
      const game = await this.dataSource
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
          'answers."firstPlayerQuestionId"',
          'answers."firstPlayerAddedAt"',
          'answers."secondPlayerAnswerStatus"',
          'answers."secondPlayerQuestionId"',
          'answers."secondPlayerAddedAt"',
        ])
        .from(Players, 'players')
        .where('players."firstPlayerId" = :currentUserId', { currentUserId })
        .innerJoin(
          GameProgresses,
          'progress',
          'progress.id = players."gameProgressId"',
        )
        .innerJoin(Games, 'games', 'games.id = progress.gameId')
        .leftJoin(Questions, 'questions', 'questions."gameId" = games.id')
        .leftJoin(Answers, 'answers', 'questions."gameId" = games.id')
        .getRawMany();

      return game ? this.RawSQLGameDBTypePairViewModel(game) : null;
    } catch (error) {
      console.log('error', error);
      throw new NotFoundException();
    }
  }
  async findRawSQLGameByPlayerId(currentUserId: string): Promise<any> {
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
          'progress.id as "gameProgressId"',
          'games."id"',
          'games."status"',
          'games."pairCreatedDate"',
          'games."startGameDate"',
          'games."finishGameDate"',
          'questions.id as "questionId"',
          'questions."body"',
          'answers."firstPlayerAnswerStatus"',
          'answers."firstPlayerQuestionId"',
          'answers."firstPlayerAddedAt"',
          'answers."secondPlayerAnswerStatus"',
          'answers."secondPlayerQuestionId"',
          'answers."secondPlayerAddedAt"',
        ])
        .from(Players, 'players')
        .where(
          'players."firstPlayerId" = :currentUserId OR players."secondPlayerId" = :currentUserId',
          { currentUserId },
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
      console.log('error', error);
      throw new NotFoundException();
    }
  }
}
