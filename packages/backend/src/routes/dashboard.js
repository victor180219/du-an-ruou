const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const [
      productCount,
      categoryCount,
      warehouseCount,
      totalInventory,
      lowStockCount,
      poCount,
      transferCount,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.inventory.aggregate({ _sum: { quantity: true } }),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM inventory WHERE quantity <= min_quantity AND min_quantity > 0`,
      prisma.purchaseOrder.count(),
      prisma.stockTransfer.count(),
    ]);

    res.json({
      productCount,
      categoryCount,
      warehouseCount,
      totalInventory: totalInventory._sum.quantity || 0,
      lowStockCount: lowStockCount[0]?.count || 0,
      poCount,
      transferCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy thống kê' });
  }
});

module.exports = router;
