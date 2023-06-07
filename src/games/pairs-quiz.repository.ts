import { Injectable, Scope } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Games } from '../entities/games.entity';
import { DataSource, Repository } from 'typeorm';
import { GameProgresses } from '../entities/game-progresses.entity';
import { Players } from '../entities/players.entity';
import {
  GameViewModel,
  QuestionViewModel,
  UserViewModel,
} from '../models/models';

@Injectable({ scope: Scope.DEFAULT })
export class GamesRepository {
  constructor(
    @InjectRepository(Games)
    private readonly gameModel: Repository<Games>,
    @InjectRepository(GameProgresses)
    private readonly gameProgressModel: Repository<GameProgresses>,
    @InjectRepository(Players)
    private readonly playersModel: Repository<Players>,
  ) {}

  async createGame(
    questions: QuestionViewModel[],
    firstUser: UserViewModel,
    startGameDate: string | null,
    secondPair?: Games,
  ): Promise<GameViewModel> {
    const newGame: Games = Games.create(
      questions,
      firstUser,
      startGameDate,
      secondPair,
    );
    //const newGamesProgress = GameProgresses.create();
    const newPlayer: Players = Players.create(firstUser);

    const createdGame = await this.gameModel.save(newGame);
    const createdPlayer = await this.playersModel.save(newPlayer);
    return new GameViewModel(createdGame, createdPlayer);
  }
}
