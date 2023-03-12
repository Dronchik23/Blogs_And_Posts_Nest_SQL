import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';
import { UsersRepository } from './users/users.repository';
import { inject, injectable } from 'inversify';
import { UserDBType } from './types and models/types';
import { BlogsRepository } from './blogs/blog.repository';
import { CommentsRepository } from './comments/comment.repository';

@ValidatorConstraint({ async: true })
@injectable()
export class isCodeAlreadyConfirmedConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async validate(code: string): Promise<boolean> {
    console.log('code', code);
    const user = await this.usersRepository.findUserByConfirmationCode(code);
    console.log('user validator', user);
    const isEmailNotConfirmed =
      user && user.emailConfirmation.isConfirmed === true;
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
@injectable()
export class IsEmailAlreadyConfirmedConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async validate(email: string) {
    const user: UserDBType = await this.usersRepository.findByEmail(email);
    const isEmailNotConfirmed =
      user && user.emailConfirmation.isConfirmed === true;
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
@injectable()
export class IsEmailAlreadyExistConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async validate(email: string) {
    const user = await this.usersRepository.findByLoginOrEmail(email);
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
@injectable()
export class IsLoginAlreadyExistConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async validate(login: string) {
    console.log('login valid', login);
    const user = await this.usersRepository.findByLogin(login);
    console.log('user valid', user);
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
@injectable()
export class isBlogExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async validate(blogId: string) {
    try {
      const blog = await this.blogsRepository.findBlogByBlogId(blogId);
      if (blog) {
        return true;
      } else return false;
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
@injectable()
export class isCommentExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly commentsRepository: CommentsRepository) {}
  async validate(commentId: string) {
    try {
      const comment = await this.commentsRepository.findCommentByCommentId(
        commentId,
      );
      if (comment) {
        return true;
      } else return false;
    } catch (e) {
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
