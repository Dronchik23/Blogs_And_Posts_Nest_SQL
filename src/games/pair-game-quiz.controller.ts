import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
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
import { SendAnswerCommand } from '../use-cases/games/send-answer-use-case';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { GameStatuses } from '../types/types';

@SkipThrottle()
@Controller({ path: 'pair-game-quiz/pairs', scope: Scope.DEFAULT })
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
    const game: GameViewModel = await this.commandBus.execute(
      new CreateGameCommand(currentUser),
    );

    return game;
  }

  @SkipThrottle()
  @UseGuards(BearerAuthGuard)
  @Post('/my-current/answers')
  @HttpCode(200)
  async sendAnswer(
    @Body() sendAnswerDTO: AnswerInputModel,
    @CurrentUserId() currentUserId,
  ): Promise<GameViewModel> {
    const game = await this.commandBus.execute(
      new SendAnswerCommand(sendAnswerDTO, currentUserId),
    );
    return game;
  }

  @UseGuards(BearerAuthGuard)
  @Get('/my-current')
  @HttpCode(200)
  async getCurrentGame(@CurrentUserId() currentUserId): Promise<any> {
    const game: GameViewModel =
      await this.gamesQueryRepository.findGameByPlayerId(currentUserId);

    if (!game || game.status !== GameStatuses.Active) {
      throw new NotFoundException();
    }

    return game;
  }

  @UseGuards(BearerAuthGuard)
  @Get(':gameId')
  @HttpCode(200)
  async getGameByGameId(
    @Param('gameId', ParseUUIDPipe)
    gameId: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<any> {
    const game: GameViewModel =
      await this.gamesQueryRepository.findGameByGameId(gameId);

    if (isNil(game)) {
      throw new NotFoundException();
    }

    if (game.secondPlayerProgress !== null) {
      if (
        game.firstPlayerProgress.player.id !== currentUserId ||
        game.secondPlayerProgress.player.id !== currentUserId
      ) {
        throw new ForbiddenException();
      }
    }

    if (game.firstPlayerProgress.player.id !== currentUserId) {
      throw new ForbiddenException();
    }

    return game;
  }
}
