import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DevicesRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

  async createDevice(
    ip: string,
    title: string,
    lastActiveDate: string,
    deviceId: string,
    userId: string,
  ) {
    return await this.dataSource.query(
      `INSERT INTO devices(
      ip,
      title,
      "lastActiveDate",
      "deviceId",
      "userId"
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )`,
      [ip, title, lastActiveDate, deviceId, userId],
    );
  }

  async deleteAllDevicesExcludeCurrent(userId: string, deviceId: string) {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "userId" = $1, "deviceId" = $2;`,
      [userId, deviceId],
    );
    return result.acknowledged;
  }

  async deleteDeviceByDeviceId(deviceId: string) {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "deviceId" = $1;`,
      [deviceId],
    );
    return result.affectedRows > 0;
  }

  async updateLastActiveDateByDevice(
    deviceId: string,
    userId: string,
    newLastActiveDate: string,
  ): Promise<any> {
    const result = await this.dataSource.query(
      `UPDATE devices SET "lastActiveDate" = $1, WHERE "deviceId" = $2, "userId" = $3;`,
      [newLastActiveDate, deviceId, userId],
    );
    return result.affectedRows > 0;
  }

  async findAndDeleteDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ): Promise<any> {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "deviceId" = ${deviceId}, "userId" = ${userId}, "lastActiveDate" = ${lastActiveDate} ;`,
      [deviceId, userId, lastActiveDate],
    );
    return result.affectedRows > 0;
  }

  async deleteAllDevices() {
    return await this.dataSource.query(`DELETE FROM devices;`);
  }
}
