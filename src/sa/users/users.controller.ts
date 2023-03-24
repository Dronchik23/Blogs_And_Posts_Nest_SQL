import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  PaginationInputQueryModel,
  UserInputModel,
  UserViewModel,
} from '../../types and models/models';
import { PaginationType } from '../../types and models/types';
import { BasicAuthGuard } from '../../auth/strategys/basic-strategy';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';

@Controller({ path: 'sa/users', scope: Scope.REQUEST })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
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
    );
  }
  @UseGuards(BasicAuthGuard)
  @Get(':id')
  async getUserByUserId(@Param('id') id: string): Promise<UserViewModel> {
    const user = await this.usersQueryRepository.findUserByUserId(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
  @Post()
  async createUser(
    @Body() createUserDTO: UserInputModel,
  ): Promise<UserViewModel> {
    return await this.usersService.createUser(
      createUserDTO.login,
      createUserDTO.email,
      createUserDTO.password,
    );
  }
  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async deleteUserByUserId(@Param('id') id: string): Promise<boolean> {
    console.log(typeof id);
    const isDeleted = await this.usersService.deleteUserByUserId(id);
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }
}
