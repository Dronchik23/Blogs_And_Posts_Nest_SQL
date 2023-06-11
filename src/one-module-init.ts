/*
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../query-repositorys/games-query-repository.service';
import { QuestionsQueryRepository } from '../../query-repositorys/questions-query.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Games } from '../../entities/games.entity';
import { Users } from '../../entities/users.entity';
import { GameProgresses } from '../../entities/game-progresses';
import { Answers } from '../../entities/answers';
import { Players } from '../../entities/players.entity';

export class SendAnswerCommand {
  constructor(
    public gameId: string,
    public userId: string,
    public answerText: string,
  ) {}
}

@CommandHandler(SendAnswerCommand)
export class SendAnswerService
  implements ICommandHandler<SendAnswerCommand>, OnModuleInit
{
  constructor(
    @InjectRepository(Games)
    private readonly gamesRepository: Repository<Games>,
    @InjectRepository(Users)
    private readonly uRepository: Repository<Users>,
    @InjectRepository(Answers)
    private readonly fRepository: Repository<Answers>,
    @InjectRepository(GameProgresses)
    private readonly FGPRepository: Repository<GameProgresses>,
    @InjectRepository(Players)
    private readonly playersRepository: Repository<Players>,
    private readonly gamesQueryRepository: GamesQueryRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async onModuleInit() {
    const game = await this.gamesRepository.find();
    const user = {
      id: 'bduiwed8e329',
      login: 'wdwd93e',
      email: '834ryru@mail.com',
      createdAt: 'buidb3828219',
      banInfo: 'banned',
    };
    const questions =
      await this.questionsQueryRepository.getFiveRandomQuestions();
    const date = new Date().toISOString();

    const player = new Players();
    player.firstPlayerId = user.id;
    player.firstPlayerLogin = user.login;
    player.secondPlayerId = 'chww9edu0923e';
    player.secondPlayerLogin = 'wendowedi3';
    const createdPlayer = await this.playersRepository.save(player);

    console.log(createdPlayer, 'crp');

    const gameProgress = new GameProgresses();
    gameProgress.firstPlayerScore = 0;
    gameProgress.secondPlayerScore = 0;

    const createdGameProgress: GameProgresses = await this.FGPRepository.save(
      gameProgress,
    );
    console.log(createdGameProgress, 'crgp');

    const answers = new Answers();
    const createdAnswers = await this.fRepository.save(answers);

    const createdGame = Games.create(
      questions,
      createdGameProgress,
      createdPlayer,
      createdAnswers,
    );

    const savedGame = await this.gamesRepository.save(createdGame);
    console.log({ game: savedGame });
    const g = await this.gamesRepository.findOne({
      where: {},
    });
    console.log({ game, g });
  }

  async execute(command: SendAnswerCommand): Promise<any> {
    const { gameId, userId, answerText } = command;
    const game = await this.gamesQueryRepository.findCurrentGame(userId);
    console.log(game);
  }
}
*/
