import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../devices/device.repository';

export class DeleteAllDevicesExcludeCurrentCommand {
  constructor(public userId: string, public deviceId: string) {}
}

@CommandHandler(DeleteAllDevicesExcludeCurrentCommand)
export class DeleteAllDevicesExcludeCurrentService
  implements ICommandHandler<DeleteAllDevicesExcludeCurrentCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: DeleteAllDevicesExcludeCurrentCommand): Promise<any> {
    return await this.devicesRepository.deleteAllDevicesExcludeCurrent(
      command.userId,
      command.deviceId,
    );
  }
}
