import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { DeviceViewModel } from '../models/models';
import { Devices } from '../entities/devices.entity';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Devices)
    private readonly deviceModel: Repository<Devices>,
  ) {}

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
    const result = await this.deviceModel.delete({
      deviceId: Not(deviceId),
      userId: userId,
    });
    return result.affected > 0;
  }

  async deleteDeviceByDeviceId(deviceId: string) {
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
    const result = await this.deviceModel.delete({
      deviceId: deviceId,
      userId: userId,
      lastActiveDate: lastActiveDate,
    });
    return result.affected > 0;
  }

  async deleteAllDevices() {
    return await this.deviceModel.delete({});
  }
}
