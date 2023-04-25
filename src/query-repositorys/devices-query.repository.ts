import { Injectable } from '@nestjs/common';

@Injectable()
export class DevicesQueryRepository {
  constructor() {
    return;
  }
  async findAllDevicesByUserId(userId: string): Promise<any> {
    return;
  }

  async findDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ) {
    return;
  }

  async findAndDeleteDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ): Promise<any> {
    return;
  }

  async findDeviceByDeviceIdAndDate(deviceId: string) {
    return;
  }
}
