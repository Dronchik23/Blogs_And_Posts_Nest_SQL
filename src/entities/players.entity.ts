import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionInputModel, UserViewModel } from '../models/models';
import { Games } from './games.entity';
import { Answers } from './answers.entity';
import { GameProgresses } from './game-progresses.entity';

@Entity()
export class Players {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column()
  playerId: string;

  @Column()
  playerLogin: string;

  @ManyToOne(() => GameProgresses, (gp) => gp.player)
  gameProgress: GameProgresses;

  static create(user: UserViewModel) {
    const newPlayer = new Players();
    newPlayer.playerId = user.id;
    newPlayer.playerLogin = user.login;
    return newPlayer;
  }
}
