import { Module } from '@nestjs/common';
import { GoogleService } from './google/google.service';
import { OutlookService } from './outlook/outlook.service';

@Module({
  providers: [GoogleService, OutlookService]
})
export class CalendarsModule {}
