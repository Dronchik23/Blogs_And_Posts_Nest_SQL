import { Module } from '@nestjs/common';
import { UsersController } from './sa/users/users.controller';
import { UsersRepository } from './sa/users/users-repository';
import { UsersService } from './sa/users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email/email.service';
import { BlogsController } from './blogs/blog.controller';
import { BlogsRepository } from './blogs/blog.repository';
import { BlogsService } from './blogs/blog.service';
import { PostsService } from './posts/post.service';
import { PostsRepository } from './posts/post.repository';
import { PostsController } from './posts/post.controller';
import { CommentsService } from './comments/comment.service';
import { CommentsRepository } from './comments/comment.repository';
import { CommentsController } from './comments/comment.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { DevicesService } from './devices/device.service';
import { DevicesRepository } from './devices/device.repository';
import { DevicesController } from './devices/device.controller';
import { LikesService } from './likes/like.service';
import { LikesRepository } from './likes/like.repository';
import { TokensRepository } from './tokens/tokens.repository';
import { CustomJwtService } from './jwt/jwt.service';
import {
  BlogSchema,
  CommentSchema,
  DeviceSchema,
  LikeSchema,
  PostSchema,
  TokenBlackListSchema,
  UserSchema,
} from './types and models/schemas';
import { TestingController } from './testing/testing.controller';
import { EmailAdapter } from './email/email.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { BlogsQueryRepository } from './query-repositorys/blogs-query.repository';
import { PostsQueryRepository } from './query-repositorys/posts-query.repository';
import { UsersQueryRepository } from './query-repositorys/users-query.repository';
import { CommentsQueryRepository } from './query-repositorys/comments-query.repository';
import { DevicesQueryRepository } from './query-repositorys/devices-query.repository';
import { DeleteBlogService } from './use-cases/blogs/delete-blog-by-blogId-use-case';
import { UpdateBlogService } from './use-cases/blogs/update-blog-by-blogId-use-case';
import { CreatePostService } from './use-cases/posts/create-post-use-case';
import { DeletePostService } from './use-cases/posts/delete-post-by-postId-use-case';
import { CreateCommentService } from './use-cases/comments/create-comment-use-case';
import { DeleteCommentService } from './use-cases/comments/delete-comment-by-commentId-use-case';
import { UpdateCommentService } from './use-cases/comments/update -comment-by-commentId-and-userId-use-case';
import { CreateUserService } from './use-cases/users/create-user-use-case';
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
import { UpdateLikeStatusService } from './use-cases/likes/update-like-status-use-case';
import { UpdatePostService } from './use-cases/posts/update-post-by-postId-and-blogid-use-case';
import { APP_GUARD } from '@nestjs/core';
import { BanBlogByBlogIdService } from './use-cases/blogs/ban-blog-by-blogId-use-case';
import { BanUserByUserIdByBloggerService } from './use-cases/blogger/users/ban-user-by-userId-by-blogger-use-case';
import { BloggerUsersController } from './blogger/blogger.users.controller';
import { FindBannedUsersByBlogIdService } from './use-cases/blogger/users/find-banned-users-by-blogId-use-case';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { MongooseConfigService } from './connect-config';

export const useCases = [
  CreateBlogService,
  UpdateBlogService,
  DeleteBlogService,
  CreatePostService,
  DeletePostService,
  CreateCommentService,
  DeleteCommentService,
  UpdateCommentService,
  CreateUserService,
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
  UpdateLikeStatusService,
  UpdatePostService,
  BanBlogByBlogIdService,
  BanUserByUserIdByBloggerService,
  FindBannedUsersByBlogIdService,
];
export const queryRepos = [
  BlogsQueryRepository,
  PostsQueryRepository,
  UsersQueryRepository,
  CommentsQueryRepository,
  DevicesQueryRepository,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongooseConfigService,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      ttl: 1000000,
      limit: 5000000,
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Blog', schema: BlogSchema },
      { name: 'Post', schema: PostSchema },
      { name: 'Comment', schema: CommentSchema },
      { name: 'Device', schema: DeviceSchema },
      { name: 'Like', schema: LikeSchema },
      { name: 'TokenBlackList', schema: TokenBlackListSchema },
    ]),

    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'bonjorim@gmail.com',
          pass: 'nronmxaommldkjpc',
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
  ],
  providers: [
    AppService,
    UsersService,
    UsersRepository,
    EmailService,
    EmailAdapter,
    BlogsService,
    BlogsRepository,
    PostsService,
    PostsRepository,
    CommentsService,
    CommentsRepository,
    AuthService,
    DevicesService,
    DevicesRepository,
    LikesService,
    LikesRepository,
    TokensRepository,
    CustomJwtService,
    IsEmailAlreadyExistConstraint,
    IsLoginAlreadyExistConstraint,
    IsEmailAlreadyConfirmedConstraint,
    isCodeAlreadyConfirmedConstraint,
    isBlogExistConstraint,
    isCommentExistConstraint,
    BasicAuthStrategy,
    JwtStrategy,
    ...useCases,
    ...queryRepos,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
