import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Games } from '../entities/games.entity';
import { Repository } from 'typeorm';
import {
  GameForOneViewModel,
  GameViewModel,
  QuestionViewModel,
  UserViewModel,
} from '../models/models';
import { GameStatuses } from '../types/types';
import { Questions } from '../entities/questions.entity';
import { QuestionsQueryRepository } from '../query-repositorys/questions-query.repository';

@Injectable({ scope: Scope.DEFAULT })
export class GamesRepository {
  constructor(
    @InjectRepository(Games)
    private readonly gameModel: Repository<Games>,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async createGameWithOnePlayer(user: UserViewModel): Promise<any> {
    const createdGame = Games.create(user);

    const savedGame = await this.gameModel.save(createdGame);

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
      secondPlayerId: user.id,
      secondPlayerLogin: user.login,
    });

    const questionsPromise =
      this.questionsQueryRepository.getFiveRandomQuestions();

    const bigArr = await Promise.all([updateGamePromise, questionsPromise]);

    const question: QuestionViewModel[] = bigArr[1];

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
