import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Scope,
  UseGuards,
} from '@nestjs/common';
import {
  AnswerInputModel,
  GameViewModel,
  UserViewModel,
} from '../models/models';
import { SkipThrottle } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import { CurrentUser, CurrentUserId } from '../auth/decorators';
import { CreateGameCommand } from '../use-cases/games/create-game-use-case';
import { GamesQueryRepository } from '../query-repositorys/games-query-repository.service';
import { Games } from '../entities/games.entity';
import { SendAnswerCommand } from '../use-cases/games/send-answer-use-case';
import { GameStatuses } from '../types/types';
import { isNil } from '@nestjs/common/utils/shared.utils';

@SkipThrottle()
@Controller({ path: 'pair-games-quiz/pairs', scope: Scope.DEFAULT })
export class CreateGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly gamesQueryRepository: GamesQueryRepository,
  ) {}

  @UseGuards(BearerAuthGuard)
  @Post('/connection')
  @HttpCode(200)
  async createGame(
    @CurrentUser() currentUser: UserViewModel,
  ): Promise<GameViewModel> {
    const game = await this.commandBus.execute(
      new CreateGameCommand(currentUser),
    );
    return game;
  }

  @UseGuards(BearerAuthGuard)
  @Post('/my-current/answers')
  @HttpCode(200)
  async sendAnswer(
    @Body() sendAnswerDTO: AnswerInputModel,
    @CurrentUserId() currentUserId,
  ): Promise<GameViewModel> {
    return await this.commandBus.execute(
      new SendAnswerCommand(sendAnswerDTO, currentUserId),
    );
  }

  @UseGuards(BearerAuthGuard)
  @Get('/my-current')
  @HttpCode(200)
  async getCurrentGame(@CurrentUserId() currentUserId): Promise<GameViewModel> {
    return await this.gamesQueryRepository.findGameByPlayerId(currentUserId);
  }

  @UseGuards(BearerAuthGuard)
  @Get(':pairId')
  @HttpCode(200)
  async getPairByPairId(
    @Param('pairId') pairId: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<any> {
    return await this.gamesQueryRepository.findGameByGameId(pairId);
    /*   if (isNil(game)) {
      throw new NotFoundException();
    }
    if (
      game.gameProgress.firstPlayerScore !== currentUserId ||
      game.gameProgress.players.secondPlayerId !== currentUserId
    ) {
      throw new ForbiddenException();
    }*/
  }
}
