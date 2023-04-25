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
    const query = `
   INSERT INTO public.devices(
  ip,
  title,
  "lastActiveDate",
  "deviceId",
  "userId",
) 
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
) 
RETURNING *
  `;
    const values = [ip, title, lastActiveDate, deviceId, userId];

    return await this.dataSource.query(query, values);
  }

  async deleteAllDevicesExcludeCurrent(userId: string, deviceId: string) {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE userId = ${userId}, deviceId = ${deviceId};`,
    );
    return result.acknowledged;
  }

  async deleteDeviceByDeviceId(deviceId: string) {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE deviceId = ${deviceId};`,
    );
    return result.affectedRows > 0;
  }

  async updateLastActiveDateByDevice(
    deviceId: string,
    userId: string,
    newLastActiveDate: string,
  ): Promise<any> {
    const result = await this.dataSource.query(
      `UPDATE devices SET lastActiveDate = ${newLastActiveDate}, WHERE deviceId = ${deviceId}, userId = ${userId};`,
    );
    return result.affectedRows > 0;
  }

  async findAndDeleteDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ): Promise<any> {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE deviceId = ${deviceId}, userId = ${userId}, lastActiveDate = ${lastActiveDate} ;`,
    );
    return result.affectedRows > 0;
  }

  async deleteAllDevices() {
    return await this.dataSource.query(`DELETE FROM devices;`);
  }
}
