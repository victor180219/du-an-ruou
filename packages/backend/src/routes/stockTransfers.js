const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

async function generateTransferCode() {
  const today = new Date();
  const prefix = `TF${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const count = await prisma.stockTransfer.count({
    where: { transferCode: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/stock-transfers
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          creator: { select: { id: true, fullName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    res.json({ data: transfers, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy phiếu chuyển kho' });
  }
});

// POST /api/stock-transfers
router.post('/', authenticate, authorize('admin', 'warehouse'), async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, notes, items } = req.body;

    if (!fromWarehouseId || !toWarehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Thiếu thông tin kho hoặc sản phẩm' });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ error: 'Kho xuất và kho nhận phải khác nhau' });
    }

    const transferCode = await generateTransferCode();
    const itemsData = items.map((item) => ({
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
    }));

    const transfer = await prisma.$transaction(async (tx) => {
      // Check stock availability
      for (const item of itemsData) {
        const inv = await tx.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: parseInt(fromWarehouseId),
            },
          },
        });
        if (!inv || inv.quantity < item.quantity) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          throw new Error(`Không đủ tồn kho cho sản phẩm: ${product?.name || item.productId}`);
        }
      }

      const tf = await tx.stockTransfer.create({
        data: {
          transferCode,
          fromWarehouseId: parseInt(fromWarehouseId),
          toWarehouseId: parseInt(toWarehouseId),
          notes,
          createdBy: req.user.id,
          status: 'pending',
          items: { create: itemsData },
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: { include: { product: true } },
        },
      });

      return tf;
    });

    res.status(201).json(transfer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Lỗi tạo phiếu chuyển kho' });
  }
});

// PUT /api/stock-transfers/:id/complete
router.put('/:id/complete', authenticate, authorize('admin', 'warehouse'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transfer) return res.status(404).json({ error: 'Không tìm thấy phiếu chuyển kho' });
    if (transfer.status === 'completed') return res.status(400).json({ error: 'Phiếu đã hoàn thành' });

    const result = await prisma.$transaction(async (tx) => {
      // Decrease from source
      for (const item of transfer.items) {
        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: transfer.fromWarehouseId,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        // Increase in destination
        await tx.inventory.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: transfer.toWarehouseId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            warehouseId: transfer.toWarehouseId,
            quantity: item.quantity,
          },
        });
      }

      return tx.stockTransfer.update({
        where: { id },
        data: { status: 'completed' },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: { include: { product: true } },
        },
      });
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi hoàn thành phiếu chuyển kho' });
  }
});

module.exports = router;
