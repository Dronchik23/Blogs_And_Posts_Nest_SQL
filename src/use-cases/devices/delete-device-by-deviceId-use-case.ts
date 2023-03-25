import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../devices/device.repository';

export class DeleteDeviceByDeviceIdCommand {
  constructor(public deviceId: string) {}
}

@CommandHandler(DeleteDeviceByDeviceIdCommand)
export class DeleteDeviceByDeviceIdService
  implements ICommandHandler<DeleteDeviceByDeviceIdCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: DeleteDeviceByDeviceIdCommand) {
    return await this.devicesRepository.deleteDeviceByDeviceId(
      command.deviceId,
    );
  }
}
