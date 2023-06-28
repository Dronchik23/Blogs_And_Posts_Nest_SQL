import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../query-repositorys/games-query-repository.service';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Games } from '../../entities/games.entity';
import { Users } from '../../entities/users.entity';
import { GameProgresses } from '../../entities/game-progresses';
import { Answers } from '../../entities/answers';
import { Players } from '../../entities/players.entity';
import {
  AnswerInputModel,
  FirstPlayerAnswerViewModel,
  SecondPlayerAnswerViewModel,
} from '../../models/models';
import { AnswerStatuses, GameStatuses } from '../../types/types';
import { Questions } from '../../entities/questions.entity';

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

  private async checkAmountOfAnswersAndFinishGame(game) {
    const playersAnswers: Answers[] = await this.answersModel.findBy({
      gameProgressId: game.gameProgressId,
    });

    const allAnswersNotNull = playersAnswers.every(
      (answer) =>
        answer.firstPlayerAnswerStatus !== null &&
        answer.secondPlayerAnswerStatus !== null,
    );

    if (playersAnswers.length === 5 && allAnswersNotNull) {
      const finishDate = new Date().toISOString();

      await this.gameModule.update(
        { id: game.id },
        {
          status: GameStatuses.Finished,
          finishGameDate: finishDate,
        },
      );
    }
  }

  async execute(command: SendAnswerCommand): Promise<any> {
    let currentQuestion;

    const rawGame = await this.gamesQueryRepository.findRawSQLGameByPlayerId(
      command.userId,
    );

    const game = rawGame[0];

    if (!game || game.status !== GameStatuses.Active) {
      throw new ForbiddenException();
    }
    const allCurrentQuestions: Questions[] = await this.questionModule.findBy({
      gameId: game.id,
    });

    const playersAnswers: Answers[] = await this.answersModel.findBy({
      gameProgressId: game.gameProgressId,
    });

    if (command.userId === game.firstPlayerId) {
      const firstPlayerAnswers = playersAnswers.filter(
        (a) =>
          a.firstPlayerAnswerStatus === AnswerStatuses.Correct ||
          a.firstPlayerAnswerStatus === AnswerStatuses.Incorrect,
      );

      if (firstPlayerAnswers.length < 5) {
        currentQuestion = allCurrentQuestions[firstPlayerAnswers.length];

        const currentAnswerEntity = await this.answersModel.findOneBy({
          gameProgressId: game.gameProgressId,
          questionId: currentQuestion.id,
        });
        if (
          playersAnswers.length === 5 &&
          currentAnswerEntity &&
          currentAnswerEntity.secondPlayerAnswerStatus === null
        ) {
          await this.gameProgressesModel.update(
            { id: game.gameProgressId },
            { firstPlayerScore: game.firstPlayerScore + 1 },
          );
        }
      } else {
        throw new ForbiddenException();
      }
    }

    if (command.userId === game.secondPlayerId) {
      const secondPlayerAnswers = playersAnswers.filter(
        (a) =>
          a.secondPlayerAnswerStatus === AnswerStatuses.Correct ||
          a.secondPlayerAnswerStatus === AnswerStatuses.Incorrect,
      );

      if (secondPlayerAnswers.length < 5) {
        currentQuestion = allCurrentQuestions[secondPlayerAnswers.length];

        const currentAnswerEntity = await this.answersModel.findOneBy({
          gameProgressId: game.gameProgressId,
          questionId: currentQuestion.id,
        });
        if (
          playersAnswers.length === 5 &&
          currentAnswerEntity &&
          currentAnswerEntity.firstPlayerAnswerStatus === null
        ) {
          await this.gameProgressesModel.update(
            { id: game.gameProgressId },
            { firstPlayerScore: game.firstPlayerScore + 1 },
          );
        }
      } else {
        throw new ForbiddenException();
      }
    }

    const question: Questions = await this.questionModule.findOneBy({
      id: currentQuestion.id,
    }); // take question with all nests

    const isAnswerCorrect =
      command.sendAnswerDTO.answer === question.correctAnswers.answer1 ||
      command.sendAnswerDTO.answer === question.correctAnswers.answer2;

    if (isAnswerCorrect) {
      const playerScoreKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerScore'
          : 'secondPlayerScore';

      await this.gameProgressesModel.update(
        { id: game.gameProgressId },
        { [playerScoreKey]: game[playerScoreKey] + 1 },
      );

      const playerAnswerStatusKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAnswerStatus'
          : 'secondPlayerAnswerStatus';

      const playerAddedAtKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAddedAt'
          : 'secondPlayerAddedAt';

      const answer = await this.answersModel.findOneBy({
        questionId: currentQuestion.id,
      });

      if (answer) {
        await this.answersModel.update(
          {
            questionId: currentQuestion.id,
          },
          {
            [playerAnswerStatusKey]: AnswerStatuses.Correct,
            [playerAddedAtKey]: new Date().toISOString(),
          },
        );
      } else {
        await this.answersModel.save({
          gameProgressId: game.gameProgressId,
          questionId: currentQuestion.id,
          [playerAnswerStatusKey]: AnswerStatuses.Correct,
          [playerAddedAtKey]: new Date().toISOString(),
        });
      }

      await this.checkAmountOfAnswersAndFinishGame(game);

      const actualAnswer = await this.answersModel.findOneBy({
        questionId: currentQuestion.id,
      });

      const answerViewModel =
        game.firstPlayerId === command.userId
          ? new FirstPlayerAnswerViewModel(actualAnswer)
          : new SecondPlayerAnswerViewModel(actualAnswer);

      return answerViewModel;
    } else {
      const playerAnswerStatusKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAnswerStatus'
          : 'secondPlayerAnswerStatus';
      const playerAddedAtKey =
        game.firstPlayerId === command.userId
          ? 'firstPlayerAddedAt'
          : 'secondPlayerAddedAt';

      const answer = await this.answersModel.findOneBy({
        questionId: currentQuestion.id,
      });
      if (answer) {
        await this.answersModel.update(
          {
            questionId: currentQuestion.id,
          },
          {
            [playerAnswerStatusKey]: AnswerStatuses.Incorrect,
            [playerAddedAtKey]: new Date().toISOString(),
          },
        );
      } else {
        await this.answersModel.save({
          questionId: currentQuestion.id,
          gameProgressId: game.gameProgressId,
          [playerAnswerStatusKey]: AnswerStatuses.Incorrect,
          [playerAddedAtKey]: new Date().toISOString(),
        });
      }

      await this.checkAmountOfAnswersAndFinishGame(game);

      const actualAnswer = await this.answersModel.findOneBy({
        questionId: currentQuestion.id,
      });

      const answerViewModel =
        game.firstPlayerId === command.userId
          ? new FirstPlayerAnswerViewModel(actualAnswer)
          : new SecondPlayerAnswerViewModel(actualAnswer);

      return answerViewModel;
    }
  }
}
