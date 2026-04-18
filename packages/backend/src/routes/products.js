const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/products
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, categoryId, isActive, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    // Hide cost_price for sale role
    const result = products.map((p) => {
      if (req.user.role.name === 'sale') {
        const { costPrice, ...rest } = p;
        return rest;
      }
      return p;
    });

    res.json({ data: result, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy sản phẩm' });
  }
});

// POST /api/products
router.post('/', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { sku, name, categoryId, volumeMl, barcode, costPrice, retailPrice, wholesalePrice, unit, imageUrl, description } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU và tên sản phẩm là bắt buộc' });
    }

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) return res.status(400).json({ error: 'Mã SKU đã tồn tại' });

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        categoryId: categoryId ? parseInt(categoryId) : null,
        volumeMl: volumeMl ? parseInt(volumeMl) : null,
        barcode,
        costPrice: costPrice || 0,
        retailPrice: retailPrice || 0,
        wholesalePrice: wholesalePrice || 0,
        unit: unit || 'chai',
        imageUrl,
        description,
      },
      include: { category: true },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi tạo sản phẩm' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { name, categoryId, volumeMl, barcode, costPrice, retailPrice, wholesalePrice, unit, imageUrl, description, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        categoryId: categoryId ? parseInt(categoryId) : null,
        volumeMl: volumeMl ? parseInt(volumeMl) : null,
        barcode,
        costPrice,
        retailPrice,
        wholesalePrice,
        unit,
        imageUrl,
        description,
        isActive,
      },
      include: { category: true },
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi cập nhật sản phẩm' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ message: 'Đã ẩn sản phẩm' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa sản phẩm' });
  }
});

module.exports = router;
