const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh mục' });
  }
});

// POST /api/categories
router.post('/', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });

    const category = await prisma.category.create({
      data: { name, description, sortOrder: sortOrder || 0 },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tạo danh mục' });
  }
});

// PUT /api/categories/:id
router.put('/:id', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { name, description, sortOrder, isActive } = req.body;
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { name, description, sortOrder, isActive },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật danh mục' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return res.status(400).json({ error: `Không thể xóa: danh mục đang có ${productsCount} sản phẩm` });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa danh mục' });
  }
});

module.exports = router;
