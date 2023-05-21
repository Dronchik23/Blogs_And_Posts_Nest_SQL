import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../devices/device.repository';
import { DevicesQueryRepository } from '../../query-repositorys/devices-query.repository';

export class DeleteAllDevicesExcludeCurrentCommand {
  constructor(public userId: string, public deviceId: string) {}
}

@CommandHandler(DeleteAllDevicesExcludeCurrentCommand)
export class DeleteAllDevicesExcludeCurrentService
  implements ICommandHandler<DeleteAllDevicesExcludeCurrentCommand>
{
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly devicesQueryRepository: DevicesQueryRepository,
  ) {}

  async execute(command: DeleteAllDevicesExcludeCurrentCommand): Promise<any> {
    await this.devicesRepository.deleteAllDevicesExcludeCurrent(
      command.userId,
      command.deviceId,
    );

    const device: any = await this.devicesQueryRepository.findDeviceByDeviceId(
      command.deviceId,
    );
    if (device) return true;
  }
}
