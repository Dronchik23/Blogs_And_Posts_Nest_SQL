import { injectable } from 'inversify';
import { DeviceDBType } from '../types and models/types';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { DeviceDocument } from '../types and models/schemas';
import { ObjectId } from 'mongodb';

@injectable()
export class DevicesRepository {
  constructor(
    @InjectModel('Device') private readonly devicesModel: Model<DeviceDocument>,
  ) {}

  async saveNewDevice(device: DeviceDBType) {
    return this.devicesModel.create(device);
  }

  async rewriteIssueAt(deviceId: string, data: string): Promise<any> {
    return this.devicesModel.updateOne(
      {
        deviceId: new ObjectId(deviceId),
      },
      { $set: { lastActiveDate: data } },
    );
  }

  async findAllDevicesByUserId(userId: string): Promise<any> {
    return this.devicesModel
      .find(
        {
          userId: userId,
        },
        { projection: { _id: false, userId: false } },
      )
      .lean();
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
      deviceId: new mongoose.Types.ObjectId(deviceId),
    });
    return result.deletedCount === 1;
  }

  async findDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ) {
    return await this.devicesModel
      .findOne({
        deviceId: deviceId,
        userId: userId,
        lastActiveDate: lastActiveDate,
      })
      .exec();
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

  async findDeviceByDeviceIdAndDate(deviceId: string) {
    return this.devicesModel.findOne({
      deviceId: deviceId,
    });
  }
}
