import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IndexService } from '../services/index.service';

@ApiTags('index')
@Controller()
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Get('states')
  @ApiOperation({ summary: 'List all states' })
  findAllStates() {
    return this.indexService.findAllStates();
  }

  @Get('states/:stateId/cities')
  @ApiOperation({ summary: 'List cities for a state' })
  findCitiesByState(@Param('stateId', ParseIntPipe) stateId: number) {
    return this.indexService.findCitiesByState(stateId);
  }
}
