import { DeviceDBType } from '../types and models/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceDocument } from '../types and models/schemas';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectModel('Device') private readonly devicesModel: Model<DeviceDocument>,
  ) {}

  async createDevice(device: DeviceDBType) {
    return this.devicesModel.create(device);
  }

  async deleteAllDevicesExcludeCurrent(userId: string, deviceId: string) {
    const result = await this.devicesModel.deleteMany({
      userId: userId,
      deviceId: { $ne: deviceId },
    });
    return result.acknowledged;
  }

  async deleteDeviceByDeviceId(deviceId: string) {
    const result = await this.devicesModel.deleteOne({
      deviceId: deviceId,
    });
    return result.deletedCount === 1;
  }

  async updateLastActiveDateByDevice(
    deviceId: string,
    userId: string,
    newLastActiveDate: string,
  ): Promise<any> {
    return this.devicesModel.updateOne(
      {
        deviceId: deviceId,
        userId: userId,
      },
      { $set: { lastActiveDate: newLastActiveDate } },
    );
  }

  async findAndDeleteDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ): Promise<any> {
    return this.devicesModel.deleteOne({
      deviceId: deviceId,
      userId: userId,
      lastActiveDate: lastActiveDate,
    });
  }

  async deleteAllDevices() {
    await this.devicesModel.deleteMany({});
  }
}
