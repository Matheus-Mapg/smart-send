import { Module } from '@nestjs/common';
import { StartSending } from './start-sending/start-sending';
import { ConnectionService } from './connection/connection.service';
import { ShippingContent } from './shipping-content/shipping-content';

@Module({
  providers: [ConnectionService, StartSending, ShippingContent]
})
export class AppModule {
}
