import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DevicesQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }
  async findAllDevicesByUserId(userId: string): Promise<any> {
    return await this.dataSource.query(
      `SELECT * FROM devices WHERE "userId" = $1`,
      [userId],
    );
  }

  async findDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ) {
    return await this.dataSource.query(
      `SELECT * FROM devices WHERE "userId" = $1, "deviceId" = $2, "lastActiveDate" = $3`,
      [userId, deviceId, lastActiveDate],
    );
  }

  async findDeviceByDeviceIdAndDate(deviceId: string) {
    return await this.dataSource.query(
      `SELECT * FROM devices WHERE "deviceId" = $1 `,
      [deviceId],
    );
  }
}
