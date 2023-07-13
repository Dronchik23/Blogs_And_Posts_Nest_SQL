import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../query-repositorys/games-query-repository.service';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Games } from '../../entities/games.entity';
import { Users } from '../../entities/users.entity';
import {
  AnswerInputModel,
  AnswerViewModel,
  GameViewModel,
} from '../../models/models';
import { AnswerStatuses, GameStatuses } from '../../types/types';
import { Questions } from '../../entities/questions.entity';
import { FirstPlayerAnswers } from '../../entities/firstPlayerAnswers';
import { SecondPlayerAnswers } from '../../entities/secondPlayerAnswers';

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
    @InjectRepository(FirstPlayerAnswers)
    private readonly firstPlayerAnswersModel: Repository<FirstPlayerAnswers>,
    @InjectRepository(SecondPlayerAnswers)
    private readonly secondPlayerAnswersModel: Repository<SecondPlayerAnswers>,
  ) {}

  private async checkAmountOfAnswersAndFinishGame(game, queryRunner) {
    const firstPlayerAnswers = await queryRunner.query(
      'SELECT * FROM "firstPlayerAnswers" ORDER BY "addedAt" DESC',
    );
    const secondPlayerAnswers = await queryRunner.query(
      'SELECT * FROM "secondPlayerAnswers" ORDER BY "addedAt" DESC',
    );

    if (firstPlayerAnswers.length === 5 && secondPlayerAnswers.length === 5) {
      debugger;
      if (
        new Date(firstPlayerAnswers[4].addedAt) <
        new Date(secondPlayerAnswers[4].addedAt)
      ) {
        if (
          firstPlayerAnswers.some(
            (a) => a.answerStatus === AnswerStatuses.Correct,
          )
        ) {
          await queryRunner.manager.update(
            Games,
            { id: game.id },
            { firstPlayerScore: () => 'firstPlayerScore + 1' },
          );
        }
      } else {
        if (
          secondPlayerAnswers.some(
            (a) => a.answerStatus === AnswerStatuses.Correct,
          )
        ) {
          await queryRunner.manager.update(
            Games,
            { id: game.id },
            { secondPlayerScore: () => 'secondPlayerScore + 1' },
          );
        }
      }

      Promise.all([
        await queryRunner.manager.update(
          Games,
          { id: game.id },
          {
            status: GameStatuses.Finished,
            finishGameDate: new Date().toISOString(),
          },
        ),
        //await this.firstPlayerAnswersModel.delete({}),
        //await this.secondPlayerAnswersModel.delete({}),
      ]);
    } else return;
  }

  async execute(command: SendAnswerCommand): Promise<AnswerViewModel> {
    const rawGame: Games = await this.gameModule.findOne({
      where: [
        { firstPlayerId: command.userId },
        { secondPlayerId: command.userId },
      ],
    });

    if (!rawGame || rawGame.status !== GameStatuses.Active) {
      throw new ForbiddenException();
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let currentQuestion;

      const rawGame: Games = await queryRunner.manager.findOne(Games, {
        where: [
          { firstPlayerId: command.userId },
          { secondPlayerId: command.userId },
        ],
      });

      if (!rawGame || rawGame.status !== GameStatuses.Active) {
        throw new ForbiddenException();
      }
      const game = new GameViewModel(rawGame);

      const allCurrentQuestions: Questions[] = await queryRunner.manager.findBy(
        Questions,
        {
          gameId: game.id,
        },
      );

      if (command.userId === game.firstPlayerProgress.player.id) {
        const firstPlayerAnswers: FirstPlayerAnswers[] =
          await queryRunner.manager.findBy(FirstPlayerAnswers, {
            gameId: game.id,
          });

        if (firstPlayerAnswers.length < 5) {
          currentQuestion = allCurrentQuestions[firstPlayerAnswers.length];

          if (firstPlayerAnswers.length === 5) {
            await queryRunner.manager.update(
              Games,
              { id: game.id },
              { firstPlayerScore: game.firstPlayerProgress.score + 1 },
            );
          }
        } else {
          throw new ForbiddenException();
        }

        const question: Questions = await queryRunner.manager.findOneBy(
          Questions,
          {
            id: currentQuestion.id,
          },
        ); // question with all nests

        const isAnswerCorrect = question.correctAnswers.some(
          (answer) => answer === command.sendAnswerDTO.answer,
        );

        if (isAnswerCorrect) {
          await Promise.all([
            queryRunner.manager.update(
              Games,
              { id: game.id },
              { firstPlayerScore: () => 'firstPlayerScore + 1' },
            ),
            await queryRunner.manager.save(FirstPlayerAnswers, {
              gameId: game.id,
              questionId: currentQuestion.id,
              answerStatus: AnswerStatuses.Correct,
              addedAt: new Date().toISOString(),
            }),
          ]);
        } else {
          await queryRunner.manager.save(FirstPlayerAnswers, {
            gameId: game.id,
            questionId: currentQuestion.id,
            answerStatus: AnswerStatuses.Incorrect,
            addedAt: new Date().toISOString(),
          });
        }

        await this.checkAmountOfAnswersAndFinishGame(game, queryRunner);
        const actualAnswer = await queryRunner.manager.findOneBy(
          FirstPlayerAnswers,
          {
            questionId: currentQuestion.id,
          },
        );
        await queryRunner.commitTransaction();
        return new AnswerViewModel(actualAnswer);
      } else {
        const secondPlayerAnswers: SecondPlayerAnswers[] =
          await queryRunner.manager.findBy(SecondPlayerAnswers, {
            gameId: game.id,
          });
        if (secondPlayerAnswers.length < 5) {
          currentQuestion = allCurrentQuestions[secondPlayerAnswers.length];

          if (secondPlayerAnswers.length === 5) {
            await queryRunner.manager.update(
              Games,
              { id: game.id },
              { secondPlayerScore: game.secondPlayerProgress.score + 1 },
            );
          }
        } else {
          throw new ForbiddenException();
        }

        const question: Questions = await queryRunner.manager.findOneBy(
          Questions,
          {
            id: currentQuestion.id,
          },
        ); // question with all nests

        const isAnswerCorrect = question.correctAnswers.some(
          (answer) => answer === command.sendAnswerDTO.answer,
        );

        if (isAnswerCorrect) {
          await Promise.all([
            await queryRunner.manager.update(
              Games,
              { id: game.id },
              { secondPlayerScore: () => 'secondPlayerScore + 1' },
            ),
            await queryRunner.manager.save(SecondPlayerAnswers, {
              gameId: game.id,
              questionId: currentQuestion.id,
              answerStatus: AnswerStatuses.Correct,
              addedAt: new Date().toISOString(),
            }),
          ]);
        } else {
          await queryRunner.manager.save(SecondPlayerAnswers, {
            questionId: currentQuestion.id,
            gameId: game.id,
            answerStatus: AnswerStatuses.Incorrect,
            addedAt: new Date().toISOString(),
          });
        }

        await this.checkAmountOfAnswersAndFinishGame(game, queryRunner);

        const actualAnswer = await queryRunner.manager.findOneBy(
          SecondPlayerAnswers,
          {
            questionId: currentQuestion.id,
          },
        );
        await queryRunner.commitTransaction();
        return new AnswerViewModel(actualAnswer);
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
