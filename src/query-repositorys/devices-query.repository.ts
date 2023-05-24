import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DeviceDBType } from '../types/types';
import { DeviceViewModel } from '../models/models';
import { Devices } from '../entities/devices.entity';

@Injectable()
export class DevicesQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Devices)
    private readonly deviceModel: Repository<Devices>,
  ) {}

  async findAllDevicesByUserId(userId: string): Promise<DeviceViewModel[]> {
    const results: Devices[] = await this.deviceModel.find({
      where: {
        userId: userId,
      },
    });

    const devices: DeviceViewModel[] = results.map(
      (result) => new DeviceViewModel(result),
    );
    return devices;
  }

  async findDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ) {
    const result: DeviceDBType = await this.deviceModel.findOneBy({
      deviceId: deviceId,
      userId: userId,
      lastActiveDate: lastActiveDate,
    });

    const device = new DeviceDBType(
      result.ip,
      result.title,
      result.lastActiveDate,
      result.deviceId,
      result.userId,
    );
    return device;
  }

  async findDeviceByDeviceId(deviceId) {
    const result: DeviceDBType = await this.deviceModel.findOneBy({
      deviceId: deviceId,
    });

    const device = new DeviceDBType(
      result.ip,
      result.title,
      result.lastActiveDate,
      result.deviceId,
      result.userId,
    );
    return device;
  }
}
