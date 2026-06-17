import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const DEFAULT_SETTINGS: Record<string, string> = {
  storeName: 'PrimePOS',
  storeAddress: 'Jl. Example No. 123',
  storePhone: '021-12345678',
};

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  async onModuleInit() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await this.settingsRepo
        .createQueryBuilder()
        .insert()
        .into(Setting)
        .values({ key, value })
        .orIgnore()
        .execute();
    }
  }

  async findAll(): Promise<Record<string, string>> {
    const rows = await this.settingsRepo.find();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async update(dto: UpdateSettingsDto): Promise<Record<string, string>> {
    const entries = Object.entries(dto).filter(([_, v]) => v !== undefined) as [string, string][];
    for (const [key, value] of entries) {
      await this.settingsRepo
        .createQueryBuilder()
        .insert()
        .into(Setting)
        .values({ key, value })
        .orUpdate(['value'], ['key'])
        .execute();
    }
    return this.findAll();
  }
}
