import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './sa/users/users.controller';
import { UsersRepository } from './sa/users/users-repository.service';
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
import { JwtService } from './jwt/jwt.service';
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
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import {
  IsEmailAlreadyConfirmedConstraint,
  IsEmailAlreadyExistConstraint,
  IsLoginAlreadyExistConstraint,
  isCodeAlreadyConfirmedConstraint,
  isBlogExistConstraint,
  isCommentExistConstraint,
} from './validator';
import { useContainer } from 'class-validator';
import { Container } from 'typedi';
import { BasicAuthStrategy } from './auth/guards/basic-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { settings } from './jwt/jwt.settings';
import { JwtStrategy } from './auth/guards/bearer-auth.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { QueryParamsMiddleware } from './middlewares/query-params-parsing.middleware';
import { BloggerBlogsController } from './blogger/blogger.controller';
import { SABlogsController } from './sa/blogs/sa.blogs.controller';
import { CreateBlogService } from './use-cases/create-blog-use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { BlogsQueryRepository } from './query-repositorys/blogs-query.repository';
import { PostsQueryRepository } from './query-repositorys/posts-query.repository';
import { UsersQueryRepository } from './query-repositorys/users-query.repository';
import { CommentsQueryRepository } from './query-repositorys/comments-query.repository';
import { DevicesQueryRepository } from './query-repositorys/devices-query.repository';

export const useCases = [CreateBlogService];
export const queryRepos = [
  BlogsQueryRepository,
  PostsQueryRepository,
  UsersQueryRepository,
  CommentsQueryRepository,
  DevicesQueryRepository,
];

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://solikamsk:solikamsk@cluster0.uu9g6jj.mongodb.net/?retryWrites=true&w=majority',
    ),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
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
    MongooseModule.forRoot('mongodb://localhost/nest'),
    ConfigModule.forRoot({ isGlobal: true }),
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
    TestingController,
    AppController,
    UsersController,
    BlogsController,
    PostsController,
    CommentsController,
    AuthController,
    DevicesController,
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
    JwtService,
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
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(QueryParamsMiddleware)
      .forRoutes(
        'blogs',
        'posts',
        'comments',
        'sa/users',
        'security/devices',
        'blogger/blogs',
        'sa/blogs',
      );
  }
}

useContainer(Container);
