import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { refreshTokenBlackList } from '../entities/refreshTokenBlackList.entity';

@Module({
  imports: [TypeOrmModule.forFeature([refreshTokenBlackList])],
  controllers: [],
  providers: [],
})
export class refreshTokenBlackListModule {}
