import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../query-repositorys/games-query-repository.service';
import { QuestionsQueryRepository } from '../../query-repositorys/questions-query.repository';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Games } from '../../entities/games.entity';
import { Users } from '../../entities/users.entity';
import { GameProgresses } from '../../entities/game-progresses';
import { Answers } from '../../entities/answers';
import { Players } from '../../entities/players.entity';
import {
  AnswerInputModel,
  GameViewModel,
  QuestionViewModel,
} from '../../models/models';
import {
  AnswerStatuses,
  GameStatuses,
  QuestionDBType,
} from '../../types/types';
import { uuid } from 'uuidv4';
import { Questions } from '../../entities/questions.entity';
import { Likes } from '../../entities/likes.entity';

export class SendAnswerCommand {
  constructor(public sendAnswerDTO: AnswerInputModel, public userId: string) {}
}

@CommandHandler(SendAnswerCommand)
export class SendAnswerService implements ICommandHandler<SendAnswerCommand> {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Games)
    private readonly gameModule: Repository<Games>,
    @InjectRepository(Questions)
    private readonly questionModule: Repository<Questions>,
    @InjectRepository(Users)
    private readonly uRepository: Repository<Users>,
    @InjectRepository(Answers)
    private readonly answersModel: Repository<Answers>,
    @InjectRepository(GameProgresses)
    private readonly gameProgressesModel: Repository<GameProgresses>,
    @InjectRepository(Players)
    private readonly playerModel: Repository<Players>,
    private readonly gamesQueryRepository: GamesQueryRepository,
  ) {}

  async execute(command: SendAnswerCommand): Promise<any> {
    debugger;
    const rawGame = await this.gamesQueryRepository.findRawSQLGameByPlayerId(
      command.userId,
    );
    const game = rawGame[0];

    if (!game || game.status !== 'Active') {
      throw new NotFoundException();
    }

    const allCurrentQuestions = await this.questionModule.findBy({
      gameId: game.id,
    });

    const currentQuestion = allCurrentQuestions[0];
    const questionDBType: Questions = await this.questionModule.findOneBy({
      id: currentQuestion.id,
    });

    const isAnswerCorrect =
      command.sendAnswerDTO.answer === questionDBType.correctAnswers.answer1 ||
      command.sendAnswerDTO.answer === questionDBType.correctAnswers.answer2;
    debugger;
    if (isAnswerCorrect) {
      const playerScoreKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerScore'
          : 'secondPlayerScore';

      await this.gameProgressesModel.update(
        { id: game.gameProgressId },
        { [playerScoreKey]: game[playerScoreKey] + 1 },
      );

      const playerQuestionIdKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerQuestionId'
          : 'secondPlayerQuestionId';
      const playerAnswerStatusKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAnswerStatus'
          : 'secondPlayerAnswerStatus';
      const playerAddedAtKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAddedAt'
          : 'secondPlayerAddedAt';

      await this.answersModel.update(
        { gameProgressId: game.gameProgressId },
        {
          [playerQuestionIdKey]: currentQuestion.id,
          [playerAnswerStatusKey]: AnswerStatuses.Correct,
          [playerAddedAtKey]: new Date().toISOString(),
        },
      );
    } else {
      const playerScoreKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerScore'
          : 'secondPlayerScore';

      await this.gameProgressesModel.update(
        { id: game.gameProgressId },
        {
          [playerScoreKey]: game[playerScoreKey] - 1,
        },
      );

      const playerQuestionIdKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerQuestionId'
          : 'secondPlayerQuestionId';
      const playerAnswerStatusKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAnswerStatus'
          : 'secondPlayerAnswerStatus';
      const playerAddedAtKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAddedAt'
          : 'secondPlayerAddedAt';

      await this.answersModel.update(
        { gameProgressId: game.gameProgressId },
        {
          [playerQuestionIdKey]: currentQuestion.id,
          [playerAnswerStatusKey]: AnswerStatuses.Incorrect,
          [playerAddedAtKey]: new Date().toISOString(),
        },
      );
    }
  }
}
