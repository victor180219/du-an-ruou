const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/inventory
router.get('/', authenticate, async (req, res) => {
  try {
    const { warehouseId, search, page = 1, limit = 50 } = req.query;
    const where = {};

    if (warehouseId) where.warehouseId = parseInt(warehouseId);
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: { include: { category: true } },
          warehouse: true,
        },
        orderBy: { product: { name: 'asc' } },
        skip,
        take: parseInt(limit),
      }),
      prisma.inventory.count({ where }),
    ]);

    res.json({ data: items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy tồn kho' });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const items = await prisma.$queryRaw`
      SELECT i.*, p.name as product_name, p.sku, w.name as warehouse_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.quantity <= i.min_quantity AND i.min_quantity > 0
      ORDER BY i.quantity ASC
    `;
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy hàng sắp hết' });
  }
});

module.exports = router;
