import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.enum';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  Transaction,
  DiscountType,
  PaymentMethod,
  PaymentStatus,
} from '../transactions/entities/transaction.entity';
import { TransactionItem } from '../transactions/entities/transaction-item.entity';
import {
  InventoryLog,
  InventoryType,
} from '../inventory/entities/inventory.entity';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatInvoiceNo(date: Date, seq: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `INV-${y}${m}${d}-${String(seq).padStart(4, '0')}`;
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    @InjectRepository(InventoryLog)
    private readonly inventoryLogRepo: Repository<InventoryLog>,
  ) {}

  async onModuleInit(): Promise<void> {
    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      this.logger.log(
        `Database already has ${userCount} users — skipping seed.`,
      );
      return;
    }

    this.logger.log('Seeding demo data...');
    await this.seed();
    this.logger.log('Seeding complete!');
  }

  private async seed(): Promise<void> {
    this.logger.log('Creating users...');
    const hash = (password: string) => bcrypt.hashSync(password, 10);
    const users = await this.userRepo.save([
      this.userRepo.create({
        name: 'Admin User',
        email: 'admin@pos.com',
        passwordHash: hash('admin123'),
        role: Role.ADMIN,
        isActive: true,
      }),
      this.userRepo.create({
        name: 'Cashier One',
        email: 'cashier1@pos.com',
        passwordHash: hash('cashier123'),
        role: Role.CASHIER,
        isActive: true,
      }),
      this.userRepo.create({
        name: 'Cashier Two',
        email: 'cashier2@pos.com',
        passwordHash: hash('cashier123'),
        role: Role.CASHIER,
        isActive: true,
      }),
      this.userRepo.create({
        name: 'Warehouse Staff',
        email: 'warehouse@pos.com',
        passwordHash: hash('warehouse123'),
        role: Role.WAREHOUSE,
        isActive: true,
      }),
    ]);
    this.logger.log(`  Created ${users.length} users.`);

    this.logger.log('Creating categories...');
    const categoryData = [
      { name: 'Food & Beverages', description: 'Makanan dan minuman kemasan' },
      { name: 'Electronics', description: 'Aksesoris dan perangkat elektronik' },
      { name: 'Clothing', description: 'Pakaian dan fashion' },
      { name: 'Health & Beauty', description: 'Produk kesehatan dan kecantikan' },
      { name: 'Home & Living', description: 'Perlengkapan rumah tangga' },
      { name: 'Stationery', description: 'Alat tulis dan perlengkapan kantor' },
    ];
    const categories = await this.categoryRepo.save(
      categoryData.map((c) =>
        this.categoryRepo.create({
          name: c.name,
          slug: slugify(c.name),
          description: c.description,
          isActive: true,
        }),
      ),
    );
    const catMap: Record<string, Category> = {};
    for (const cat of categories) {
      catMap[slugify(cat.name)] = cat;
    }
    this.logger.log(`  Created ${categories.length} categories.`);

    this.logger.log('Creating products...');
    const productData = [
      {
        name: 'Indomie Goreng Original',
        sku: 'FNB-001',
        barcode: '8991002111111',
        slug: 'indomie-goreng-original',
        description: 'Indomie Goreng Original 85g',
        purchasePrice: 2800,
        sellingPrice: 3500,
        stock: 200,
        minStock: 20,
        categorySlug: 'food-and-beverages',
      },
      {
        name: 'Aqua Botol 600ml',
        sku: 'FNB-002',
        barcode: '8991002111122',
        slug: 'aqua-botol-600ml',
        description: 'Air mineral Aqua botol 600ml',
        purchasePrice: 2200,
        sellingPrice: 3000,
        stock: 150,
        minStock: 30,
        categorySlug: 'food-and-beverages',
      },
      {
        name: 'Coca Cola Kaleng 330ml',
        sku: 'FNB-003',
        barcode: '8991002111133',
        slug: 'coca-cola-kaleng-330ml',
        description: 'Coca Cola kaleng 330ml',
        purchasePrice: 5500,
        sellingPrice: 7000,
        stock: 80,
        minStock: 15,
        categorySlug: 'food-and-beverages',
      },
      {
        name: 'Chitato Sapi Panggang 68g',
        sku: 'FNB-004',
        barcode: '8991002111144',
        slug: 'chitato-sapi-panggang-68g',
        description: 'Chitato rasa Sapi Panggang 68g',
        purchasePrice: 8500,
        sellingPrice: 10500,
        stock: 60,
        minStock: 10,
        categorySlug: 'food-and-beverages',
      },
      {
        name: 'Nescafe Classic Sachet',
        sku: 'FNB-005',
        barcode: '8991002111155',
        slug: 'nescafe-classic-sachet',
        description: 'Nescafe Classic kopi sachet',
        purchasePrice: 1800,
        sellingPrice: 2500,
        stock: 300,
        minStock: 50,
        categorySlug: 'food-and-beverages',
      },
      {
        name: 'Kabel USB Type-C 1m',
        sku: 'ELE-001',
        barcode: '8991002111166',
        slug: 'kabel-usb-type-c-1m',
        description: 'Kabel USB Type-C panjang 1 meter',
        purchasePrice: 15000,
        sellingPrice: 25000,
        stock: 45,
        minStock: 5,
        categorySlug: 'electronics',
      },
      {
        name: 'Mouse Wireless Logitech',
        sku: 'ELE-002',
        barcode: '8991002111177',
        slug: 'mouse-wireless-logitech',
        description: 'Mouse wireless Logitech M185',
        purchasePrice: 65000,
        sellingPrice: 85000,
        stock: 20,
        minStock: 5,
        categorySlug: 'electronics',
      },
      {
        name: 'Headset Bluetooth Sony',
        sku: 'ELE-003',
        barcode: '8991002111188',
        slug: 'headset-bluetooth-sony',
        description: 'Headset bluetooth Sony WH-1000XM5',
        purchasePrice: 300000,
        sellingPrice: 350000,
        stock: 5,
        minStock: 2,
        categorySlug: 'electronics',
      },
      {
        name: 'Power Bank 10000mAh',
        sku: 'ELE-004',
        barcode: '8991002111199',
        slug: 'power-bank-10000mah',
        description: 'Power bank kapasitas 10000mAh',
        purchasePrice: 110000,
        sellingPrice: 150000,
        stock: 15,
        minStock: 3,
        categorySlug: 'electronics',
      },
      {
        name: 'Kaos Polos Hitam',
        sku: 'CLT-001',
        barcode: '8991002111200',
        slug: 'kaos-polos-hitam',
        description: 'Kaos polos warna hitam dewasa',
        purchasePrice: 30000,
        sellingPrice: 45000,
        stock: 50,
        minStock: 10,
        categorySlug: 'clothing',
      },
      {
        name: 'Kemeja Flanel Pria',
        sku: 'CLT-002',
        barcode: '8991002111211',
        slug: 'kemeja-flanel-pria',
        description: 'Kemeja flanel kotak-kotak pria',
        purchasePrice: 85000,
        sellingPrice: 120000,
        stock: 25,
        minStock: 5,
        categorySlug: 'clothing',
      },
      {
        name: 'Celana Jeans Wanita',
        sku: 'CLT-003',
        barcode: '8991002111222',
        slug: 'celana-jeans-wanita',
        description: 'Celana jeans wanita slim fit',
        purchasePrice: 130000,
        sellingPrice: 175000,
        stock: 12,
        minStock: 3,
        categorySlug: 'clothing',
      },
      {
        name: 'Pepsodent Pasta Gigi 75g',
        sku: 'HNB-001',
        barcode: '8991002111233',
        slug: 'pepsodent-pasta-gigi-75g',
        description: 'Pasta gigi Pepsodent 75g',
        purchasePrice: 11000,
        sellingPrice: 15000,
        stock: 100,
        minStock: 20,
        categorySlug: 'health-and-beauty',
      },
      {
        name: 'Lifebuoy Sabun Cair 250ml',
        sku: 'HNB-002',
        barcode: '8991002111244',
        slug: 'lifebuoy-sabun-cair-250ml',
        description: 'Sabun cair Lifebuoy 250ml',
        purchasePrice: 28000,
        sellingPrice: 35000,
        stock: 40,
        minStock: 8,
        categorySlug: 'health-and-beauty',
      },
      {
        name: 'Wardah Lipstick',
        sku: 'HNB-003',
        barcode: '8991002111255',
        slug: 'wardah-lipstick',
        description: 'Lipstick Wardah matte',
        purchasePrice: 65000,
        sellingPrice: 85000,
        stock: 30,
        minStock: 5,
        categorySlug: 'health-and-beauty',
      },
      {
        name: 'Lampu LED 10W',
        sku: 'HNL-001',
        barcode: '8991002111266',
        slug: 'lampu-led-10w',
        description: 'Lampu LED Philips 10 watt',
        purchasePrice: 20000,
        sellingPrice: 28000,
        stock: 35,
        minStock: 5,
        categorySlug: 'home-and-living',
      },
      {
        name: 'Magic Com Miyako 1.8L',
        sku: 'HNL-002',
        barcode: '8991002111277',
        slug: 'magic-com-miyako-18l',
        description: 'Magic com Miyako 1.8 liter',
        purchasePrice: 145000,
        sellingPrice: 180000,
        stock: 8,
        minStock: 2,
        categorySlug: 'home-and-living',
      },
      {
        name: 'Sapu Lantai Plastik',
        sku: 'HNL-003',
        barcode: '8991002111288',
        slug: 'sapu-lantai-plastik',
        description: 'Sapu lantai plastik dengan gagang',
        purchasePrice: 15000,
        sellingPrice: 22000,
        stock: 25,
        minStock: 5,
        categorySlug: 'home-and-living',
      },
      {
        name: 'Buku Tulis Sinar Dunia 38 Lembar',
        sku: 'STN-001',
        barcode: '8991002111299',
        slug: 'buku-tulis-sinar-dunia-38',
        description: 'Buku tulis Sinar Dunia 38 lembar',
        purchasePrice: 3500,
        sellingPrice: 5000,
        stock: 120,
        minStock: 30,
        categorySlug: 'stationery',
      },
      {
        name: 'Pulpen Standard AE7',
        sku: 'STN-002',
        barcode: '8991002111300',
        slug: 'pulpen-standard-ae7',
        description: 'Pulpen Standard AE7 hitam',
        purchasePrice: 2200,
        sellingPrice: 3500,
        stock: 200,
        minStock: 40,
        categorySlug: 'stationery',
      },
    ];

    const products = await this.productRepo.save(
      productData.map((p) =>
        this.productRepo.create({
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          slug: p.slug,
          description: p.description,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          stock: p.stock,
          minStock: p.minStock,
          isActive: true,
          categoryId: catMap[p.categorySlug].id,
        }),
      ),
    );
    const productMap: Record<string, Product> = {};
    for (const p of products) {
      productMap[p.slug] = p;
    }
    this.logger.log(`  Created ${products.length} products.`);

    this.logger.log('Creating customers...');
    const customerData = [
      {
        name: 'Budi Santoso',
        email: 'budi@email.com',
        phone: '081234567890',
        address: 'Jl. Merdeka No. 10, Jakarta Pusat',
      },
      {
        name: 'Siti Rahmawati',
        email: 'siti@email.com',
        phone: '081234567891',
        address: 'Jl. Sudirman No. 25, Bandung',
      },
      {
        name: 'Agus Wijaya',
        email: 'agus@email.com',
        phone: '081234567892',
        address: 'Jl. Gatot Subroto No. 5, Surabaya',
      },
      {
        name: 'Dewi Sartika',
        email: 'dewi@email.com',
        phone: '081234567893',
        address: 'Jl. Diponegoro No. 15, Yogyakarta',
      },
      {
        name: 'Bambang Setiawan',
        email: 'bambang@email.com',
        phone: '081234567894',
        address: 'Jl. Ahmad Yani No. 8, Semarang',
      },
    ];
    const customers = await this.customerRepo.save(
      customerData.map((c) =>
        this.customerRepo.create({
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          loyaltyPoints: 0,
        }),
      ),
    );
    this.logger.log(`  Created ${customers.length} customers.`);

    this.logger.log('Creating transactions...');
    let invoiceSeq = 1;
    const cashiers = [users[0], users[1], users[2]];

    interface SeedItem {
      productSlug: string;
      quantity: number;
    }

    interface SeedTransaction {
      createdAt: Date;
      cashierIndex: number;
      customerIndex: number | null;
      paymentMethod: PaymentMethod;
      items: SeedItem[];
      discountType?: DiscountType;
      discountValue?: number;
      taxRate?: number;
      notes?: string;
    }

    const txDefs: SeedTransaction[] = [
      {
        createdAt: daysAgo(7),
        cashierIndex: 1,
        customerIndex: 0,
        paymentMethod: PaymentMethod.CASH,
        items: [
          { productSlug: 'indomie-goreng-original', quantity: 5 },
          { productSlug: 'aqua-botol-600ml', quantity: 3 },
        ],
      },
      {
        createdAt: daysAgo(6),
        cashierIndex: 1,
        customerIndex: 1,
        paymentMethod: PaymentMethod.QRIS,
        items: [
          { productSlug: 'magic-com-miyako-18l', quantity: 1 },
          { productSlug: 'buku-tulis-sinar-dunia-38', quantity: 3 },
          { productSlug: 'pulpen-standard-ae7', quantity: 5 },
        ],
        taxRate: 11,
        notes: 'Pembelian perlengkapan dapur dan alat tulis',
      },
      {
        createdAt: daysAgo(5),
        cashierIndex: 2,
        customerIndex: 2,
        paymentMethod: PaymentMethod.CARD,
        items: [{ productSlug: 'headset-bluetooth-sony', quantity: 1 }],
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        notes: 'Diskon member 10%',
      },
      {
        createdAt: daysAgo(4),
        cashierIndex: 1,
        customerIndex: null,
        paymentMethod: PaymentMethod.EWALLET,
        items: [
          { productSlug: 'chitato-sapi-panggang-68g', quantity: 2 },
          { productSlug: 'coca-cola-kaleng-330ml', quantity: 4 },
          { productSlug: 'indomie-goreng-original', quantity: 10 },
          { productSlug: 'nescafe-classic-sachet', quantity: 6 },
        ],
      },
      {
        createdAt: hoursAgo(80),
        cashierIndex: 2,
        customerIndex: 3,
        paymentMethod: PaymentMethod.TRANSFER,
        items: [
          { productSlug: 'kaos-polos-hitam', quantity: 2 },
          { productSlug: 'celana-jeans-wanita', quantity: 1 },
        ],
        taxRate: 11,
        discountType: DiscountType.FIXED,
        discountValue: 20000,
        notes: 'Promo akhir pekan',
      },
      {
        createdAt: daysAgo(3),
        cashierIndex: 1,
        customerIndex: 4,
        paymentMethod: PaymentMethod.CASH,
        items: [
          { productSlug: 'lampu-led-10w', quantity: 3 },
          { productSlug: 'sapu-lantai-plastik', quantity: 1 },
          { productSlug: 'pepsodent-pasta-gigi-75g', quantity: 2 },
        ],
      },
      {
        createdAt: daysAgo(2),
        cashierIndex: 2,
        customerIndex: 0,
        paymentMethod: PaymentMethod.QRIS,
        items: [
          { productSlug: 'power-bank-10000mah', quantity: 1 },
          { productSlug: 'kabel-usb-type-c-1m', quantity: 2 },
        ],
        discountType: DiscountType.PERCENTAGE,
        discountValue: 5,
      },
      {
        createdAt: hoursAgo(20),
        cashierIndex: 1,
        customerIndex: null,
        paymentMethod: PaymentMethod.CARD,
        items: [
          { productSlug: 'wardah-lipstick', quantity: 2 },
          { productSlug: 'lifebuoy-sabun-cair-250ml', quantity: 1 },
          { productSlug: 'pepsodent-pasta-gigi-75g', quantity: 3 },
          { productSlug: 'buku-tulis-sinar-dunia-38', quantity: 5 },
          { productSlug: 'pulpen-standard-ae7', quantity: 4 },
        ],
        taxRate: 11,
      },
      {
        createdAt: hoursAgo(10),
        cashierIndex: 2,
        customerIndex: 1,
        paymentMethod: PaymentMethod.EWALLET,
        items: [{ productSlug: 'kemeja-flanel-pria', quantity: 1 }],
        notes: 'Hadiah ulang tahun',
      },
      {
        createdAt: hoursAgo(2),
        cashierIndex: 1,
        customerIndex: 2,
        paymentMethod: PaymentMethod.CASH,
        items: [
          { productSlug: 'indomie-goreng-original', quantity: 8 },
          { productSlug: 'chitato-sapi-panggang-68g', quantity: 3 },
          { productSlug: 'lifebuoy-sabun-cair-250ml', quantity: 2 },
        ],
      },
    ];

    for (const def of txDefs) {
      const subtotal = def.items.reduce(
        (sum, item) =>
          sum + productMap[item.productSlug].sellingPrice * item.quantity,
        0,
      );

      let discountAmount = 0;
      if (def.discountType === DiscountType.PERCENTAGE && def.discountValue) {
        discountAmount =
          Math.round(subtotal * (def.discountValue / 100) * 100) / 100;
      } else if (def.discountType === DiscountType.FIXED && def.discountValue) {
        discountAmount = Math.min(def.discountValue, subtotal);
      }

      const afterDiscount = subtotal - discountAmount;
      const taxRate = def.taxRate || 0;
      const taxAmount =
        Math.round(afterDiscount * (taxRate / 100) * 100) / 100;
      const total = afterDiscount + taxAmount;

      const invoiceNo = formatInvoiceNo(def.createdAt, invoiceSeq++);

      const transaction = await this.transactionRepo.save({
        invoiceNo,
        subtotal,
        discountType: def.discountType || null,
        discountValue: def.discountValue || 0,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        paymentMethod: def.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        notes: def.notes || null,
        customerId:
          def.customerIndex !== null
            ? customers[def.customerIndex].id
            : null,
        userId: cashiers[def.cashierIndex].id,
      } as any);

      await this.patchCreatedAt('transactions', transaction.id, def.createdAt);

      for (const itemDef of def.items) {
        const product = productMap[itemDef.productSlug];
        const unitPrice = product.sellingPrice;
        const itemSubtotal = unitPrice * itemDef.quantity;

        await this.transactionItemRepo.save({
          transactionId: transaction.id,
          productId: product.id,
          quantity: itemDef.quantity,
          unitPrice,
          subtotal: itemSubtotal,
        } as any);

        product.stock -= itemDef.quantity;
        await this.productRepo.save(product);

        const invLog = await this.inventoryLogRepo.save({
          productId: product.id,
          type: InventoryType.OUT,
          quantity: itemDef.quantity,
          reference: invoiceNo,
          notes: `Penjualan ${invoiceNo}`,
          userId: cashiers[def.cashierIndex].id,
        } as any);

        await this.patchCreatedAt(
          'inventory_logs',
          invLog.id,
          def.createdAt,
        );
      }

      this.logger.log(
        `  ${invoiceNo}: ${def.items.length} item(s), Rp${total.toLocaleString('id-ID')}`,
      );
    }
  }

  private async patchCreatedAt(
    tableName: string,
    id: string,
    date: Date,
  ): Promise<void> {
    await this.transactionRepo.query(
      `UPDATE ${tableName} SET created_at = $1 WHERE id = $2`,
      [date, id],
    );
  }
}
