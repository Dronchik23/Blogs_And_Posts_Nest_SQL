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
import { GameViewModel, UserViewModel } from '../models/models';
import { SkipThrottle } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import { BearerAuthGuard } from '../auth/strategys/bearer-strategy';
import { CurrentUser, CurrentUserId } from '../auth/decorators';
import { CreateGameCommand } from '../use-cases/games/create-game-use-case';
import { GamesQueryRepository } from '../query-repositorys/games-query-repository.service';
import { Games } from '../entities/games.entity';
import { SendAnswerCommand } from '../use-cases/games/send-answer-use-case';

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
    return await this.commandBus.execute(new CreateGameCommand(currentUser));
  }

  @UseGuards(BearerAuthGuard)
  @Post('/my-current/answers')
  @HttpCode(200)
  async sendAnswer(
    @Body() sendAnswerDTO: string,
    @CurrentUserId() currentUserId,
  ): Promise<GameViewModel> {
    const game: GameViewModel = await this.gamesQueryRepository.findCurrentGame(
      currentUserId,
    );
    return await this.commandBus.execute(
      new SendAnswerCommand(sendAnswerDTO, game),
    );
  }

  @UseGuards(BearerAuthGuard)
  @Get('/my-current')
  @HttpCode(200)
  async getCurrentGame(@CurrentUserId() currentUserId): Promise<GameViewModel> {
    const game: GameViewModel = await this.gamesQueryRepository.findCurrentGame(
      currentUserId,
    );
    return game;
  }

  @UseGuards(BearerAuthGuard)
  @Get(':pairId')
  @HttpCode(200)
  async getPairByPairId(
    @Param('pairId') pairId: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<any> {
    const game: Games = await this.gamesQueryRepository.findPairByPairId(
      pairId,
    );

    /*    if (isNil(games)) {
      throw new NotFoundException();
    }
    if (games.gameProgress. !== currentUserId) {
      throw new ForbiddenException();
    }
    return games;*/
  }
}
