import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { settings } from '../jwt/jwt.settings';
import { JwtPayload } from 'jsonwebtoken';
import { BearerJwtPayloadType } from '../types and models/types';

export const CurrentUserId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user.id;
  },
);
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentUserIdFromToken = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, settings.JWT_SECRET) as {
      userId: string;
    };
    return decoded.userId;
  },
);
