import { Module } from '@nestjs/common'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { PrismaModule } from '../prisma/prisma.module'
import { LoggingModule } from '../logging/logging.module'

@Module({
  imports: [PrismaModule, LoggingModule],
  providers: [AllExceptionsFilter],
  exports: [AllExceptionsFilter],
})
export class CommonModule {}
