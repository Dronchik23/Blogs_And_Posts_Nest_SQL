import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { RefreshTokenGuard } from '../auth/guards/refresh-token.guard';
import { CurrentUserId, JwtPayload } from '../auth/decorators';
import { SkipThrottle } from '@nestjs/throttler';
import { DevicesQueryRepository } from '../query-repositorys/devices-query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteAllDevicesExcludeCurrentCommand } from '../use-cases/devices/delete -all-devices-exclude-current-use-case';
import { DeleteDeviceByDeviceIdCommand } from '../use-cases/devices/delete-device-by-deviceId-use-case';

@SkipThrottle()
@Controller({ path: 'security/devices', scope: Scope.REQUEST })
export class DevicesController {
  constructor(
    private readonly devicesQueryService: DevicesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(RefreshTokenGuard)
  @Get()
  async getAllDevices(@CurrentUserId() currentUserId) {
    return await this.devicesQueryService.findAllDevicesByUserId(currentUserId);
  }

  @UseGuards(RefreshTokenGuard)
  @Delete()
  @HttpCode(204)
  async deleteAllDevicesExcludeCurrent(@JwtPayload() jwtPayload) {
    const isDeleted = await this.commandBus.execute(
      new DeleteAllDevicesExcludeCurrentCommand(
        jwtPayload.userId,
        jwtPayload.deviceId,
      ),
    );
    if (!isDeleted) {
      throw new NotFoundException();
    }
  }

  @UseGuards(RefreshTokenGuard)
  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDeviceByDeviceId(
    @Param('deviceId') deviceId: string,
    @CurrentUserId() currentUserId,
  ) {
    const device: any =
      await this.devicesQueryService.findDeviceByDeviceIdAndDate(deviceId);
    if (!device) {
      throw new NotFoundException();
    }
    if (currentUserId !== device.userId) {
      throw new ForbiddenException();
    }
    const isDeleted = await this.commandBus.execute(
      new DeleteDeviceByDeviceIdCommand(deviceId),
    );
    if (!isDeleted) {
      throw new ForbiddenException();
    }
  }
}
