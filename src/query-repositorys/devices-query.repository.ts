import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceDocument } from '../types and models/schemas';

@injectable()
export class DevicesQueryRepository {
  constructor(
    @InjectModel('Device') private readonly devicesModel: Model<DeviceDocument>,
  ) {}
  async findAllDevicesByUserId(userId: string): Promise<any> {
    return this.devicesModel
      .find({
        userId: userId,
      })
      .select('-_id -userId -__v')
      .lean();
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

  async findDeviceByDeviceIdAndDate(deviceId: string) {
    return this.devicesModel.findOne({
      deviceId: deviceId,
    });
  }
}
