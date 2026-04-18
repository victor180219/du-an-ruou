import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

const emptyProduct = {
  sku: '', name: '', categoryId: '', volumeMl: '', barcode: '',
  costPrice: '', retailPrice: '', wholesalePrice: '', unit: 'chai', description: '',
};

function formatVND(v) {
  return Number(v || 0).toLocaleString('vi-VN') + 'đ';
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const params = { search, categoryId: filterCategory || undefined };
      const { data } = await api.get('/products', { params });
      setProducts(data.data);
      setTotal(data.total);
    } catch (e) {
      toast.error('Lỗi tải sản phẩm');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (e) {}
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [search, filterCategory]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, categoryId: p.categoryId || '',
      volumeMl: p.volumeMl || '', barcode: p.barcode || '',
      costPrice: p.costPrice, retailPrice: p.retailPrice,
      wholesalePrice: p.wholesalePrice, unit: p.unit, description: p.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await api.post('/products', form);
        toast.success('Đã thêm sản phẩm');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi lưu sản phẩm');
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Ẩn sản phẩm "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success('Đã ẩn sản phẩm');
      fetchProducts();
    } catch (e) {
      toast.error('Lỗi xóa sản phẩm');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sản phẩm ({total})</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Tìm theo tên, SKU, barcode..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Tên sản phẩm</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Danh mục</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Giá bán lẻ</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Giá buôn</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.name}</div>
                    {p.volumeMl && <span className="text-xs text-slate-400">{p.volumeMl}ml</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatVND(p.retailPrice)}</td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">{formatVND(p.wholesalePrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">
                  {loading ? 'Đang tải...' : 'Chưa có sản phẩm nào'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã SKU *</label>
              <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                disabled={!!editing} required
                className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                required className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
              <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">— Chọn —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dung tích (ml)</label>
              <input type="number" value={form.volumeMl} onChange={e => setForm({...form, volumeMl: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
              <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
              <input type="text" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá nhập</label>
              <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán lẻ</label>
              <input type="number" value={form.retailPrice} onChange={e => setForm({...form, retailPrice: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán buôn</label>
              <input type="number" value={form.wholesalePrice} onChange={e => setForm({...form, wholesalePrice: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Hủy</button>
            <button type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
              {editing ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
