import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import {
  BanUserInputModel,
  UserInputModel,
  UserPaginationQueryModel,
  UserViewModel,
} from '../../models/models';
import { BasicAuthGuard, LogGuard } from '../../auth/strategys/basic-strategy';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../../use-cases/users/delete-user-by-id-use-case';
import { BanUserByUserIdBySACommand } from '../../use-cases/users/bun-user-by-userId-use-case';
import { SkipThrottle } from '@nestjs/throttler';
import { PaginationType } from '../../types/types';
import { CreateUserCommand } from '../../use-cases/users/create-user-by-super-admin-use-case';

@SkipThrottle()
@Controller({ path: 'sa/users', scope: Scope.REQUEST })
export class UsersController {
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(LogGuard)
  @UseGuards(BasicAuthGuard)
  @Get()
  async getAllUsers(
    @Query() query: UserPaginationQueryModel,
  ): Promise<PaginationType> {
    const users = this.usersQueryRepository.getAllUsers(
      query.searchLoginTerm,
      query.searchEmailTerm,
      +query.pageSize,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
      query.banStatus,
    );
    return users;
  }

  @UseGuards(BasicAuthGuard)
  @Get(':userId')
  async getUserByUserId(@Param('userId') id: string): Promise<UserViewModel> {
    const user = await this.usersQueryRepository.findUserByUserId(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createUserBySA(
    @Body() createUserDTO: UserInputModel,
  ): Promise<UserViewModel> {
    const user = await this.commandBus.execute(
      new CreateUserCommand(createUserDTO),
    );
    return user;
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':userId')
  @HttpCode(204)
  async deleteUserByUserId(@Param('userId') userId: string): Promise<boolean> {
    const isDeleted = await this.commandBus.execute(
      new DeleteUserCommand(userId),
    );
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(BasicAuthGuard)
  @Put(':userId/ban')
  @HttpCode(204)
  async banUserByUserId(
    @Param('userId') userId: string,
    @Body() banUserDTO: BanUserInputModel,
  ): Promise<boolean> {
    debugger;
    return await this.commandBus.execute(
      new BanUserByUserIdBySACommand(userId, banUserDTO),
    );
  }
}
