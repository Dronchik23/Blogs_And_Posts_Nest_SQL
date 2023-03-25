import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../devices/device.repository';
import { DeviceDBType } from '../../types and models/types';
import { DevicesQueryRepository } from '../../query-repositorys/devices-query.repository';

export class LogoutCommand {
  constructor(
    public deviceId: string,
    public userId: string,
    public lastActiveDate: string,
  ) {}
}

@CommandHandler(LogoutCommand)
export class LogoutService implements ICommandHandler<LogoutCommand> {
  constructor(
    private readonly devicesQueryRepository: DevicesQueryRepository,
    private readonly devicesRepository: DevicesRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<DeviceDBType> {
    const device =
      await this.devicesQueryRepository.findDeviceByDeviceIdUserIdAndDate(
        command.deviceId,
        command.userId,
        command.lastActiveDate,
      );
    if (!device) return null;

    const foundDevice =
      this.devicesRepository.findAndDeleteDeviceByDeviceIdUserIdAndDate(
        command.deviceId,
        command.userId,
        command.lastActiveDate,
      );
    return foundDevice;
  }
}
