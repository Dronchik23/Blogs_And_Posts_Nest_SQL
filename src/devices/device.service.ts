import { injectable } from 'inversify';
import { DeviceType } from '../types and models/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DevicesRepository } from './device.repository';
import { JwtService } from '../jwt/jwt.service';

@injectable()
export class DevicesService {
  constructor(
    @InjectModel('Device') private readonly devicesModel: Model<DeviceType>,
    protected devicesRepository: DevicesRepository,
    protected jwtService: JwtService,
  ) {}

  async createDevice(
    ip: string,
    title: string,
    lastActiveDate: string,
    deviceId: string,
    userId: string,
  ) {
    const device = new DeviceType(ip, title, lastActiveDate, deviceId, userId);
    return this.devicesRepository.saveNewDevice(device);
  }

  async findAllDevicesByUserId(userId: string): Promise<any> {
    return await this.devicesRepository.findAllDevicesByUserId(userId);
  }

  async deleteAllDevicesExcludeCurrent(userId: string, currentDevice: string) {
    return await this.devicesRepository.deleteAllDevicesExcludeCurrent(
      userId,
      currentDevice,
    );
  }

  async deleteDeviceByDeviceId(deviceId: string) {
    return await this.devicesRepository.deleteDeviceByDeviceId(deviceId);
  }

  async findAndDeleteDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ) {
    const device =
      await this.devicesRepository.findDeviceByDeviceIdUserIdAndDate(
        deviceId,
        userId,
        lastActiveDate,
      );
    if (!device) return null;
    return this.devicesRepository.findAndDeleteDeviceByDeviceIdUserIdAndDate(
      deviceId,
      userId,
      lastActiveDate,
    );
  }

  async findDeviceByDeviceIdUserIdAndDate(
    deviceId: string,
    userId: string,
    lastActiveDate: string,
  ) {
    return this.devicesRepository.findDeviceByDeviceIdUserIdAndDate(
      deviceId,
      userId,
      lastActiveDate,
    );
  }

  async findDeviceByDeviceIdAndDate(deviceId: string) {
    return this.devicesRepository.findDeviceByDeviceIdAndDate(deviceId);
  }

  async updateLastActiveDateByDevice(
    deviceId: string,
    userId: string,
    newLastActiveDate: string,
  ) {
    return this.devicesRepository.updateLastActiveDateByDevice(
      deviceId,
      userId,
      newLastActiveDate,
    );
  }
}
