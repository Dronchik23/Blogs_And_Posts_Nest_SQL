import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { settings } from '../jwt/jwt.settings';

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
    const auth = request.headers.authorization;
    if (!auth) {
      return null;
    }
    const [authType, token] = auth.split(' ');
    if (authType !== 'Bearer' || !token) {
      return null;
    }
    try {
      const decoded: any = jwt.decode(token);
      return decoded.userId;
    } catch {
      return null;
    }
  },
);
