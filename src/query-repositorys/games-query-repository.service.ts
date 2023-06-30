import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { GameStatuses } from '../types/types';
import {
  AnswerViewModel,
  GameForOneViewModel,
  GameViewModel,
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

  private fromRawSQLToGameViewModel(rawGame: any[]): GameViewModel {
    const game = rawGame[0];

    const filteredAnswersBeforeFilter = rawGame.map((rawGameItem) => {
      const updatedItem: any = {};

      if (rawGameItem.questionIdFromAnswers !== null) {
        updatedItem.questionIdFromAnswers = rawGameItem.questionIdFromAnswers;
      }
      if (rawGameItem.firstPlayerAddedAt !== null) {
        updatedItem.firstPlayerAddedAt = rawGameItem.firstPlayerAddedAt;
      }
      if (rawGameItem.firstPlayerAnswerStatus !== null) {
        updatedItem.firstPlayerAnswerStatus =
          rawGameItem.firstPlayerAnswerStatus;
      }
      if (rawGameItem.secondPlayerAnswerStatus !== null) {
        updatedItem.secondPlayerAnswerStatus =
          rawGameItem.secondPlayerAnswerStatus;
      }
      if (rawGameItem.secondPlayerAddedAt !== null) {
        updatedItem.secondPlayerAddedAt = rawGameItem.secondPlayerAddedAt;
      }
      return updatedItem;
    });
    const filteredAnswers = filteredAnswersBeforeFilter.filter(
      (obj) => Object.keys(obj).length > 0,
    );

    return {
      id: game.id,
      firstPlayerProgress: {
        answers: filteredAnswers
          .map((rawGameItem) => ({
            questionId: rawGameItem.questionIdFromAnswers,
            answerStatus: rawGameItem.firstPlayerAnswerStatus,
            addedAt: rawGameItem.firstPlayerAddedAt,
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
          id: game.firstPlayerId,
          login: game.firstPlayerLogin,
        },
        score: game.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: filteredAnswers
          .map((rawGameItem) => ({
            questionId: rawGameItem.questionIdFromAnswers,
            answerStatus: rawGameItem.secondPlayerAnswerStatus,
            addedAt: rawGameItem.secondPlayerAddedAt,
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
          id: game.secondPlayerId,
          login: game.secondPlayerLogin,
        },
        score: game.secondPlayerScore,
      },
      questions: rawGame
        .map((rawGameItem) => ({
          id: rawGameItem.questionId,
          body: rawGameItem.body,
        }))
        .filter((question, index, self) => {
          const foundIndex = self.findIndex((q) => q.id === question.id);
          return foundIndex === index;
        }),
      status: game.status,
      pairCreatedDate: game.pairCreatedDate,
      startGameDate: game.startGameDate,
      finishGameDate: game.finishGameDate,
    };
  }

  private fromRawSQLToGameForOneViewModel(rawGame: any[]): GameViewModel {
    const game = rawGame[0];
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: [],
        player: {
          id: game.firstPlayerId,
          login: game.firstPlayerLogin,
        },
        score: game.firstPlayerScore,
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
          'answers."questionId" as "questionIdFromAnswers"',
          'answers."firstPlayerAddedAt"',
          'answers."secondPlayerAnswerStatus"',
          'answers."secondPlayerAddedAt"',
        ])
        .from(Players, 'players')
        .where(
          '(players."firstPlayerId" = :currentUserId OR players."secondPlayerId" = :currentUserId)',
          { currentUserId },
        )
        .innerJoin(
          GameProgresses,
          'progress',
          'progress.id = players."gameProgressId"',
        )
        .innerJoin(Games, 'games', 'games.id = progress."gameId"')
        .leftJoin(Questions, 'questions', 'questions."gameId" = games.id')
        .leftJoin(Answers, 'answers', 'questions."gameId" = games.id')
        .getRawMany();
      debugger;
      if (!game || game.length === 0) {
        return null;
      }

      if (game[0].secondPlayerId === null) {
        return this.fromRawSQLToGameForOneViewModel(game);
      }

      return game ? this.fromRawSQLToGameViewModel(game) : null;
    } catch (error) {
      throw new NotFoundException();
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
