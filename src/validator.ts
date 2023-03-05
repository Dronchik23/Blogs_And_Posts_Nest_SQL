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
