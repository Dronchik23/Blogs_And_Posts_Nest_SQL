import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Players {
  @PrimaryGeneratedColumn('uuid')
  _id?: string;

  @Column({ nullable: true })
  firstPlayerId: string;

  @Column({ nullable: true })
  firstPlayerLogin: string;

  @Column({ nullable: true })
  secondPlayerId: string;

  @Column({ nullable: true })
  secondPlayerLogin: string;

  /*  static create(user: UserViewModel) {
    const newPlayer = new Players();
    newPlayer.playerId = user.id;
    newPlayer.playerLogin = user.login;
    return newPlayer;
  }*/
}
