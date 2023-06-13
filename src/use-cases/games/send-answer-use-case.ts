import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../query-repositorys/games-query-repository.service';
import { QuestionsQueryRepository } from '../../query-repositorys/questions-query.repository';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Games } from '../../entities/games.entity';
import { Users } from '../../entities/users.entity';
import { GameProgresses } from '../../entities/game-progresses';
import { Answers } from '../../entities/answers';
import { Players } from '../../entities/players.entity';
import {
  AnswerInputModel,
  GameViewModel,
  QuestionViewModel,
} from '../../models/models';
import { GameStatuses } from '../../types/types';
import { uuid } from 'uuidv4';
import { Questions } from '../../entities/questions.entity';
import { Likes } from '../../entities/likes.entity';

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
    @InjectRepository(Answers)
    private readonly fRepository: Repository<Answers>,
    @InjectRepository(GameProgresses)
    private readonly FGPRepository: Repository<GameProgresses>,
    @InjectRepository(Players)
    private readonly playerModel: Repository<Players>,
    private readonly gamesQueryRepository: GamesQueryRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async execute(command: SendAnswerCommand): Promise<any> {
    const game: GameViewModel =
      await this.gamesQueryRepository.findGameByGameId(command.userId);
    if (!game || game.status !== GameStatuses.Active) {
      throw new NotFoundException();
    }
    const currentQuestion = game.questions[0];

    //if(command.sendAnswerDTO.answer === currentQuestion.answers)
  }
}
