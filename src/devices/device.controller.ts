import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  NotFoundException,
  HttpCode,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DevicesService } from './device.service';
import { RefreshTokenGuard } from '../auth/guards/refresh-token.guard';
import { CurrentUserId, JwtPayload } from '../auth/decorators';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(RefreshTokenGuard)
  @Get()
  async getAllDevices(@CurrentUserId() currentUserId) {
    debugger;
    console.log('currentUserId', currentUserId);
    const allDevices = await this.devicesService.findAllDevicesByUserId(
      currentUserId,
    );
    return allDevices;
  }

  @UseGuards(RefreshTokenGuard)
  @Delete('exclude-current')
  @HttpCode(204)
  async deleteAllDevicesExcludeCurrent(
    @CurrentUserId() currentUserId,
    @JwtPayload() jwtPayload,
  ) {
    const isDeleted = await this.devicesService.deleteAllDevicesExcludeCurrent(
      currentUserId,
      jwtPayload.deviceId,
    );
    if (!isDeleted) {
      throw new NotFoundException();
    }
  }

  @UseGuards(RefreshTokenGuard)
  @Delete(':deviceId')
  async deleteDeviceByDeviceId(
    @Param('deviceId') deviceId: string,
    @CurrentUserId() currentUserId,
  ) {
    const device = await this.devicesService.findDeviceByDeviceIdAndDate(
      currentUserId,
    );
    if (!device) {
      throw new NotFoundException();
    }
    // if (userId !== userId) {
    //   return res.sendStatus(403);
    // }
    const isDeleted = await this.devicesService.deleteDeviceByDeviceId(
      deviceId,
    );
    if (!isDeleted) {
      throw new ForbiddenException();
    }
  }
}
