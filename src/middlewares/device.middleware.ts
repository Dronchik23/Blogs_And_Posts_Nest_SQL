import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DevicesService } from '../devices/device.service';
import { JwtService } from '../jwt/jwt.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class DeviceMiddleware {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const device = await this.devicesService.findDeviceByDeviceIdAndDate(
      req.params.deviceId,
    );

    if (!device) {
      return res.sendStatus(404);
    }

    if (device!.userId !== new ObjectId(req.userId)) return res.sendStatus(403);

    // const decodedToken = this.jwtService.decodeToken(req.headers.authorization);
    // if (device.userId !== decodedToken.id) {
    //   return res.sendStatus(403);
    // }

    next();
  }
}
