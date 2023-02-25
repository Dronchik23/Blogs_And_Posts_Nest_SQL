import { Injectable } from '@nestjs/common';
import { body, param } from 'express-validator';
import { UsersRepository } from '../users/users.repository';
import { BlogsRepository } from '../blogs/blog.repository';

@Injectable()
export class Validator {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  public nameValidation = body('name')
    .trim()
    .isLength({ min: 1, max: 15 })
    .isString();

  public websiteUrlValidation = body('websiteUrl')
    .trim()
    .isLength({ min: 0, max: 100 })
    .isString()
    .matches(
      /^https:\/\/([a-zA-Z0-9_-]+.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
    );

  public titleValidation = body('title')
    .isString()
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 30 });

  public shortDescriptionValidation = body('shortDescription')
    .trim()
    .isLength({ min: 1, max: 100 })
    .notEmpty()
    .isString();

  public contentValidation = body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .notEmpty()
    .isString();

  public contentValidationForComment = body('content')
    .trim()
    .isLength({ min: 20, max: 300 })
    .notEmpty()
    .isString();

  public bodyBlogIdValidation = body('blogId')
    .trim()
    .notEmpty()
    .custom(async (v) => {
      const blog = await this.blogsRepository.findBlogByBlogId(v);
      if (!blog) throw new Error();
      return true;
    });

  public paramsBlogIdValidation = param('blogId').trim().notEmpty().isString();

  public loginValidation = body('login')
    .isString()
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 10 })
    .custom(async (value) => {
      const isValidUser = await this.usersRepository.findByLoginOrEmail(value);
      if (isValidUser) throw new Error('Login already in use');
      return true;
    });

  public passwordValidation = body('password')
    .trim()
    .isLength({ min: 6, max: 20 })
    .isString();

  public newPasswordValidation = body('newPassword')
    .trim()
    .isLength({ min: 6, max: 20 })
    .isString();

  public emailValidation = body('email')
    .trim()
    .isLength({ min: 3, max: 100 })
    .isString()
    .matches(/^[\w-.]+@([\w-]+.)+[\w-]{2,4}$/);

  public isCodeAlreadyConfirmed = body('code').custom(async (value) => {
    const user = await this.usersRepository.findUserByConfirmationCode(value);
    if (user?.emailConfirmation.isConfirmed)
      throw new Error('Code is already confirmed');
    return true;
  });

  public isEmailAlreadyConfirmed = body('email').custom(async (value) => {
    const user = await this.usersRepository.findByLoginOrEmail(value);
    if (user?.emailConfirmation.isConfirmed)
      throw new Error('E-mail is already confirmed');
    return true;
  });

  public codeValidation = body('code').isString().trim().notEmpty().isUUID();

  public passwordRecoveryCodeValidation = body('recoveryCode')
    .isString()
    .trim()
    .notEmpty()
    .isUUID();

  public async isEmailExist(email: string): Promise<boolean> {
    await this.usersRepository.findByEmail(email);
    return true;
  }

  public likeStatusValidation = body('likeStatus')
    .isString()
    .trim()
    .notEmpty()
    .isIn(['Like', 'Dislike', 'None']);
}
