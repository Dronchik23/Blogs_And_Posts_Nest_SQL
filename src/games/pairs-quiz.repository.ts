import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Games } from '../entities/games.entity';
import { Repository } from 'typeorm';
import { Players } from '../entities/players.entity';
import { QuestionViewModel, UserViewModel } from '../models/models';
import { GameStatuses } from '../types/types';

@Injectable({ scope: Scope.DEFAULT })
export class GamesRepository {
  constructor(
    @InjectRepository(Games)
    private readonly gameModel: Repository<Games>,
    @InjectRepository(Players)
    private readonly playersModel: Repository<Players>,
  ) {}

  async createGame(
    questions: QuestionViewModel[],
    firstUser: UserViewModel,
    startGameDate: string | null,
    secondPair?: Games,
  ): Promise<any> {
    //const newGp = GameProgresses.create(randomUUID());
    // const gp = await this.gameProgressModel.create(newGp);
    /*    const newGame: Games = Games.create(
      questions,
      startGameDate,
      secondPair,
    );*/
    //const newGamesProgress = GameProgresses.create();
    // const newPlayer: Players = Players.create(firstUser);
    //const createdGame = await this.gameModel.save(newGame);
    //const createdPlayer = await this.playersModel.save(newPlayer);
    //return new GameViewModel(createdGame);
  }

  async finishGame(gameId: string) {
    try {
      const game = await this.gameModel.findOneBy({ id: gameId });
      if (!game) {
        throw new NotFoundException();
      }

      const result = await this.gameModel.update(gameId, {
        status: GameStatuses.Finished,
      });
      return result.affected > 0;
    } catch (e) {
      throw new NotFoundException();
    }
  }

  /*  async saveAnswer(gameId: string, answer: string) {
    //const newAnswer: Answers = Answers.create(answer);

    const createdAnswer = await this.answersModel.save(newAnswer);
    return createdAnswer;
    //return new AnswerViewModel(createdAnswer);
  }*/
}
