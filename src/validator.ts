import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';
import { UserDBType } from './types and models/types';
import { BlogsQueryRepository } from './query-repositorys/blogs-query.repository';
import { UsersQueryRepository } from './query-repositorys/users-query.repository';
import { CommentsQueryRepository } from './query-repositorys/comments-query.repository';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ async: true })
@Injectable()
export class isCodeAlreadyConfirmedConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async validate(code: string): Promise<boolean> {
    const user: UserDBType =
      await this.usersQueryRepository.findUserByConfirmationCode(code);
    const isEmailNotConfirmed = user && user.isEmailConfirmed === true;
    return !isEmailNotConfirmed;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Confirmation code already confirmed';
  }
}
export function IsCodeAlreadyConfirmed(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: isCodeAlreadyConfirmedConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class IsEmailAlreadyConfirmedConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async validate(email: string) {
    const user: UserDBType = await this.usersQueryRepository.findUserByEmail(
      email,
    );
    const isEmailNotConfirmed = user && user.isEmailConfirmed === true;
    return !isEmailNotConfirmed;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Email is already confirmed';
  }
}
export function IsEmailAlreadyConfirmed(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailAlreadyConfirmedConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class IsEmailAlreadyExistConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async validate(email: string) {
    const user = await this.usersQueryRepository.findUserByEmail(email);
    return !user;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Email already exists';
  }
}
export function IsEmailAlreadyExist(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailAlreadyExistConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class IsLoginAlreadyExistConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async validate(login: string) {
    const user = await this.usersQueryRepository.findUserByLogin(login);
    return !user;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Login already exists';
  }
}
export function IsLoginAlreadyExist(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLoginAlreadyExistConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class isBlogExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}
  async validate(blogId: string) {
    try {
      const blog = await this.blogsQueryRepository.findBlogByBlogId(blogId);
      return !!blog;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'blog does not exist';
  }
}
export function IsBlogExist(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: isBlogExistConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class isCommentExistConstraint implements ValidatorConstraintInterface {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}
  async validate(commentId: string) {
    try {
      console.log(commentId);
      const comment = await this.commentsQueryRepository.findCommentByCommentId(
        commentId,
      );
      return Boolean(comment);
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'comment does not exist';
  }
}

export function IsCommentExist(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: isCommentExistConstraint,
    });
  };
}
