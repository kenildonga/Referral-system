import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChainService } from '../services/chain.service';
import { CreateChainDto, UpdateChainDto } from '../dto/chain.dto';
import { AllRoleAuthInterceptor } from '../common/interceptors/all-role-auth.interceptor';

@ApiTags('chains')
@Controller('chains')
export class ChainController {
  constructor(private readonly chainService: ChainService) {}

  @Post()
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new chain (Super Admin)' })
  create(@Body() createChainDto: CreateChainDto) {
    return this.chainService.create(createChainDto);
  }

  @Get()
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all chains (Super Admin)' })
  findAll() {
    return this.chainService.findAll();
  }

  @Get(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a chain by ID (Super Admin)' })
  findOne(@Param('id') id: string) {
    return this.chainService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update chain details (Super Admin)' })
  update(@Param('id') id: string, @Body() updateChainDto: UpdateChainDto) {
    return this.chainService.update(id, updateChainDto);
  }

  @Delete(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a chain (Super Admin)' })
  remove(@Param('id') id: string) {
    return this.chainService.remove(id);
  }
}
