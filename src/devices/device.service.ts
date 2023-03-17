import { injectable } from 'inversify';
import { DeviceDBType } from '../types and models/types';
import { DevicesRepository } from './device.repository';
import { JwtService } from '../jwt/jwt.service';
import mongoose from 'mongoose';

@injectable()
export class DevicesService {
  constructor(
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
    const device = new DeviceDBType(
      ip,
      title,
      lastActiveDate,
      deviceId,
      userId,
    );
    return this.devicesRepository.saveNewDevice(device);
  }

  async findAllDevicesByUserId(userId: string): Promise<any> {
    debugger;
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

    const foundDevice =
      this.devicesRepository.findAndDeleteDeviceByDeviceIdUserIdAndDate(
        deviceId,
        userId,
        lastActiveDate,
      );
    return foundDevice;
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
