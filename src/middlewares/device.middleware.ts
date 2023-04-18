import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DevicesQueryRepository } from '../query-repositorys/devices-query.repository';
import mongoose from 'mongoose';

@Injectable()
export class DeviceMiddleware {
  constructor(
    private readonly devicesQueryRepository: DevicesQueryRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const device =
      await this.devicesQueryRepository.findDeviceByDeviceIdAndDate(
        req.params.deviceId,
      );

    if (!device) {
      return res.sendStatus(404);
    }

    if (device!.userId !== new mongoose.Types.ObjectId(req.userId))
      return res.sendStatus(403);

    next();
  }
}
