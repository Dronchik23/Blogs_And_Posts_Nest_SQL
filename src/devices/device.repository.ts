import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DeviceViewModel } from '../models/models';
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
    debugger;
    const result = await this.deviceModel.delete({ deviceId: deviceId });

    return result.affected > 0;
  }

  async updateLastActiveDateByDevice(
    deviceId: string,
    userId: string,
    newLastActiveDate: string,
  ): Promise<boolean> {
    const result = await this.deviceModel.update(
      { deviceId: deviceId, userId: userId },
      { lastActiveDate: newLastActiveDate },
    );

    return result.affected > 0;
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
