import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealthCheck() {
    return {
      message: 'AIRTH Job Queue API is running',
    };
  }
}
