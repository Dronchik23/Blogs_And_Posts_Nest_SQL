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
    private readonly gamesQueryRepository: GamesQueryRepository,
  ) {}

  private async checkAmountOfAnswersAndFinishGame(game) {
    const firstPlayerAnswers = await this.firstPlayerAnswersModel
      .createQueryBuilder('answers')
      .orderBy('answers."addedAt"', 'DESC')
      .getMany();

    const secondPlayerAnswers = await this.secondPlayerAnswersModel
      .createQueryBuilder('answers')
      .orderBy('answers."addedAt"', 'DESC')
      .getMany();

    if (firstPlayerAnswers.length === 5 && secondPlayerAnswers.length === 5) {
      if (firstPlayerAnswers[4].addedAt <= secondPlayerAnswers[4].addedAt) {
        if (
          secondPlayerAnswers.some(
            (a) => a.answerStatus === AnswerStatuses.Correct,
          )
        )
          await this.gameModule.update(
            { id: game.id },
            { secondPlayerScore: +1 },
          );
      } else {
        if (
          firstPlayerAnswers.some(
            (a) => a.answerStatus === AnswerStatuses.Correct,
          )
        )
          await this.gameModule.update(
            { id: game.id },
            { firstPlayerScore: +1 },
          );
      }

      Promise.all([
        await this.gameModule.update(
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
    let currentQuestion;

    const game: GameViewModel =
      await this.gamesQueryRepository.findGameByPlayerId(command.userId);

    if (!game || game.status !== GameStatuses.Active) {
      throw new ForbiddenException();
    }

    const allCurrentQuestions: Questions[] = await this.questionModule.findBy({
      gameId: game.id,
    });

    if (command.userId === game.firstPlayerProgress.player.id) {
      const firstPlayerAnswers: FirstPlayerAnswers[] =
        await this.firstPlayerAnswersModel.findBy({
          gameId: game.id,
        });

      if (firstPlayerAnswers.length < 5) {
        currentQuestion = allCurrentQuestions[firstPlayerAnswers.length];

        if (firstPlayerAnswers.length === 5) {
          await this.gameModule.update(
            { id: game.id },
            { firstPlayerScore: game.firstPlayerProgress.score + 1 },
          );
        }
      } else {
        throw new ForbiddenException();
      }

      const question: Questions = await this.questionModule.findOneBy({
        id: currentQuestion.id,
      }); // question with all nests

      const isAnswerCorrect = question.correctAnswers.some(
        (answer) => answer === command.sendAnswerDTO.answer,
      );

      if (isAnswerCorrect) {
        await Promise.all([
          this.gameModule.update(
            { id: game.id },
            { firstPlayerScore: () => 'firstPlayerScore + 1' },
          ),
          this.firstPlayerAnswersModel.save({
            gameId: game.id,
            questionId: currentQuestion.id,
            answerStatus: AnswerStatuses.Correct,
            addedAt: new Date().toISOString(),
          }),
        ]);
      } else {
        await this.firstPlayerAnswersModel.save({
          questionId: currentQuestion.id,
          gameId: game.id,
          answerStatus: AnswerStatuses.Incorrect,
          addedAt: new Date().toISOString(),
        });
      }

      await this.checkAmountOfAnswersAndFinishGame(game);
      const actualAnswer = await this.firstPlayerAnswersModel.findOneBy({
        questionId: currentQuestion.id,
      });
      return new AnswerViewModel(actualAnswer);
    } else {
      const secondPlayerAnswers: any =
        await this.secondPlayerAnswersModel.findBy({
          gameId: game.id,
        });
      if (secondPlayerAnswers.length < 5) {
        currentQuestion = allCurrentQuestions[secondPlayerAnswers.length];

        if (secondPlayerAnswers.length === 5) {
          await this.gameModule.update(
            { id: game.id },
            { secondPlayerScore: game.secondPlayerProgress.score + 1 },
          );
        }
      } else {
        throw new ForbiddenException();
      }

      const question: Questions = await this.questionModule.findOneBy({
        id: currentQuestion.id,
      }); // question with all nests

      const isAnswerCorrect = question.correctAnswers.some(
        (answer) => answer === command.sendAnswerDTO.answer,
      );

      if (isAnswerCorrect) {
        await Promise.all([
          this.gameModule.update(
            { id: game.id },
            { secondPlayerScore: () => 'secondPlayerScore + 1' },
          ),
          this.secondPlayerAnswersModel.save({
            gameId: game.id,
            questionId: currentQuestion.id,
            answerStatus: AnswerStatuses.Correct,
            addedAt: new Date().toISOString(),
          }),
        ]);
      } else {
        await this.secondPlayerAnswersModel.save({
          questionId: currentQuestion.id,
          gameId: game.id,
          answerStatus: AnswerStatuses.Incorrect,
          addedAt: new Date().toISOString(),
        });
      }

      await this.checkAmountOfAnswersAndFinishGame(game);

      const actualAnswer = await this.secondPlayerAnswersModel.findOneBy({
        questionId: currentQuestion.id,
      });
      return new AnswerViewModel(actualAnswer);
    }
  }
}
