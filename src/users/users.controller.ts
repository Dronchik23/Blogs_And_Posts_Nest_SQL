import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  PaginationInputQueryModel,
  UserCreateModel,
  UserViewModel,
} from '../types and models/models';
import { PaginationType } from '../types and models/types';
import { inject } from 'inversify';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query() query: PaginationInputQueryModel,
  ): Promise<PaginationType> {
    const {
      searchLoginTerm,
      searchEmailTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    } = query;
    return this.usersService.findAllUsers(
      searchLoginTerm,
      searchEmailTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    );
  }

  @Get(':id')
  async getUserByUserId(@Param('id') id: string): Promise<UserViewModel> {
    const user = await this.usersService.getUserByUserId(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Post()
  async createUser(
    @Body() createUserData: UserCreateModel,
  ): Promise<UserViewModel> {
    return this.usersService.createUser(
      createUserData.login,
      createUserData.email,
      createUserData.password,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteUserByUserId(@Param('id') id: string): Promise<boolean> {
    const isDeleted = await this.usersService.deleteUserByUserId(id);
    if (isDeleted) {
      return true;
    } else {
      throw new NotFoundException();
    }
  }
}
