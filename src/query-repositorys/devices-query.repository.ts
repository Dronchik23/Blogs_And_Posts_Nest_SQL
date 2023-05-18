import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DeviceDBType } from '../types and models/types';
import { DeviceViewModel } from '../types and models/models';

@Injectable()
export class DevicesQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private fromDeviceDBTypeToDeviceView(
    devices: DeviceDBType[],
  ): DeviceViewModel[] {
    return devices.map((device) => ({
      deviceId: device.deviceId,
      ip: device.ip,
      lastActiveDate: device.lastActiveDate,
      title: device.title,
    }));
  }

  async findAllDevicesByUserId(userId: string): Promise<DeviceViewModel[]> {
    const devices: DeviceDBType[] = await this.dataSource.query(
      `SELECT * FROM devices WHERE "userId" = $1`,
      [userId],
    );
    return this.fromDeviceDBTypeToDeviceView(devices);
  }

  async findDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ) {
    const result = await this.dataSource.query(
      `SELECT * FROM devices WHERE "userId" = $1 AND "deviceId" = $2 AND "lastActiveDate" = $3`,
      [userId, deviceId, lastActiveDate],
    );
    return result[0];
  }

  async findDeviceByDeviceId(deviceId: string) {
    const device = await this.dataSource.query(
      `SELECT * FROM devices WHERE "deviceId" = $1 `,
      [deviceId],
    );
    console.log('device', device);
    return device[0];
  }
}
