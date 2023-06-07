import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { GameStatuses, GameDBType } from '../types/types';
import { GameViewModel } from '../models/models';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Games } from '../entities/games.entity';
import { Players } from '../entities/players.entity';

@Injectable({ scope: Scope.DEFAULT })
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Games) private readonly gameModel: Repository<Games>,
    @InjectRepository(Players)
    private readonly playerModel: Repository<Players>,
  ) {}

  private gameDBTypePairViewModel(pair: GameDBType): GameViewModel {
    return {
      id: pair.id,
      firstPlayerProgress: pair.firstPlayerProgress,
      secondPlayerProgress: pair.secondPlayerProgress,
      questions: pair.questions,
      status: pair.status,
      pairCreatedDate: pair.pairCreatedDate,
      startGameDate: pair.startGameDate,
      finishGameDate: pair.finishGameDate,
    };
  }

  async findPairByPairId(pairId: string): Promise<Games> {
    try {
      const game = await this.gameModel.findOneBy({ id: pairId });
      return game;
      //return games ? this.gameDBTypePairViewModel(games) : null;
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

  async findCurrentGame(currentUserId: string): Promise<GameViewModel> {
    try {
      const player: Players = await this.playerModel.findOne({
        where: {
          // player.gameProgress.games.id: currentUserId,
        },
      });
      /*     const gameProgress: GameProgresses = await this.gameProgressModel.findOne(
        {
          where: {
            player: currentUserId,
          },
        },
      );*/

      return;

      // return games ? this.gameDBTypePairViewModel(games) : null;
    } catch (error) {
      console.log(error, 'error');
    }
  }
}
