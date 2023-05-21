import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DeviceViewModel } from '../types and models/models';
import { Devices } from '../entities/devices.entity';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Devices)
    private readonly deviceModel: Repository<Devices>,
  ) {
    return;
  }

  async createDevice(
    ip: string,
    title: string,
    lastActiveDate: string,
    deviceId: string,
    userId: string,
  ) {
    const newDevice = Devices.create(
      ip,
      title,
      lastActiveDate,
      deviceId,
      userId,
    );
    const createdDevice = await this.deviceModel.save(newDevice);
    return new DeviceViewModel(createdDevice);
  }

  async deleteAllDevicesExcludeCurrent(userId: string, deviceId: string) {
    await this.dataSource.query(
      `DELETE FROM devices WHERE "userId" = $1 AND "deviceId" != $2;`,
      [userId, deviceId],
    );
  }

  async deleteDeviceByDeviceId(deviceId: string) {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "deviceId" = $1;`,
      [deviceId],
    );
    return result[1];
  }

  async updateLastActiveDateByDevice(
    deviceId: string,
    userId: string,
    newLastActiveDate: string,
  ): Promise<any> {
    const result = await this.dataSource.query(
      `UPDATE devices SET "lastActiveDate" = $1 WHERE "deviceId" = $2 AND "userId" = $3;`,
      [newLastActiveDate, deviceId, userId],
    );
    return result[1];
  }

  async findAndDeleteDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ): Promise<any> {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "deviceId" = $1 AND "userId" = $2 AND "lastActiveDate" = $3 ;`,
      [deviceId, userId, lastActiveDate],
    );
    return result[1];
  }

  async deleteAllDevices() {
    return await this.dataSource.query(`DELETE FROM devices CASCADE;`);
  }
}
