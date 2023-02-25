import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DevicesService } from './device.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  //@UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllDevices(@Req() req: Request, @Res() res: Response) {
    const userId = req.user!.id;
    const allDevices = await this.devicesService.findAllDevicesByUserId(userId);
    return res.send(allDevices);
  }

  //@UseGuards(AuthGuard('jwt'))
  @Delete('exclude-current')
  async deleteAllDevicesExcludeCurrent(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const deviceId = req.jwtPayload!.deviceId!;
    const userId = req.jwtPayload!.userId!;
    const isDeleted = await this.devicesService.deleteAllDevicesExcludeCurrent(
      userId,
      deviceId,
    );
    if (isDeleted) {
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  }

  //@UseGuards(AuthGuard('jwt'))
  @Delete(':deviceId')
  async deleteDeviceByDeviceId(
    @Req() req: Request,
    @Res() res: Response,
    @Param('deviceId') deviceId: string,
  ) {
    const userId = req.jwtPayload!.userId!;
    const device = await this.devicesService.findDeviceByDeviceIdAndDate(
      deviceId,
    );
    if (!device) {
      return res.sendStatus(404);
    }
    if (userId !== userId) {
      return res.sendStatus(403);
    }
    const isDeleted = await this.devicesService.deleteDeviceByDeviceId(
      deviceId,
    );
    if (isDeleted) {
      res.sendStatus(204);
    } else {
      res.sendStatus(403);
    }
  }
}
