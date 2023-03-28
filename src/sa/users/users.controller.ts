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
import { UsersService } from './users.service';
import {
  BunUserInputModel,
  PaginationInputQueryModel,
  UserInputModel,
  UserViewModel,
} from '../../types and models/models';
import { PaginationType } from '../../types and models/types';
import { BasicAuthGuard } from '../../auth/strategys/basic-strategy';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../use-cases/users/create-user-use-case';
import { DeleteUserCommand } from '../../use-cases/users/delete-user-by-id-use-case';
import { BunUserByUserIdCommand } from '../../use-cases/users/bun-user-by-userId-use-case';

@Controller({ path: 'sa/users', scope: Scope.REQUEST })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async getAllUsers(
    @Query() query: PaginationInputQueryModel,
  ): Promise<PaginationType> {
    return this.usersQueryRepository.getAllUsers(
      query.searchLoginTerm,
      query.searchEmailTerm,
      +query.pageSize,
      query.sortBy,
      query.sortDirection,
      +query.pageNumber,
      query.banStatus,
    );
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
  async createUser(
    @Body() createUserDTO: UserInputModel,
  ): Promise<UserViewModel> {
    return await this.commandBus.execute(
      new CreateUserCommand(
        createUserDTO.login,
        createUserDTO.email,
        createUserDTO.password,
      ),
    );
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
  async bunUserByUserId(
    @Param('userId') userId: string,
    @Body() bunUserDTO: BunUserInputModel,
  ): Promise<boolean> {
    return await this.commandBus.execute(
      new BunUserByUserIdCommand(
        userId,
        bunUserDTO.isBanned,
        bunUserDTO.banReason,
      ),
    );
  }
}
