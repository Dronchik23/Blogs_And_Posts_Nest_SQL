import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
//export class BasicAuthGuard extends AuthGuard('basic') {}
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const credentials = request.headers['authorization']?.split(' ')[1];
    if (credentials!) {
      throw new UnauthorizedException();
    }
    if (credentials === 'YWRtaW46cXdlcnR5') {
      return true;
    }
    return false;
  }
}

@Injectable()
export class LogGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    console.log('LogGuard');
    console.log(request.params);
    console.error(request.params);
    return true;
  }
}
