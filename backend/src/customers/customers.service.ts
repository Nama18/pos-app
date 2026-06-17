import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto, PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async findAll(query: PaginationDto & { search?: string }): Promise<PaginationResult<Customer>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { sortBy, sortOrder, search } = query;
    const skip = (page - 1) * limit;

    const where: any[] = [];
    if (search) {
      where.push(
        { name: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
        { phone: Like(`%${search}%`) },
      );
    }

    const [data, total] = await this.customersRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      skip,
      take: limit,
      order: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create(dto);
    return this.customersRepository.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);
    Object.assign(customer, dto);
    return this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findById(id);
    await this.customersRepository.softRemove(customer);
  }

  async addLoyaltyPoints(id: string, points: number): Promise<Customer> {
    if (points <= 0) {
      throw new BadRequestException('Points must be a positive number');
    }
    const customer = await this.findById(id);
    customer.loyaltyPoints += points;
    return this.customersRepository.save(customer);
  }

  async redeemLoyaltyPoints(id: string, points: number): Promise<Customer> {
    if (points <= 0) {
      throw new BadRequestException('Points must be a positive number');
    }
    const customer = await this.findById(id);
    if (customer.loyaltyPoints < points) {
      throw new BadRequestException('Insufficient loyalty points');
    }
    customer.loyaltyPoints -= points;
    return this.customersRepository.save(customer);
  }
}
