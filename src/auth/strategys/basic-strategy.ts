import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
//export class BasicAuthGuard extends AuthGuard('basic') {}
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    //TODO ?
    const creds = request.headers['authorization']?.split(' ')[1];
    if (creds === 'YWRtaW46cXdlcnR5') {
      return true;
    }
    return false;
  }
}
