import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';

class ProbeDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

// Registered only in tests, never imported by AppModule.
@Controller('test-probe')
export class ProbeController {
  @Get('exception')
  fail(): never {
    throw new Error('sensitive-test-message');
  }

  @Post('validation')
  validate(@Body() body: ProbeDto): ProbeDto {
    return body;
  }
}
