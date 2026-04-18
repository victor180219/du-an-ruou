const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Roles
  const roles = [
    { name: 'admin', displayName: 'Quản trị viên', permissions: JSON.stringify({ all: true }), description: 'Toàn quyền hệ thống' },
    { name: 'sale', displayName: 'Nhân viên bán hàng', permissions: JSON.stringify({ orders: ['create', 'read'], customers: ['create', 'read', 'update'], products: ['read'] }), description: 'Tạo đơn hàng, quản lý khách hàng' },
    { name: 'cashier', displayName: 'Thu ngân', permissions: JSON.stringify({ orders: ['read', 'update', 'approve'], payments: ['create', 'read'] }), description: 'Duyệt đơn, thu tiền' },
    { name: 'warehouse', displayName: 'Thủ kho', permissions: JSON.stringify({ inventory: ['read', 'update'], stockTransfers: ['create', 'read', 'update'] }), description: 'Quản lý kho hàng' },
    { name: 'shipper', displayName: 'Nhân viên giao hàng', permissions: JSON.stringify({ deliveries: ['read', 'update'] }), description: 'Giao hàng, thu tiền' },
    { name: 'accountant', displayName: 'Kế toán', permissions: JSON.stringify({ purchaseOrders: ['create', 'read'], payments: ['create', 'read'], reports: ['read'] }), description: 'Nhập hàng, báo cáo tài chính' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }
  console.log('✅ Roles seeded');

  // Admin user
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'Quản trị viên',
      title: 'Admin',
      phone: '0900000000',
      email: 'admin@posruou.vn',
      roleId: adminRole.id,
      branch: 'all',
    },
  });
  console.log('✅ Admin user seeded (admin / admin123)');

  // Warehouses
  const warehouses = [
    { name: 'Kho lẻ Hà Nội', type: 'retail', branch: 'HN', address: 'Hà Nội' },
    { name: 'Kho lẻ HCM', type: 'retail', branch: 'HCM', address: 'TP. Hồ Chí Minh' },
    { name: 'Kho buôn Hà Nội', type: 'wholesale', branch: 'HN', address: 'Hà Nội' },
    { name: 'Kho buôn HCM', type: 'wholesale', branch: 'HCM', address: 'TP. Hồ Chí Minh' },
  ];

  for (const wh of warehouses) {
    const existing = await prisma.warehouse.findFirst({ where: { name: wh.name } });
    if (!existing) {
      await prisma.warehouse.create({ data: wh });
    }
  }
  console.log('✅ Warehouses seeded');

  // Categories
  const categories = [
    { name: 'Whisky', description: 'Rượu Whisky các loại', sortOrder: 1 },
    { name: 'Vodka', description: 'Rượu Vodka', sortOrder: 2 },
    { name: 'Wine', description: 'Rượu vang', sortOrder: 3 },
    { name: 'Brandy', description: 'Rượu Brandy / Cognac', sortOrder: 4 },
    { name: 'Rum', description: 'Rượu Rum', sortOrder: 5 },
    { name: 'Liqueur', description: 'Rượu mùi', sortOrder: 6 },
    { name: 'Bia', description: 'Bia các loại', sortOrder: 7 },
    { name: 'Phụ kiện', description: 'Phụ kiện pha chế, ly, đá...', sortOrder: 8 },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log('✅ Categories seeded');

  // Sample suppliers
  const suppliers = [
    { name: 'Diageo Việt Nam', contactName: 'Nguyễn Văn A', phone: '0901111111', address: 'Hà Nội' },
    { name: 'Pernod Ricard VN', contactName: 'Trần Thị B', phone: '0902222222', address: 'HCM' },
  ];

  for (const sup of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { name: sup.name } });
    if (!existing) {
      await prisma.supplier.create({ data: sup });
    }
  }
  console.log('✅ Suppliers seeded');

  console.log('\n🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
