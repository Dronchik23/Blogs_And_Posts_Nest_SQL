import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { GameStatuses, GameDBType } from '../types/types';
import { GameViewModel } from '../models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Games } from '../entities/games.entity';
import { Players } from '../entities/players.entity';
import { GameProgresses } from '../entities/game-progresses';

@Injectable({ scope: Scope.DEFAULT })
export class GamesQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Games) private readonly gameModel: Repository<Games>,
    @InjectRepository(Players)
    private readonly playerModel: Repository<Players>,
  ) {}

  private gameDBTypePairViewModel(game: any): GameViewModel {
    return {
      id: game.id,
      firstPlayerProgress: game.firstPlayerProgress,
      secondPlayerProgress: game.secondPlayerProgress,
      questions: game.questions,
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
      console.log(currentUserId);
      const result = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from(Players, 'players')
        .where('players."firstPlayerId" = :currentUserId', { currentUserId })
        .leftJoin(
          GameProgresses,
          'progress',
          'progress.id = players."gameProgressId"',
        )
        .leftJoin(Games, 'games', 'games.id = progress."gameId"')
        .getRawOne();

      const game = result;
      console.log('game repo', game);

      return game ? this.gameDBTypePairViewModel(game) : null;
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
