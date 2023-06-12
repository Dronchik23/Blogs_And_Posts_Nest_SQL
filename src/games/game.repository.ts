import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Games } from '../entities/games.entity';
import { Repository } from 'typeorm';
import { Players } from '../entities/players.entity';
import { QuestionViewModel, UserViewModel } from '../models/models';
import { GameStatuses } from '../types/types';
import { GameProgresses } from '../entities/game-progresses';
import { Answers } from '../entities/answers';
import { Questions } from '../entities/questions.entity';

@Injectable({ scope: Scope.DEFAULT })
export class GamesRepository {
  constructor(
    @InjectRepository(Games)
    private readonly gameModel: Repository<Games>,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
    @InjectRepository(Players)
    private readonly playersModel: Repository<Players>,
    @InjectRepository(GameProgresses)
    private readonly gameProgressModel: Repository<GameProgresses>,
    @InjectRepository(Answers)
    private readonly answersProgressModel: Repository<Answers>,
  ) {}

  async createGame(
    questions: QuestionViewModel[],
    user: UserViewModel,
    startGameDate: string | null,
    secondPair?: Games,
  ): Promise<any> {
    const newGameProgress = GameProgresses.create();
    const createdGameProgress = await this.gameProgressModel.save(
      newGameProgress,
    );
    const newPlayers = Players.create(user, createdGameProgress.id);
    const createdPlayers = await this.playersModel.save(newPlayers);

    const newAnswers = new Answers();
    const createdAnswers = await this.answersProgressModel.save(newAnswers);

    const createdGame = Games.create(
      questions,
      createdGameProgress.id,
      createdPlayers,
      createdAnswers,
    );

    const savedGame = await this.gameModel.save(createdGame);

    await this.gameProgressModel.update(createdGameProgress.id, {
      gameId: savedGame.id,
    }); // add gameId to gameProgress

    await this.questionModel.update(savedGame.id, {
      gameId: savedGame.id,
    });

    return savedGame;
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
