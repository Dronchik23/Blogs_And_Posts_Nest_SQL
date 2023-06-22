import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Games } from '../entities/games.entity';
import { Repository } from 'typeorm';
import { Players } from '../entities/players.entity';
import {
  GameForOneViewModel,
  GameViewModel,
  QuestionViewModel,
  UserViewModel,
} from '../models/models';
import { GameStatuses } from '../types/types';
import { GameProgresses } from '../entities/game-progresses';
import { Answers } from '../entities/answers';
import { Questions } from '../entities/questions.entity';
import { CorrectAnswers } from '../entities/correct-answers.entity';
import { QuestionsQueryRepository } from '../query-repositorys/questions-query.repository';

@Injectable({ scope: Scope.DEFAULT })
export class GamesRepository {
  constructor(
    @InjectRepository(Games)
    private readonly gameModel: Repository<Games>,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
    @InjectRepository(Players)
    private readonly playersModel: Repository<Players>,
    @InjectRepository(GameProgresses)
    private readonly gameProgressModel: Repository<GameProgresses>,
    @InjectRepository(Answers)
    private readonly answerModel: Repository<Answers>,
    @InjectRepository(CorrectAnswers)
    private readonly correctAnswerModel: Repository<CorrectAnswers>,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async createGameWithOnePlayer(user: UserViewModel): Promise<any> {
    const newGameProgress = GameProgresses.create();
    const createdGameProgress = await this.gameProgressModel.save(
      newGameProgress,
    );
    const newPlayers = Players.create(user, createdGameProgress.id);
    const createdPlayers = await this.playersModel.save(newPlayers);

    const newCorrectAnswers = new CorrectAnswers();
    await this.correctAnswerModel.save(newCorrectAnswers);

    const createdGame = Games.create(createdGameProgress.id, createdPlayers);

    const savedGame = await this.gameModel.save(createdGame);

    await this.gameProgressModel.update(createdGameProgress.id, {
      gameId: savedGame.id,
    }); // add gameId to gameProgress

    const rawGameWith1Player = await this.gameModel.findOneBy({
      id: savedGame.id,
    }); //games with all nests

    return new GameForOneViewModel(rawGameWith1Player);
  }

  async createGameWithTwoPlayers(
    user: UserViewModel,
    game: Games,
  ): Promise<GameViewModel> {
    const startGameDate = new Date().toISOString();

    const updateGamePromise = this.gameModel.update(game.id, {
      id: game.id,
      status: GameStatuses.Active,
      startGameDate: startGameDate,
    });

    const updatePlayersPromise = this.playersModel.update(
      game.gameProgress.players.id,
      {
        secondPlayerId: user.id,
        secondPlayerLogin: user.login,
      },
    );

    const questionsPromise =
      this.questionsQueryRepository.getFiveRandomQuestions();

    const bigArr = await Promise.all([
      updateGamePromise,
      updatePlayersPromise,
      questionsPromise,
    ]);

    const question: QuestionViewModel[] = bigArr[2];

    const questionIds = question.map((question) => question.id);

    await Promise.all(
      questionIds.map((questionId) =>
        this.questionModel.update({ id: questionId }, { gameId: game.id }),
      ),
    ); // add gameId to questions

    const rawGameWith2Players = await this.gameModel.findOneBy({ id: game.id });

    return new GameViewModel(rawGameWith2Players);
  }
}
