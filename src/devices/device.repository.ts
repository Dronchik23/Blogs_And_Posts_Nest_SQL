import { injectable } from 'inversify';
import { DeviceType } from '../types and models/types';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { DeviceDocument } from '../types and models/schemas';
import { ObjectId } from 'mongodb';

@injectable()
export class DevicesRepository {
  constructor(
    @InjectModel('Device') private readonly devicesModel: Model<DeviceDocument>,
  ) {}

  async saveNewDevice(device: DeviceType) {
    return this.devicesModel.insertMany(device);
  }

  async rewriteIssueAt(deviceId: string, data: string): Promise<any> {
    return this.devicesModel.updateOne(
      {
        deviceId: new mongoose.Types.ObjectId(deviceId),
      },
      { $set: { lastActiveDate: data } },
    );
  }

  async findAllDevicesByUserId(userId: string): Promise<any> {
    debugger;
    return this.devicesModel
      .find(
        {
          _id: new mongoose.Types.ObjectId(userId),
        },
        { projection: { _id: false, userId: false } },
      )
      .lean();
  }

  async deleteAllDevicesExcludeCurrent(userId: string, deviceId: any) {
    const result = await this.devicesModel.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
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
    return this.devicesModel.findOne({
      deviceId: new mongoose.Types.ObjectId(deviceId),
      userId: new mongoose.Types.ObjectId(userId),
      lastActiveDate: lastActiveDate,
    });
  }

  async updateLastActiveDateByDevice(
    deviceId: string,
    userId: string,
    newLastActiveDate: string,
  ): Promise<any> {
    return this.devicesModel.updateOne(
      {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        userId: new mongoose.Types.ObjectId(userId),
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
      deviceId: new mongoose.Types.ObjectId(deviceId),
      userId: new mongoose.Types.ObjectId(userId),
      lastActiveDate: lastActiveDate,
    });
  }

  async deleteAllDevices() {
    await this.devicesModel.deleteMany({});
  }

  async findDeviceByDeviceIdAndDate(deviceId: string) {
    return this.devicesModel.findOne({
      deviceId: new mongoose.Types.ObjectId(deviceId),
    });
  }
}
