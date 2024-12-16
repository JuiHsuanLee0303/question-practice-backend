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
  BadRequestException,
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
  async create(@Body() createRecordDto: CreateRecordDto, @Request() req) {
    try {
      console.log('User from request:', req.user);

      if (!req.user || !req.user.userId) {
        throw new UnauthorizedException('User not authenticated properly');
      }

      createRecordDto.userId = req.user.userId;
      console.log('Create record DTO:', createRecordDto);

      return await this.recordsService.create(createRecordDto);
    } catch (error) {
      console.error('Error in create record controller:', error);
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create record');
    }
  }

  @Get()
  @Roles('admin')
  async findAll() {
    return this.recordsService.findAll();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string, @Request() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (req.user.role !== 'admin' && userId !== req.user.userId) {
        throw new UnauthorizedException(
          'Not authorized to access these records',
        );
      }

      return await this.recordsService.findByUser(userId);
    } catch (error) {
      console.error('Error in findByUser:', error);
      throw error;
    }
  }

  @Get('stats/:userId')
  async getStatsByUser(@Param('userId') userId: string, @Request() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (req.user.role !== 'admin' && userId !== req.user.userId) {
        throw new UnauthorizedException('Not authorized to access these stats');
      }

      return await this.recordsService.getStatsByUser(userId);
    } catch (error) {
      console.error('Error in getStatsByUser:', error);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const record = await this.recordsService.findOne(id);

      if (req.user.role !== 'admin' && record.userId !== req.user.userId) {
        throw new UnauthorizedException('Not authorized to access this record');
      }

      return record;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error;
    }
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: Partial<CreateRecordDto>,
  ) {
    try {
      return await this.recordsService.update(id, updateRecordDto);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    try {
      return await this.recordsService.remove(id);
    } catch (error) {
      console.error('Error in remove:', error);
      throw error;
    }
  }
}
