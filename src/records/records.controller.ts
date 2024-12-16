import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  create(@Body() createRecordDto: CreateRecordDto, @Request() req) {
    createRecordDto.userId = req.user.uid;
    return this.recordsService.create(createRecordDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.recordsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const record = await this.recordsService.findOne(id);
    if (req.user.role !== 'admin' && record.userId !== req.user.uid) {
      throw new UnauthorizedException();
    }
    return record;
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string, @Request() req) {
    if (req.user.role !== 'admin' && userId !== req.user.uid) {
      throw new UnauthorizedException();
    }
    return this.recordsService.findByUser(userId);
  }

  @Get('stats/:userId')
  async getStatsByUser(@Param('userId') userId: string, @Request() req) {
    if (req.user.role !== 'admin' && userId !== req.user.uid) {
      throw new UnauthorizedException();
    }
    return this.recordsService.getStatsByUser(userId);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() updateRecordDto: Partial<CreateRecordDto>,
  ) {
    return this.recordsService.update(id, updateRecordDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.recordsService.remove(id);
  }
}
