import {
  AnswerStatuses,
  BlogOwnerInfoType,
  ExtendedLikesInfoType,
  GameStatuses,
  LikeStatus,
  PostDBType,
  PostInfoType,
  UserBanInfoType,
} from '../types/types';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  IsBlogExist,
  IsCodeAlreadyConfirmed,
  IsEmailAlreadyConfirmed,
  IsEmailAlreadyExist,
  IsLoginAlreadyExist,
} from '../validator';
import { Transform, Type } from 'class-transformer';
import { Blogs } from '../entities/blogs.entity';
import { Comments } from '../entities/comments.entity';
import { Users } from '../entities/users.entity';
import { Questions } from '../entities/questions.entity';
import { Games } from '../entities/games.entity';
import { CorrectAnswers } from '../entities/correct-answers.entity';
import { Answers } from '../entities/answers';

export class DefaultPaginationData {
  @Type(() => Number)
  @IsOptional()
  pageSize = 10;
  @IsOptional()
  @IsString()
  sortBy = 'createdAt';
  @IsOptional()
  @IsString()
  @Transform((params) => {
    return params.value === 'asc' ? 'asc' : 'desc';
  })
  sortDirection: 'asc' | 'desc' = 'desc';
  @IsOptional()
  @Type(() => Number)
  pageNumber: number | null = 1;
}
export class UserPaginationQueryModel extends DefaultPaginationData {
  @IsOptional()
  @IsString()
  searchLoginTerm: string | null = null;

  @IsOptional()
  @IsString()
  searchEmailTerm: string | null = null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'banned') return true;
    if (value === 'notBanned') return false;
    if (value === 'all') return null;
    return null;
  })
  banStatus: string | boolean = null;
}
export class BlogPaginationQueryModel extends DefaultPaginationData {
  @IsOptional()
  @IsString()
  searchNameTerm: string | null = null;
}
export class CommentPaginationQueryModel extends DefaultPaginationData {
  @IsOptional()
  @IsString()
  searchLoginTerm: string | null = null;
}
export class PostPaginationQueryModel extends DefaultPaginationData {}
export class QuestionPaginationQueryModel extends DefaultPaginationData {
  @IsOptional()
  @IsString()
  bodySearchTerm: string | null = null;

  @IsOptional()
  @IsString()
  publishedStatus: string | null = null;
}

export class DeviceViewModel {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
  constructor(deviceFromDB: DeviceViewModel) {
    this.ip = deviceFromDB.ip;
    this.title = deviceFromDB.title;
    this.deviceId = deviceFromDB.deviceId;
    this.lastActiveDate = deviceFromDB.lastActiveDate;
  }
}
export class PostUpdateModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 30)
  @IsNotEmpty()
  title: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 100)
  @IsNotEmpty()
  shortDescription: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 1000)
  @IsNotEmpty()
  content: string;
}
export class BlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  constructor(blogFromDB: Blogs) {
    this.id = blogFromDB.id;
    this.name = blogFromDB.name;
    this.description = blogFromDB.description;
    this.websiteUrl = blogFromDB.websiteUrl;
    this.createdAt = blogFromDB.createdAt;
    this.isMembership = blogFromDB.isMembership;
  }
}
export class SABlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo: BlogOwnerInfoType;
}
export class PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoType;
  constructor(postDB: PostDBType) {
    this.id = postDB.id;
    this.title = postDB.title;
    this.shortDescription = postDB.shortDescription;
    this.content = postDB.content;
    this.blogName = postDB.blogName;
    this.blogId = postDB.blogId;
    this.createdAt = postDB.createdAt;
    this.extendedLikesInfo = {
      likesCount: postDB.likesCount,
      dislikesCount: postDB.dislikesCount,
      myStatus: postDB.myStatus,
      newestLikes: postDB.newestLikes,
    };
  }
}
export class UserViewModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  banInfo: UserBanInfoType;
  constructor(userFromDB: Users) {
    this.id = userFromDB.id;
    this.login = userFromDB.login;
    this.email = userFromDB.email;
    this.createdAt = userFromDB.createdAt;
    this.banInfo = {
      isBanned: userFromDB.isBanned,
      banDate: userFromDB.banDate,
      banReason: userFromDB.banReason,
      //blogId: userFromDB.blogId,
    };
  }
}
export class BloggerUserViewModel {
  id: string;
  login: string;
  banInfo: UserBanInfoType;
}
export class CommentInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20, 300)
  @IsNotEmpty()
  content: string;
}
export class BloggerCommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  postInfo: PostInfoType;
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };
}
export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };
  constructor(commentFromDB: Comments) {
    this.id = commentFromDB.id;
    this.content = commentFromDB.content;
    this.commentatorInfo = {
      userId: commentFromDB.commentatorId,
      userLogin: commentFromDB.commentatorLogin,
    };
    this.createdAt = commentFromDB.createdAt;
    this.likesInfo = {
      likesCount: commentFromDB.likesCount,
      dislikesCount: commentFromDB.dislikesCount,
      myStatus: commentFromDB.myStatus,
    };
  }
}
export class BlogInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 15)
  @IsNotEmpty()
  name: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 100)
  @IsNotEmpty()
  description: string;
  @IsString()
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  @Length(1, 100)
  websiteUrl: string;
}
export class QuestionInputModel {
  @IsString()
  @Length(10, 500)
  @IsNotEmpty()
  body: string;
  @IsArray()
  @IsNotEmpty()
  correctAnswers: string[];
}
export class BlogPostInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 30)
  @IsNotEmpty()
  title: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 100)
  @IsNotEmpty()
  shortDescription: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 1000)
  @IsNotEmpty()
  content: string;
}
export class BlogUpdateModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 15)
  @IsNotEmpty()
  name: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(1, 500)
  @IsNotEmpty()
  description: string;
  @IsString()
  @IsUrl()
  @Length(1, 1000)
  @IsNotEmpty()
  websiteUrl: string;
}
export class QuestionUpdateModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(10, 500)
  @IsNotEmpty()
  body: string;
  @IsArray()
  @IsNotEmpty()
  correctAnswers: string[];
}
export class PublishQuestionModel {
  @IsBoolean()
  published: boolean;
}
export class LoginInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @IsNotEmpty()
  loginOrEmail: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @IsNotEmpty()
  password: string;
}
export class UserInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(3, 10)
  @IsNotEmpty()
  @IsLoginAlreadyExist()
  login: string;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(6, 20)
  @IsNotEmpty()
  password: string;

  @IsString()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @IsNotEmpty()
  @IsEmailAlreadyExist()
  email: string;
}
export class LikeInputModel {
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
export class RegistrationEmailResendingModel {
  //@IsEmail()
  @IsEmailAlreadyConfirmed()
  email: string;
}
export class CodeInputModel {
  @IsString()
  @IsUUID()
  @IsCodeAlreadyConfirmed()
  code: string;
}
export class AnswerInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @IsNotEmpty()
  answer: string;
}
export class CommentUpdateModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20, 300)
  @IsNotEmpty()
  content: string;
}
export class BanUserInputModel {
  @IsBoolean()
  isBanned: boolean;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20)
  banReason: string;
}
export class BanBlogInputModel {
  @IsBoolean()
  isBanned: boolean;
}
export class NewPasswordInputModel {
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(6, 20)
  newPassword: string;
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;
}
export class BloggerBanUserInputModel {
  @IsBoolean()
  isBanned: boolean;
  @IsString()
  @Matches(/^(?!\s*$).+/)
  @Length(20)
  banReason: string;
  @IsString()
  @IsNotEmpty()
  @IsBlogExist()
  blogId: string;
}
export class LikeViewModel {
  id: string;
  commentId?: string;
  postId?: string;
  userId: string;
  login: string;
  status: LikeStatus = LikeStatus.None;
  addedAt: string;
}
export class QuestionViewModel {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  constructor(questionDB: Questions, createdCorrectAnswers?: CorrectAnswers) {
    this.id = questionDB.id;
    this.body = questionDB.body;
    (this.correctAnswers = [
      createdCorrectAnswers.answer1,
      createdCorrectAnswers.answer2,
    ]),
      (this.published = questionDB.published);
    this.createdAt = questionDB.createdAt;
    this.updatedAt = questionDB.updatedAt;
  }
}
export class GameViewModel {
  id: string;
  firstPlayerProgress: GamePlayerProgressViewModel;
  secondPlayerProgress: GamePlayerProgressViewModel;
  questions: QuestionGameViewModel[];
  status: GameStatuses;
  pairCreatedDate: string;
  startGameDate: string;
  finishGameDate: string;
  constructor(gameDB: Games) {
    this.id = gameDB.id;
    this.firstPlayerProgress = {
      answers: gameDB.gameProgress.answers.map((a) => ({
        questionId: a.firstPlayerQuestionId,
        answerStatus: a.firstPlayerAnswerStatus,
        addedAt: a.firstPlayerAddedAt,
      })),
      player: {
        id: gameDB.gameProgress.players.firstPlayerId,
        login: gameDB.gameProgress.players.firstPlayerLogin,
      },
      score: gameDB.gameProgress.firstPlayerScore,
    };
    this.secondPlayerProgress = {
      answers: gameDB.gameProgress.answers.map((a) => ({
        questionId: a.secondPlayerQuestionId,
        answerStatus: a.secondPlayerAnswerStatus,
        addedAt: a.secondPlayerAddedAt,
      })),
      player: {
        id: gameDB.gameProgress.players.secondPlayerId,
        login: gameDB.gameProgress.players.secondPlayerLogin,
      },
      score: gameDB.gameProgress.secondPlayerScore,
    };
    this.questions = gameDB.questions;
    this.status = gameDB.status;
    this.pairCreatedDate = gameDB.pairCreatedDate;
    this.startGameDate = gameDB.startGameDate;
    this.finishGameDate = gameDB.finishGameDate;
  }
}
export class GamePlayerProgressViewModel {
  answers: AnswerViewModel[];
  player: PlayerViewModel;
  score: any;
}
export class AnswerViewModel {
  questionId: string;
  answerStatus: AnswerStatuses;
  addedAt: string;
}
export class FirstPlayerAnswerViewModel {
  questionId: string;
  answerStatus: AnswerStatuses;
  addedAt: string;
  constructor(answerDB: Answers) {
    this.questionId = answerDB.firstPlayerQuestionId;
    this.answerStatus = answerDB.firstPlayerAnswerStatus;
    this.addedAt = answerDB.firstPlayerAddedAt;
  }
}
export class SecondPlayerAnswerViewModel {
  questionId: string;
  answerStatus: AnswerStatuses;
  addedAt: string;
  constructor(answerDB: Answers) {
    this.questionId = answerDB.secondPlayerQuestionId;
    this.answerStatus = answerDB.secondPlayerAnswerStatus;
    this.addedAt = answerDB.secondPlayerAddedAt;
  }
}
export class PlayerViewModel {
  id: any;
  login: any;
}
export class QuestionGameViewModel {
  id: string;
  body: string;
}
export class CorrectAnswersViewModel {
  answer1: string;
  answer2: string;
}
