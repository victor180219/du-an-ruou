const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate PO code
async function generatePoCode() {
  const today = new Date();
  const prefix = `PO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const count = await prisma.purchaseOrder.count({
    where: { poCode: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/purchase-orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          warehouse: true,
          creator: { select: { id: true, fullName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({ data: orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy phiếu nhập hàng' });
  }
});

// GET /api/purchase-orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        supplier: true,
        warehouse: true,
        creator: { select: { id: true, fullName: true } },
        items: { include: { product: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Không tìm thấy phiếu nhập' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy chi tiết phiếu nhập' });
  }
});

// POST /api/purchase-orders
router.post('/', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { supplierId, warehouseId, notes, items } = req.body;

    if (!supplierId || !warehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Thiếu thông tin nhà cung cấp, kho hoặc sản phẩm' });
    }

    const poCode = await generatePoCode();
    let totalAmount = 0;
    const itemsData = items.map((item) => {
      const lineTotal = item.quantity * item.unitCost;
      totalAmount += lineTotal;
      return {
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
        unitCost: parseFloat(item.unitCost),
        lineTotal,
      };
    });

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poCode,
          supplierId: parseInt(supplierId),
          warehouseId: parseInt(warehouseId),
          totalAmount,
          debtAmount: totalAmount,
          notes,
          createdBy: req.user.id,
          status: 'completed',
          items: { create: itemsData },
        },
        include: {
          supplier: true,
          warehouse: true,
          items: { include: { product: true } },
        },
      });

      // Update inventory
      for (const item of itemsData) {
        await tx.inventory.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: parseInt(warehouseId),
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            warehouseId: parseInt(warehouseId),
            quantity: item.quantity,
          },
        });
      }

      return po;
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi tạo phiếu nhập hàng' });
  }
});

module.exports = router;
