import { Module } from '@nestjs/common';
import { UsersController } from './sa/users/users.controller';
import { UsersRepository } from './sa/users/users-repository';
import { EmailService } from './email/email.service';
import { BlogsController } from './blogs/blog.controller';
import { BlogsRepository } from './blogs/blog.repository';
import { PostsRepository } from './posts/post.repository';
import { PostsController } from './posts/post.controller';
import { CommentsRepository } from './comments/comment.repository';
import { CommentsController } from './comments/comment.controller';
import { AuthController } from './auth/auth.controller';
import { DevicesRepository } from './devices/device.repository';
import { DevicesController } from './devices/device.controller';
import { LikesRepository } from './likes/like.repository';
import { TokensRepository } from './tokens/tokens.repository';
import { CustomJwtService } from './jwt/jwt.service';
import { TestingController } from './testing/testing.controller';
import { EmailAdapter } from './email/email.adapter';
import { ConfigModule } from '@nestjs/config';
import {
  IsEmailAlreadyConfirmedConstraint,
  IsEmailAlreadyExistConstraint,
  IsLoginAlreadyExistConstraint,
  isCodeAlreadyConfirmedConstraint,
  isBlogExistConstraint,
  isCommentExistConstraint,
} from './validator';
import { BasicAuthStrategy } from './auth/guards/basic-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { settings } from './jwt/jwt.settings';
import { JwtStrategy } from './auth/guards/bearer-auth.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BloggerBlogsController } from './blogger/blogger.blogs.controller';
import { SABlogsController } from './sa/blogs/sa.blogs.controller';
import { CreateBlogService } from './use-cases/blogs/create-blog-use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { DeleteBlogService } from './use-cases/blogs/delete-blog-by-blogId-use-case';
import { UpdateBlogService } from './use-cases/blogs/update-blog-by-blogId-use-case';
import { CreatePostService } from './use-cases/posts/create-post-use-case';
import { DeletePostService } from './use-cases/posts/delete-post-by-postId-use-case';
import { CreateCommentService } from './use-cases/comments/create-comment-use-case';
import { DeleteCommentService } from './use-cases/comments/delete-comment-by-commentId-use-case';
import { UpdateCommentService } from './use-cases/comments/update -comment-by-commentId-and-userId-use-case';
import { RegistrationUserService } from './use-cases/users/registration-user-use-case';
import { DeleteUserService } from './use-cases/users/delete-user-by-id-use-case';
import { LoginService } from './use-cases/auth/login-use-case';
import { RefreshTokenService } from './use-cases/auth/refresh-token-use-case';
import { PasswordRecoveryService } from './use-cases/auth/password-recovery-use-case';
import { NewPasswordService } from './use-cases/auth/new-password-use-case';
import { RegistrationConfirmationService } from './use-cases/auth/registration-confirmation-use-case';
import { RegistrationEmailResendingService } from './use-cases/auth/registration-email-resending-use-case';
import { DeleteAllDevicesExcludeCurrentService } from './use-cases/devices/delete -all-devices-exclude-current-use-case';
import { LogoutService } from './use-cases/auth/logout-use-case';
import { DeleteDeviceByDeviceIdService } from './use-cases/devices/delete-device-by-deviceId-use-case';
import { BanUserByUserIdService } from './use-cases/users/bun-user-by-userId-use-case';
import { PostUpdateLikeStatusService } from './use-cases/likes/post-update-like-status-use-case';
import { UpdatePostService } from './use-cases/posts/update-post-by-postId-and-blogid-use-case';
import { APP_GUARD } from '@nestjs/core';
import { BanBlogByBlogIdService } from './use-cases/blogs/ban-blog-by-blogId-use-case';
import { BanUserByUserIdByBloggerService } from './use-cases/blogger/users/ban-user-by-userId-by-blogger-use-case';
import { BloggerUsersController } from './blogger/blogger.users.controller';
import { FindBannedUsersByBlogIdService } from './use-cases/blogger/users/find-banned-users-by-blogId-use-case';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsQueryRepository } from './query-repositorys/blogs-query.repository';
import { CommentsQueryRepository } from './query-repositorys/comments-query.repository';
import { UsersQueryRepository } from './query-repositorys/users-query.repository';
import { DevicesQueryRepository } from './query-repositorys/devices-query.repository';
import { PostsQueryRepository } from './query-repositorys/posts-query.repository';
import { CreateUserService } from './use-cases/users/create-user-by-super-admin-use-case';
import { Blogs } from './entities/blogs.entity';
import { Posts } from './entities/posts.entity';
import { TestingRepository } from './testing/testing.repository';
import { Comments } from './entities/comments.entity';
import { Likes } from './entities/likes.entity';
import { CommentUpdateLikeStatusService } from './use-cases/likes/comment-update-like-status-use-case';
import { Devices } from './entities/devices.entity';
import { Users } from './entities/users.entity';
import { QuestionRepository } from './sa/quiz/questions/question.repository';
import { CreateQuestionService } from './use-cases/questions/create-question-use-case';
import { Questions } from './entities/question.entity';
import { QuizQuestionsController } from './sa/quiz/questions/quiz-questions.controller';
import { QuestionsQueryRepository } from './query-repositorys/questions-query.repository';
import { DeleteQuestionService } from './use-cases/questions/delete-question-use-case';
import { UpdateQuestionService } from './use-cases/questions/update-question-use-case';
import { PublishQuestionService } from './use-cases/questions/publish-question-use-case';
import { CreatePairService } from './use-cases/quiz-pair/create-quiz-pair-use-case';
import { CreateQuizGameController } from './quiz/pairs-quiz.controller';
import { QuizPairsRepository } from './quiz/pairs-quiz.repository';
import { QuizPairs } from './entities/quiz-pairs.entity';
import { PairsQuizQueryRepository } from './query-repositorys/pairs-quiz-query.repository';
import { GameProgress } from './entities/game-progress.entity';
import { RefreshTokenBlackList } from './entities/refreshTokenBlackList.entity';

export const useCases = [
  CreateBlogService,
  UpdateBlogService,
  DeleteBlogService,
  CreatePostService,
  DeletePostService,
  CreateCommentService,
  DeleteCommentService,
  UpdateCommentService,
  RegistrationUserService,
  DeleteUserService,
  LoginService,
  RefreshTokenService,
  PasswordRecoveryService,
  NewPasswordService,
  RegistrationConfirmationService,
  RegistrationEmailResendingService,
  LogoutService,
  DeleteAllDevicesExcludeCurrentService,
  DeleteDeviceByDeviceIdService,
  BanUserByUserIdService,
  CommentUpdateLikeStatusService,
  PostUpdateLikeStatusService,
  UpdatePostService,
  BanBlogByBlogIdService,
  BanUserByUserIdByBloggerService,
  FindBannedUsersByBlogIdService,
  CreateUserService,
  CreateQuestionService,
  DeleteQuestionService,
  UpdateQuestionService,
  PublishQuestionService,
  CreatePairService,
];
export const queryRepos = [
  BlogsQueryRepository,
  PostsQueryRepository,
  UsersQueryRepository,
  CommentsQueryRepository,
  DevicesQueryRepository,
  QuestionsQueryRepository,
  PairsQuizQueryRepository,
];
export const repositories = [
  LikesRepository,
  TokensRepository,
  UsersRepository,
  DevicesRepository,
  BlogsRepository,
  CommentsRepository,
  PostsRepository,
  TestingRepository,
  QuestionRepository,
  QuizPairsRepository,
];
export const services = [CustomJwtService, AppService, EmailService];
export const constraints = [
  IsEmailAlreadyExistConstraint,
  IsLoginAlreadyExistConstraint,
  IsEmailAlreadyConfirmedConstraint,
  isCodeAlreadyConfirmedConstraint,
  isBlogExistConstraint,
  isCommentExistConstraint,
];
export const strategies = [BasicAuthStrategy, JwtStrategy];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgres://Dronchik23:LNDFEJKac6Q9@ep-plain-dew-291409.us-east-2.aws.neon.tech/fuckingBD',
      autoLoadEntities: true,
      //logging: true,
      synchronize: true,
      ssl: true,
    }),
    TypeOrmModule.forFeature([
      Users,
      Blogs,
      Posts,
      Comments,
      Likes,
      Devices,
      Questions,
      QuizPairs,
      GameProgress,
      RefreshTokenBlackList,
    ]),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'bonjorim@gmail.com',
          pass: 'onohnespoxxyfvbl',
        },
      },
    }),
    PassportModule,
    JwtModule.register({
      secret: settings.JWT_SECRET, // секретный ключ для подписи токенов
      signOptions: { expiresIn: '7m' }, // время жизни токенов
    }),
    CqrsModule,
  ],
  controllers: [
    AppController,
    TestingController,
    UsersController,
    BlogsController,
    PostsController,
    CommentsController,
    AuthController,
    DevicesController,
    BloggerUsersController,
    BloggerBlogsController,
    SABlogsController,
    QuizQuestionsController,
    CreateQuizGameController,
  ],
  providers: [
    EmailAdapter,
    ...strategies,
    ...constraints,
    ...services,
    ...useCases,
    ...queryRepos,
    ...repositories,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
