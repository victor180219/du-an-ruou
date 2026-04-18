const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/warehouses
router.get('/', authenticate, async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: { _count: { select: { inventory: true } } },
    });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách kho' });
  }
});

// POST /api/warehouses
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, type, branch, address, managerName } = req.body;
    if (!name || !type || !branch) {
      return res.status(400).json({ error: 'Tên, loại kho và chi nhánh là bắt buộc' });
    }
    const warehouse = await prisma.warehouse.create({
      data: { name, type, branch, address, managerName },
    });
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tạo kho' });
  }
});

// PUT /api/warehouses/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, type, branch, address, managerName, isActive } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: parseInt(req.params.id) },
      data: { name, type, branch, address, managerName, isActive },
    });
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật kho' });
  }
});

module.exports = router;
