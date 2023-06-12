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
import { AnswerInputModel, GameViewModel } from '../../models/models';
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
  // async onModuleInit() {
  //   const user = {
  //     id: 'ed20bc60-99a0-4845-bb3b-55e2fefaeb1a',
  //     login: 'wdwd93e',
  //     email: '834ryru@mail.com',
  //     createdAt: 'buidb3828219',
  //     banInfo: 'banned',
  //   };
  //   const questions =
  //     await this.questionsQueryRepository.getFiveRandomQuestions();
  //   const date = new Date().toISOString();
  //
  //   const gameProgress = new GameProgresses();
  //   gameProgress.firstPlayerScore = 0;
  //   gameProgress.secondPlayerScore = 0;
  //
  //   const createdGameProgress: GameProgresses = await this.FGPRepository.save(
  //     gameProgress,
  //   );
  //
  //   const player = new Players();
  //   player.firstPlayerId = user.id;
  //   player.firstPlayerLogin = user.login;
  //   player.secondPlayerId = uuid();
  //   player.secondPlayerLogin = 'wendowedi3';
  //   player.gameProgressId = gameProgress.id;
  //   const createdPlayer = await this.playerModel.save(player);
  //
  //   const answers = new Answers();
  //   const createdAnswers = await this.fRepository.save(answers);
  //
  //   const createdGame = Games.create(
  //     questions,
  //     createdGameProgress.id,
  //     createdPlayer,
  //     createdAnswers,
  //   );
  //
  //   const savedGame = await this.gameModule.save(createdGame);
  //   const playerId = player.firstPlayerId;
  //   //const gameProgressId = players.gameProgressId;
  //
  //   /*const game = await this.gameModule
  //     .createQueryBuilder('g')
  //     .where('g."gameProgressId" = :gameProgressId', { gameProgressId })
  //     .getOne();*/
  //
  //   /*    const game = await this.gameModule.findOne({
  //     where: {
  //       gameProgressId: players.gameProgressId,
  //     },
  //   });*/
  //
  //   //const gameId = game.id;
  //   console.log('game', result);
  //
  //   /*   const questionsArr = await this.questionModule
  //     .createQueryBuilder('q')
  //     .where('q."gameId" = :gameId', { gameId })
  //     .getMany();
  //
  //   console.log('resultsssss', questionsArr);*/
  //
  //   /*   const result = await this.dataSource
  //     .createQueryBuilder()
  //     .select('*')
  //     .from(Players, 'players')
  //     .where('players."firstPlayerId" = :playerId', { playerId })
  //     .leftJoin(
  //       GameProgresses,
  //       'progress',
  //       'progress.id = players."gameProgressId"',
  //     )
  //     .leftJoin(Games, 'games', 'games.id = progress.gameId')
  //     //.where('players."firstPlayerId" = :playerId', { playerId })
  //     .getRawOne();
  //
  //   console.log('result', { result });*/
  // }

  async execute(command: SendAnswerCommand): Promise<any> {
    const game: GameViewModel =
      await this.gamesQueryRepository.findGameByGameId(command.userId);
    if (!game || game.status !== GameStatuses.Active) {
      throw new NotFoundException();
    }
  }
}
